import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import ProductGrid from "@/src/components/productsGrid/products";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { createClient } from "@/src/lib/supabase/server";
import { formatProduct } from "@/src/lib/queries";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations("Common");
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                <h1 className="mb-4 text-3xl font-bold">
                    {t("likedProducts")}
                </h1>
                <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                    {t("signInFirst")}
                </p>
            </main>
        );
    }

    const cookieStore = await cookies();
    const username = cookieStore.get("username")?.value ?? "";

    const { data } = await supabase
        .from("liked_products")
        .select(
            "product:products(id, slug, title, price, images, category:categories(name))"
        )
        .eq("profile_id", user.id);

    const likedProducts = (data ?? [])
        .map((row: any) => row.product)
        .filter(Boolean)
        .map((product: any) => formatProduct(product, locale));

    return (
        <MaxWidthWrapper>
            <main className="mx-auto p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {t("likedProducts")}
                        </h1>
                        <p className="text-gray-600">
                            {t("savedProductsBy", { name: username })}
                        </p>
                    </div>
                </div>

                {likedProducts.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
                        {t("noLikedProducts")}
                    </div>
                ) : (
                    <ProductGrid
                        products={likedProducts}
                        likedProductIds={likedProducts.map((product) => product.id)}
                    />
                )}
            </main>
        </MaxWidthWrapper>
    );
}
