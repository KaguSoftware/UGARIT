import CategoryGrid from "@/src/components/cards/CategoryCard/categoryGrid";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductGrid from "@/src/components/productsGrid/products";
import ProductCarousel from "@/src/components/carousel/ProductCarousel";

export const dynamic = "force-dynamic";

const STRAPI_URL =
	process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getMediaUrl(url?: string | null) {
	if (!url) return "/image1.jpeg";
	if (url.startsWith("http")) return url;
	return `${STRAPI_URL}${url}`;
}

function extractImageUrl(image: any) {
	if (!image) return "/image1.jpeg";

	if (Array.isArray(image)) {
		return extractImageUrl(image[0]);
	}

	if (typeof image === "string") {
		return getMediaUrl(image);
	}

	if (image.url) {
		return getMediaUrl(image.url);
	}

	if (image.data) {
		return extractImageUrl(image.data);
	}

	if (image.attributes?.url) {
		return getMediaUrl(image.attributes.url);
	}

	return "/image1.jpeg";
}

async function getFeaturedProducts() {
	try {
		const res = await fetch(
			`${STRAPI_URL}/api/products?filters[isFeatured][$eq]=true&populate=*`,
			{ cache: "no-store" },
		);

		if (!res.ok) return { data: [] };
		return await res.json();
	} catch (error) {
		console.error("Failed to fetch featured products", error);
		return { data: [] };
	}
}

async function getHomepageCategories(locale: string) {
	try {
		const res = await fetch(
			`${STRAPI_URL}/api/categories?locale=${locale}&populate[image]=true`,
			{ cache: "no-store" },
		);

		if (!res.ok) return { data: [] };
		return await res.json();
	} catch (error) {
		console.error("Failed to fetch homepage categories", error);
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

	console.log(
		"STRAPI CATEGORIES:",
		JSON.stringify(categoriesResponse.data, null, 2),
	);

	const featuredProducts = productsResponse.data.map((item: any) => ({
		id: item.documentId,
		title: item.title,
		price: item.price,
		imageUrl: extractImageUrl(item.image),
		category: item.category?.name || "Uncategorized",
		slug: item.slug,
	}));

	const homepageCategories = categoriesResponse.data.map((item: any) => ({
		id: item.id || item.documentId,
		title: item.name,
		moreLink: `/categories/${item.slug}`,
		imageUrl: extractImageUrl(item.image),
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
