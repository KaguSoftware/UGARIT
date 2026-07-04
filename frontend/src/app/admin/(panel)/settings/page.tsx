import { createAdminClient } from "@/src/lib/supabase/admin";
import SavedBanner from "@/src/components/admin/SavedBanner";
import { FadeIn } from "@/src/components/admin/Motion";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string }>;
}) {
    const { saved } = await searchParams;
    const supabase = createAdminClient();
    const { data } = await supabase.from("site_settings").select("key, value");

    const map = new Map<string, unknown>(
        (data ?? []).map((row: any) => [row.key, row.value])
    );
    const asString = (v: unknown) => (typeof v === "string" ? v : "");

    const settings = {
        whatsappNumber: asString(map.get("whatsapp_number")) || "905372825347",
        storeName: asString(map.get("store_name")) || "UGARIT",
        socials:
            (map.get("socials") as Record<string, string> | undefined) ?? {},
    };

    return (
        <FadeIn>
            <SavedBanner show={saved === "1"} />
            <div className="mb-6 max-w-3xl">
                <h1 className="text-2xl font-bold">Site settings</h1>
                <p className="mt-1 text-sm text-neutral-500">
                    These apply across the storefront.
                </p>
            </div>
            <div className="max-w-3xl">
                <SettingsForm settings={settings} />
            </div>
        </FadeIn>
    );
}
