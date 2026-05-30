import { notFound } from "next/navigation";
import { createAdminClient } from "@/src/lib/supabase/admin";
import ColorForm from "../ColorForm";

export const dynamic = "force-dynamic";

export default async function EditColorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createAdminClient();
    const { data: color } = await supabase
        .from("colors")
        .select("id, name, hex_code")
        .eq("id", id)
        .maybeSingle();

    if (!color) notFound();

    return (
        <div className="max-w-lg">
            <h1 className="mb-6 text-2xl font-bold">Edit color</h1>
            <ColorForm color={color} />
        </div>
    );
}
