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

// ─── colors ─────────────────────────────────────────────────────────────────
export async function saveColor(prevState: any, formData: FormData) {
    await assertAdmin();
    const supabase = createAdminClient();

    const id = String(formData.get("id") ?? "");
    const payload = {
        name: localizedFromForm(formData, "name"),
        hex_code: String(formData.get("hex_code") ?? "#000000"),
    };

    const { error } = id
        ? await supabase.from("colors").update(payload).eq("id", id)
        : await supabase.from("colors").insert(payload);

    if (error) return { error: error.message };
    redirect("/admin/colors?saved=1");
}

export async function deleteColor(id: string) {
    await assertAdmin();
    const supabase = createAdminClient();
    await supabase.from("colors").delete().eq("id", id);
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

    // Existing images preserved + any new uploads appended.
    const existing = formData
        .getAll("existing_images")
        .map((v) => String(v))
        .filter(Boolean);

    const newFiles = formData.getAll("images") as File[];
    const uploaded: string[] = [];
    try {
        for (const file of newFiles) {
            if (file && file.size > 0) {
                const url = await uploadImage(file);
                if (url) uploaded.push(url);
            }
        }
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Image upload failed." };
    }
    const images = [...existing, ...uploaded];

    const categoryId = String(formData.get("category_id") ?? "") || null;
    const slug = await uniqueSlug("products", displayTitle, id);

    const payload = {
        slug,
        title,
        description: localizedFromForm(formData, "description"),
        price,
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

    const { error } = id
        ? await supabase.from("products").update(payload).eq("id", id)
        : await supabase.from("products").insert(payload);
    if (error) return { error: error.message };

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
