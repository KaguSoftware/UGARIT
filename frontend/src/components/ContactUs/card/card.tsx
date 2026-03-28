import Link from "next/link";
import { CARDCONTACT } from "./constants";
import { Card } from "./types";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";

export default function ContactSmallC() {
    return (

        <div className="grid grid-cols-1  items-center md:grid-cols-3 gap-6 mx-auto py-1 bg-white mt-4">
            {CARDCONTACT.map((card) => {
                const Icon = card.icon;
                return (
                    <MaxWidthWrapper>
                        <div key={card.id}
                            className="h-30 rounded-xl border-2 border-gray-200 flex flex-col item-center text-center gap-1 shadow-lg">
                            <div className="flex mt-1 mx-1 gap-2">
                                <Icon className="h-6 w-6 text-gray-600 rounded-xs mt-1 mx-1 z-10" />

                                <h3 className="text-lg font-bold text-gray-600 ">
                                    {card.title}
                                </h3>
                            </div>
                            <p className=" text-left text-gray-600 font-bold px-8 mx-1">{card.desc}</p>
                            <Link
                                href={card.link}
                                className=" px-8 py-2 self-center text-white bg-gray-600 rounded-2xl mt-4 pb-2 text-sm justify-center text-center cursor-pointer
                        shadow-xs hover:shadow-md transition-all duration-300 hover:scale-105 " >
                                {card.button}
                            </Link>
                        </div>
                    </MaxWidthWrapper>
                );
            })}

        </div>

    );
}