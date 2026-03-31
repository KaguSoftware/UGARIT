import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import { CATEGORIES } from "@/src/components/cards/CategoryCard/constants";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";
import { getStrapiMedia, getStrapiURL } from "@/src/lib/strapi";

export const dynamic = "force-dynamic";

async function getFeaturedProducts() {
	try {
		const res = await fetch(
			getStrapiURL(
				"/api/products?filters[isFeatured][$eq]=true&populate=*",
			),
			{ cache: "no-store" },
		);
		if (!res.ok) return { data: [] };
		return await res.json();
	} catch (error) {
		console.error("Failed to fetch featured products", error);
		return { data: [] };
	}
}

export default async function Home() {
	const strapiResponse = await getFeaturedProducts();

	const featuredProducts = strapiResponse.data.map((item: any) => {
		const imagePath = Array.isArray(item.image)
			? item.image[0]?.url
			: item.image?.url;

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
		<main>
			<MaxWidthWrapper>
				<CategoryGrid categories={CATEGORIES} />
				<ProductCarousel
					title="Featured Products"
					products={featuredProducts}
				/>
				<ProductGrid products={featuredProducts} />
				<LocationCard />
			</MaxWidthWrapper>
		</main>
	);
}
