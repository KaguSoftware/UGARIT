export interface Product {

    id: string;
    name: string;
    images: {
        src: string;
    }[];
    current_price: string;
    before_discount_price: string;
}
