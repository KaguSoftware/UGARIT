import { notFound } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createAdminClient();
    const { data: category } = await supabase
        .from("categories")
        .select(
            "id, slug, name, image_url, show_in_navbar, is_mega_menu, mega_menu_content"
        )
        .eq("id", id)
        .maybeSingle();

    if (!category) notFound();

    return (
        <div className="max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold">Edit category</h1>
            <CategoryForm category={category} />
        </div>
    );
}
