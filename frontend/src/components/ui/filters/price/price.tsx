"use client";

import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useTranslations } from "next-intl";
import { PRICE_RANGE_DATA as DATA } from "./constants";
import { PriceRangeProps } from "./types";

export const Price = ({ onValueChange, initialValues }: PriceRangeProps) => {
    const t = useTranslations("Filters.Price");
    const [val, setVal] = useState(initialValues || [DATA.DEFAULT_MIN, DATA.DEFAULT_MAX]);

    const update = (v: number[]) => {
        setVal(v);
        onValueChange?.(v as [number, number]);
    };

    return (
        <div className="p-6 pt-4 w-64 border border-slate-200 rounded-lg bg-white text-black shadow-lg ml-12">
            <div className="mb-6">
                <h3 className="font-bold text-lg">{t("title")}</h3>
            </div>

            <div className="flex flex-col gap-5 items-center">
                <Slider.Root
                    className="relative flex items-center w-full h-5 touch-none select-none"
                    value={val}
                    onValueChange={update}
                    max={DATA.MAX_LIMIT}
                    step={DATA.STEP}
                >
                    <Slider.Track className="bg-slate-200 relative grow h-0.5 rounded-full">
                        <Slider.Range className="absolute bg-black h-full rounded-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-5 h-5 bg-white border-2 rounded-full transition-transform hover:scale-110 shadow-sm" />
                    <Slider.Thumb className="block w-5 h-5 bg-white border-2 rounded-full transition-transform hover:scale-110 shadow-sm" />
                </Slider.Root>

                <span className="font-bold text-sm">
                    {t("currency")}{val[0].toLocaleString()}
                    {t("separator")}
                    {t("currency")}{val[1].toLocaleString()}
                </span>
            </div>
        </div>
    );
};