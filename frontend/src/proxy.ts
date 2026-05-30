import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Refreshes the Supabase auth session cookie and, for /admin routes, enforces
 * that the user is signed in and is an admin. Storefront (locale) routes are
 * delegated to the next-intl middleware after the session is refreshed.
 */
export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isAdminRoute = pathname.startsWith("/admin");

    // Base response: for storefront routes, let next-intl handle rewrites.
    const response = isAdminRoute
        ? NextResponse.next({ request })
        : intlMiddleware(request);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (isAdminRoute && pathname !== "/admin/login") {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/login";
            return NextResponse.redirect(url);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        if (!profile?.is_admin) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/login";
            url.searchParams.set("error", "not-admin");
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/",
        "/(ar|en|tr)/:path*",
        "/admin/:path*",
    ],
};
