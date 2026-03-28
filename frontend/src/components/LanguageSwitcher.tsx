"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/src/i18n/routing"; // Adjust path if needed
import { ChangeEvent, useTransition } from "react";

export default function LanguageSwitcher() {
    // 1. Get the current locale (e.g., 'en' or 'ar')
    const currentLocale = useLocale();

    // 2. Use your custom next-intl router and pathname
    const router = useRouter();
    const pathname = usePathname();

    // 3. useTransition prevents the UI from freezing while the new route loads
    const [isPending, startTransition] = useTransition();

    const onSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = event.target.value;

        startTransition(() => {
            // Replace the current URL with the new locale while keeping the same path
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <label className="relative border border-gray-600 rounded-md p-1 flex items-center gap-2">
            <span className="sr-only">Change Language</span>
            <select
                defaultValue={currentLocale}
                disabled={isPending}
                onChange={onSelectChange}
                className="appearance-none bg-transparent cursor-pointer pl-2 pr-6 py-1 text-sm outline-none disabled:opacity-50"
            >
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
                {/* Add <option value="tr">Türkçe (Turkish)</option> if you add Turkish back! */}
            </select>

            {/* Simple dropdown arrow icon */}
            <span className="pointer-events-none absolute right-2 text-gray-400">
                ▼
            </span>
        </label>
    );
}