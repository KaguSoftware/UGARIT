"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { cartProductCardProps } from "./types";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { Trash } from "lucide-react";

export default function CartProductCard({ product }: cartProductCardProps) {
    const t = useTranslations();

    return (
        <MaxWidthWrapper>
            <div className="flex max-h-fit p-2 h-full w-full bg-black/2 rounded-2xl">
                <div className="size-42 md:w-40 w-24 h-fit">
                    {/* yall will prolly say wtf , basically the dimentions dont change this way sorry that it looks ass */}
                    <Link
                        className="rounded-2xl object-cover"
                        href={`/products/${product.id}`}
                    >
                        <Image
                            src={product.imageUrl}
                            alt={product.title}
                            width={300}
                            height={400}
                            className="rounded-2xl"
                        />
                    </Link>
                </div>
                <div className=" flex justify-center w-full md:p-3 p-1 h-full">
                    <div className="flex md:flex-col justify-between w-full p-1">
                        <h3 className="md:text-3xl text-xs font-bold text-black ">
                            {t(product.title)}
                        </h3>
                        <p className="md:text-2xl self-center md:mr-auto text-gray-700 text-sm font-bold bg-gray-50 w-fit h-fit md:px-6 md:py-2 py-1 px-2 rounded-full">
                            {product.size}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <h2 className="text-black md:text-2xl self-center font-bold">
                            ₺{product.currentPrice}
                        </h2>
                        <button>
                            <Trash className="text-red-400 md:size-10 size-7" />
                        </button>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    );
}
