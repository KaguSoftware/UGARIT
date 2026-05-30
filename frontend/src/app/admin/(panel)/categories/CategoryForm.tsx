"use client";

import FormShell from "@/src/components/admin/FormShell";
import LocalizedInput from "@/src/components/admin/LocalizedInput";
import ImageUploader from "@/src/components/admin/ImageUploader";
import { saveCategory } from "../../actions";

type Category = {
    id: string;
    slug: string;
    name?: Record<string, string> | null;
    image_url?: string | null;
    show_in_navbar?: boolean;
    is_mega_menu?: boolean;
    mega_menu_content?: unknown;
};

export default function CategoryForm({ category }: { category?: Category }) {
    return (
        <FormShell action={saveCategory}>
            {category?.id && (
                <input type="hidden" name="id" value={category.id} />
            )}

            <LocalizedInput
                label="Name"
                name="name"
                required
                defaultValues={category?.name ?? {}}
            />

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Slug
                </label>
                <input
                    type="text"
                    name="slug"
                    required
                    defaultValue={category?.slug ?? ""}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
            </div>

            <ImageUploader
                label="Image"
                name="image"
                existing={category?.image_url ? [category.image_url] : []}
                existingFieldName="existing_image_url"
            />

            <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="show_in_navbar"
                        defaultChecked={category?.show_in_navbar ?? true}
                    />
                    Show in navbar
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="is_mega_menu"
                        defaultChecked={category?.is_mega_menu ?? false}
                    />
                    Mega menu
                </label>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Mega menu content (JSON, optional)
                </label>
                <textarea
                    name="mega_menu_content"
                    rows={5}
                    defaultValue={
                        category?.mega_menu_content
                            ? JSON.stringify(category.mega_menu_content, null, 2)
                            : ""
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-neutral-900 focus:outline-none"
                    placeholder='[{"title":"Tops","links":[{"title":"T-Shirts","href":"/products"}]}]'
                />
            </div>
        </FormShell>
    );
}
