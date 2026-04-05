export type Product = {
    id: number | string;
    title: string;
    price: number;
    imageUrl: string;
    category?: string;
    slug?: string;
    isLiked?: boolean;
};

export interface ProductCardProps {
    product: Product;
}

export interface addToCartText {
    addToCartText: string;
}
