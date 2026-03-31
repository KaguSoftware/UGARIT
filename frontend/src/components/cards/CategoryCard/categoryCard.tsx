"use client";

import { CategoryProps } from "./types";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { DiscoverText } from "./constants";

const Cat = ({ category }: CategoryProps) => {
	const t = useTranslations();

	if (!category) return null;

	return (
		<Link
			href={category.moreLink}
			className="relative block w-auto md:h-90 h-60 overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md group"
		>
			<Image
				src={category.imageUrl}
				alt={category.title}
				fill
				className="object-cover transition-transform duration-500 group-hover:scale-105"
			/>

			<div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/20" />

			<div className="absolute bottom-0 left-0 z-10 w-full p-4 text-gray-200">
				<h3 className="text-4xl font-sans font-bold uppercase tracking-widest">
					{category.title}
				</h3>

				<div className="flex items-center gap-2 mt-1">
					<span className="text-sm font-semibold">
						{t(DiscoverText.discover)}
					</span>
					<ArrowRight className="w-4 h-4" />
				</div>
			</div>
		</Link>
	);
};

export default Cat;
