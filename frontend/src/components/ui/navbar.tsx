"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "@/src/i18n/routing";
import { createPortal } from "react-dom";
import { MenuIcon, X, ArrowRight, Globe, ShoppingCartIcon } from "lucide-react";
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
type LanguageMenuProps = {
    locale: string;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onLocaleChange: (newLocale: string) => void;
    mobile?: boolean;
};

function LanguageMenu({
    locale,
    isOpen,
    setIsOpen,
    onLocaleChange,
    mobile = false,
}: LanguageMenuProps) {
    const triggerClassName = mobile
        ? "flex items-center gap-2 text-sm font-bold uppercase text-neutral-900"
        : "flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-400";

    const dropdownWrapperClassName = mobile
        ? "absolute right-0 top-full z-[1003] mt-2 w-21 overflow-hidden rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
        : "absolute right-0 top-full z-50 pt-2 w-21";

    const dropdownInnerClassName = mobile
        ? "space-y-1"
        : "overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg space-y-1";

    const optionClassName = mobile
        ? "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold uppercase text-neutral-700 transition-colors hover:bg-neutral-100"
        : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold uppercase tracking-widest text-neutral-700 transition-colors hover:bg-neutral-100";

    return (
        <div className="flex gap-3">
            <ShoppingCartIcon />
            <div
                className="relative"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={!mobile ? () => setIsOpen(true) : undefined}
                onMouseLeave={!mobile ? () => setIsOpen(false) : undefined}
            >
                <button
                    type="button"
                    onClick={
                        mobile ? () => setIsOpen((prev) => !prev) : undefined
                    }
                    className={triggerClassName}
                    aria-label="Open language menu"
                    aria-expanded={isOpen}
                >
                    <Globe
                        aria-hidden="true"
                        size={mobile ? 25 : 25}
                        className={
                            mobile ? "text-neutral-900" : "text-neutral-500"
                        }
                    />
                    {locale}
                </button>

                {isOpen && (
                    <div className={dropdownWrapperClassName}>
                        <div className={dropdownInnerClassName}>
                            <button
                                type="button"
                                onClick={() => onLocaleChange("en")}
                                className={optionClassName}
                            >
                                <Image
                                    src="/ukicon.svg"
                                    alt="English flag"
                                    width={16}
                                    height={16}
                                />
                                EN
                            </button>

                            <button
                                type="button"
                                onClick={() => onLocaleChange("ar")}
                                className={optionClassName}
                            >
                                <Image
                                    src="/arIcon.svg"
                                    alt="Arabic flag"
                                    width={16}
                                    height={16}
                                />
                                AR
                            </button>

                            <button
                                type="button"
                                onClick={() => onLocaleChange("tr")}
                                className={optionClassName}
                            >
                                <Image
                                    src="/TrIcon.svg"
                                    alt="Turkish flag"
                                    width={16}
                                    height={16}
                                />
                                TR
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Navbar() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    const t = useTranslations("nav.links");

    const LINKS = [{ label: t("one"), href: "#" }];

    const [isOpen, setIsOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);

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

    useEffect(() => {
        const handleClickOutside = () => {
            setIsLangOpen(false);
        };

        if (isLangOpen) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isLangOpen]);

    // Remove any existing locale prefix from the current pathname before switching locales.
    const handleLocaleChange = (newLocale: string) => {
        setIsLangOpen(false);

        const normalizedPathname = pathname.replace(
            /^\/(en|ar|tr)(?=\/|$)/,
            ""
        );

        router.replace(normalizedPathname || "/", { locale: newLocale });
    };

    return (
        // 1. Outer Shell: Handles Position, Background, Blur, and Border only.
        // Removed 'px-6' and flex utilities from here.
        <nav className="sticky top-0 z-999 border-b border-neutral-100 bg-white/80 shadow-sm backdrop-blur-md">
            {/* 2. MaxWidthWrapper: Handles the width constraints and alignment */}
            <MaxWidthWrapper className="md:grid flex grid-cols-3 items-center">
                {" "}
                {/* LOGO */}
                <div className="justify-self-start">
                    <Link href="/">
                        <Image
                            src="/LogoNoBg.png"
                            width={100}
                            height={40}
                            alt="logo gang"
                        />
                    </Link>
                </div>
                {/* DESKTOP MENU */}
                <div
                    className="hidden md:flex items-center justify-center gap-5 justify-self-center"
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {LINKS.map((item, index) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={`relative z-0 py-4 text-sm font-bold duration-300 uppercase whitespace-nowrap tracking-widest transition-colors ${
                                hoveredIndex === index
                                    ? "text-white"
                                    : "text-neutral-500"
                            }`}
                        >
                            {item.label}
                            {hoveredIndex === index && (
                                <motion.span
                                    layoutId="navbar-underline"
                                    className="absolute bottom-0 -left-3 -right-3 top-0 -z-10 rounded-full bg-neutral-950"
                                    transition={{
                                        type: "spring",
                                        bounce: 0.2,
                                        duration: 0.6,
                                    }}
                                />
                            )}
                        </Link>
                    ))}
                </div>
                <div className="hidden md:flex items-center justify-self-end">
                    <LanguageMenu
                        locale={locale}
                        isOpen={isLangOpen}
                        setIsOpen={setIsLangOpen}
                        onLocaleChange={handleLocaleChange}
                    />
                </div>
                {/* MOBILE TOGGLE */}
                <div className="md:hidden ml-auto flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="relative z-1002 flex h-6 w-6 items-center justify-center text-neutral-900"
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                    >
                        <span
                            className={`absolute transition-all duration-300 ease-in-out ${
                                isOpen
                                    ? "rotate-90 scale-75 opacity-0"
                                    : "rotate-0 scale-100 opacity-100"
                            }`}
                        >
                            <MenuIcon size={24} />
                        </span>

                        <span
                            className={`absolute transition-all duration-300 ease-in-out ${
                                isOpen
                                    ? "rotate-0 scale-100 opacity-100"
                                    : "-rotate-90 scale-75 opacity-0"
                            }`}
                        >
                            <X size={24} />
                        </span>
                    </button>

                    <LanguageMenu
                        locale={locale}
                        isOpen={isLangOpen}
                        setIsOpen={setIsLangOpen}
                        onLocaleChange={handleLocaleChange}
                        mobile
                    />
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
