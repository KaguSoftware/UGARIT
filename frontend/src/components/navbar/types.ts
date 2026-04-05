import React from "react";

export interface SubLink {
    labelKey: string;
    href: string;
}

export interface NavSection {
    labelKey: string;
    links: SubLink[];
}

export interface NavItem {
    labelKey: string;
    href: string;
    sections?: NavSection[];
}

export interface LanguageMenuProps {
    locale?: string;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onLocaleChange: (newLocale: string) => void;
    mobile?: boolean;
}
