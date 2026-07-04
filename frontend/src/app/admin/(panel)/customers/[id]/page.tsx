import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized } from "@/src/lib/supabase/media";
import { FadeIn } from "@/src/components/admin/Motion";
import AdminToggle from "../AdminToggle";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createAdminClient();

    const [{ data: profile }, { data: likes }, { data: carts }] =
        await Promise.all([
            supabase
                .from("profiles")
                .select("id, email, username, is_admin, created_at")
                .eq("id", id)
                .maybeSingle(),
            supabase
                .from("liked_products")
                .select("product:products(id, slug, title)")
                .eq("profile_id", id),
            supabase
                .from("carts")
                .select(
                    "id, status, cart_items(id, title_snapshot, size, color, quantity, unit_price)"
                )
                .eq("profile_id", id),
        ]);

    if (!profile) notFound();

    const cartItems = (carts ?? []).flatMap((c: any) => c.cart_items ?? []);

    return (
        <FadeIn>
            <Link
                href="/admin/customers"
                className="text-sm text-neutral-500 hover:text-neutral-800"
            >
                ← Back to customers
            </Link>

            <div className="mt-4 mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {profile.username || profile.email}
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        {profile.email}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                        Joined{" "}
                        {profile.created_at
                            ? new Date(profile.created_at).toLocaleDateString()
                            : "—"}
                    </p>
                </div>
                <AdminToggle
                    profileId={profile.id}
                    isAdmin={Boolean(profile.is_admin)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <section className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                        Liked products ({likes?.length ?? 0})
                    </h2>
                    {likes && likes.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                            {likes.map((l: any, i: number) => (
                                <li key={i}>
                                    {l.product ? (
                                        <Link
                                            href={`/admin/products/${l.product.id}`}
                                            className="text-neutral-800 hover:underline"
                                        >
                                            {localized(l.product.title, "en") ||
                                                l.product.slug}
                                        </Link>
                                    ) : (
                                        <span className="text-neutral-400">
                                            (deleted product)
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-neutral-400">
                            No liked products.
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <h2 className="mb-3 text-sm font-semibold text-neutral-700">
                        Cart items ({cartItems.length})
                    </h2>
                    {cartItems.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                            {cartItems.map((it: any) => (
                                <li
                                    key={it.id}
                                    className="flex justify-between gap-3"
                                >
                                    <span className="min-w-0 truncate text-neutral-800">
                                        {it.quantity} × {it.title_snapshot}
                                        {it.size ? ` • ${it.size}` : ""}
                                        {it.color && it.color !== "Default"
                                            ? ` • ${it.color}`
                                            : ""}
                                    </span>
                                    <span className="whitespace-nowrap text-neutral-500">
                                        ₺
                                        {(
                                            Number(it.unit_price) * it.quantity
                                        ).toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-neutral-400">
                            Cart is empty.
                        </p>
                    )}
                </section>
            </div>
        </FadeIn>
    );
}
