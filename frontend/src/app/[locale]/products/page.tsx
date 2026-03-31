import { Filters } from "@/src/components/ui/filters/filters";
import ProductGrid from "@/src/components/productsGrid/products";
import { getStrapiMedia, getStrapiURL } from "@/src/lib/strapi";

export const dynamic = "force-dynamic";

async function getProducts() {
	const res = await fetch(getStrapiURL("/api/products?populate=*"), {
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
		const imagePath = item.image?.[0]?.url || item.image?.url || null;

		return {
			id: item.documentId,
			title: item.title,
			price: item.price,
			imageUrl: getStrapiMedia(imagePath),
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
