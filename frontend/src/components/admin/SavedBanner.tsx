"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Shows a green "Saved" confirmation after a successful create/edit, then fades
 * out. Driven by the ?saved=1 query param set on redirect from the save action.
 */
export default function SavedBanner({ show }: { show: boolean }) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        if (!show) return;
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 4000);
        return () => clearTimeout(timer);
    }, [show]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-4 flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
                >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                        ✓
                    </span>
                    Saved successfully.
                </motion.div>
            )}
        </AnimatePresence>
    );
}
