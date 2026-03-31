const STRAPI_URL =
	process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export function getStrapiURL(path = "") {
	return `${STRAPI_URL}${path}`;
}

export function getStrapiMedia(url?: string | null) {
	if (!url) return "/mock-images/mockshirt.png";
	if (url.startsWith("http")) return url;
	return `${STRAPI_URL}${url}`;
}
