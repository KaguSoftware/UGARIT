import { notFound } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized } from "@/src/lib/supabase/media";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createAdminClient();

    const [{ data: product }, { data: categories }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).maybeSingle(),
        supabase.from("categories").select("id, name, slug").order("slug"),
    ]);

    if (!product) notFound();

    const options = (categories ?? []).map((c: any) => ({
        id: c.id,
        label: localized(c.name, "en") || c.slug,
    }));

    return (
        <div className="max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold">Edit product</h1>
            <ProductForm product={product} categories={options} />
        </div>
    );
}
