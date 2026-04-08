"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SIZE_DATA } from "./constants";

type SizeProps = {
    availableSizes?: string[];
    selectedSize?: string | string[];
};

export const Size = ({ availableSizes = [], selectedSize }: SizeProps) => {
    const t = useTranslations("Filters");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const sizeList = SIZE_DATA[0].ids;

    const visibleSizes = useMemo(() => {
        if (!availableSizes.length) return sizeList;
        return sizeList.filter((item) => {
            const sizeLabel = String(t(item.id));
            return availableSizes.includes(sizeLabel);
        });
    }, [availableSizes, sizeList, t]);

    const [activeSizes, setActiveSizes] = useState<string[]>(
        Array.isArray(selectedSize)
            ? selectedSize
            : selectedSize
            ? [selectedSize]
            : []
    );

    useEffect(() => {
        setActiveSizes(
            Array.isArray(selectedSize)
                ? selectedSize
                : selectedSize
                ? [selectedSize]
                : []
        );
    }, [selectedSize]);

    const toggleSize = (id: string) => {
        const sizeLabel = String(t(id));
        const nextSizes = activeSizes.includes(sizeLabel)
            ? activeSizes.filter((size) => size !== sizeLabel)
            : [...activeSizes, sizeLabel];

        setActiveSizes(nextSizes);

        const params = new URLSearchParams(searchParams.toString());
        params.delete("size");
        nextSizes.forEach((size) => params.append("size", size));

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="p-6 pt-4 w-full bg-white rounded-xl border border-slate-200 text-slate-900 shadow-lg max-w-64 max-h-60 flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-lg">{t("sizeTitle")}</h3>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {visibleSizes.map((item) => (
                    <label
                        key={item.id}
                        className="flex items-center gap-3 w-full cursor-pointer group"
                    >
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={activeSizes.includes(String(t(item.id)))}
                            onChange={() => toggleSize(item.id)}
                        />
                        <span className="text-slate-700 group-hover:text-blue-600 font-medium transition-colors">
                            {t(item.id)}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};
