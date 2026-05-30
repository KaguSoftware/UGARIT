"use client";

import { useActionState } from "react";
import { motion, AnimatePresence } from "motion/react";

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
        <motion.form
            action={formAction}
            className="space-y-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
        >
            <AnimatePresence>
                {state?.error && (
                    <motion.p
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {state.error}
                    </motion.p>
                )}
            </AnimatePresence>

            {children}

            <motion.button
                type="submit"
                disabled={pending}
                whileHover={{ scale: pending ? 1 : 1.02 }}
                whileTap={{ scale: pending ? 1 : 0.98 }}
                className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
                {pending ? "Saving…" : submitLabel}
            </motion.button>
        </motion.form>
    );
}
