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
    const obj: Record<string, string> = {};
    for (const l of LOCALES) {
        obj[l] = String(formData.get(`${prefix}_${l}`) ?? "");
    }
    return obj;
}

function bool(formData: FormData, key: string) {
    const v = formData.get(key);
    return v === "on" || v === "true" || v === "1";
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
 */
async function uploadImage(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;
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
        console.error("Image upload failed:", error.message);
        return null;
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
    const slug = String(formData.get("slug") ?? "").trim();
    if (!slug) return { error: "Slug is required." };

    let imageUrl = String(formData.get("existing_image_url") ?? "") || null;
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
        const uploaded = await uploadImage(file);
        if (uploaded) imageUrl = uploaded;
    }

    let megaMenuContent: unknown = null;
    const rawMega = String(formData.get("mega_menu_content") ?? "").trim();
    if (rawMega) {
        try {
            megaMenuContent = JSON.parse(rawMega);
        } catch {
            return { error: "Mega menu content is not valid JSON." };
        }
    }

    const payload = {
        slug,
        name: localizedFromForm(formData, "name"),
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
    redirect("/admin/categories");
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
    redirect("/admin/colors");
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
    const slug = String(formData.get("slug") ?? "").trim();
    if (!slug) return { error: "Slug is required." };

    // Existing images preserved + any new uploads appended.
    const existing = formData
        .getAll("existing_images")
        .map((v) => String(v))
        .filter(Boolean);

    const newFiles = formData.getAll("images") as File[];
    const uploaded: string[] = [];
    for (const file of newFiles) {
        if (file && file.size > 0) {
            const url = await uploadImage(file);
            if (url) uploaded.push(url);
        }
    }
    const images = [...existing, ...uploaded];

    const priceRaw = String(formData.get("price") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;

    const categoryId = String(formData.get("category_id") ?? "") || null;

    const payload = {
        slug,
        title: localizedFromForm(formData, "title"),
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
        if (error) return { error: error.message };
        productId = data.id;
    }

    revalidateCatalog();
    tag(`product:tr:${slug}`);
    tag(`product:en:${slug}`);
    tag(`product:ar:${slug}`);

    redirect("/admin/products");
}

export async function deleteProduct(id: string) {
    await assertAdmin();
    const supabase = createAdminClient();
    await supabase.from("products").delete().eq("id", id);
    revalidateCatalog();
}
