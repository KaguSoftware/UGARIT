import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/src/lib/supabase/public";

export type SiteSettings = {
    whatsappNumber: string;
    storeName: string;
    socials: Record<string, string>;
};

const DEFAULTS: SiteSettings = {
    whatsappNumber: "905372825347",
    storeName: "UGARIT",
    socials: {},
};

export const SITE_SETTINGS_TAG = "site-settings";

/**
 * Reads the editable site settings (key/value rows) and returns them as a typed
 * object, falling back to sensible defaults. Cached and tagged so the admin
 * Settings form can revalidate it instantly on save.
 */
export const getSiteSettings = unstable_cache(
    async (): Promise<SiteSettings> => {
        const supabase = createPublicClient();
        const { data } = await supabase.from("site_settings").select("key, value");

        const map = new Map<string, unknown>(
            (data ?? []).map((row: any) => [row.key, row.value])
        );

        const asString = (v: unknown, fallback: string) =>
            typeof v === "string" ? v : fallback;

        return {
            whatsappNumber: asString(
                map.get("whatsapp_number"),
                DEFAULTS.whatsappNumber
            ),
            storeName: asString(map.get("store_name"), DEFAULTS.storeName),
            socials:
                (map.get("socials") as Record<string, string> | undefined) ??
                DEFAULTS.socials,
        };
    },
    ["site-settings"],
    { tags: [SITE_SETTINGS_TAG], revalidate: 600 }
);

export async function getWhatsappNumber(): Promise<string> {
    return (await getSiteSettings()).whatsappNumber;
}
