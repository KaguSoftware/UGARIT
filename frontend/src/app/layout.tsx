import React from "react";
import Link from "next/link";

type NavbarCategory = {
    id?: number;
    documentId?: string;
    name?: string;
    slug?: string;
    showInNavbar?: boolean;
    isMegaMenu?: boolean;
    megaMenuContent?: unknown;
    locale?: string;
    image?: unknown;
};

type NavbarProps = {
    strapiCategories?: NavbarCategory[];
};

const Navbar = ({ strapiCategories = [] }: NavbarProps) => {
    return (
        <nav>
            <ul>
                {strapiCategories.map((category) => (
                    <li
                        key={
                            category.id || category.documentId || category.slug
                        }
                    >
                        <Link href={`/${category.slug}`}>{category.name}</Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;
