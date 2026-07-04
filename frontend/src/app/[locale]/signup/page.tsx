import { redirect } from "@/src/i18n/routing";
import SignUp from "@/src/components/SignUp/SignUp";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
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

    if (user) {
        redirect({ href: next?.startsWith("/") ? next : "/user", locale });
    }

    return (
        <main>
            <SignUp next={next} />
        </main>
    );
}
