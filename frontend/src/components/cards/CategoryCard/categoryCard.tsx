"use client";
import { Category } from "./types";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type CategoryCardProps = { category: Category };
export default function CategoryCard({ category }: CategoryCardProps) {
    return (
        <div

            className="relative w-full h-64 bg-white overflow-hidden group cursor-pointer rounded-lg shadow-sm hover:shadow-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Image
                    src={category.imageUrl}
                    alt={category.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-102"
                />
                {/*the gradient overlay*/}
                <div className="absolute inset-0 bg-linear-to-t from-black/25 via-black/20 to-black/20" />
                {/*the text content*/}
                <div className="absolute bottom-0 left-0 w-full flex flex-col item-center justify-center text-gray-200 z-10 p-4">
                    <h3 className="text-2xl font-bold uppercase text-left tracking-widest text-gray-200">
                        {category.title}
                    </h3>
                    <Link
                        href={category.moreLink}
                        className="flex items-center gap-2 mt-1 text-gray-200 hover:text-gray-400 group">
                        <span className="text-sm mt-0.05 text-left mx-1 font-semibold hover:text-gray-400 text-gray-200">
                            Discover More
                        </span>

                        <ArrowRight className="w-4 h-4 font-semibold transition-transform" />
                    </Link>

                </div>
            </div>
        </div>
    );
}