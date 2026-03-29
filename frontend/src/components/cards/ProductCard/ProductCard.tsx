"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { ProductCardProps } from "./types";
import { addToCart } from "./constants";

const ProductCard = ({ product }: ProductCardProps) => {
	const t = useTranslations();
	const [isLiked, setIsLiked] = useState(false);

	if (!product) {
		return null;
	}

	return (
		<Link
			href={`/products/${product.id}`}
			className="block w-full overflow-hidden rounded-2xl bg-white shadow-md group/card"
		>
			<div className="group relative w-auto cursor-pointer overflow-hidden rounded-t-2xl h-60 md:h-90">
				<Image
					src={product.imageUrl}
					alt={product.title}
					fill
					className="rounded-t-2xl object-cover transition-transform duration-300 group-hover/card:scale-105"
				/>

				<button
					onClick={(e) => {
						e.preventDefault(); // stops the card link from triggering
						setIsLiked(!isLiked);
					}}
					className="absolute top-3 right-3 z-10 transition-transform hover:scale-110"
				>
					<Heart
						className={`w-6 h-6 transition-colors duration-200 ${
							isLiked
								? "fill-red-500 text-red-500"
								: "text-gray-400 hover:text-red-500"
						}`}
					/>
				</button>

				<button
					onClick={(e) => {
						e.preventDefault(); // stops the card link from triggering
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
					{t(product.title)}
				</h3>
				<div className="flex justify-center items-center gap-2 text-sm">
					<h1 className="text-gray-500 line-through">
						{product.originalPrice}
					</h1>
					<h2 className="text-black font-bold">
						{product.currentPrice}
					</h2>
				</div>
			</div>
		</Link>
	);
};

export default ProductCard;
