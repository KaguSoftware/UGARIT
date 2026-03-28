"use client";

import { useTranslations } from "next-intl";
import { CATEGORIES_DATA } from "./constants";

export const Categories = () => {
    const t = useTranslations("Filters");


    const categoryList = CATEGORIES_DATA[0].ids;

    return (
        <div className="p-6 pt-4 bg-white rounded-xl border border-slate-200 text-slate-900 shadow-lg max-w-56 ml-12 max-h-60 flex flex-col">
            <div className="mb-6">
                <h3 className="font-bold text-lg">{t("categoriesTitle")}</h3>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {categoryList.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between w-full cursor-pointer group hover:text-blue-600 hover:transition"
                    >
                        <span className="text-slate-700 group-hover:text-blue-600 font-medium">
                            {t(item.id)}
                        </span>

                    </div>
                ))}
            </div>
        </div >
    );
};