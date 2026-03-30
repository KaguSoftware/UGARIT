"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SP_DATA } from "./constants";

export const Sp = () => {
    const t = useTranslations("Filters");
    const spList = SP_DATA[0].ids;

    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

    const toggleSize = (id: string) => {
        setSelectedSizes((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="p-6 pt-4 w-full bg-white rounded-xl border border-slate-200 text-slate-900 shadow-lg max-w-64 max-h-60 flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-lg">{t("sizeTitle")}</h3>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {spList.map((item) => (
                    <label // 3. Changed to label for better accessibility
                        key={item.id}
                        className="flex items-center gap-3 w-full cursor-pointer group"
                    >
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={selectedSizes.includes(item.id)}
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
