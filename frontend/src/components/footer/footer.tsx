"use client"

import { useTranslations } from "next-intl";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { FOOTER_DATA } from "./constants";
import Link from "next/link";

export const Footer = () => {
    const t = useTranslations();
    return (
        <footer className="w-full bg-white text-black border-t border-gray-800">
            <MaxWidthWrapper>
                <div className="grid grid-cols-1 md:grid-cols-3 pt-8">
                    {FOOTER_DATA.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="font-bold text-2xl pb-5">
                                {t(section.titleKey)}
                            </h3>
                            <ul className="flex flex-col">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <Link
                                            href={link.href}
                                            className="hover:transition duration-150 hover:text-gray-800"
                                        >
                                            {t(link.label)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </MaxWidthWrapper>

        </footer>
    );
};