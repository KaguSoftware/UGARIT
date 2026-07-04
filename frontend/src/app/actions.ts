"use server";

import z from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";

const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

const LoginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

type ActionState = {
    ZodError?: Record<string, string[] | undefined> | null;
    errorMessage?: string | null;
    success?: boolean;
    successMessage?: string | null;
    user?: unknown;
    redirectTo?: string | null;
};

function buildActionState(
    prevState: ActionState,
    overrides: Partial<ActionState>
): ActionState {
    return {
        ...prevState,
        ZodError: null,
        errorMessage: null,
        success: false,
        successMessage: null,
        user: null,
        redirectTo: null,
        ...overrides,
    };
}

/**
 * Lightweight, non-httpOnly cookies that client components read to detect login
 * state and display the username/email. The real session is the Supabase
 * cookie managed by @supabase/ssr.
 */
async function setProfileCookies(user: {
    id: string;
    username?: string | null;
    email?: string | null;
}) {
    const cookieStore = await cookies();
    const opts = {
        httpOnly: false as const,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    };
    cookieStore.set("userId", user.id, opts);
    cookieStore.set("username", user.username ?? "", opts);
    cookieStore.set("userEmail", user.email ?? "", opts);
}

async function upsertProfile(
    id: string,
    username: string,
    email: string
): Promise<void> {
    const supabase = await createClient();
    await supabase
        .from("profiles")
        .upsert({ id, username, email }, { onConflict: "id" });
}

export async function CreateUserAction(
    prevState: ActionState,
    formData: FormData
) {
    const result = CreateUserSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        name: formData.get("name"),
    });

    if (!result.success) {
        return buildActionState(prevState, {
            ZodError: result.error.flatten().fieldErrors,
            errorMessage: "Please fix the highlighted fields.",
        });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: { data: { username: result.data.name } },
    });

    if (error) {
        // If the account already exists, try to sign in instead (mirrors old flow).
        const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({
                email: result.data.email,
                password: result.data.password,
            });

        if (loginError || !loginData.session) {
            return buildActionState(prevState, {
                errorMessage:
                    "An account with this email already exists. Please sign in instead.",
            });
        }

        await setProfileCookies({
            id: loginData.user.id,
            username: result.data.name,
            email: loginData.user.email,
        });
        await upsertProfile(
            loginData.user.id,
            result.data.name,
            loginData.user.email ?? result.data.email
        );

        return buildActionState(prevState, {
            success: true,
            successMessage:
                "Your account already existed, so you were signed in instead.",
            user: loginData.user,
            redirectTo: "/user",
        });
    }

    // When email confirmation is required, signUp returns a user but no session.
    // Only mark the browser as "logged in" once a real session exists — otherwise
    // the navbar would show the user as signed in before they confirm.
    if (data.user && data.session) {
        await setProfileCookies({
            id: data.user.id,
            username: result.data.name,
            email: data.user.email,
        });
        await upsertProfile(
            data.user.id,
            result.data.name,
            data.user.email ?? result.data.email
        );
    }

    return buildActionState(prevState, {
        success: true,
        successMessage: data.session
            ? "User created successfully."
            : "Account created. Please check your email to confirm, then sign in.",
        user: data.user,
        redirectTo: data.session ? "/user" : null,
    });
}

export async function LoginUserAction(
    prevState: ActionState,
    formData: FormData
) {
    const result = LoginUserSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!result.success) {
        return buildActionState(prevState, {
            ZodError: result.error.flatten().fieldErrors,
            errorMessage: "Please fix the highlighted fields.",
        });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
    });

    if (error || !data.user) {
        return buildActionState(prevState, {
            errorMessage: error?.message ?? "Invalid email or password.",
        });
    }

    const username =
        (data.user.user_metadata?.username as string | undefined) ??
        data.user.email?.split("@")[0] ??
        "";

    await setProfileCookies({
        id: data.user.id,
        username,
        email: data.user.email,
    });
    await upsertProfile(data.user.id, username, data.user.email ?? "");

    return buildActionState(prevState, {
        success: true,
        successMessage: "Signed in successfully.",
        user: data.user,
        redirectTo: "/user",
    });
}

export async function ToggleLikeProductAction(productId: string | number) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                errorMessage: "You must be signed in to like products.",
                liked: false,
            };
        }

        const id = String(productId);

        const { data: existing } = await supabase
            .from("liked_products")
            .select("product_id")
            .eq("profile_id", user.id)
            .eq("product_id", id)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("liked_products")
                .delete()
                .eq("profile_id", user.id)
                .eq("product_id", id);
            return { success: true, errorMessage: null, liked: false };
        }

        const { error } = await supabase
            .from("liked_products")
            .insert({ profile_id: user.id, product_id: id });

        if (error) throw error;

        return { success: true, errorMessage: null, liked: true };
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
    const supabase = await createClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    const opts = {
        httpOnly: false as const,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    };
    cookieStore.set("userId", "", opts);
    cookieStore.set("username", "", opts);
    cookieStore.set("userEmail", "", opts);
}
