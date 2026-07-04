"use client";

import FormShell from "@/src/components/admin/FormShell";
import LocalizedInput from "@/src/components/admin/LocalizedInput";
import ProductImagesField, {
    type ColorOption,
} from "@/src/components/admin/ProductImagesField";
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
    stock?: number | null;
};

type CategoryOption = { id: string; label: string };
type ExistingImage = { url: string; colorId: string | null };

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
    colors,
    existingImages = [],
}: {
    product?: Product;
    categories: CategoryOption[];
    colors: ColorOption[];
    existingImages?: ExistingImage[];
}) {
    return (
        <FormShell action={saveProduct}>
            {product?.id && <input type="hidden" name="id" value={product.id} />}

            <LocalizedInput
                label="Product name"
                name="title"
                required
                defaultValues={product?.title ?? {}}
                help="Use the TR / EN / AR tabs to type the name in each language. Turkish is required."
            />

            <LocalizedInput
                label="Description"
                name="description"
                textarea
                defaultValues={product?.description ?? {}}
                help="Optional. The text customers read on the product page."
            />

            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                        Price (₺)
                        <span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        step="0.01"
                        min="0"
                        required
                        placeholder="e.g. 499.90"
                        defaultValue={product?.price ?? ""}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                        Numbers only, in Turkish Lira.
                    </p>
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
                        <option value="">— No category —</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">
                        Which section of the shop this product belongs to.
                    </p>
                </div>
            </div>

            <div className="max-w-xs">
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Stock
                </label>
                <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    placeholder="Leave empty to not track"
                    defaultValue={product?.stock ?? ""}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
                <p className="mt-1 text-xs text-neutral-500">
                    Leave empty to not track stock. Set to 0 to mark as out of
                    stock (customers can&apos;t add it to their cart).
                </p>
            </div>

            <ProductImagesField
                existing={existingImages}
                colors={colors}
            />

            <fieldset>
                <legend className="mb-1 text-sm font-medium text-neutral-700">
                    Available sizes
                </legend>
                <p className="mb-2 text-xs text-neutral-500">
                    Tick the sizes that are in stock. Customers can only pick
                    ticked sizes.
                </p>
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
                <legend className="mb-1 text-sm font-medium text-neutral-700">
                    Promotion labels
                </legend>
                <p className="mb-2 text-xs text-neutral-500">
                    Tick to show this product in these areas of the shop.
                </p>
                <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="is_featured"
                            defaultChecked={product?.is_featured ?? false}
                        />
                        Show on the homepage (Featured)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="sp_one"
                            defaultChecked={product?.sp_one ?? false}
                        />
                        New Arrival
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="sp_two"
                            defaultChecked={product?.sp_two ?? false}
                        />
                        Discounted
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="sp_three"
                            defaultChecked={product?.sp_three ?? false}
                        />
                        Free Shipping
                    </label>
                </div>
            </fieldset>

            <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                    Model info (optional)
                </p>
                <p className="mb-2 text-xs text-neutral-500">
                    The measurements of the model wearing the product, shown on
                    the size guide.
                </p>
                <div className="grid grid-cols-3 gap-5">
                    <div>
                        <label className="mb-1 block text-xs text-neutral-600">
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
                        <label className="mb-1 block text-xs text-neutral-600">
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
                        <label className="mb-1 block text-xs text-neutral-600">
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
            </div>
        </FormShell>
    );
}
