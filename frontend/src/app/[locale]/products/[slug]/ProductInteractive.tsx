"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { MessageCircle, Ruler, Weight, Shirt, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { addToCart as addToCartAction } from "@/src/lib/cart-actions";
import { ToggleLikeProductAction } from "@/src/app/actions";

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
    isLiked: initialIsLiked = false,
}: any) {
    // Build carousel: product gallery images first, then any color variant images not already included
    const allImages: string[] = fallbackImages.length > 0 ? fallbackImages : [initialImage];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedColorImage, setSelectedColorImage] = useState<string | null>(null);
    const [activeColorId, setActiveColorId] = useState<string | number | null>(null);
    const [selectedColorName, setSelectedColorName] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [isAdding, setIsAdding] = useState(false);
    const [isLiked, setIsLiked] = useState(Boolean(initialIsLiked));
    const [isPending, startTransition] = useTransition();

    const mainImage = selectedColorImage ?? allImages[currentIndex] ?? initialImage;

    const prev = () => {
        setSelectedColorImage(null);
        setActiveColorId(null);
        setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length);
    };
    const next = () => {
        setSelectedColorImage(null);
        setActiveColorId(null);
        setCurrentIndex((i) => (i + 1) % allImages.length);
    };

    const handleLike = () => {
        if (isPending) return;
        const previous = isLiked;
        setIsLiked(!previous);
        startTransition(async () => {
            const result = await ToggleLikeProductAction(documentId);
            if (!result?.success) {
                setIsLiked(previous);
                toast.error(result?.errorMessage || "Failed to update like.");
            } else {
                setIsLiked(result.liked);
            }
        });
    };

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
            {/* Image Carousel Column */}
            <div className="justify-items-center">
                <div className="relative w-full select-none">
                    <Image
                        className="object-cover w-full aspect-3/4 rounded-2xl transition-opacity duration-300 shadow-sm"
                        alt={title}
                        src={mainImage}
                        width={750}
                        height={1000}
                        unoptimized
                    />

                    {/* Like button */}
                    <button
                        type="button"
                        onClick={handleLike}
                        disabled={isPending}
                        aria-label={isLiked ? "Unlike product" : "Like product"}
                        className="absolute top-3 right-3 z-10 transition-transform hover:scale-110 disabled:opacity-70"
                    >
                        <Heart
                            className={`w-7 h-7 transition-colors duration-200 drop-shadow ${
                                isLiked
                                    ? "fill-red-500 text-red-500"
                                    : "text-white hover:text-red-400"
                            }`}
                        />
                    </button>

                    {/* Prev / Next arrows — only shown when more than 1 image */}
                    {allImages.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prev}
                                aria-label="Previous image"
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                aria-label="Next image"
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Dot indicators */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {allImages.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setCurrentIndex(i)}
                                        aria-label={`Go to image ${i + 1}`}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            i === currentIndex
                                                ? "bg-white scale-125"
                                                : "bg-white/50 hover:bg-white/80"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Color swatches */}
                {colorVariants.length > 0 && (
                    <div className="justify-items-center w-full">
                        <p className="font-bold text-sm mt-6">{translations.colors}</p>
                        <div className="flex mt-3 gap-4 flex-wrap justify-center">
                            {colorVariants.map((variant: any, index: number) => {
                                const isActive = activeColorId === variant.id;
                                return (
                                    <button
                                        key={variant.id || index}
                                        onClick={() => {
                                            setSelectedColorImage(variant.imageUrl);
                                            setActiveColorId(variant.id);
                                            setSelectedColorName(variant.color?.name);
                                        }}
                                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                                            isActive
                                                ? "border-gray-800 scale-110 shadow-md"
                                                : "border-gray-300 hover:scale-105"
                                        }`}
                                        style={{ backgroundColor: variant.color?.hexCode || "#ccc" }}
                                        title={variant.color?.name}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
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
