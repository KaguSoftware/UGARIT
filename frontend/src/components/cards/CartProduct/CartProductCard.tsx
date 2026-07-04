"use client";

import Image from "next/image";
import { Link } from "@/src/i18n/routing";
import { cartProductCardProps } from "./types";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { Trash, Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    removeFromCart,
    updateCartItemQuantity,
} from "@/src/lib/cart-actions";
import toast from "react-hot-toast";

export default function CartProductCard({ product }: cartProductCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const tc = useTranslations("Common");

    const changeQuantity = (next: number) => {
        startTransition(async () => {
            const result = await updateCartItemQuantity(
                product.documentId,
                next
            );
            if (result.success) {
                router.refresh();
            } else {
                toast.error(tc("failedRemoveItem"));
            }
        });
    };

    // Cart snapshots store absolute Supabase Storage URLs.
    const rawImage = product?.imageUrl || "";
    const imageUrl = rawImage || "/LogoNoBg.png";

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await removeFromCart(product.documentId);

        if (result.success) {
            toast.success(tc("removedFromCart"));
        } else {
            console.error(result.error);
            toast.error(tc("failedRemoveItem"));
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
                        width={112}
                        height={150}
                        sizes="112px"
                        className="object-cover"
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
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    changeQuantity(product.quantity - 1)
                                }
                                disabled={isPending}
                                aria-label="Decrease quantity"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold text-gray-800">
                                {product.quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    changeQuantity(product.quantity + 1)
                                }
                                disabled={isPending}
                                aria-label="Increase quantity"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <span className="text-xl font-bold text-black">
                            ₺{(Number(product.unitPrice) * product.quantity).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    );
}
