import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import { notFound } from "next/navigation";

const STRAPI_URL =
	process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getMediaUrl(url?: string | null) {
	if (!url) return "/mock-images/mockshirt.png";
	if (url.startsWith("http")) return url;
	return `${STRAPI_URL}${url}`;
}

async function getCategory(slug: string, locale: string) {
	const res = await fetch(
		`${STRAPI_URL}/api/categories?filters[slug][$eq]=${encodeURIComponent(slug)}&locale=${locale}&populate=*`,
		{ cache: "no-store" },
	);

	if (!res.ok) return null;

	const json = await res.json();
	return json.data?.[0] || null;
}

async function getProductsByCategory(slug: string, locale: string) {
	const res = await fetch(
		`${STRAPI_URL}/api/products?filters[category][slug][$eq]=${encodeURIComponent(slug)}&locale=${locale}`,
		{ cache: "no-store" },
	);

	if (!res.ok) return { data: [] };

	return res.json();
}

export default async function CategoryPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;

	const category = await getCategory(slug, locale);
	if (!category) notFound();

	const productsResponse = await getProductsByCategory(slug, locale);

	const products = productsResponse.data.map((item: any) => {
		const imagePath = Array.isArray(item.image)
			? item.image[0]?.url
			: item.image?.url;

		return {
			id: item.documentId,
			title: item.title,
			price: item.price,
			imageUrl: getMediaUrl(imagePath),
			category: item.category?.name || "Uncategorized",
			slug: item.slug,
		};
	});

	return (
		<main className="min-h-screen py-8">
			<MaxWidthWrapper>
				<h1 className="text-3xl font-bold mb-6">{category.name}</h1>

				{products.length > 0 ? (
					<ProductGrid products={products} />
				) : (
					<div className="rounded-2xl border p-8 text-center text-gray-500">
						No products found in this category yet.
					</div>
				)}
			</MaxWidthWrapper>
		</main>
	);
}
