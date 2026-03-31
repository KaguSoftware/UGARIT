import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";

export const dynamic = "force-dynamic";

const STRAPI_URL =
	process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getMediaUrl(url?: string | null) {
	if (!url) return "/mock-images/mockshirt.png";
	if (url.startsWith("http")) return url;
	return `${STRAPI_URL}${url}`;
}

async function getFeaturedProducts() {
	try {
		const res = await fetch(
			`${STRAPI_URL}/api/products?filters[isFeatured][$eq]=true`,
			{ cache: "no-store" },
		);
		if (!res.ok) return { data: [] };
		return await res.json();
	} catch {
		return { data: [] };
	}
}

async function getHomepageCategories(locale: string) {
	try {
		const res = await fetch(
			`${STRAPI_URL}/api/categories?locale=${locale}&populate=*`,
			{ cache: "no-store" },
		);
		if (!res.ok) return { data: [] };
		return await res.json();
	} catch {
		return { data: [] };
	}
}

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	const [productsResponse, categoriesResponse] = await Promise.all([
		getFeaturedProducts(),
		getHomepageCategories(locale),
	]);

	const featuredProducts = productsResponse.data.map((item: any) => {
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

	const homepageCategories = categoriesResponse.data.map((item: any) => ({
		id: item.id,
		title: item.name,
		moreLink: `/categories/${item.slug}`,
		imageUrl: getMediaUrl(item.image?.url),
	}));

	return (
		<main>
			<MaxWidthWrapper>
				<CategoryGrid categories={homepageCategories} />
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
