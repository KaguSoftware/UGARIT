export type Product = {
    id: number;
    title: string;
    originalPrice: string;
    currentPrice: string;
    imageUrl: string;
};
export interface ProductCardProps {
    product: Product;
}
export interface addToCartText {
    addToCartText: string;
}
