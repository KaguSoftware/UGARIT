"use server";

import { revalidateTag } from "next/cache";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

const LOCALES = ["tr", "en", "ar"] as const;

// ─── auth guard for actions ─────────────────────────────────────────────────
async function assertAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_admin) throw new Error("Not authorized");
    return user;
}

// ─── helpers ────────────────────────────────────────────────────────────────
function localizedFromForm(formData: FormData, prefix: string) {
    // Store only non-empty locales; the read-side falls back to the source
    // locale anyway, so we don't bloat the JSONB with empty strings.
    const obj: Record<string, string> = {};
    for (const l of LOCALES) {
        const value = String(formData.get(`${prefix}_${l}`) ?? "").trim();
        if (value) obj[l] = value;
    }
    return obj;
}

function bool(formData: FormData, key: string) {
    const v = formData.get(key);
    return v === "on" || v === "true" || v === "1";
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
];

/**
 * Turns a piece of text into a URL-safe slug (the customer never types this —
 * it's derived from the product/category name automatically).
 */
function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "") // strip accents
        .replace(/[^a-z0-9\s-]/g, "") // drop non-alphanumerics
        .replace(/[\s_-]+/g, "-") // spaces → hyphens
        .replace(/^-+|-+$/g, ""); // trim hyphens
}

/**
 * Generates a slug from a name that is unique within a table. Re-uses the
 * current row's slug when editing if the name is unchanged.
 */
async function uniqueSlug(
    table: "products" | "categories",
    name: string,
    currentId: string
): Promise<string> {
    const supabase = createAdminClient();
    const base = slugify(name) || "item";

    let candidate = base;
    for (let i = 2; i < 1000; i++) {
        const { data } = await supabase
            .from(table)
            .select("id")
            .eq("slug", candidate)
            .maybeSingle();

        if (!data || data.id === currentId) return candidate;
        candidate = `${base}-${i}`;
    }
    // Extremely unlikely fallback.
    return `${base}-${randomUUID().slice(0, 6)}`;
}

function tag(name: string) {
    // This Next.js version's revalidateTag takes a cache profile as 2nd arg.
    revalidateTag(name, "default");
}

function revalidateCatalog() {
    for (const l of LOCALES) {
        tag(`homepage:${l}:featured-products`);
        tag(`homepage:${l}:categories`);
        tag(`products:all:${l}`);
        tag(`products:all:${l}:grid`);
        tag(`products:all:${l}:sizes`);
    }
    tag("navbar-categories");
}

/**
 * Uploads an image File to the media bucket and returns its public URL.
 * Throws a friendly Error on validation/upload failure so the form can show it.
 */
