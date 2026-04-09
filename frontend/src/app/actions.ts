"use server";

import z from "zod";
import { cookies } from "next/headers";
import { strapiPrivateFetch } from "@/src/lib/strapi";

const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

const LoginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

type StrapiAuthUser = {
    id: number;
    documentId: string;
    username: string;
    email: string;
};

type StrapiUserDbEntry = {
    id: number;
    documentId: string;
    username?: string | null;
    email?: string | null;
    likedProducts?: Array<{ id: number; documentId?: string }>;
};

type StrapiProductEntry = {
    id: number;
    documentId?: string;
};

type StrapiCollectionResponse<T> = {
    data?: T[];
};

type StrapiAuthResponse = {
    jwt?: string;
    user?: {
        id?: number;
        documentId?: string;
        username?: string | null;
        email?: string | null;
    } | null;
    error?: {
        message?: string;
        [key: string]: unknown;
    } | null;
};

type ActionState = {
    ZodError?: Record<string, string[] | undefined> | null;
    strapiError?: unknown;
    errorMessage?: string | null;
    success?: boolean;
    successMessage?: string | null;
    jwt?: string | null;
    user?: unknown;
    redirectTo?: string | null;
};

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

function buildActionState(
    prevState: ActionState,
    overrides: Partial<ActionState>
): ActionState {
    return {
        ...prevState,
        ZodError: null,
        strapiError: null,
        errorMessage: null,
        success: false,
        successMessage: null,
        jwt: null,
        user: null,
        redirectTo: null,
        ...overrides,
    };
}

