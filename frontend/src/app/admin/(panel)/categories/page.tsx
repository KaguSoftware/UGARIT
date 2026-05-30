import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized } from "@/src/lib/supabase/media";
import DeleteButton from "@/src/components/admin/DeleteButton";
import SavedBanner from "@/src/components/admin/SavedBanner";
import { FadeIn } from "@/src/components/admin/Motion";
import { deleteCategory } from "../../actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string }>;
}) {
    const { saved } = await searchParams;
    const supabase = createAdminClient();
    const { data: categories } = await supabase
        .from("categories")
        .select("id, slug, name, image_url, show_in_navbar")
        .order("slug", { ascending: true });

    return (
        <FadeIn>
            <SavedBanner show={saved === "1"} />
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Categories</h1>
                <Link
                    href="/admin/categories/new"
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                    + Add category
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Image</th>
                            <th className="px-4 py-3 font-medium">Name (EN)</th>
                            <th className="px-4 py-3 font-medium">Slug</th>
                            <th className="px-4 py-3 font-medium">Navbar</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {(categories ?? []).map((c: any) => (
                            <tr
                                key={c.id}
                                className="border-b border-neutral-100 last:border-0"
                            >
                                <td className="px-4 py-3">
                                    {c.image_url ? (
                                        <Image
                                            src={c.image_url}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="h-10 w-10 rounded object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-neutral-300">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {localized(c.name, "en") || "—"}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {c.slug}
                                </td>
                                <td className="px-4 py-3">
                                    {c.show_in_navbar ? "Yes" : "No"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/admin/categories/${c.id}`}
                                        className="mr-3 text-neutral-600 hover:text-neutral-900"
                                    >
                                        Edit
                                    </Link>
                                    <DeleteButton
                                        id={c.id}
                                        action={deleteCategory}
                                    />
                                </td>
                            </tr>
                        ))}
                        {(!categories || categories.length === 0) && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-neutral-400"
                                >
                                    No categories yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </FadeIn>
    );
}
