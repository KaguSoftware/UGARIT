// ============================================================================
// One-shot migration: Strapi (SQLite) → Supabase.
//
// What it does:
//   1. Reads the old Strapi SQLite DB (backend/.tmp/data.db).
//   2. Uploads referenced media (from backend/public/uploads) to the Supabase
//      `media` storage bucket, recording the new public URLs.
//   3. Writes ../supabase/04_seed.sql with INSERT statements for
//      categories, colors, products, and product_color_variants.
//
// The script does NOT write to the Postgres DB directly (other than Storage):
// you review 04_seed.sql, then paste it into the Supabase SQL editor.
//
// Usage (from the backend/ directory):
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/export-to-supabase.mjs
//
// If SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set, media upload is
// skipped and image columns are left empty (you can re-upload from the admin
// panel later) — the rest of the seed is still generated.
// ============================================================================

import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = resolve(__dirname, "..");
const DB_PATH = join(BACKEND_DIR, ".tmp", "data.db");
const UPLOADS_DIR = join(BACKEND_DIR, "public", "uploads");
const OUT_SQL = resolve(BACKEND_DIR, "..", "supabase", "04_seed.sql");

const LOCALES = ["tr", "en", "ar"];
const SOURCE_LOCALE = "en"; // the data in this DB is English-only

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canUpload = Boolean(SUPABASE_URL && SERVICE_KEY);

const supabase = canUpload
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!existsSync(DB_PATH)) {
    console.error(`SQLite DB not found at ${DB_PATH}`);
    process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

// ─── SQL literal helpers ────────────────────────────────────────────────────
function sqlStr(value) {
    if (value === null || value === undefined) return "null";
    return `'${String(value).replace(/'/g, "''")}'`;
}
function sqlBool(value) {
    return value ? "true" : "false";
}
// products.price is numeric(10,2) → max 99,999,999.99. Clamp absurd test data
// and never emit scientific notation (which Postgres numeric rejects).
const MAX_PRICE = 99999999.99;
function sqlNum(value) {
    if (value === null || value === undefined || value === "") return "null";
    const n = Number(value);
    if (!Number.isFinite(n)) return "null";
    const clamped = Math.min(Math.abs(n), MAX_PRICE);
    return clamped.toFixed(2);
}
function sqlJsonb(obj) {
    if (obj === null || obj === undefined) return "null";
    return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}
// Build a localized JSONB object from a single source string (en → all locales).
function localizedFrom(value) {
    const v = value ?? "";
    return LOCALES.reduce((acc, l) => ({ ...acc, [l]: v }), {});
}

// ─── Media upload ───────────────────────────────────────────────────────────
const MIME_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
};

