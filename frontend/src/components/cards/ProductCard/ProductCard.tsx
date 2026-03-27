"use client";

import Image from "next/image"; // core nextjs
import { Heart } from "lucide-react";
import { useState } from "react"; //state tool
import { Product } from "./types";

type ProductCardProps = { product: Product };

export default function ProductCard({ product }: ProductCardProps) {
    //memo variable, starts as 'false'
    const [isLiked, setIsLiked] = useState(false);

    return (
        <div className="flex flex-col w-full  mx-auto group cursor-pointer bg-white shadow-sm hover:shadow-md duration-400 pb-1 rounded-2xl">
            <div className="relative w-full md:h-96 h-60 max-w-xs overflow-hidden group rounded-t-2xl mx-auto cursor-pointer bg-white z-0">
                <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform rounded-t-2xl duration-300 group-hover:scale-105 "
                    //group-hover:scale-105 and transition-transform duration-300 - might be removed/goes together for smoothness
                />

                <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="absolute top-3 right-3 z-10 transition-transform hover:scale-110"
                >
                    <Heart
                        //if isliked is true, make it pink and fill in. otherwise, keep it gray and empty
                        className={`w-6 h-6 transition-colors duration-200 ${
                            isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400 hover:text-red-500"
                        }`}
                    />
                </button>

                {/* the add to cart button*/}
                <button className="absolute bottom-0 left-0 w-full bg-black/70 md:py-3 py-1 z-10 md:translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                    <p className="text-white text-sm font-bold">Add to cart</p>
                </button>
            </div>

            <div className="text-center flex flex-col gap-1 mt-3 px-2">
                <h3 className="text-sm font-medium text-black group-hover:underline truncate">
                    {product.title}
                </h3>
                <div className="flex justify-center items-center gap-2 text-sm">
                    <span className="text-gray-500 line-through">
                        {product.originalPrice}
                    </span>
                    <span className="text-black font-bold">
                        {product.currentPrice}
                    </span>
                </div>
            </div>
        </div>
    );
}
