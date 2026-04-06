import Link from "next/link";
import { useTranslations } from "next-intl";
import { CARDCONTACT } from "./constants";
import { Card } from "./types";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";

export default function ContactSmallC() {
    const t = useTranslations();

    return (
        <MaxWidthWrapper>
            <div className="grid grid-cols-1  items-center md:grid-cols-3 gap-6 mx-auto p-3 mt-4">
                {CARDCONTACT.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.id}
                            className=" rounded-xl border-2 p-3 gap-4  border-gray-200 flex flex-col items-center  text-center  shadow-lg"
                        >
                            <div className="flex gap-2">
                                <Icon className="h-6 w-6 text-gray-600 rounded-xs z-10" />

                                <h3 className="text-xl font-bold text-gray-600 ">
                                    {t(card.title)}
                                </h3>
                            </div>
                            <p className=" text-left text-gray-600 text-xl font-bold">
                                {card.id === 1 ? card.desc : t(card.desc)}
                            </p>
                            <Link
                                href={card.link}
                                className=" px-8 p-2 self-center text-white bg-gray-600 rounded-2xl text-lg font-bold justify-center text-center cursor-pointer
                            shadow-xs hover:shadow-md transition-all duration-300 hover:scale-105 "
                            >
                                {t(card.button)}
                            </Link>
                        </div>
                    );
                })}
            </div>
        </MaxWidthWrapper>
    );
}
