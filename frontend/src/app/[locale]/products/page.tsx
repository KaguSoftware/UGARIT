import { Filters } from "@/src/components/ui/filters/filters";
import ProductGrid from "@/src/components/productsGrid/products";

export const dynamic = "force-dynamic";

const STRAPI_URL =
	process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getMediaUrl(url?: string | null) {
	if (!url) return "/mock-images/mockshirt.png";
	if (url.startsWith("http")) return url;
	return `${STRAPI_URL}${url}`;
}

async function getProducts() {
	const res = await fetch(`${STRAPI_URL}/api/products?populate=*`, {
		cache: "no-store",
	});

	if (!res.ok) {
		return { data: [] };
	}

	return res.json();
}

export default async function ProductList() {
	const strapiResponse = await getProducts();

	const formattedProducts = strapiResponse.data.map((item: any) => {
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
		<main className="bg-white text-black min-h-screen">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8">All Products</h1>
				<Filters />
				<ProductGrid products={formattedProducts} />
			</div>
		</main>
	);
}
