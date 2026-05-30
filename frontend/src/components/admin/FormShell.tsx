"use client";

import { useActionState } from "react";

type ActionResult = { error?: string | null } | void;

type Props = {
    action: (prevState: any, formData: FormData) => Promise<ActionResult>;
    submitLabel?: string;
    children: React.ReactNode;
};

/**
 * Wraps an admin form: binds a server action via useActionState, surfaces the
 * error string it may return, and renders a pending-aware submit button.
 * (On success the server action redirects, so no success state is needed.)
 */
export default function FormShell({
    action,
    submitLabel = "Save",
    children,
}: Props) {
    const [state, formAction, pending] = useActionState(action as any, {
        error: null,
    });

    return (
        <form action={formAction} className="space-y-5">
            {state?.error && (
                <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {state.error}
                </p>
            )}

            {children}

            <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
                {pending ? "Saving…" : submitLabel}
            </button>
        </form>
    );
}
