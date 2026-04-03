"use client";

import Image from "next/image";
import { Link } from "@/src/i18n/routing";
import { cartProductCardProps } from "./types";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { Trash } from "lucide-react";
import { useState } from "react";
import { removeFromCart } from "@/src/lib/cart-actions";

export default function CartProductCard({ product }: cartProductCardProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	// This guarantees the image URL always points to your Strapi backend
	const imageUrl = product.imageUrl?.startsWith("http")
		? product.imageUrl
		: `http://localhost:1337${product.imageUrl}`;

	const handleDelete = async () => {
		setIsDeleting(true);
		const result = await removeFromCart(product.documentId);

		if (!result.success) {
			console.error(result.error);
			setIsDeleting(false); // Only re-enable if it failed, otherwise the component unmounts
		}
	};

	return (
		<MaxWidthWrapper>
			<div
				className={`flex max-h-fit h-full w-auto bg-black/2 rounded-2xl transition-opacity ${isDeleting ? "opacity-50" : "opacity-100"}`}
			>
				<div className="size-42 md:w-[20%] min-w-18 w-24 h-fit">
					<Link
						className="rounded-2xl object-cover"
						href={`/products/${product.slug}`}
					>
						<Image
							src={imageUrl}
							alt={product.title}
							width={300}
							height={400}
							className="rounded-2xl"
						/>
					</Link>
				</div>
				<div className=" flex p-2 justify-center w-full h-full">
					<div className="flex md:flex-col justify-between w-full">
						<h3 className="text-xl font-bold text-black line-clamp-2">
							{product.title}
						</h3>
						<p className=" self-center md:mr-auto text-gray-700 font-bold bg-gray-50 w-fit h-fit md:px-6 px-2 rounded-full">
							{product.size}
						</p>
					</div>
					<div className="flex gap-1">
						<h2 className="text-black self-center font-bold">
							₺{product.unitPrice}
						</h2>
						<button
							onClick={handleDelete}
							disabled={isDeleting}
							className="disabled:opacity-50 transition-opacity"
						>
							<Trash className="text-red-400 md:size-6 size-7 hover:text-red-600 transition-colors" />
						</button>
					</div>
				</div>
			</div>
		</MaxWidthWrapper>
	);
}
