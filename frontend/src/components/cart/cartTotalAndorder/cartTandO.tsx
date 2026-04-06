"use client";
import Image from "next/image";
import { CARTTANDO } from "./constants";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CartItem } from "@/src/types/cart";

interface CartTandOProps {
    cartItems: CartItem[];
}
export default function CartTandO({ cartItems = [] }: CartTandOProps) {
    const t = useTranslations();
    const Cartwhatsapbuttontext = CARTTANDO.buttonlink;

    // Calculate real total based on database price and quantity
    const total = cartItems.reduce((sum, item) => {
        return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    // Get real titles for the WhatsApp message
    const titlesString = cartItems.map((item) => item.title).join(", ");

    return (
        <MaxWidthWrapper>
            <div className="my-10 md:mt-2 items-center rounded-2xl flex flex-col md:grid-cols-3 bg-gray-200 gap-6 mx-auto md:p-8 p-3">
                <div className="bg-white font-bold w-full p-6 rounded-2xl">
                    <h1 className="text-3xl border-b-2 py-2 border-gray-300">
                        {t(CARTTANDO.summary)}
                    </h1>
                    <div className="mt-4 space-y-2">
                        {cartItems.map((item) => (
                            <h2
                                key={item.documentId}
                                className="text-xl font-medium flex w-full justify-between gap-4"
                            >
                                <p className="line-clamp-1 text-gray-700">
                                    {item.title}
                                </p>
                                <p className="whitespace-nowrap">
                                    ₺{item.unitPrice}
                                </p>
                            </h2>
                        ))}
                    </div>
                    <div className="flex justify-between text-3xl mt-4 pt-4 border-t-2 border-gray-300">
                        <h3>{t(CARTTANDO.total)}</h3>
                        <h4 className="font-medium">₺{total.toFixed(2)}</h4>
                    </div>
                </div>
                <Link
                    href={`https://wa.me/905372825347?text=${t(
                        Cartwhatsapbuttontext
                    )}:${titlesString}`}
                    target="_blank"
                    className="flex bg-green-500 justify-center gap-3 md:text-xl text-[17px] font-bold text-white p-3 rounded-full w-full hover:bg-green-600 transition-colors"
                >
                    {t(CARTTANDO.wabutton)}
                    <Image
                        src={"/icons/whatsapp.svg"}
                        width={24}
                        height={24}
                        alt="wa logo"
                        className="invert"
                    />
                </Link>
            </div>
        </MaxWidthWrapper>
    );
}
