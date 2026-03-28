import { PRODUCTS } from "@/src/components/layout/products_info/constants";
import Image from "next/image";
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
                <Image className="object-fill w-120  ml-20 h-180 " alt="MainImage" src={SelectedProduct.images[0].src} width={90} height={90} />
                <div>
                    <h1 className="text-lg font-bold"> {SelectedProduct.name} </h1>
                    <div className="flex gap-4">
                        <p className=" text-black text-lg font-bold line-through">{SelectedProduct.before_discount_price}</p>
                        <p className=" text-yellow-500 text-lg font-bold ">{SelectedProduct.current_price}</p>
                    </div>
                    <div className="flex gap-4">
                        {SelectedProduct.images.map((img, index) => (
                            <Image
                                key={index}
                                alt="images"
                                loading="eager"
                                src={img.src}
                                width={90}
                                height={90}
                                className="object-contain "
                            ></Image>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