async function uploadFile(file) {
    // file: { url, ext, mime, name }
    const localName = file.url.replace(/^\/uploads\//, "");
    const localPath = join(UPLOADS_DIR, localName);

    if (!existsSync(localPath)) {
        console.warn(`  ! missing local file, skipping: ${localName}`);
        return null;
    }
    if (!canUpload) return null;

    const buffer = readFileSync(localPath);
    const objectPath = `migrated/${localName}`;
    const contentType =
        file.mime || MIME_BY_EXT[file.ext?.toLowerCase()] || "application/octet-stream";

    const { error } = await supabase.storage
        .from("media")
        .upload(objectPath, buffer, { contentType, upsert: true });

    if (error) {
        console.warn(`  ! upload failed for ${localName}: ${error.message}`);
        return null;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(objectPath);
    return data.publicUrl;
}

// Map: related_type + related_id  →  [file rows] (ordered)
function buildMediaMap() {
    const rows = db
        .prepare(
            `SELECT m.related_id, m.related_type, m.field, m."order" AS ord,
                    f.url, f.ext, f.mime, f.name
             FROM files_related_mph m
             JOIN files f ON f.id = m.file_id
             ORDER BY m.related_id, m."order"`
        )
        .all();

    const map = new Map(); // key: `${type}:${id}` → [file...]
    for (const r of rows) {
        const key = `${r.related_type}:${r.related_id}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
    }
    return map;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
    console.log(`Reading ${DB_PATH}`);
    console.log(canUpload ? "Media upload: ENABLED" : "Media upload: DISABLED (no Supabase env)");

    const mediaMap = buildMediaMap();
    const uploadCache = new Map(); // local url → public url

    async function resolveImages(type, id) {
        const files = mediaMap.get(`${type}:${id}`) ?? [];
        const urls = [];
        for (const f of files) {
            if (uploadCache.has(f.url)) {
                const cached = uploadCache.get(f.url);
                if (cached) urls.push(cached);
                continue;
            }
            const publicUrl = await uploadFile(f);
            uploadCache.set(f.url, publicUrl);
            if (publicUrl) urls.push(publicUrl);
        }
        return urls;
    }

    // Deduplicate per document_id, preferring the source locale.
    function pickByDocument(rows) {
        const byDoc = new Map();
        for (const r of rows) {
            const cur = byDoc.get(r.document_id);
            if (!cur || r.locale === SOURCE_LOCALE) byDoc.set(r.document_id, r);
        }
        return [...byDoc.values()];
    }

    // ── Categories ──────────────────────────────────────────────────────────
    const categoryRows = pickByDocument(
        db.prepare(`SELECT * FROM categories`).all()
    );
    const categoryIdByStrapiId = new Map(); // strapi numeric id → new uuid
    const categorySql = [];
    const usedSlugs = new Set();

    for (const c of categoryRows) {
        const uuid = randomUUID();
        // also index every strapi row id that shares this document_id
        for (const row of db
            .prepare(`SELECT id FROM categories WHERE document_id = ?`)
            .all(c.document_id)) {
            categoryIdByStrapiId.set(row.id, uuid);
        }

        let slug = c.slug || c.document_id;
        while (usedSlugs.has(slug)) slug = `${slug}-${c.id}`;
        usedSlugs.add(slug);

        const images = await resolveImages("api::category.category", c.id);
        let megaMenu = null;
        if (c.mega_menu_content) {
            try {
                megaMenu = JSON.parse(c.mega_menu_content);
            } catch {
                megaMenu = null;
            }
        }

        categorySql.push(
            `insert into public.categories (id, slug, name, image_url, show_in_navbar, is_mega_menu, mega_menu_content) values (` +
                `${sqlStr(uuid)}, ${sqlStr(slug)}, ${sqlJsonb(localizedFrom(c.name))}, ` +
                `${images[0] ? sqlStr(images[0]) : "null"}, ${sqlBool(c.show_in_navbar)}, ` +
                `${sqlBool(c.is_mega_menu)}, ${sqlJsonb(megaMenu)});`
        );
    }
    console.log(`Categories: ${categorySql.length}`);

    // ── Products ────────────────────────────────────────────────────────────
    const productRows = pickByDocument(db.prepare(`SELECT * FROM products`).all());
    const productSql = [];
    const usedProductSlugs = new Set();

    // product → category link (Strapi product id → category id)
    const catLink = db.prepare(
        `SELECT product_id, category_id FROM products_category_lnk`
    ).all();
    const categoryByProductId = new Map();
    for (const l of catLink) categoryByProductId.set(l.product_id, l.category_id);

    for (const p of productRows) {
        const uuid = randomUUID();

        let slug = p.slug || p.document_id;
        while (usedProductSlugs.has(slug)) slug = `${slug}-${p.id}`;
        usedProductSlugs.add(slug);

        const images = await resolveImages("api::product.product", p.id);
        const strapiCatId = categoryByProductId.get(p.id);
        const newCatId = strapiCatId ? categoryIdByStrapiId.get(strapiCatId) : null;

        const imagesArray =
            images.length > 0
                ? `array[${images.map((u) => sqlStr(u)).join(", ")}]::text[]`
                : `'{}'::text[]`;

        productSql.push(
            `insert into public.products (id, slug, title, description, price, is_featured, ` +
                `model_height, model_weight, model_size, ` +
                `size_xs, size_s, size_m, size_l, size_xl, size_xxl, category_id, images) values (` +
                `${sqlStr(uuid)}, ${sqlStr(slug)}, ${sqlJsonb(localizedFrom(p.title))}, ` +
                `${sqlJsonb(localizedFrom(p.description))}, ${sqlNum(p.price)}, ${sqlBool(p.is_featured)}, ` +
                `${sqlStr(p.model_height)}, ${sqlStr(p.model_weight)}, ${sqlStr(p.model_size)}, ` +
                `${sqlBool(p.size_xs)}, ${sqlBool(p.size_s)}, ${sqlBool(p.size_m)}, ` +
                `${sqlBool(p.size_l)}, ${sqlBool(p.size_xl)}, ${sqlBool(p.size_xxl)}, ` +
                `${newCatId ? sqlStr(newCatId) : "null"}, ${imagesArray});`
        );
    }
    console.log(`Products: ${productSql.length}`);

    // ── Compose SQL file ─────────────────────────────────────────────────────
    const out = [
        "-- ============================================================",
        "-- 04_seed.sql — generated by backend/scripts/export-to-supabase.mjs",
        `-- Generated: ${new Date().toISOString()}`,
        "-- Run AFTER 01_schema.sql, 02_rls.sql, 03_storage.sql.",
        "--",
        "-- Source data was English-only; localized JSONB fields carry the same",
        "-- text in tr/en/ar. Translate via the admin panel afterward.",
        "-- ============================================================",
        "",
        "begin;",
        "",
        "-- Categories",
        ...categorySql,
        "",
        "-- Products",
        ...productSql,
        "",
        "commit;",
        "",
    ].join("\n");

    writeFileSync(OUT_SQL, out, "utf8");
    console.log(`\nWrote ${OUT_SQL}`);
    if (!canUpload) {
        console.log(
            "\nNOTE: media was NOT uploaded (no Supabase env). Image URLs are empty."
        );
        console.log(
            "Re-run with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set to upload media."
        );
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
