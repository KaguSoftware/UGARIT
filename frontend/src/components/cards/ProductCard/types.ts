export type Product = {
	id: string;
	title: string;
	price: number;
	imageUrl: string;
	category?: string;
	slug?: string;
};
export interface ProductCardProps {
	product: Product;
}
export interface addToCartText {
	addToCartText: string;
}
