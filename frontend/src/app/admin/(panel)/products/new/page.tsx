import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized } from "@/src/lib/supabase/media";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
    const supabase = createAdminClient();
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("slug");

    const options = (categories ?? []).map((c: any) => ({
        id: c.id,
        label: localized(c.name, "en") || c.slug,
    }));

    return (
        <div className="max-w-3xl">
            <h1 className="mb-6 text-2xl font-bold">New product</h1>
            <ProductForm categories={options} />
        </div>
    );
}
