"use client"

import { useTranslations } from "next-intl";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { FOOTER_DATA, SOCIAL_LINKS } from "./constants"; // Import SOCIAL_LINKS
import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
    const t = useTranslations();

    return (
        <footer className="w-full bg-white text-black border-t border-gray-200">
            <MaxWidthWrapper>
                {/* Main Footer Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 p-8">
                    {FOOTER_DATA.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="font-bold text-2xl pb-5">
                                {t(section.titleKey)}
                            </h3>
                            <ul className="flex flex-col gap-2">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <Link
                                            href={link.href}
                                            className="hover:transition duration-150 hover:text-gray-600"
                                        >
                                            {t(link.label)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-8 py-12 border-t border-gray-200">
                    {SOCIAL_LINKS.map((social, idx) => (
                        <a
                            key={idx}
                            href={t(social.href)}
                            className="transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
                        >
                            <Image
                                src={t(social.icon)}
                                alt={t(social.label)}
                                width={24}
                                height={24}
                                className="object-contain grayscale hover:grayscale-0 transition-all"
                            />
                        </a>
                    ))}
                </div>
            </MaxWidthWrapper>
        </footer>
    );
};