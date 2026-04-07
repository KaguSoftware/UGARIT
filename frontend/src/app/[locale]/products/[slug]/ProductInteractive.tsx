"use client";

import Image from "next/image";
import { useState } from "react";
import { MessageCircle, Ruler, Weight, Shirt } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { addToCart as addToCartAction } from "@/src/lib/cart-actions";

export default function ProductInteractive({
    documentId,
    price,
    title,
    slug,
    description,
    initialImage,
    fallbackImages,
    colorVariants,
    sizeOptions,
    modelInfo,
    translations,
}: any) {
    // This state controls the image, and now the Cart Action knows about it!
    const [mainImage, setMainImage] = useState(initialImage);
    const [activeColorId, setActiveColorId] = useState<string | number | null>(
        null
    );
    const [selectedColorName, setSelectedColorName] = useState<string>("");

    const [selectedSize, setSelectedSize] = useState<string>("");
    const [isAdding, setIsAdding] = useState(false);

    const params = useParams<{ locale?: string }>();
    const currentLocale =
        typeof params?.locale === "string" ? params.locale : "en";

    const handleAdd = async () => {
        if (!selectedSize) {
            toast.error("Please select a size");
            return;
        }
        if (colorVariants.length > 0 && !selectedColorName) {
            toast.error("Please select a color");
            return;
        }

        setIsAdding(true);
        // Notice how mainImage and selectedColorName are perfectly captured here
        const result = await addToCartAction(
            documentId,
            selectedSize,
            selectedColorName || "Default",
            1,
            Number(price),
            title,
            slug,
            mainImage,
            currentLocale
        );

        if (result.success) {
            toast.success("Added to cart!");
        } else {
            toast.error("Failed to add to cart");
        }
        setIsAdding(false);
    };

    return (
        <div className="md:grid md:grid-cols-2 grid-cols-1">
            {/* Image Gallery Column */}
            <div className="justify-items-center">
                {/* Image has the aspect-[4/3] you requested earlier */}
                <Image
                    className="object-cover w-full aspect-[4/3] rounded-2xl transition-opacity duration-300 shadow-sm"
                    alt={title}
                    src={mainImage}
                    width={1000}
                    height={750}
                    unoptimized
                />
                <div className="justify-items-center w-full">
                    <p className="font-bold text-sm mt-6">
                        {translations.colors}
                    </p>
                    <div className="flex mt-3 gap-4 flex-wrap justify-center">
                        {colorVariants.length > 0
                            ? colorVariants.map(
                                  (variant: any, index: number) => {
                                      const isActive =
                                          activeColorId === variant.id ||
                                          (mainImage === variant.imageUrl &&
                                              activeColorId === null);
                                      return (
                                          <button
                                              key={variant.id || index}
                                              onClick={() => {
                                                  setMainImage(
                                                      variant.imageUrl
                                                  );
                                                  setActiveColorId(variant.id);
                                                  setSelectedColorName(
                                                      variant.color?.name
                                                  );
                                              }}
                                              className={`w-9 h-9 rounded-full border-2 transition-all ${
                                                  isActive
                                                      ? "border-gray-800 scale-110 shadow-md"
                                                      : "border-gray-300 hover:scale-105"
                                              }`}
                                              style={{
                                                  backgroundColor:
                                                      variant.color?.hexCode ||
                                                      "#ccc",
                                              }}
                                              title={variant.color?.name}
                                          />
                                      );
                                  }
                              )
                            : fallbackImages.map(
                                  (imgUrl: string, index: number) => (
                                      <button
                                          key={index}
                                          onClick={() => setMainImage(imgUrl)}
                                          className={`relative w-[75px] h-[75px] rounded-xl overflow-hidden border-2 ${
                                              mainImage === imgUrl
                                                  ? "border-black"
                                                  : "border-transparent"
                                          }`}
                                      >
                                          <Image
                                              alt="thumbnail"
                                              src={imgUrl}
                                              fill
                                              className="object-cover"
                                              unoptimized
                                          />
                                      </button>
                                  )
                              )}
                    </div>
                </div>
            </div>

            {/* Details & Cart Action Column */}
            <div className="px-6">
                <h1 className="text-3xl tracking-tighter font-bold md:mt-0 mt-4 max-w-200">
                    {title}
                </h1>
                <div className="flex items-center font-bold mt-2 gap-4">
                    <p className="text-black text-4xl">₺{price}</p>
                </div>
                {description && (
                    <>
                        <h2 className="font-semibold text-xl mt-4">
                            {translations.desc}
                        </h2>
                        <p className="text-gray-500 tracking-tight text-xl mt-2 max-w-200 whitespace-pre-wrap">
                            {description}
                        </p>
                    </>
                )}

                {/* Sizes */}
                <div className="flex gap-8 mt-4">
                    <div>
                        <h3 className="text-gray-700 font-bold tracking-tight text-lg">
                            {translations.sizetext}
                        </h3>
                        <div className="flex font-bold mt-2 gap-2">
                            {sizeOptions.map((size: any) => (
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

                {/* Actions */}
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
                            `${translations.linktext}: ${title}`
                        )}`}
                        target="_blank"
                        className="text-white flex gap-4 items-center justify-center h-14 shadow-xl rounded-xl hover:bg-green-400 duration-300 bg-green-500"
                    >
                        <MessageCircle className="hover:fill-white duration-300 hover:text-green-600" />
                        {translations.whatsapp}
                    </Link>
                </div>

                {/* Model Info */}
                {(modelInfo.modelHeight ||
                    modelInfo.modelWeight ||
                    modelInfo.modelSize) && (
                    <div className="text-lg text-center md:text-left mt-4">
                        <h4 className="font-bold">{translations.maniken}:</h4>
                        {modelInfo.modelHeight && (
                            <p className="flex gap-2">
                                <Ruler className="hover:fill-gray-400" />
                                {translations.height}:{modelInfo.modelHeight}
                            </p>
                        )}
                        {modelInfo.modelWeight && (
                            <p className="flex gap-2">
                                <Weight className="hover:fill-gray-400" />
                                {translations.weight}:{modelInfo.modelWeight}
                            </p>
                        )}
                        {modelInfo.modelSize && (
                            <p className="flex gap-2">
                                <Shirt className="hover:fill-gray-400" />
                                {translations.mansize}:{modelInfo.modelSize}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
