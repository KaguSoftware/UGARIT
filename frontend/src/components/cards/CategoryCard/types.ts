export type Category = {
    id: number;
    title: string;
    moreLink: string;
    imageUrl: string;
};
export interface CategoryProps {
    category: Category;
}
export interface Discover {
    discover: string;
}
