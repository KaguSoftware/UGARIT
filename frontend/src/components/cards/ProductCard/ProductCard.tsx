"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { ToggleLikeProductAction } from "@/src/app/actions";
import { ProductCardProps } from "./types";
import { addToCart } from "./constants";
import { addToCart as addToCartAction } from "@/src/lib/cart-actions";
import toast from "react-hot-toast";

const ProductCard = ({ product }: ProductCardProps) => {
    const t = useTranslations();
    const [isLiked, setIsLiked] = useState(Boolean(product?.isLiked));
    const [isPending, startTransition] = useTransition();

    if (!product) {
        return null;
    }
    return (
        <Link
            href={`/products/${product.slug}`}
            className="block w-full overflow-hidden rounded-2xl bg-white shadow-md group/card"
        >
            <div className="group relative w-auto cursor-pointer overflow-hidden rounded-t-2xl min-h-60 md:min-h-90">
                <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    unoptimized
                    className="rounded-t-2xl object-cover transition-transform duration-300 group-hover/card:scale-105"
                />
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (isPending) return;

                        const previousLiked = isLiked;
                        setIsLiked(!previousLiked);

                        startTransition(async () => {
                            const result = await ToggleLikeProductAction(
                                product.id
                            );

                            if (!result?.success) {
                                setIsLiked(previousLiked);
                                console.error(
                                    result?.errorMessage ||
                                        "Failed to update liked product."
                                );
                            } else {
                                setIsLiked(result.liked);
                            }
                        });
                    }}
                    disabled={isPending}
                    aria-label={isLiked ? "Unlike product" : "Like product"}
                    className="absolute top-3 right-3 z-10 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <Heart
                        className={`w-6 h-6 transition-colors duration-200 ${
                            isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-black hover:text-red-500"
                        }`}
                    />
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        // cart logic here later
                        console.log("Added to cart!");
                    }}
                    className="absolute bottom-0 left-0 w-full bg-black/70 md:py-3 py-1 z-10 md:translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 ease-in-out"
                >
                    <p className="text-white text-md font-bold">
                        {t(addToCart.addToCartText)}
                    </p>
                </button>
            </div>

            <div className="text-center flex flex-col gap-1 m-3 px-2 bottom-0">
                <h3 className="text-md font-bold text-black group-hover/card:underline truncate">
                    {product.title}
                </h3>
                <div className="flex justify-center items-center gap-2 text-sm">
                    <h2 className="text-black font-bold">{product.price}</h2>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
