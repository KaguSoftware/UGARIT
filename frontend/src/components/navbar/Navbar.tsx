"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/src/i18n/routing";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { MenuIcon, X, ArrowRight, Globe, ChevronDown } from "lucide-react";

import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { LanguageMenuProps } from "./types";

// Adding types so TypeScript knows what our JSON structure looks like
type NavLink = { title: string; href: string };
type NavSection = { title: string; links: NavLink[] };
type NavItem = { title: string; href: string; sections?: NavSection[] };

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
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};
const menuIconFlipVariants: Variants = {
    initial: { rotate: -90, opacity: 0, scale: 0.85 },
    animate: {
        rotate: 0,
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.18,
            ease: [0.22, 1, 0.36, 1],
        },
    },
    exit: {
        rotate: 90,
        opacity: 0,
        scale: 0.85,
        transition: {
            duration: 0.14,
            ease: [0.55, 0, 1, 0.45],
        },
    },
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

    return (
        <div
            className="relative"
            onMouseEnter={!mobile ? () => setIsOpen(true) : undefined}
            onMouseLeave={!mobile ? () => setIsOpen(false) : undefined}
        >
            <button
                type="button"
                onClick={
                    mobile
                        ? () => setIsOpen((prev: boolean) => !prev)
                        : undefined
                }
                className={triggerClassName}
            >
                <Globe size={mobile ? 20 : 16} />
                {locale}
            </button>

            {isOpen && (
                <div
                    className={
                        mobile
                            ? "absolute right-0 top-full z-1003 mt-2 w-24 overflow-hidden rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
                            : "absolute right-0 top-full z-50 pt-2 w-24"
                    }
                >
                    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg space-y-1">
                        {["en", "ar", "tr"].map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => onLocaleChange(lang)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-neutral-700 transition-colors hover:bg-neutral-100"
                            >
                                <Image
                                    src={`/${
                                        lang === "en"
                                            ? "ukicon"
                                            : lang === "ar"
                                            ? "arIcon"
                                            : "TrIcon"
                                    }.svg`}
                                    alt={lang}
                                    width={14}
                                    height={14}
                                />
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const locale = useLocale();

    // Grab the whole array from our JSON file
    const tNav = useTranslations("Nav");
    const navItems = tNav.raw("items") as NavItem[];

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [mobileSubmenuIndex, setMobileSubmenuIndex] = useState<number | null>(
        null
    );
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileOpen]);

    const handleLocaleChange = (newLocale: string) => {
        setIsLangOpen(false);
        setIsMobileOpen(false);
        setMobileSubmenuIndex(null);

        const currentPath = window.location.pathname;
        const cleanPath =
            currentPath.replace(
                /^\/(?:en|ar|tr)(?:\/(?:en|ar|tr))*?(?=\/|$)/,
                ""
            ) || "/";
        const normalizedPath = cleanPath.startsWith("/")
            ? cleanPath
            : `/${cleanPath}`;
        const targetPath =
            normalizedPath === "/"
                ? `/${newLocale}`
                : `/${newLocale}${normalizedPath}`;

        window.location.assign(targetPath);
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 shadow-sm backdrop-blur-md">
            <MaxWidthWrapper className="md:grid flex grid-cols-3 items-center h-20">
                {/* LOGO */}
                <div className="justify-self-start">
                    <Link href="/">
                        <Image
                            src="/LogoNoBg.png"
                            width={100}
                            height={40}
                            alt="Logo"
                            priority
                        />
                    </Link>
                </div>

                {/* DESKTOP NAV */}
                <div className="hidden md:flex items-center justify-center gap-8 h-full">
                    {navItems.map((item, index) => (
                        <div
                            key={item.title}
                            className="relative h-full flex items-center"
                            onMouseEnter={() =>
                                item.sections && setActiveDropdown(index)
                            }
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            <Link
                                href={item.href}
                                className="flex items-center gap-1 py-2 text-sm font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900"
                            >
                                {item.title}
                                {item.sections && (
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 ${
                                            activeDropdown === index
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                )}
                            </Link>

                            <AnimatePresence>
                                {activeDropdown === index && item.sections && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 w-150 pt-4"
                                    >
                                        <div className="bg-white rounded-2xl border border-neutral-100 shadow-2xl p-8 grid grid-cols-2 gap-10">
                                            {item.sections.map((section) => (
                                                <div
                                                    key={section.title}
                                                    className="flex flex-col gap-4"
                                                >
                                                    <h4 className="text-xs font-black uppercase tracking-tighter text-neutral-400">
                                                        {section.title}
                                                    </h4>
                                                    <div className="flex flex-col gap-3">
                                                        {section.links.map(
                                                            (link) => (
                                                                <Link
                                                                    key={
                                                                        link.title
                                                                    }
                                                                    href={
                                                                        link.href
                                                                    }
                                                                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 flex items-center group"
                                                                >
                                                                    {link.title}
                                                                    <ArrowRight
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="ml-2 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                                                                    />
                                                                </Link>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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

                <div className="md:hidden ml-auto flex items-center gap-4">
                    <button
                        onClick={() => {
                            setIsMobileOpen((prev: boolean) => {
                                const next = !prev;
                                if (!next) {
                                    setMobileSubmenuIndex(null);
                                    setIsLangOpen(false);
                                }
                                return next;
                            });
                        }}
                        className="relative z-1002 flex h-10 w-10 items-center justify-center text-neutral-900"
                        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isMobileOpen ? (
                                <motion.span
                                    key="close"
                                    variants={menuIconFlipVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <X size={24} />
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="menu"
                                    variants={menuIconFlipVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <MenuIcon size={24} />
                                </motion.span>
                            )}
                        </AnimatePresence>
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

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isMobileOpen && (
                            <motion.div
                                variants={menuVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="fixed inset-0 z-40 overflow-y-auto bg-white px-6 pt-24 pb-8 flex flex-col"
                            >
                                <div className="flex flex-col gap-4">
                                    {mobileSubmenuIndex === null ? (
                                        navItems.map((item, index) => (
                                            <motion.div
                                                key={item.title}
                                                variants={itemVariants}
                                            >
                                                {item.sections ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setMobileSubmenuIndex(
                                                                index
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-between border-b border-neutral-100 py-4 text-left text-3xl font-black uppercase text-neutral-900"
                                                    >
                                                        {item.title}
                                                        <ArrowRight size={24} />
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => {
                                                            setIsMobileOpen(
                                                                false
                                                            );
                                                            setMobileSubmenuIndex(
                                                                null
                                                            );
                                                        }}
                                                        className="flex items-center justify-between border-b border-neutral-100 py-4 text-3xl font-black uppercase text-neutral-900"
                                                    >
                                                        {item.title}
                                                        <ArrowRight size={24} />
                                                    </Link>
                                                )}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            variants={itemVariants}
                                            className="flex flex-col gap-6"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setMobileSubmenuIndex(null)
                                                }
                                                className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-neutral-500"
                                            >
                                                <ArrowRight
                                                    size={16}
                                                    className="rotate-180"
                                                />
                                                Back
                                            </button>

                                            <div className="flex flex-col gap-6">
                                                {navItems[
                                                    mobileSubmenuIndex
                                                ]?.sections?.map((section) => (
                                                    <div
                                                        key={section.title}
                                                        className="flex flex-col gap-4"
                                                    >
                                                        <h4 className="text-xs font-black uppercase tracking-tighter text-neutral-400">
                                                            {section.title}
                                                        </h4>
                                                        <div className="flex flex-col gap-3">
                                                            {section.links.map(
                                                                (link) => (
                                                                    <Link
                                                                        key={
                                                                            link.title
                                                                        }
                                                                        href={
                                                                            link.href
                                                                        }
                                                                        onClick={() => {
                                                                            setIsMobileOpen(
                                                                                false
                                                                            );
                                                                            setMobileSubmenuIndex(
                                                                                null
                                                                            );
                                                                        }}
                                                                        className="flex items-center justify-between border-b border-neutral-100 py-3 text-lg font-bold uppercase text-neutral-900"
                                                                    >
                                                                        {
                                                                            link.title
                                                                        }
                                                                        <ArrowRight
                                                                            size={
                                                                                18
                                                                            }
                                                                        />
                                                                    </Link>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </nav>
    );
}
