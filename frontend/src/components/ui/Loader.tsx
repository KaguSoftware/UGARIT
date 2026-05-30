"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * Branded full-screen loading animation: the UGARIT logo gently breathing
 * inside a rotating ring. Used by the route-level loading.tsx files, which
 * Next.js shows automatically while a page's data is being fetched.
 */
export default function Loader({ fullScreen = true }: { fullScreen?: boolean }) {
    return (
        <div
            className={`flex items-center justify-center ${
                fullScreen ? "min-h-screen" : "py-24"
            } bg-white`}
        >
            <div className="relative flex h-32 w-32 items-center justify-center">
                {/* Rotating ring */}
                <motion.span
                    className="absolute inset-0 rounded-full border-2 border-neutral-200 border-t-neutral-900"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.1,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />

                {/* Breathing logo */}
                <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{
                        duration: 1.6,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                    className="relative h-16 w-16"
                >
                    <Image
                        src="/LogoNoBg.png"
                        alt="Loading"
                        fill
                        priority
                        className="object-contain"
                    />
                </motion.div>
            </div>
        </div>
    );
}
