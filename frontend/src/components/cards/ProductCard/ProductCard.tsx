"use client";

import Image from 'next/image'; // core nextjs
import { Heart } from 'lucide-react';
import { useState } from 'react'; //state tool

export default function ProductCard() {
    //memo variable, starts as 'false'
    const [isLiked, setIsLiked] = useState(false);

    return (
        <div
            className="relative w-full h-96 max-w-xs overflow-hidden group mx-auto cursor-pointer bg-white z-0">
            <Image
                src="/mock-images/mockpants.png"
                alt="Vamos Korean Style Pants"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105 "
            //group-hover:scale-105 and transition-transform duration-300 - might be removed/goes together for smoothness
            />

            <button
                onClick={() => setIsLiked(!isLiked)}
                className="absolute top-3 right-3 z-10 transition-transform hover:scale-110">
                <Heart
                    //if isliked is true, make it pink and fill in. otherwise, keep it gray and empty
                    className={`w-6 h-6 transition-colors duration-200 ${isLiked
                        ? 'fill-pink-500 text-pink-500'
                        : 'text-gray-400 hover:text-pink-500'
                        }`}
                />
            </button>

            {/* the add to cart button*/}
            <button className=
                "absolute bottom-0 left-0 w-full bg-black/70 py-3 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"
            >
                <p className="text-white text-sm font-bold">Add to cart</p>
            </button>


        </div>
    )
}