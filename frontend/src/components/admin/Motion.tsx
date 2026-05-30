"use client";

import { motion, type Variants } from "motion/react";

/**
 * Small, reusable motion primitives for the admin panel. Subtle by design —
 * fast fades and slides that make the UI feel responsive without being noisy.
 */

const pageVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: "easeOut" },
    },
};

/** Fades + lifts a page/section into view on mount. */
export function FadeIn({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {children}
        </motion.div>
    );
}

const listVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.04 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** Staggers its children in. Use with <StaggerItem> for each row/card. */
export function Stagger({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    );
}

/** A button-like wrapper that gently scales on hover/press. */
export function Pressable({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
