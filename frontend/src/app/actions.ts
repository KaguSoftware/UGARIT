"use server";

import z from "zod";
import { cookies } from "next/headers";

const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

const LoginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const STRAPI_URL =
    process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
    "http://localhost:1337";

if (
    !process.env.NEXT_PUBLIC_STRAPI_URL &&
    process.env.NODE_ENV === "production"
) {
    console.warn(
        "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost, which will fail on the deployed site."
    );
}

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
    authUser?: { id?: number; documentId?: string } | number | string | null;
};

type StrapiProductEntry = {
    id: number;
    documentId?: string;
};

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

async function fetchAuthenticatedStrapiUser(jwt: string) {
    const response = await fetch(`${STRAPI_URL}/api/users/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const rawText = await response.text();
        throw new Error(rawText || "Failed to fetch authenticated user.");
    }

    const user = (await response.json()) as StrapiAuthUser;

    if (!user.documentId) {
        throw new Error("Authenticated user documentId is missing.");
    }

    return user;
}

async function findUserDbByAuthUser(
    jwt: string,
    authUserId: number,
    authUserEmail?: string,
    authUsername?: string
) {
    const response = await fetch(
        `${STRAPI_URL}/api/userdbs?populate=authUser&populate=likedProducts`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const rawText = await response.text();
        throw new Error(rawText || "Failed to fetch user profile.");
    }

    const json = await response.json();
    const entries = Array.isArray(json?.data)
        ? (json.data as StrapiUserDbEntry[])
        : [];

    return (
        entries.find((entry) => {
            if (typeof entry.authUser === "number") {
                return entry.authUser === authUserId;
            }

            if (
                entry.authUser &&
                typeof entry.authUser === "object" &&
                entry.authUser.id === authUserId
            ) {
                return true;
            }

            if (authUserEmail && entry.email === authUserEmail) {
                return true;
            }

            if (authUsername && entry.username === authUsername) {
                return true;
            }

            return false;
        }) ?? null
    );
}

async function createUserDbEntry(jwt: string, user: StrapiAuthUser) {
    const response = await fetch(`${STRAPI_URL}/api/userdbs`, {
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
        cache: "no-store",
    });

    if (!response.ok) {
        const rawText = await response.text();
        throw new Error(rawText || "Failed to create userdb entry.");
    }

    return (await response.json()) as { data?: StrapiUserDbEntry };
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
    const rawValue = String(productIdOrDocumentId);

    const response = await fetch(
        `${STRAPI_URL}/api/products?filters[documentId][$eq]=${rawValue}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const rawText = await response.text();
        throw new Error(rawText || "Failed to resolve product document id.");
    }

    const json = await response.json();
    const product = json?.data?.[0] as StrapiProductEntry | undefined;

    if (product?.documentId) {
        return product.documentId;
    }

    if (typeof productIdOrDocumentId === "string" && productIdOrDocumentId) {
        return productIdOrDocumentId;
    }

    throw new Error("Product not found.");
}

