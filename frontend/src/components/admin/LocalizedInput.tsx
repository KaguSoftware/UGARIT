"use client";

import { useState } from "react";

const LOCALES = [
    { code: "tr", label: "TR" },
    { code: "en", label: "EN" },
    { code: "ar", label: "AR" },
] as const;

type Props = {
    label: string;
    name: string; // base name; fields submit as `${name}_${locale}`
    defaultValues?: Partial<Record<"tr" | "en" | "ar", string>>;
    textarea?: boolean;
    required?: boolean;
    help?: string;
};

/**
 * A localized text field with TR/EN/AR tabs. Renders all three inputs (hidden
 * unless active) so the full set is submitted with the form.
 */
export default function LocalizedInput({
    label,
    name,
    defaultValues = {},
    textarea = false,
    required = false,
    help,
}: Props) {
    const [active, setActive] = useState<"tr" | "en" | "ar">("tr");

    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                <div className="flex gap-1">
                    {LOCALES.map((l) => (
                        <button
                            key={l.code}
                            type="button"
                            onClick={() => setActive(l.code)}
                            className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                                active === l.code
                                    ? "bg-neutral-900 text-white"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {LOCALES.map((l) => {
                const common = {
                    name: `${name}_${l.code}`,
                    defaultValue: defaultValues[l.code] ?? "",
                    required: required && l.code === "tr",
                    className: `w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none ${
                        active === l.code ? "block" : "hidden"
                    }`,
                };
                return textarea ? (
                    <textarea key={l.code} rows={4} {...common} />
                ) : (
                    <input key={l.code} type="text" {...common} />
                );
            })}

            {help && (
                <p className="mt-1 text-xs text-neutral-500">{help}</p>
            )}
        </div>
    );
}
