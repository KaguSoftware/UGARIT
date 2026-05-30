import Link from "next/link";
import { createAdminClient } from "@/src/lib/supabase/admin";

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
        <div>
            <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-3 gap-4">
                {cards.map((c) => (
                    <Link
                        key={c.label}
                        href={c.href}
                        className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-sm"
                    >
                        <div className="text-3xl font-bold">{c.value}</div>
                        <div className="mt-1 text-sm text-neutral-500">
                            {c.label}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