export async function CreateUserAction(prevState: any, formData: FormData) {
    console.log("Creating user...");
    console.log("submitted form data:", Object.fromEntries(formData.entries()));

    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");

    const result = CreateUserSchema.safeParse({ email, password, name });
    console.log(
        "validation field errors:",
        result.success ? null : result.error.flatten().fieldErrors
    );

    if (!result.success) {
        console.error("Validation failed:", result.error.flatten().fieldErrors);

        return {
            ...prevState,
            ZodError: result.error.flatten().fieldErrors,
            strapiError: null,
            errorMessage: "Please fix the highlighted fields.",
            success: false,
            successMessage: null,
            jwt: null,
            user: null,
        };
    }

    try {
        const strapiUrl = `${STRAPI_URL}/api/auth/local/register`;
        console.log("Sending signup request to:", strapiUrl);
        console.log("Signup payload:", {
            username: result.data.name,
            email: result.data.email,
            password: "[REDACTED]",
        });

        const response = await fetch(strapiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: result.data.name,
                email: result.data.email,
                password: result.data.password,
            }),
            cache: "no-store",
        });

        const rawText = await response.text();
        let data: any = null;

        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch {
            data = rawText;
        }

        console.log("Strapi status:", response.status);
        console.log(
            "Strapi headers:",
            Object.fromEntries(response.headers.entries())
        );
        console.log("Strapi raw response:", rawText);
        console.log("Strapi parsed response:", data);

        let postSignupSetupError: string | null = null;

        if (response.ok && data?.jwt && data?.user) {
            try {
                const cookieStore = await cookies();

                cookieStore.set("jwt", data.jwt, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                cookieStore.set("userId", String(data.user.id), {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                cookieStore.set("username", data.user.username ?? "", {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                cookieStore.set("userEmail", data.user.email ?? "", {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                const existingUserDb = await findUserDbByAuthUser(
                    data.jwt,
                    data.user.id,
                    data.user.email,
                    data.user.username
                );

                if (!existingUserDb) {
                    await createUserDbEntry(data.jwt, {
                        id: data.user.id,
                        documentId: data.user.documentId,
                        username: data.user.username,
                        email: data.user.email,
                    });
                }
            } catch (postSignupError) {
                console.error("Post-signup setup failed:", postSignupError);
                postSignupSetupError =
                    postSignupError instanceof Error
                        ? postSignupError.message
                        : "Account created, but profile setup failed.";
            }
        }

        if (!response.ok) {
            return {
                ...prevState,
                ZodError: null,
                strapiError: data?.error ?? data ?? null,
                errorMessage: data?.error?.message ?? "Failed to create user.",
                success: false,
                successMessage: null,
                jwt: null,
                user: null,
            };
        }

        return {
            ...prevState,
            ZodError: null,
            strapiError: null,
            errorMessage: postSignupSetupError,
            success: true,
            successMessage: "User created successfully.",
            jwt: data?.jwt ?? null,
            user: data?.user ?? null,
        };
    } catch (error) {
        console.error("Create user error:", error);

        return {
            ...prevState,
            ZodError: null,
            strapiError: null,
            errorMessage:
                error instanceof Error
                    ? error.message
                    : "Could not connect to Strapi.",
            success: false,
            successMessage: null,
            jwt: null,
            user: null,
        };
    }
}

export async function LoginUserAction(prevState: any, formData: FormData) {
    console.log("Signing in user...");
    console.log(
        "submitted login form data:",
        Object.fromEntries(formData.entries())
    );

    const identifier = formData.get("email");
    const password = formData.get("password");

    const result = LoginUserSchema.safeParse({
        email: identifier,
        password,
    });

    console.log(
        "login validation field errors:",
        result.success ? null : result.error.flatten().fieldErrors
    );

    if (!result.success) {
        console.error(
            "Login validation failed:",
            result.error.flatten().fieldErrors
        );

        return {
            ...prevState,
            ZodError: result.error.flatten().fieldErrors,
            strapiError: null,
            errorMessage: "Please fix the highlighted fields.",
            success: false,
            successMessage: null,
            jwt: null,
            user: null,
        };
    }

    try {
        const strapiUrl = `${STRAPI_URL}/api/auth/local`;
        console.log("Sending signin request to:", strapiUrl);
        console.log("Signin payload:", {
            identifier: result.data.email,
            password: "[REDACTED]",
        });

        const response = await fetch(strapiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identifier: result.data.email,
                password: result.data.password,
            }),
            cache: "no-store",
        });

        const rawText = await response.text();
        let data: any = null;

        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch {
            data = rawText;
        }

        console.log("Signin status:", response.status);
        console.log(
            "Signin headers:",
            Object.fromEntries(response.headers.entries())
        );
        console.log("Signin raw response:", rawText);
        console.log("Signin parsed response:", data);

        let postLoginSetupError: string | null = null;

        if (response.ok && data?.jwt && data?.user) {
            try {
                const cookieStore = await cookies();

                cookieStore.set("jwt", data.jwt, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                cookieStore.set("userId", String(data.user.id), {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                cookieStore.set("username", data.user.username ?? "", {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                cookieStore.set("userEmail", data.user.email ?? "", {
                    httpOnly: false,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 7,
                });

                const existingUserDb = await findUserDbByAuthUser(
                    data.jwt,
                    data.user.id,
                    data.user.email,
                    data.user.username
                );

                if (!existingUserDb) {
                    await createUserDbEntry(data.jwt, {
                        id: data.user.id,
                        documentId: data.user.documentId,
                        username: data.user.username,
                        email: data.user.email,
                    });
                }
            } catch (postLoginError) {
                console.error("Post-login setup failed:", postLoginError);
                postLoginSetupError =
                    postLoginError instanceof Error
                        ? postLoginError.message
                        : "Signed in, but profile setup failed.";
            }
        }

        if (!response.ok) {
            return {
                ...prevState,
                ZodError: null,
                strapiError: data?.error ?? data ?? null,
                errorMessage: data?.error?.message ?? "Failed to sign in.",
                success: false,
                successMessage: null,
                jwt: null,
                user: null,
            };
        }

        return {
            ...prevState,
            ZodError: null,
            strapiError: null,
            errorMessage: postLoginSetupError,
            success: true,
            successMessage: "Signed in successfully.",
            jwt: data?.jwt ?? null,
            user: data?.user ?? null,
        };
    } catch (error) {
        console.error("Sign in error:", error);

        return {
            ...prevState,
            ZodError: null,
            strapiError: null,
            errorMessage:
                error instanceof Error
                    ? error.message
                    : "Could not connect to Strapi.",
            success: false,
            successMessage: null,
            jwt: null,
            user: null,
        };
    }
}

export async function ToggleLikeProductAction(productId: string | number) {
    console.log("Toggling liked product:", productId);

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
        let userDbEntry = await ensureUserDbEntry(jwt, authUser);

        if (!userDbEntry) {
            return {
                success: false,
                errorMessage: "No user profile was found for this account yet.",
                liked: false,
            };
        }

        const currentLikedProducts = Array.isArray(userDbEntry.likedProducts)
            ? userDbEntry.likedProducts
            : [];

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

        const response = await fetch(
            `${STRAPI_URL}/api/userdbs/${userDbEntry.documentId}`,
            {
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
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const rawText = await response.text();

            return {
                success: false,
                errorMessage: rawText || "Failed to update liked products.",
                liked: alreadyLiked,
            };
        }

        return {
            success: true,
            errorMessage: null,
            liked: !alreadyLiked,
        };
    } catch (error) {
        console.error("ToggleLikeProductAction error:", error);

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
