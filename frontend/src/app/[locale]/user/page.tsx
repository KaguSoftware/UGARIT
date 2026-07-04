import { Heart, ShoppingBag, User as UserIcon, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/routing";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { createClient } from "@/src/lib/supabase/server";
import LogoutButton from "@/src/components/UserPage/LogoutButton";

export const dynamic = "force-dynamic";

export default async function UserPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations();
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Not signed in → go straight to sign in, then come back here.
    if (!user) {
        redirect({ href: "/signin?next=/user", locale });
    }

    const [{ data: profile }, likes, carts] = await Promise.all([
        supabase
            .from("profiles")
            .select("username, email")
            .eq("id", user!.id)
            .maybeSingle(),
        supabase
            .from("liked_products")
            .select("product_id", { count: "exact", head: true })
            .eq("profile_id", user!.id),
        supabase
            .from("carts")
            .select("cart_items(count)")
            .eq("profile_id", user!.id),
    ]);

    const username =
        profile?.username ||
        (user!.user_metadata?.username as string | undefined) ||
        user!.email?.split("@")[0] ||
        "User";
    const email = profile?.email || user!.email || "";

    const likedCount = likes.count ?? 0;
    const cartCount = (carts.data ?? []).reduce(
        (sum: number, c: any) => sum + (c.cart_items?.[0]?.count ?? 0),
        0
    );

    return (
        <MaxWidthWrapper>
            <main className="mx-auto w-full max-w-2xl px-4 py-10 md:py-16">
                <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-4 bg-neutral-50 px-6 py-10 text-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
                            <UserIcon className="h-11 w-11 text-neutral-700" />
                        </div>
                        <div>
                            <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
                                {t("User.userpage.welcome")}
                            </p>
                            <h1 className="mt-1 text-3xl font-bold text-neutral-900">
                                {username}
                            </h1>
                            {email && (
                                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-neutral-500">
                                    <Mail size={14} />
                                    {email}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-px bg-neutral-200">
                        <Link
                            href="/likedproducts"
                            className="flex flex-col items-center gap-1 bg-white py-6 transition-colors hover:bg-neutral-50"
                        >
                            <Heart className="h-5 w-5 text-red-500" />
                            <span className="text-2xl font-bold text-neutral-900">
                                {likedCount}
                            </span>
                            <span className="text-xs uppercase tracking-wide text-neutral-500">
                                {t("Common.likedProducts")}
                            </span>
                        </Link>
                        <Link
                            href="/cart"
                            className="flex flex-col items-center gap-1 bg-white py-6 transition-colors hover:bg-neutral-50"
                        >
                            <ShoppingBag className="h-5 w-5 text-neutral-700" />
                            <span className="text-2xl font-bold text-neutral-900">
                                {cartCount}
                            </span>
                            <span className="text-xs uppercase tracking-wide text-neutral-500">
                                {t("Common.qty")}
                            </span>
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 p-6">
                        <Link
                            href="/likedproducts"
                            className="flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
                        >
                            {t("User.userpage.liked")}
                        </Link>
                        <Link
                            href="/cart"
                            className="flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
                        >
                            {t("User.userpage.cart")}
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
            </main>
        </MaxWidthWrapper>
    );
}