async function uploadImage(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error(
            `"${file.name}" is not a supported image. Please use JPG, PNG, WebP, or GIF.`
        );
    }
    if (file.size > MAX_IMAGE_BYTES) {
        throw new Error(
            `"${file.name}" is too large (max 8 MB). Please choose a smaller image.`
        );
    }

    const supabase = createAdminClient();
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const path = `admin/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
        .from("media")
        .upload(path, buffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
        });

    if (error) {
        throw new Error(`Could not upload "${file.name}". Please try again.`);
    }

    return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// ─── auth ───────────────────────────────────────────────────────────────────
export async function adminSignIn(prevState: any, formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        return { error: error?.message ?? "Invalid credentials." };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();

    if (!profile?.is_admin) {
        await supabase.auth.signOut();
        return { error: "This account is not an admin." };
    }

    redirect("/admin");
}

export async function adminSignOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
}

// ─── categories ─────────────────────────────────────────────────────────────
export async function saveCategory(prevState: any, formData: FormData) {
    await assertAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id") ?? "");
    const name = localizedFromForm(formData, "name");
    const displayName = name.tr || name.en || name.ar || "";
    if (!displayName) {
        return { error: "Please enter a category name." };
    }

    let imageUrl = String(formData.get("existing_image_url") ?? "") || null;
    try {
        const file = formData.get("image") as File | null;
        if (file && file.size > 0) {
            const uploaded = await uploadImage(file);
            if (uploaded) imageUrl = uploaded;
        }
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Image upload failed." };
    }

    let megaMenuContent: unknown = null;
    const rawMega = String(formData.get("mega_menu_content") ?? "").trim();
    if (rawMega) {
        try {
            megaMenuContent = JSON.parse(rawMega);
        } catch {
            return {
                error: "The advanced menu box must be valid JSON, or left empty.",
            };
        }
    }

    const slug = await uniqueSlug("categories", displayName, id);

    const payload = {
        slug,
        name,
        image_url: imageUrl,
        show_in_navbar: bool(formData, "show_in_navbar"),
        is_mega_menu: bool(formData, "is_mega_menu"),
        mega_menu_content: megaMenuContent,
    };

    const { error } = id
        ? await supabase.from("categories").update(payload).eq("id", id)
        : await supabase.from("categories").insert(payload);

    if (error) return { error: error.message };

    revalidateCatalog();
    redirect("/admin/categories?saved=1");
}

export async function deleteCategory(id: string) {
    await assertAdmin();
    const supabase = createAdminClient();
    await supabase.from("categories").delete().eq("id", id);
    revalidateCatalog();
}

// ─── products ───────────────────────────────────────────────────────────────
export async function saveProduct(prevState: any, formData: FormData) {
    await assertAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id") ?? "");
    const title = localizedFromForm(formData, "title");
    const displayTitle = title.tr || title.en || title.ar || "";
    if (!displayTitle) {
        return { error: "Please enter a product name." };
    }

    const priceRaw = String(formData.get("price") ?? "").trim();
    if (!priceRaw || Number.isNaN(Number(priceRaw)) || Number(priceRaw) < 0) {
        return { error: "Please enter a valid price (a number, e.g. 499.90)." };
    }
    const price = Number(priceRaw);

    const stockRaw = String(formData.get("stock") ?? "").trim();
    const stock =
        stockRaw === "" ? null : Math.max(0, Math.trunc(Number(stockRaw) || 0));

    // ── Images + their per-image color assignments ──────────────────────────
    // Existing images preserved (in order) + any new uploads appended. Each
    // image carries a color reference: "" (none), an existing color id, or
    // "new:<idx>" pointing at an inline color defined below.
    const existing = formData
        .getAll("existing_images")
        .map((v) => String(v));
    const existingColorRefs = formData
        .getAll("existing_image_color")
        .map((v) => String(v));

    const newFiles = formData.getAll("images") as File[];
    const newColorRefs = formData
        .getAll("new_image_color")
        .map((v) => String(v));

    // Inline colors created on the form (parallel name/hex arrays).
    const inlineNames = formData.getAll("new_color_name").map((v) => String(v));
    const inlineHexes = formData.getAll("new_color_hex").map((v) => String(v));

    // Resolve a color reference to a real color id, creating inline colors on
    // first use and caching the result so shared references reuse one row.
    const inlineIdCache = new Map<number, string>();
    async function resolveColorRef(ref: string): Promise<string | null> {
        if (!ref) return null;
        if (!ref.startsWith("new:")) return ref; // existing color id
        const idx = Number(ref.slice(4));
        if (Number.isNaN(idx)) return null;
        if (inlineIdCache.has(idx)) return inlineIdCache.get(idx)!;

        const name = (inlineNames[idx] ?? "").trim();
        if (!name) return null; // unnamed inline color → treat as "no color"
        const hex = inlineHexes[idx] || "#000000";
        const { data, error } = await supabase
            .from("colors")
            .insert({ name: { tr: name }, hex_code: hex })
            .select("id")
            .single();
        if (error || !data) return null;
        inlineIdCache.set(idx, data.id);
        return data.id;
    }

    // images[i] pairs with imageColorRefs[i] once uploads finish.
    const images: string[] = [];
    const imageColorRefs: string[] = [];
    for (let i = 0; i < existing.length; i++) {
        const url = existing[i];
        if (!url) continue;
        images.push(url);
        imageColorRefs.push(existingColorRefs[i] ?? "");
    }

    try {
        for (let i = 0; i < newFiles.length; i++) {
            const file = newFiles[i];
            if (file && file.size > 0) {
                const url = await uploadImage(file);
                if (url) {
                    images.push(url);
                    imageColorRefs.push(newColorRefs[i] ?? "");
                }
            }
        }
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Image upload failed." };
    }

    const categoryId = String(formData.get("category_id") ?? "") || null;
    const slug = await uniqueSlug("products", displayTitle, id);

    const payload = {
        slug,
        title,
        description: localizedFromForm(formData, "description"),
        price,
        stock,
        is_featured: bool(formData, "is_featured"),
        sp_one: bool(formData, "sp_one"),
        sp_two: bool(formData, "sp_two"),
        sp_three: bool(formData, "sp_three"),
        model_height: String(formData.get("model_height") ?? "") || null,
        model_weight: String(formData.get("model_weight") ?? "") || null,
        model_size: String(formData.get("model_size") ?? "") || null,
        size_xs: bool(formData, "size_xs"),
        size_s: bool(formData, "size_s"),
        size_m: bool(formData, "size_m"),
        size_l: bool(formData, "size_l"),
        size_xl: bool(formData, "size_xl"),
        size_xxl: bool(formData, "size_xxl"),
        category_id: categoryId,
        images,
    };

    let productId = id;
    if (id) {
        const { error } = await supabase
            .from("products")
            .update(payload)
            .eq("id", id);
        if (error) return { error: error.message };
    } else {
        const { data, error } = await supabase
            .from("products")
            .insert(payload)
            .select("id")
            .single();
        if (error || !data) {
            return { error: error?.message ?? "Could not create product." };
        }
        productId = data.id;
    }

    // ── Sync color variants: rebuild from the current image→color mapping ────
    await supabase
        .from("product_color_variants")
        .delete()
        .eq("product_id", productId);

    const variantRows: {
        product_id: string;
        color_id: string;
        image_url: string;
        position: number;
    }[] = [];
    for (let i = 0; i < images.length; i++) {
        const colorId = await resolveColorRef(imageColorRefs[i]);
        if (colorId) {
            variantRows.push({
                product_id: productId,
                color_id: colorId,
                image_url: images[i],
                position: i,
            });
        }
    }
    if (variantRows.length > 0) {
        await supabase.from("product_color_variants").insert(variantRows);
    }

    revalidateCatalog();
    tag(`product:tr:${slug}`);
    tag(`product:en:${slug}`);
    tag(`product:ar:${slug}`);

    redirect("/admin/products?saved=1");
}

export async function deleteProduct(id: string) {
    await assertAdmin();
    const supabase = createAdminClient();
    await supabase.from("products").delete().eq("id", id);
    revalidateCatalog();
}

// ─── site settings ───────────────────────────────────────────────────────────
export async function saveSettings(prevState: any, formData: FormData) {
    await assertAdmin();
    const supabase = createAdminClient();

    const whatsapp = String(formData.get("whatsapp_number") ?? "").trim();
    const storeName = String(formData.get("store_name") ?? "").trim();
    const instagram = String(formData.get("instagram") ?? "").trim();

    // WhatsApp deep links expect a digits-only number (country code + number).
    const normalizedWhatsapp = whatsapp.replace(/[^0-9]/g, "");

    const rows = [
        { key: "whatsapp_number", value: normalizedWhatsapp },
        { key: "store_name", value: storeName },
        { key: "socials", value: { instagram } },
    ];

    const { error } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "key" });

    if (error) return { error: error.message };

    tag("site-settings");
    redirect("/admin/settings?saved=1");
}

// ─── customers ───────────────────────────────────────────────────────────────
export async function setCustomerAdmin(profileId: string, isAdmin: boolean) {
    const actingUser = await assertAdmin();
    // Guard against locking yourself out of the admin panel.
    if (profileId === actingUser.id && !isAdmin) {
        throw new Error("You cannot remove your own admin access.");
    }
    const supabase = createAdminClient();
    await supabase
        .from("profiles")
        .update({ is_admin: isAdmin })
        .eq("id", profileId);
}
