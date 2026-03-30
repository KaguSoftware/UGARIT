"use client";
import { useEffect, useState } from "react";
import { Categories } from "./categories/categories";
import { Price } from "./price/price";
import { Size } from "./size/size";
import { Sp } from "./specialProducts/specialProducts";

export const Filters = () => {
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const handleScreenSizeChange = (
            event: MediaQueryListEvent | MediaQueryList
        ) => {
            setIsOpen(event.matches);
        };
        handleScreenSizeChange(mediaQuery);

        const listener = (event: MediaQueryListEvent) =>
            handleScreenSizeChange(event);
        mediaQuery.addEventListener("change", listener);

        return () => {
            mediaQuery.removeEventListener("change", listener);
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 p-6 ">
            <div className="flex items-start justify-between gap-4">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="w-35 rounded-md border bg-white p-4 py-2"
                >
                    {isOpen ? "Hide Filters" : "Show Filters"}
                </button>

                <button
                    type="button"
                    className="shrink-0 self-start w-fit rounded-md border bg-white px-4 py-2"
                >
                    sort by
                </button>
            </div>

            {isOpen && (
                <div className="flex w-full flex-col items-center gap-6">
                    <Categories />
                    <Size />
                    <Sp />
                    <Price />
                </div>
            )}
        </div>
    );
};
