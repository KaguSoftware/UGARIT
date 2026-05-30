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
                label="Category name"
                name="name"
                required
                defaultValues={category?.name ?? {}}
                help="Use the TR / EN / AR tabs to type the name in each language. Turkish is required."
            />

            <div>
                <ImageUploader
                    label="Image"
                    name="image"
                    existing={category?.image_url ? [category.image_url] : []}
                    existingFieldName="existing_image_url"
                />
                <p className="mt-1 text-xs text-neutral-500">
                    Optional. Shown on the homepage category cards. Max 8 MB.
                </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    name="show_in_navbar"
                    defaultChecked={category?.show_in_navbar ?? true}
                />
                Show this category in the top menu
            </label>

            {/* Advanced mega-menu is hidden by default so it doesn't confuse
                day-to-day editing. */}
            <details className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                    Advanced: dropdown menu (optional)
                </summary>
                <div className="mt-3 space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="is_mega_menu"
                            defaultChecked={category?.is_mega_menu ?? false}
                        />
                        Show a large dropdown menu for this category
                    </label>
                    <div>
                        <label className="mb-1 block text-xs text-neutral-600">
                            Dropdown menu layout (advanced — leave empty unless
                            you know the JSON format)
                        </label>
                        <textarea
                            name="mega_menu_content"
                            rows={5}
                            defaultValue={
                                category?.mega_menu_content
                                    ? JSON.stringify(
                                          category.mega_menu_content,
                                          null,
                                          2
                                      )
                                    : ""
                            }
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-neutral-900 focus:outline-none"
                            placeholder='[{"title":"Tops","links":[{"title":"T-Shirts","href":"/products"}]}]'
                        />
                    </div>
                </div>
            </details>
        </FormShell>
    );
}
