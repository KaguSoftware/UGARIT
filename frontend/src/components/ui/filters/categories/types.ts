export interface categoriesSection {

    links: categoriesLinks[];

}

export interface categoriesLinks {

    label: string;
    href: string;

}

export type categoriesTypes = categoriesSection[];