"use client";

import FormShell from "@/src/components/admin/FormShell";
import LocalizedInput from "@/src/components/admin/LocalizedInput";
import ImageUploader from "@/src/components/admin/ImageUploader";
import { saveProduct } from "../../actions";

type Product = {
    id: string;
    slug: string;
    title?: Record<string, string> | null;
    description?: Record<string, string> | null;
    price?: number | null;
    images?: string[] | null;
    is_featured?: boolean;
    sp_one?: boolean;
    sp_two?: boolean;
    sp_three?: boolean;
    model_height?: string | null;
    model_weight?: string | null;
    model_size?: string | null;
    size_xs?: boolean;
    size_s?: boolean;
    size_m?: boolean;
    size_l?: boolean;
    size_xl?: boolean;
    size_xxl?: boolean;
    category_id?: string | null;
};

type CategoryOption = { id: string; label: string };

const SIZES = [
    { key: "size_xs", label: "XS" },
    { key: "size_s", label: "S" },
    { key: "size_m", label: "M" },
    { key: "size_l", label: "L" },
    { key: "size_xl", label: "XL" },
    { key: "size_xxl", label: "XXL" },
] as const;

export default function ProductForm({
    product,
    categories,
}: {
    product?: Product;
    categories: CategoryOption[];
}) {
    return (
        <FormShell action={saveProduct}>
            {product?.id && <input type="hidden" name="id" value={product.id} />}

            <div className="grid grid-cols-2 gap-5">
                <LocalizedInput
                    label="Title"
                    name="title"
                    required
                    defaultValues={product?.title ?? {}}
                />
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Slug
                    </label>
                    <input
                        type="text"
                        name="slug"
                        required
                        defaultValue={product?.slug ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    />
                </div>
            </div>

            <LocalizedInput
                label="Description"
                name="description"
                textarea
                defaultValues={product?.description ?? {}}
            />

            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Price
                    </label>
                    <input
                        type="number"
                        name="price"
                        step="0.01"
                        defaultValue={product?.price ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Category
                    </label>
                    <select
                        name="category_id"
                        defaultValue={product?.category_id ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    >
                        <option value="">— None —</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <ImageUploader
                label="Images"
                name="images"
                multiple
                existing={product?.images ?? []}
                existingFieldName="existing_images"
            />

            <fieldset>
                <legend className="mb-2 text-sm font-medium text-neutral-700">
                    Available sizes
                </legend>
                <div className="flex flex-wrap gap-4">
                    {SIZES.map((s) => (
                        <label
                            key={s.key}
                            className="flex items-center gap-2 text-sm"
                        >
                            <input
                                type="checkbox"
                                name={s.key}
                                defaultChecked={Boolean(
                                    product?.[s.key as keyof Product]
                                )}
                            />
                            {s.label}
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset>
                <legend className="mb-2 text-sm font-medium text-neutral-700">
                    Flags
                </legend>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="is_featured"
                            defaultChecked={product?.is_featured ?? false}
                        />
                        Featured
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="sp_one"
                            defaultChecked={product?.sp_one ?? false}
                        />
                        SP One
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="sp_two"
                            defaultChecked={product?.sp_two ?? false}
                        />
                        SP Two
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="sp_three"
                            defaultChecked={product?.sp_three ?? false}
                        />
                        SP Three
                    </label>
                </div>
            </fieldset>

            <div className="grid grid-cols-3 gap-5">
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Model height
                    </label>
                    <input
                        type="text"
                        name="model_height"
                        defaultValue={product?.model_height ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Model weight
                    </label>
                    <input
                        type="text"
                        name="model_weight"
                        defaultValue={product?.model_weight ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Model size
                    </label>
                    <input
                        type="text"
                        name="model_size"
                        defaultValue={product?.model_size ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    />
                </div>
            </div>
        </FormShell>
    );
}
