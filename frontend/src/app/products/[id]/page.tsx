import { PRODUCTS } from "@/src/components/layout/products_info/constants";
import Image from "next/image";
export default async function ProductDetail({ params,
}: {
    params: Promise<{ id: string }>;
}) {

    const id = (await params).id
    return (
        <main>
            <h1>why dont work {id} </h1>
            {PRODUCTS.map((product) => (
                <div key={product.id}>
                    <h1> {product.name} </h1>
                    {product.images.map((img, index) => (

                        <Image key={index} alt="images" src={img.src} width={120} height={120}></Image>

                    ))}

                </div>
            ))}


        </main>

    )
}