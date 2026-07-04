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

    if (isAdminRoute) {
        // Look up admin status once when a user is present; skip the DB round-trip
        // entirely for anonymous visitors.
        let isAdmin = false;
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .single();
            isAdmin = Boolean(profile?.is_admin);
        }

        if (pathname === "/admin/login") {
            // Already-authenticated admins skip the login page.
            if (isAdmin) {
                const url = request.nextUrl.clone();
                url.pathname = "/admin";
                url.search = "";
                return NextResponse.redirect(url);
            }
        } else if (!isAdmin) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin/login";
            if (user) url.searchParams.set("error", "not-admin");
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
