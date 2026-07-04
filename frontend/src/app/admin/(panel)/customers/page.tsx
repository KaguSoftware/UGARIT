import Link from "next/link";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { FadeIn } from "@/src/components/admin/Motion";
import AdminToggle from "./AdminToggle";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
    const supabase = createAdminClient();
    const { data: profiles } = await supabase
        .from("profiles")
        .select(
            "id, email, username, is_admin, created_at, liked_products(count), carts(cart_items(count))"
        )
        .order("created_at", { ascending: false });

    const rows = (profiles ?? []).map((p: any) => {
        const likes = p.liked_products?.[0]?.count ?? 0;
        const cartItems = (p.carts ?? []).reduce(
            (sum: number, c: any) => sum + (c.cart_items?.[0]?.count ?? 0),
            0
        );
        return { ...p, likes, cartItems };
    });

    return (
        <FadeIn>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Customers</h1>
                <p className="mt-1 text-sm text-neutral-500">
                    Registered accounts and their activity.
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Username</th>
                            <th className="px-4 py-3 font-medium">Likes</th>
                            <th className="px-4 py-3 font-medium">Cart items</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((p: any) => (
                            <tr
                                key={p.id}
                                className="border-b border-neutral-100 last:border-0"
                            >
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/customers/${p.id}`}
                                        className="text-neutral-900 hover:underline"
                                    >
                                        {p.email || "—"}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">
                                    {p.username || "—"}
                                </td>
                                <td className="px-4 py-3">{p.likes}</td>
                                <td className="px-4 py-3">{p.cartItems}</td>
                                <td className="px-4 py-3">
                                    {p.is_admin ? (
                                        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                                            Admin
                                        </span>
                                    ) : (
                                        <span className="text-neutral-400">
                                            Customer
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <AdminToggle
                                        profileId={p.id}
                                        isAdmin={Boolean(p.is_admin)}
                                    />
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-neutral-400"
                                >
                                    No customers yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </FadeIn>
    );
}
