import Image from "next/image";
import { CARTTANDO } from "./constants";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import Link from "next/link";
import CartProductCard from "../../cards/CartProduct/CartProductCard";
import { CARTPRODUCTS } from "../../cards/CartProduct/constants";
import { useTranslations } from "next-intl";

export default function CartTandO() {
    const t = useTranslations();
    const total = CARTPRODUCTS.reduce((sum, product) => {
        const price = Number(
            String(product.currentPrice).replace(/[^0-9.-]+/g, "")
        );

        return sum + price;
    }, 0);
    return (
        <MaxWidthWrapper>
            <div className="my-10 md:mt-2 items-center rounded-2xl flex flex-col md:grid-cols-3 bg-gray-200 gap-6 mx-auto md:p-8 p-3">
                <div className="bg-white font-bold w-full p-6 rounded-2xl">
                    <h1 className="text-3xl border-b-2 py-2 border-gray-300">
                        {CARTTANDO.summary}
                    </h1>
                    <div className="mt-4 space-y-2">
                        {CARTPRODUCTS.map((title) => (
                            <h2
                                key={title.id}
                                className="text-xl font-medium flex w-full justify-between"
                            >
                                <p>{t(title.title)}</p> {title.currentPrice}
                            </h2>
                        ))}
                    </div>
                    <div className="flex justify-between text-3xl mt-4 border-gray-300">
                        <h3>{CARTTANDO.total}</h3>
                        <h4 className="font-medium">₺{total.toFixed(2)}</h4>
                    </div>
                </div>
                <Link
                    href="/"
                    className="flex bg-green-500 justify-center gap-3 md:text-xl text-[17px]  font-bold text-white p-3 rounded-full w-full"
                >
                    {CARTTANDO.wabutton}
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
