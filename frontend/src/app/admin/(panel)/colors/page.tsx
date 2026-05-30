import Link from "next/link";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized } from "@/src/lib/supabase/media";
import DeleteButton from "@/src/components/admin/DeleteButton";
import SavedBanner from "@/src/components/admin/SavedBanner";
import { FadeIn } from "@/src/components/admin/Motion";
import { deleteColor } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ColorsPage({
    searchParams,
}: {
    searchParams: Promise<{ saved?: string }>;
}) {
    const { saved } = await searchParams;
    const supabase = createAdminClient();
    const { data: colors } = await supabase
        .from("colors")
        .select("id, name, hex_code")
        .order("created_at", { ascending: false });

    return (
        <FadeIn>
            <SavedBanner show={saved === "1"} />
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Colors</h1>
                <Link
                    href="/admin/colors/new"
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                    + Add color
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">Color</th>
                            <th className="px-4 py-3 font-medium">Name (EN)</th>
                            <th className="px-4 py-3 font-medium">Hex</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {(colors ?? []).map((c: any) => (
                            <tr
                                key={c.id}
                                className="border-b border-neutral-100 last:border-0"
                            >
                                <td className="px-4 py-3">
                                    <span
                                        className="inline-block h-6 w-6 rounded-full border border-neutral-200"
                                        style={{ background: c.hex_code }}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    {localized(c.name, "en") || "—"}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {c.hex_code}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/admin/colors/${c.id}`}
                                        className="mr-3 text-neutral-600 hover:text-neutral-900"
                                    >
                                        Edit
                                    </Link>
                                    <DeleteButton
                                        id={c.id}
                                        action={deleteColor}
                                    />
                                </td>
                            </tr>
                        ))}
                        {(!colors || colors.length === 0) && (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-8 text-center text-neutral-400"
                                >
                                    No colors yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </FadeIn>
    );
}
