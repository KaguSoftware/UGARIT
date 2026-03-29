"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale } from "next-intl";
import { ProductCarouselProps } from "./types";
import { CAROUSEL_OPTIONS, CAROUSEL_COLORS } from "./constants";
import ProductCard from "@/src/components/cards/ProductCard/ProductCard";

export default function ProductCarousel({
	title,
	products,
}: ProductCarouselProps) {
	const locale = useLocale();
	const isRtl = locale === "ar";

	const [emblaRef, emblaApi] = useEmblaCarousel({
		...CAROUSEL_OPTIONS,
		direction: isRtl ? "rtl" : "ltr",
	});

	const scrollPrev = useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	return (
		<section className="w-full max-w-7xl mx-auto px-4 py-8 relative">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-[#171717]">{title}</h2>

				{/* Navigation Arrows */}
				<div className="flex gap-2">
					<button
						onClick={scrollPrev}
						className={`${CAROUSEL_COLORS.arrowBackground} ${CAROUSEL_COLORS.arrowDefault}`}
						aria-label="Previous slide"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d={isRtl ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
							/>
						</svg>
					</button>
					<button
						onClick={scrollNext}
						className={`${CAROUSEL_COLORS.arrowBackground} ${CAROUSEL_COLORS.arrowDefault}`}
						aria-label="Next slide"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d={isRtl ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Carousel Viewport */}
			<div className="overflow-hidden" ref={emblaRef}>
				<div className="flex -ml-4">
					{products.map((product, index) => (
						<div
							key={product.id || index}
							className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4"
						>
							<ProductCard product={product} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
