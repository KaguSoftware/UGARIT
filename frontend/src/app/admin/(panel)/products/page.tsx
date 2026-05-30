import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized, firstImage } from "@/src/lib/supabase/media";
import DeleteButton from "@/src/components/admin/DeleteButton";
import { deleteProduct } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
    const supabase = createAdminClient();
    const { data: products } = await supabase
        .from("products")
        .select(
            "id, slug, title, price, images, is_featured, category:categories(name)"
        )
        .order("created_at", { ascending: false });

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Products</h1>
                <Link
                    href="/admin/products/new"
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                    + New product
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Image</th>
                            <th className="px-4 py-3 font-medium">Title (EN)</th>
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">Price</th>
                            <th className="px-4 py-3 font-medium">Featured</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {(products ?? []).map((p: any) => (
                            <tr
                                key={p.id}
                                className="border-b border-neutral-100 last:border-0"
                            >
                                <td className="px-4 py-3">
                                    <Image
                                        src={firstImage(p.images)}
                                        alt=""
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded object-cover"
                                        unoptimized
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    {localized(p.title, "en") || "—"}
                                </td>
                                <td className="px-4 py-3">
                                    {p.category?.name
                                        ? localized(p.category.name, "en")
                                        : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    {p.price != null ? `₺${p.price}` : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    {p.is_featured ? "Yes" : "No"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/admin/products/${p.id}`}
                                        className="mr-3 text-neutral-600 hover:text-neutral-900"
                                    >
                                        Edit
                                    </Link>
                                    <DeleteButton
                                        id={p.id}
                                        action={deleteProduct}
                                    />
                                </td>
                            </tr>
                        ))}
                        {(!products || products.length === 0) && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-neutral-400"
                                >
                                    No products yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
