import { Product } from "./types"
export const PRODUCTS: Product[] = [
    {
        id: "1",
        name: "GOMLEK UZUN KOLLU OYNAR BASLI",
        images: [
            { src: "/Project0_Gsize.jpeg" },
            { src: "/Project0_Gsize.jpeg" },
            { src: "/Project0_Gsize.jpeg" },
            { src: "/Project0_Gsize.jpeg" },
            // i need something that limits at 4 images if i keep the exact sizes
        ],
        before_discount_price: "₺2999.99",
        current_price: "₺2499.99",
        item_description: "Urun yuzde 500 keten gomlek pantalon corap her turlu pamuk ve makinede yikanir Urun yuzde 500 keten gomlek pantalon corap her turlu pamuk ve makinede yikanir Urun yuzde 500 keten gomlek pantalon corap her turlu pamuk ve makinede yikanir",
        manken_height: "175",
        manken_kg: "75",
        manken_size: "M"

    },
    {
        id: "2",
        name: "GOMLEK 2",
        images: [
            { src: "/Project0_Gsize.jpeg" },
            { src: "/Project0_Gsize.jpeg" },
            { src: "/Project0_Gsize.jpeg" },
            { src: "/Project0_Gsize.jpeg" },
        ],

        before_discount_price: "₺3999.99",
        current_price: "₺3499.99",
        item_description: "Urun yuzde 500dhjgksadhjghjadghjad Urun yuzde 500 keten gomlek pantalon corap her turlu pamuk ve makinede yikanir Urun yuzde 500 keten gomlek pantalon corap her turlu pamuk ve makinede yikanir",
        manken_height: "180",
        manken_kg: "81",
        manken_size: "L"
    }

]

