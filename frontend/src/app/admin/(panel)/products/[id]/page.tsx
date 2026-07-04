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

    const [{ data: product }, { data: categories }, { data: colors }, { data: variants }] =
        await Promise.all([
            supabase.from("products").select("*").eq("id", id).maybeSingle(),
            supabase.from("categories").select("id, name, slug").order("slug"),
            supabase.from("colors").select("id, name, hex_code"),
            supabase
                .from("product_color_variants")
                .select("image_url, color_id")
                .eq("product_id", id),
        ]);

    if (!product) notFound();

    const options = (categories ?? []).map((c: any) => ({
        id: c.id,
        label: localized(c.name, "en") || c.slug,
    }));

    const colorOptions = (colors ?? []).map((c: any) => ({
        id: c.id,
        label: localized(c.name, "en") || "Color",
        hex: c.hex_code || "#000000",
    }));

    // Map each saved image URL to its assigned color (if any), preserving the
    // gallery order stored on the product.
    const colorByUrl = new Map<string, string>();
    for (const v of variants ?? []) {
        if (v.color_id) colorByUrl.set(v.image_url, v.color_id);
    }
    const existingImages = (product.images ?? []).map((url: string) => ({
        url,
        colorId: colorByUrl.get(url) ?? null,
    }));

    return (
        <div className="max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold">Edit product</h1>
            <ProductForm
                product={product}
                categories={options}
                colors={colorOptions}
                existingImages={existingImages}
            />
        </div>
    );
}
