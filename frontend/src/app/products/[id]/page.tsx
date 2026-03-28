import { PRODUCTS } from "@/src/components/layout/products_info/constants";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
export default async function ProductDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const id = (await params).id;
    const SelectedProduct = PRODUCTS.find((deneme) => deneme.id == id);
    if (!SelectedProduct) {
        return <main>print("Invalid product ID:{id} ")</main>;
    }
    return (
        <main className="py-10 px-6">
            <div className="flex gap-4">
                <div className="justify-items-center">
                    <Image className="object-fill w-140 h-210 rounded-2xl" alt="MainImage" src={SelectedProduct.images[0].src} width={90} height={90} />
                    <div className="justify-items-center">
                        <p className="font-bold text-sm mt-6">RENK SEÇENEKLERİ</p>
                        <div className="flex mt-2 gap-4 ">
                            {SelectedProduct.images.map((img, index) => (
                                <Image
                                    key={index}
                                    alt="images"
                                    loading="eager"
                                    src={img.src}
                                    width={100}
                                    height={100}
                                    className="object-contain rounded-xl"
                                ></Image>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="px-6">
                    <h1 className="text-3xl tracking-tighter font-bold max-w-200"> {SelectedProduct.name} </h1>
                    <div className="flex items-center font-bold mt-2 gap-4">
                        <p className=" text-black text-2xl line-through">{SelectedProduct.before_discount_price}</p>
                        <p className=" text-yellow-500  text-4xl ">{SelectedProduct.current_price}</p>
                    </div>
                    <h2 className="font-semibold text-xl mt-4">Ürün Açıklaması</h2>
                    <p className="text-gray-600 tracking-tight text-xl mt-2 max-w-200">{SelectedProduct.item_description}</p>
                    <div className="flex gap-8 mt-4">
                        <div>
                            <h3 className="text-gray-600 font-bold tracking-tight text-lg">BEDEN</h3>
                            <div className="flex mt-2 gap-2">
                                <button className="h-10 w-10 border border-gray-400 rounded-lg hover:text-white hover:bg-black">S</button>
                                <button className="h-10 w-10 border border-gray-400 rounded-lg hover:text-white hover:bg-black">M</button>
                                <button className="h-10 w-10 border border-gray-400 rounded-lg hover:text-white hover:bg-black">L</button>
                            </div>
                        </div>
                        <div className="text-lg ">
                            <h4 className="font-bold"> Mankenin Ölçüleri:</h4>
                            <p className="mt-2 flex h-10 items-center"> Boy:{SelectedProduct.manken_height} Kilo:{SelectedProduct.manken_kg} </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 mt-6 font-bold">
                        <button className=" text-black  border-gray-500 hover:bg-black hover:text-white rounded-xl border-2 h-14">SEPETE EKLE</button>
                        <button className="text-white flex gap-4 items-center justify-center border-gray-500 h-14 border-2 rounded-xl hover:bg-green-400 bg-green-500 "><MessageCircle className="hover:fill-white hover:text-green-600" /> WHATSAPPtan iletisime gec </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
