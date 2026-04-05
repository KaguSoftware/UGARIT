const STRAPI_URL =
    process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
    "http://localhost:1337";

if (
    !process.env.NEXT_PUBLIC_STRAPI_URL &&
    process.env.NODE_ENV === "production"
) {
    console.warn(
        "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost, which will fail on the deployed site."
    );
}

export function getStrapiURL(path = "") {
    return `${STRAPI_URL}${path}`;
}

export function getStrapiMedia(url?: string | null) {
    if (!url) return "/mock-images/mockshirt.png";
    if (url.startsWith("http")) return url;
    return `${STRAPI_URL}${url}`;
}
