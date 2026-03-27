"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "@/src/i18n/routing";
import { createPortal } from "react-dom";
import { MenuIcon, X, ArrowRight, Globe } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

const menuVariants: Variants = {
    initial: { x: "100%" },
    animate: {
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.08,
        },
    },
    exit: {
        x: "100%",
        transition: {
            duration: 0.3,
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
    },
    exit: {
        opacity: 0,
        y: 20,
        transition: { duration: 0.2 },
    },
};

export default function Navbar() {
    // const t = useTranslations("Navigation");
    // const locale = useLocale();
    // const pathname = usePathname();

    const LINKS = [
        { label: "NEW SEASON", href: "/projects" },
        { label: "TOP CLOTHING ", href: "/material-manufacturing" },
        { label: "OUTERWEAR", href: "/contact" },
        { label: "BOTTOM CLOTHING", href: "/" },
        { label: " SET", href: "/" },
        { label: " ACCESORIES", href: "/" },
        { label: " SHOES", href: "/" },
        { label: " DISCOUNT", href: "/" },
    ];

    const [isOpen, setIsOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        // Cleanup function to reset scroll if component unmounts
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        // 1. Outer Shell: Handles Position, Background, Blur, and Border only.
        // Removed 'px-6' and flex utilities from here.
        <nav className="sticky top-0 z-999 border-b border-neutral-100 bg-white/80 py-4 shadow-sm backdrop-blur-md">
            {/* 2. MaxWidthWrapper: Handles the width constraints and alignment */}
            <MaxWidthWrapper className="flex items-center justify-between">
                {/* LOGO */}
                <Link href="/">
                    <Image
                        src="/IMG_3966.jpg"
                        width={80}
                        height={44}
                        alt="logo gang"
                    />
                </Link>

                {/* DESKTOP MENU */}
                <div
                    className="hidden gap-8 md:flex items-center"
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {LINKS.map((item, index) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={`relative z-0 px-2 py-1 text-xs font-bold uppercase tracking-widest transition-colors ${
                                hoveredIndex === index
                                    ? "text-logocolor"
                                    : "text-neutral-500"
                            }`}
                        >
                            {item.label}
                            {hoveredIndex === index && (
                                <motion.span
                                    layoutId="navbar-underline"
                                    className="absolute -bottom-3 -left-4 -right-4 -top-3 -z-10 rounded-full bg-sky-950"
                                    transition={{
                                        type: "spring",
                                        bounce: 0.2,
                                        duration: 0.6,
                                    }}
                                />
                            )}
                        </Link>
                    ))}

                    <Link
                        // href={pathname}
                        href={"/"}
                        // locale={locale === "en" ? "ar" : "en"}
                        className="text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-logocolor flex items-center gap-1"
                    >
                        <Globe aria-label="language change" size={16} />
                        {/* {locale === "en" ? "AR" : "EN"} */}
                    </Link>
                </div>

                {/* MOBILE TOGGLE */}
                <div className="md:hidden flex items-center gap-4">
                    <Link
                        // href={pathname}
                        href={"/"}
                        // locale={locale === "en" ? "ar" : "en"}
                        className="text-neutral-900"
                    >
                        <Globe aria-label="language change" size={24} />
                    </Link>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="relative z-1002"
                        aria-label="Toggle Menu"
                    >
                        <motion.div
                            animate={{ rotate: isOpen ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isOpen ? <X size={28} /> : <MenuIcon size={28} />}
                        </motion.div>
                    </button>
                </div>
            </MaxWidthWrapper>
            {/* MOBILE MENU OVERLAY */}
            {/* Kept outside the wrapper so it fills the screen properly */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                variants={menuVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="fixed inset-0 z-800 flex h-dvh w-full flex-col justify-between overflow-y-auto overscroll-contain bg-white px-6 pb-8 pt-24"
                            >
                                <div className="flex flex-col gap-4">
                                    {LINKS.map((item) => (
                                        <motion.div
                                            key={item.href}
                                            variants={itemVariants}
                                        >
                                            <Link
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center justify-between border-b border-neutral-100 py-4 text-3xl font-black uppercase tracking-tighter text-neutral-900 active:text-neutral-500"
                                            >
                                                {item.label}
                                                <ArrowRight
                                                    className="text-neutral-300 rtl:rotate-180"
                                                    size={24}
                                                />
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </nav>
    );
}
