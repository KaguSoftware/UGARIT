"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { addToCart as addToCartAction } from "@/src/lib/cart-actions";

interface SizeOption {
	label: string;
	isAvailable: boolean;
}

interface Props {
	documentId: string;
	price: number;
	title: string;
	slug: string;
	imageUrl: string;
	sizeOptions: SizeOption[];
	translations: {
		sizetext: string;
		addtocart: string;
		linktext: string;
		whatsapp: string;
	};
}

export default function AddToCartSection({
	documentId,
	price,
	title,
	slug,
	imageUrl,
	sizeOptions,
	translations,
}: Props) {
	const [selectedSize, setSelectedSize] = useState<string>("");
	const [isAdding, setIsAdding] = useState(false);

	const handleAdd = async () => {
		if (!selectedSize) {
			toast.error("Please select a size");
			return;
		}

		setIsAdding(true);
		// Using Number() just to be safe with the Strapi data type
		const result = await addToCartAction(
			documentId,
			selectedSize,
			1,
			Number(price),
			title,
			slug,
			imageUrl,
		);

		if (result.success) {
			toast.success("Added to cart!");
		} else {
			toast.error("Failed to add to cart");
		}
		setIsAdding(false);
	};

	return (
		<>
			<div className="flex gap-8 mt-4">
				<div>
					<h3 className="text-gray-700 font-bold tracking-tight text-lg">
						{translations.sizetext}
					</h3>
					<div className="flex font-bold mt-2 gap-2">
						{sizeOptions.map((size) => (
							<button
								key={size.label}
								disabled={!size.isAvailable}
								onClick={() => setSelectedSize(size.label)}
								className={`h-10 w-10 border rounded-lg duration-150 flex items-center justify-center ${
									!size.isAvailable
										? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
										: selectedSize === size.label
											? "border-black bg-black text-white"
											: "border-gray-400 text-black hover:bg-black hover:text-white cursor-pointer"
								}`}
							>
								{size.label}
							</button>
						))}
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-4 mt-6 font-bold">
				<button
					onClick={handleAdd}
					disabled={isAdding}
					className="text-black bg-neutral-100 hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl duration-300 shadow-xl h-14"
				>
					{isAdding ? "..." : translations.addtocart}
				</button>
				<Link
					href={`https://wa.me/905372825347?text=${encodeURIComponent(
						`${translations.linktext}: ${title}`,
					)}`}
					target="_blank"
					className="text-white flex gap-4 items-center justify-center h-14 shadow-xl rounded-xl hover:bg-green-400 duration-300 bg-green-500"
				>
					<MessageCircle className="hover:fill-white duration-300 hover:text-green-600" />
					{translations.whatsapp}
				</Link>
			</div>
		</>
	);
}
