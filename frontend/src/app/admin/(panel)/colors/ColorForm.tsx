"use client";

import FormShell from "@/src/components/admin/FormShell";
import LocalizedInput from "@/src/components/admin/LocalizedInput";
import { saveColor } from "../../actions";

type Color = {
    id: string;
    name?: Record<string, string> | null;
    hex_code?: string;
};

export default function ColorForm({ color }: { color?: Color }) {
    return (
        <FormShell action={saveColor}>
            {color?.id && <input type="hidden" name="id" value={color.id} />}

            <LocalizedInput
                label="Color name"
                name="name"
                required
                defaultValues={color?.name ?? {}}
                help="Use the TR / EN / AR tabs to type the color name in each language. Turkish is required."
            />

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Pick the color
                </label>
                <input
                    type="color"
                    name="hex_code"
                    defaultValue={color?.hex_code ?? "#000000"}
                    className="h-10 w-20 cursor-pointer rounded-lg border border-neutral-300"
                />
                <p className="mt-1 text-xs text-neutral-500">
                    Click the box and choose the color shown to customers.
                </p>
            </div>
        </FormShell>
    );
}