async function setAuthCookies(data: {
    jwt: string;
    user?: {
        id?: number;
        username?: string | null;
        email?: string | null;
    } | null;
}) {
    const cookieStore = await cookies();

    cookieStore.set("jwt", data.jwt, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("userId", String(data.user?.id ?? ""), {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("username", data.user?.username ?? "", {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("userEmail", data.user?.email ?? "", {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

async function createAuthRequest(
    path: string,
    payload: Record<string, unknown>
) {
    return strapiPrivateFetch<StrapiAuthResponse>(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

function isDuplicateCredentialError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    return error.message.includes("Email or Username are already taken");
}

function getLikedProductsFromEntry(
    entry: StrapiUserDbEntry | null | undefined
) {
    const likedProducts = entry?.likedProducts ?? [];
    return Array.isArray(likedProducts) ? likedProducts : [];
}

async function fetchAuthenticatedStrapiUser(jwt: string) {
    const user = await strapiPrivateFetch<StrapiAuthUser>("/api/users/me", {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    });

    if (!user.documentId) {
        throw new Error("Authenticated user documentId is missing.");
    }

    return user;
}

async function findUserDbByAuthUser(
    jwt: string,
    _authUserId: number,
    authUserEmail?: string,
    authUsername?: string
) {
    const queries = [
        authUserEmail
            ? {
                  filters: { email: { $eq: authUserEmail } },
              }
            : null,
        authUsername
            ? {
                  filters: { username: { $eq: authUsername } },
              }
            : null,
    ].filter(Boolean) as Array<{ filters: Record<string, any> }>;

    for (const query of queries) {
        const json = await strapiPrivateFetch<
            StrapiCollectionResponse<StrapiUserDbEntry>
        >("/api/userdbs", {
            query: {
                ...query,
                pagination: { pageSize: 1 },
                populate: {
                    likedProducts: { fields: ["id", "documentId"] },
                },
                fields: ["username", "email", "documentId"],
            },
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
        });

        const entry = Array.isArray(json?.data) ? json.data[0] ?? null : null;

        if (entry) {
            return entry;
        }
    }

    return null;
}

async function createUserDbEntry(jwt: string, user: StrapiAuthUser) {
    return strapiPrivateFetch<{ data?: StrapiUserDbEntry }>("/api/userdbs", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data: {
                username: user.username,
                email: user.email,
            },
        }),
    });
}

async function ensureUserDbEntry(jwt: string, authUser: StrapiAuthUser) {
    let userDbEntry = await findUserDbByAuthUser(
        jwt,
        authUser.id,
        authUser.email,
        authUser.username
    );

    if (!userDbEntry) {
        await createUserDbEntry(jwt, {
            id: authUser.id,
            documentId: authUser.documentId,
            username: authUser.username,
            email: authUser.email,
        });

        userDbEntry = await findUserDbByAuthUser(
            jwt,
            authUser.id,
            authUser.email,
            authUser.username
        );
    }

    return userDbEntry;
}

async function resolveProductDocumentId(
    jwt: string,
    productIdOrDocumentId: string | number
) {
    if (
        typeof productIdOrDocumentId === "string" &&
        productIdOrDocumentId.trim() &&
        !/^\d+$/.test(productIdOrDocumentId.trim())
    ) {
        return productIdOrDocumentId.trim();
    }

    const rawValue = String(productIdOrDocumentId).trim();
    const numericId = Number(rawValue);

    const json = await strapiPrivateFetch<
        StrapiCollectionResponse<StrapiProductEntry>
    >("/api/products", {
        query: {
            filters: Number.isNaN(numericId)
                ? {
                      documentId: {
                          $eq: rawValue,
                      },
                  }
                : {
                      id: {
                          $eq: numericId,
                      },
                  },
            fields: ["documentId"],
            pagination: { pageSize: 1 },
        },
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
    });

    const product = json?.data?.[0];

    if (product?.documentId) {
        return product.documentId;
    }

    if (typeof productIdOrDocumentId === "number") {
        throw new Error("Product not found.");
    }

    return rawValue;
}

async function updateLikedProducts(
    jwt: string,
    userDbDocumentId: string,
    nextDocumentIds: string[]
) {
    return strapiPrivateFetch(`/api/userdbs/${userDbDocumentId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data: {
                likedProducts: {
                    set: nextDocumentIds,
                },
            },
        }),
    });
}

export async function CreateUserAction(
    prevState: ActionState,
    formData: FormData
) {
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    const result = CreateUserSchema.safeParse({ email, password, name });

    if (!result.success) {
        return buildActionState(prevState, {
            ZodError: result.error.flatten().fieldErrors,
            errorMessage: "Please fix the highlighted fields.",
            success: false,
        });
    }

    try {
        const data = await createAuthRequest("/api/auth/local/register", {
            username: result.data.name,
            email: result.data.email,
            password: result.data.password,
        });

        let postSignupSetupError: string | null = null;

        if (data?.jwt && data?.user) {
            try {
                await setAuthCookies({ jwt: data.jwt, user: data.user });

                const existingUserDb = await findUserDbByAuthUser(
                    data.jwt,
                    data.user.id ?? 0,
                    data.user.email ?? undefined,
                    data.user.username ?? undefined
                );

                if (!existingUserDb && data.user.id && data.user.documentId) {
                    await createUserDbEntry(data.jwt, {
                        id: data.user.id,
                        documentId: data.user.documentId,
                        username: data.user.username ?? "",
                        email: data.user.email ?? "",
                    });
                }
            } catch (postSignupError) {
                postSignupSetupError =
                    postSignupError instanceof Error
                        ? postSignupError.message
                        : "Account created, but profile setup failed.";
            }
        }

        return buildActionState(prevState, {
            success: true,
            successMessage: "User created successfully.",
            errorMessage: postSignupSetupError,
            jwt: data?.jwt ?? null,
            user: data?.user ?? null,
            redirectTo: "/",
        });
    } catch (error) {
        if (isDuplicateCredentialError(error)) {
            try {
                const loginData = await createAuthRequest("/api/auth/local", {
                    identifier: result.data.email,
                    password: result.data.password,
                });

                let postSignupSetupError: string | null = null;

                if (loginData?.jwt && loginData?.user) {
                    try {
                        await setAuthCookies({
                            jwt: loginData.jwt,
                            user: loginData.user,
                        });

                        const existingUserDb = await findUserDbByAuthUser(
                            loginData.jwt,
                            loginData.user.id ?? 0,
                            loginData.user.email ?? undefined,
                            loginData.user.username ?? undefined
                        );

                        if (
                            !existingUserDb &&
                            loginData.user.id &&
                            loginData.user.documentId
                        ) {
                            await createUserDbEntry(loginData.jwt, {
                                id: loginData.user.id,
                                documentId: loginData.user.documentId,
                                username: loginData.user.username ?? "",
                                email: loginData.user.email ?? "",
                            });
                        }
                    } catch (postSignupError) {
                        postSignupSetupError =
                            postSignupError instanceof Error
                                ? postSignupError.message
                                : "Account exists and you were signed in, but profile setup failed.";
                    }

                    return buildActionState(prevState, {
                        success: true,
                        successMessage:
                            "Your account already existed, so you were signed in instead.",
                        errorMessage: postSignupSetupError,
                        jwt: loginData?.jwt ?? null,
                        user: loginData?.user ?? null,
                        redirectTo: "/",
                    });
                }
            } catch {
                // Fall through to the original error response below.
            }
        }

        const message =
            error instanceof Error
                ? error.message
                : "Could not connect to Strapi.";

        return buildActionState(prevState, {
            errorMessage: message,
            success: false,
        });
    }
}

export async function LoginUserAction(
    prevState: ActionState,
    formData: FormData
) {
    const identifier = formData.get("email");
    const password = formData.get("password");

    const result = LoginUserSchema.safeParse({
        email: identifier,
        password,
    });

    if (!result.success) {
        return buildActionState(prevState, {
            ZodError: result.error.flatten().fieldErrors,
            errorMessage: "Please fix the highlighted fields.",
            success: false,
        });
    }

    try {
        const data = await createAuthRequest("/api/auth/local", {
            identifier: result.data.email,
            password: result.data.password,
        });

        let postLoginSetupError: string | null = null;

        if (data?.jwt && data?.user) {
            try {
                await setAuthCookies({ jwt: data.jwt, user: data.user });

                const existingUserDb = await findUserDbByAuthUser(
                    data.jwt,
                    data.user.id ?? 0,
                    data.user.email ?? undefined,
                    data.user.username ?? undefined
                );

                if (!existingUserDb && data.user.id && data.user.documentId) {
                    await createUserDbEntry(data.jwt, {
                        id: data.user.id,
                        documentId: data.user.documentId,
                        username: data.user.username ?? "",
                        email: data.user.email ?? "",
                    });
                }
            } catch (postLoginError) {
                postLoginSetupError =
                    postLoginError instanceof Error
                        ? postLoginError.message
                        : "Signed in, but profile setup failed.";
            }
        }

        return buildActionState(prevState, {
            success: true,
            successMessage: "Signed in successfully.",
            errorMessage: postLoginSetupError,
            jwt: data?.jwt ?? null,
            user: data?.user ?? null,
            redirectTo: "/",
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Could not connect to Strapi.";

        return buildActionState(prevState, {
            errorMessage: message,
            success: false,
        });
    }
}

export async function ToggleLikeProductAction(productId: string | number) {
    try {
        const jwt = await getJwtFromCookie();

        if (!jwt) {
            return {
                success: false,
                errorMessage: "You must be signed in to like products.",
                liked: false,
            };
        }

        const authUser = await fetchAuthenticatedStrapiUser(jwt);
        const userDbEntry = await ensureUserDbEntry(jwt, authUser);

        if (!userDbEntry) {
            return {
                success: false,
                errorMessage: "No user profile was found for this account yet.",
                liked: false,
            };
        }

        const currentLikedProducts = getLikedProductsFromEntry(userDbEntry);

        const currentDocumentIds = currentLikedProducts
            .map((product) => product.documentId)
            .filter(
                (id): id is string => typeof id === "string" && id.length > 0
            );

        const normalizedProductDocumentId = await resolveProductDocumentId(
            jwt,
            productId
        );
        const alreadyLiked = currentDocumentIds.includes(
            normalizedProductDocumentId
        );

        const nextDocumentIds = alreadyLiked
            ? currentDocumentIds.filter(
                  (id) => id !== normalizedProductDocumentId
              )
            : [...currentDocumentIds, normalizedProductDocumentId];

        await updateLikedProducts(jwt, userDbEntry.documentId, nextDocumentIds);

        return {
            success: true,
            errorMessage: null,
            liked: !alreadyLiked,
        };
    } catch (error) {
        return {
            success: false,
            errorMessage:
                error instanceof Error
                    ? error.message
                    : "Something went wrong while updating likes.",
            liked: false,
        };
    }
}

export async function LogoutAction() {
    const cookieStore = await cookies();
    const cookieOptions = {
        httpOnly: false,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    };
    cookieStore.set("jwt", "", { ...cookieOptions, httpOnly: true });
    cookieStore.set("userId", "", cookieOptions);
    cookieStore.set("username", "", cookieOptions);
    cookieStore.set("userEmail", "", cookieOptions);
}
