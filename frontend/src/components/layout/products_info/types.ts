export interface Product {

    id: string;
    name: string;
    images: {
        src: string;
    }[];
    current_price: string;
    before_discount_price: string;
    item_description: string;
    manken_height: string;
    manken_kg: string;
    manken_size: string;

}
