"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export type ColorOption = { id: string; label: string; hex: string };

type ExistingImage = { url: string; colorId: string | null };

// A row is either a previously-saved image (has `url`) or a newly picked file
// (has `file` + an object-URL preview). `colorRef` is:
//   ""            → no color
//   "<colorId>"   → an existing color
//   "new:<idx>"   → the inline new color defined at inlineColors[idx]
type Row = {
    key: string;
    url?: string;
    file?: File;
    preview?: string;
    colorRef: string;
};

type InlineColor = { name: string; hex: string };

const NEW_COLOR = "__new__";

/**
 * Product image field with per-image color assignment. Replaces ImageUploader
 * on the product form. Each image can be tagged with an existing color or a new
 * one created inline (name + hex). The chosen colors are written to
 * product_color_variants by saveProduct; the ordered image URLs stay in
 * products.images.
 *
 * FormData contract (parsed in saveProduct):
 *   existing_images        repeated: kept image URLs, in order
 *   existing_image_color   repeated (parallel): "" | colorId | "new:<idx>"
 *   images                 file input: new files, in order
 *   new_image_color        repeated (parallel to files): "" | colorId | "new:<idx>"
 *   new_color_name         repeated: inline color names, indexed
 *   new_color_hex          repeated (parallel): inline color hex values
 */
export default function ProductImagesField({
    existing = [],
    colors,
}: {
    existing?: ExistingImage[];
    colors: ColorOption[];
}) {
    const [rows, setRows] = useState<Row[]>(() =>
        existing.map((img, i) => ({
            key: `existing-${i}`,
            url: img.url,
            colorRef: img.colorId ?? "",
        }))
    );
    // Inline colors are stored in a stable array; rows reference them by index so
    // several images can share one newly-created color.
    const [inlineColors, setInlineColors] = useState<InlineColor[]>([]);
    const keyCounter = useRef(0);

    const existingRows = rows.filter((r) => r.url);
    const newRows = rows.filter((r) => r.file);

    const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        setRows((prev) => [
            ...prev,
            ...files.map((file) => ({
                key: `new-${keyCounter.current++}`,
                file,
                preview: URL.createObjectURL(file),
                colorRef: "",
            })),
        ]);
        // Reset so the same file can be re-picked and our hidden inputs (below)
        // are the single source of truth for what gets submitted.
        e.target.value = "";
    };

    const removeRow = (key: string) =>
        setRows((prev) => prev.filter((r) => r.key !== key));

    const setColorRef = (key: string, value: string) => {
        if (value === NEW_COLOR) {
            const idx = inlineColors.length;
            setInlineColors((prev) => [...prev, { name: "", hex: "#000000" }]);
            setRows((prev) =>
                prev.map((r) =>
                    r.key === key ? { ...r, colorRef: `new:${idx}` } : r
                )
            );
            return;
        }
        setRows((prev) =>
            prev.map((r) => (r.key === key ? { ...r, colorRef: value } : r))
        );
    };

    const updateInlineColor = (
        idx: number,
        patch: Partial<InlineColor>
    ) =>
        setInlineColors((prev) =>
            prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
        );

    const colorLabel = useMemo(() => {
        const map = new Map(colors.map((c) => [c.id, c.label]));
        return (ref: string) => {
            if (!ref) return "No color";
            if (ref.startsWith("new:")) {
                const i = Number(ref.slice(4));
                return inlineColors[i]?.name || "New color";
            }
            return map.get(ref) ?? "No color";
        };
    }, [colors, inlineColors]);

    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
                Photos & colors
            </label>
            <p className="mb-3 text-xs text-neutral-500">
                The first photo is the main one shown in the shop. Assign a color
                to a photo so that customers who pick that color see this photo.
                Leave photos without a color to keep them in the gallery only.
            </p>

            {rows.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {rows.map((row) => {
                        const src = row.url ?? row.preview!;
                        const isNewColor = row.colorRef.startsWith("new:");
                        const inlineIdx = isNewColor
                            ? Number(row.colorRef.slice(4))
                            : -1;
                        return (
                            <div
                                key={row.key}
                                className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-2"
                            >
                                <div className="relative h-28 w-full overflow-hidden rounded-md bg-neutral-100">
                                    {row.url ? (
                                        <Image
                                            src={src}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={src}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.key)}
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                                        aria-label="Remove image"
                                    >
                                        ×
                                    </button>
                                </div>

                                <select
                                    value={row.colorRef}
                                    onChange={(e) =>
                                        setColorRef(row.key, e.target.value)
                                    }
                                    className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs focus:border-neutral-900 focus:outline-none"
                                >
                                    <option value="">No color</option>
                                    {colors.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.label}
                                        </option>
                                    ))}
                                    {isNewColor && (
                                        <option value={row.colorRef}>
                                            {colorLabel(row.colorRef)} (new)
                                        </option>
                                    )}
                                    <option value={NEW_COLOR}>
                                        + New color…
                                    </option>
                                </select>

                                {isNewColor && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={
                                                inlineColors[inlineIdx]?.name ??
                                                ""
                                            }
                                            onChange={(e) =>
                                                updateInlineColor(inlineIdx, {
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Color name (e.g. White)"
                                            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs focus:border-neutral-900 focus:outline-none"
                                        />
                                        <input
                                            type="color"
                                            value={
                                                inlineColors[inlineIdx]?.hex ??
                                                "#000000"
                                            }
                                            onChange={(e) =>
                                                updateInlineColor(inlineIdx, {
                                                    hex: e.target.value,
                                                })
                                            }
                                            className="h-7 w-9 shrink-0 cursor-pointer rounded border border-neutral-300"
                                            aria-label="Color swatch"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hidden inputs carrying the submitted state. Order is preserved:
                existing images first (matching saveProduct's [...existing, ...new]). */}
            {existingRows.map((row) => (
                <div key={`h-${row.key}`}>
                    <input type="hidden" name="existing_images" value={row.url} />
                    <input
                        type="hidden"
                        name="existing_image_color"
                        value={row.colorRef}
                    />
                </div>
            ))}
            {newRows.map((row) => (
                <input
                    key={`hc-${row.key}`}
                    type="hidden"
                    name="new_image_color"
                    value={row.colorRef}
                />
            ))}
            {inlineColors.map((c, i) => (
                <div key={`ic-${i}`}>
                    <input type="hidden" name="new_color_name" value={c.name} />
                    <input type="hidden" name="new_color_hex" value={c.hex} />
                </div>
            ))}

            {/* The file input must contain exactly the new files, in row order, so
                new_image_color lines up with images on the server. We rebuild it
                from the rows via the DataTransfer trick. */}
            <FileMirror files={newRows.map((r) => r.file!)} />

            <input
                type="file"
                accept="image/*"
                multiple
                onChange={onSelectFiles}
                className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800"
            />
            <p className="mt-1 text-xs text-neutral-500">
                Max 8 MB each (JPG, PNG, WebP, or GIF).
            </p>
        </div>
    );
}

/**
 * Keeps a hidden <input type="file" name="images"> whose FileList mirrors the
 * given files in order. Selected files live in React state (so rows can be
 * reordered/removed), and this input is what actually gets submitted.
 */
function FileMirror({ files }: { files: File[] }) {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        const dt = new DataTransfer();
        for (const f of files) dt.items.add(f);
        ref.current.files = dt.files;
    }, [files]);

    return <input ref={ref} type="file" name="images" multiple hidden />;
}
