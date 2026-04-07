"use client";

import Image from "next/image";
import { useState } from "react";

interface ColorVariant {
    id: string | number;
    color: {
        name: string;
        hexCode: string;
    };
    imageUrl: string;
}

interface ProductGalleryProps {
    initialImage: string;
    colorVariants: ColorVariant[];
    colorsTitle: string;
    fallbackImages: string[];
}

export default function ProductGallery({
    initialImage,
    colorVariants,
    colorsTitle,
    fallbackImages,
}: ProductGalleryProps) {
    const [mainImage, setMainImage] = useState(initialImage);
    const [activeColorId, setActiveColorId] = useState<string | number | null>(
        null
    );

    return (
        <div className="justify-items-center">
            <Image
                className="object-cover w-full aspect-[3/4] rounded-2xl transition-opacity duration-300 shadow-sm"
                alt="Product Image"
                src={mainImage}
                width={750}
                height={1000}
                unoptimized
            />
            <div className="justify-items-center w-full">
                <p className="font-bold text-sm mt-6">{colorsTitle}</p>
                <div className="flex mt-3 gap-4 flex-wrap justify-center">
                    {colorVariants.length > 0
                        ? // Render Color Picker Circles
                          colorVariants.map((variant, index) => {
                              const isActive =
                                  activeColorId === variant.id ||
                                  (mainImage === variant.imageUrl &&
                                      activeColorId === null);
                              return (
                                  <button
                                      key={variant.id || index}
                                      onClick={() => {
                                          setMainImage(variant.imageUrl);
                                          setActiveColorId(variant.id);
                                      }}
                                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                                          isActive
                                              ? "border-gray-800 scale-110 shadow-md"
                                              : "border-gray-300 hover:scale-105"
                                      }`}
                                      style={{
                                          backgroundColor:
                                              variant.color?.hexCode || "#ccc",
                                      }}
                                      title={variant.color?.name}
                                      aria-label={`Select ${variant.color?.name}`}
                                  />
                              );
                          })
                        : // Fallback to normal images if no colors are assigned yet
                          fallbackImages.map((imgUrl, index) => (
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
                                      alt="gallery thumbnail"
                                      src={imgUrl}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                  />
                              </button>
                          ))}
                </div>
            </div>
        </div>
    );
}
