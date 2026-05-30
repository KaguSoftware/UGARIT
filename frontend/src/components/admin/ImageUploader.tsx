"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
    label: string;
    name: string; // file input name
    multiple?: boolean;
    existing?: string[]; // already-saved image URLs
    existingFieldName?: string; // hidden field name carrying kept URLs
};

/**
 * Image upload field. Shows currently-saved images (each removable) and a file
 * input for new uploads. Kept existing URLs are submitted as hidden inputs so
 * the server action can preserve them.
 */
export default function ImageUploader({
    label,
    name,
    multiple = false,
    existing = [],
    existingFieldName,
}: Props) {
    const [kept, setKept] = useState<string[]>(existing);
    const [previews, setPreviews] = useState<string[]>([]);

    const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
    };

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
                {label}
            </label>

            {kept.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {kept.map((url) => (
                        <div
                            key={url}
                            className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200"
                        >
                            <Image
                                src={url}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setKept((k) => k.filter((u) => u !== url))
                                }
                                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                                aria-label="Remove image"
                            >
                                ×
                            </button>
                            {existingFieldName && (
                                <input
                                    type="hidden"
                                    name={existingFieldName}
                                    value={url}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {previews.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {previews.map((url, i) => (
                        <div
                            key={i}
                            className="relative h-20 w-20 overflow-hidden rounded-lg border border-dashed border-neutral-300"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            <input
                type="file"
                name={name}
                accept="image/*"
                multiple={multiple}
                onChange={onSelect}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800"
            />
        </div>
    );
}
