export type CartItem = {
    documentId: string;
    productDocumentId: string;
    title: string;
    slug: string;
    imageUrl: string;
    size: "XS" | "S" | "M" | "L" | "XL" | "XXL";
    quantity: number;
    unitPrice: number;
    color?: string;
};

export type Cart = {
    documentId: string | null;
    sessionId: string | null;
    items: CartItem[];
};
