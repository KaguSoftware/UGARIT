"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { FOOTER_DATA } from "./constants";
export const Footer = () => {
    const t = useTranslations();

    return (
        <footer className="w-full bg-gray-900 text-gray-300 border-t border-gray-800">
            <MaxWidthWrapper className="py-12 md:py-16">
                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    {FOOTER_DATA.map((section, idx) => (
                        <div key={idx} className="flex flex-col gap-4">
                            <h3 className="text-white font-semibold text-lg uppercase tracking-wider">
                                {t(section.titleKey)}
                            </h3>
                            <ul className="flex flex-col gap-2">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <Link
                                            href={link.href}
                                            className="hover:text-white transition-colors duration-200 text-sm"
                                        >
                                            {t(link.label)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} Project0 - Kagu Team</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-gray-300">Terms of Service</Link>
                    </div>
                </div>
            </MaxWidthWrapper>
        </footer>
    );
};