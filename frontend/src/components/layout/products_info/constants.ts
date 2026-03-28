import { Product } from "./types"
export const PRODUCTS: Product[] = [
    {
        id: "1",
        name: "kofte 1",
        images: [
            { src: "/muz.png" },
            { src: "/mandalina.png" },
            { src: "/domates.png" },
        ],
        before_discount_price: "₺2999.99",
        current_price: "₺2499.99"
    },
    {
        id: "2",
        name: "KOFTE 2",
        images: [
            { src: "/kofte.png" },
            { src: "/kuzu.jpeg" },
            { src: "/inek.png" },
        ],

        before_discount_price: "₺3999.99",
        current_price: "₺3499.99"
    }

]

