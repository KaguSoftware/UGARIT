export type Locale = "tr" | "en" | "ar";

const SOURCE_LOCALE: Locale = "tr";
const FALLBACK_IMAGE = "/mock-images/mockshirt.png";

/**
 * Localized JSONB field as stored in the DB: { tr, en, ar }.
 * Any locale may be missing/empty; we fall back to the source locale (tr),
 * then to the first non-empty value.
 */
export type LocalizedField = Partial<Record<Locale, string>> | null | undefined;

/**
 * Read a localized JSONB field for the active locale, with sensible fallbacks.
 */
export function localized(field: LocalizedField, locale: string): string {
    if (!field || typeof field !== "object") return "";

    const value = field[locale as Locale];
    if (value && value.trim()) return value;

    const source = field[SOURCE_LOCALE];
    if (source && source.trim()) return source;

    const first = Object.values(field).find((v) => v && v.trim());
    return first ?? "";
}

/**
 * Resolve a media URL. Storage URLs are already absolute, so this mostly just
 * applies the fallback image. Kept as a helper so call sites don't special-case
 * empty/missing media (replaces the old getStrapiMedia).
 */
export function getMediaUrl(url?: string | null): string {
    if (!url) return FALLBACK_IMAGE;
    return url;
}

/**
 * First image of a product's images[] array, or the fallback.
 */
export function firstImage(images?: string[] | null): string {
    if (Array.isArray(images) && images.length > 0 && images[0]) {
        return images[0];
    }
    return FALLBACK_IMAGE;
}
