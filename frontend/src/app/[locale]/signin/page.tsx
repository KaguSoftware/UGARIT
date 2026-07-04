import { redirect } from "@/src/i18n/routing";
import SignIn from "@/src/components/SignIn/SignIn";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SignInPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ next?: string }>;
}) {
    const { locale } = await params;
    const { next } = await searchParams;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Already signed in → no reason to show the form.
    if (user) {
        redirect({ href: next?.startsWith("/") ? next : "/user", locale });
    }

    return (
        <main>
            <SignIn next={next} />
        </main>
    );
}
