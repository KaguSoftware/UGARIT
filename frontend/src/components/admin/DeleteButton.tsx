"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
    id: string;
    action: (id: string) => Promise<void>;
    label?: string;
};

/**
 * Inline delete with a confirm prompt. Calls a server action, then refreshes.
 */
export default function DeleteButton({ id, action, label = "Delete" }: Props) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const onClick = () => {
        if (!confirm("Delete this item? This cannot be undone.")) return;
        startTransition(async () => {
            await action(id);
            router.refresh();
        });
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className="text-red-600 hover:text-red-700 disabled:opacity-50"
        >
            {pending ? "…" : label}
        </button>
    );
}
