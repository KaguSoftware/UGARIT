import Link from "next/link";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { FadeIn, Stagger, StaggerItem, Pressable } from "@/src/components/admin/Motion";

export const dynamic = "force-dynamic";

async function count(table: string) {
    const supabase = createAdminClient();
    const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
    return count ?? 0;
}

export default async function AdminDashboard() {
    const [products, categories, colors] = await Promise.all([
        count("products"),
        count("categories"),
        count("colors"),
    ]);

    const cards = [
        { label: "Products", value: products, href: "/admin/products" },
        { label: "Categories", value: categories, href: "/admin/categories" },
        { label: "Colors", value: colors, href: "/admin/colors" },
    ];

    return (
        <FadeIn>
            <h1 className="mb-1 text-2xl font-bold">Welcome 👋</h1>
            <p className="mb-6 text-sm text-neutral-500">
                Manage your shop here. Click a card below, or use the menu on the
                left, to add or edit products and categories.
            </p>
            <Stagger className="grid grid-cols-3 gap-4">
                {cards.map((c) => (
                    <StaggerItem key={c.label}>
                        <Pressable>
                            <Link
                                href={c.href}
                                className="block rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
                            >
                                <div className="text-3xl font-bold">
                                    {c.value}
                                </div>
                                <div className="mt-1 text-sm text-neutral-500">
                                    {c.label}
                                </div>
                            </Link>
                        </Pressable>
                    </StaggerItem>
                ))}
            </Stagger>
        </FadeIn>
    );
}
