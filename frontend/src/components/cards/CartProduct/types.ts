export type cartProduct = {
    id: number;
    title: string;
    originalPrice: string;
    currentPrice: string;
    imageUrl: string;
    size: string;
};
export interface cartProductCardProps {
    product: cartProduct;
}
