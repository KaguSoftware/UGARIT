import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase email-confirmation / OAuth callback.
 *
 * The confirmation link points here with a one-time `?code=…`. We exchange it
 * for a real session (setting the auth cookies on the response), then redirect
 * the user into the app — to `next` when provided, otherwise the account page.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get("code");

    const nextParam = searchParams.get("next");
    const next =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
            ? nextParam
            : "/user";

    const errorRedirect = NextResponse.redirect(`${origin}/signin?error=auth`);

    if (!code) return errorRedirect;

    // We must attach the session cookies to the response we ultimately return,
    // so build it up front and let the client write onto it.
    const response = NextResponse.redirect(`${origin}${next}`);

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return errorRedirect;

    return response;
}
