"use client";

import FormShell from "@/src/components/admin/FormShell";
import { saveSettings } from "../../actions";

type Settings = {
    whatsappNumber: string;
    storeName: string;
    socials: Record<string, string>;
};

export default function SettingsForm({ settings }: { settings: Settings }) {
    return (
        <FormShell action={saveSettings}>
            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    WhatsApp order number
                </label>
                <input
                    type="text"
                    name="whatsapp_number"
                    defaultValue={settings.whatsappNumber}
                    placeholder="905372825347"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
                <p className="mt-1 text-xs text-neutral-500">
                    Digits only, including country code (e.g. 90 for Turkey). Used
                    by the &ldquo;Order via WhatsApp&rdquo; buttons on product and
                    cart pages.
                </p>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Store name
                </label>
                <input
                    type="text"
                    name="store_name"
                    defaultValue={settings.storeName}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Instagram URL
                </label>
                <input
                    type="text"
                    name="instagram"
                    defaultValue={settings.socials?.instagram ?? ""}
                    placeholder="https://instagram.com/…"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
            </div>
        </FormShell>
    );
}
