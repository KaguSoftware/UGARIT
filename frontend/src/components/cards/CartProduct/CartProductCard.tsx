"use client";

import Image from "next/image";
import { Link } from "@/src/i18n/routing";
import { cartProductCardProps } from "./types";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { Trash } from "lucide-react";
import { useState } from "react";
import { removeFromCart } from "@/src/lib/cart-actions";
import toast from "react-hot-toast";

export default function CartProductCard({ product }: cartProductCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    // guarantees the image URL always points to your Strapi backend
    const rawImage = product?.imageUrl || "";
    const imageUrl =
        rawImage.startsWith("http") || rawImage.startsWith("data:")
            ? rawImage
            : rawImage
            ? `${
                  process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
                  "http://localhost:1337"
              }${rawImage}`
            : "/LogoNoBg.png";

    if (
        !process.env.NEXT_PUBLIC_STRAPI_URL &&
        process.env.NODE_ENV === "production"
    ) {
        console.warn(
            "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost."
        );
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await removeFromCart(product.documentId);

        if (result.success) {
            toast.success("Item removed from cart");
        } else {
            console.error(result.error);
            toast.error("Failed to remove item");
            setIsDeleting(false);
        }
    };

    return (
        <MaxWidthWrapper>
            <div
                className={`flex items-stretch bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden transition-all hover:shadow-sm ${
                    isDeleting
                        ? "opacity-50 pointer-events-none"
                        : "opacity-100"
                }`}
            >
                {/* Image Section */}
                <Link
                    href={`/products/${product.slug}`}
                    className="w-28  shrink-0 relative block bg-gray-200"
                >
                    <Image
                        src={imageUrl}
                        alt={product.title}
                        width={750}
                        height={1000}
                        className="object-cover"
                        unoptimized
                    />
                </Link>

                {/* Details Section */}
                <div className="flex flex-col justify-between flex-1 p-4 w-full min-w-0">
                    {/* Top Row: Title & Trash */}
                    <div className="flex justify-between items-start gap-3">
                        {/* Title & Attributes - min-w-0 is absolutely required here for truncate to work */}
                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-lg font-bold text-gray-900 truncate"
                                title={product.title}
                            >
                                {product.title}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 mt-1 truncate">
                                {product.size}{" "}
                                {product.color &&
                                    product.color !== "Default" &&
                                    `• ${product.color}`}
                            </p>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            aria-label="Remove item"
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0 -mt-2 -mr-2"
                        >
                            <Trash size={20} />
                        </button>
                    </div>

                    {/* Bottom Row: Quantity & Price */}
                    <div className="flex items-center justify-between mt-auto">
                        <span className="text-gray-500 text-sm font-medium">
                            Qty: {product.quantity}
                        </span>
                        <span className="text-xl font-bold text-black">
                            ₺{product.unitPrice}
                        </span>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    );
}
