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
		<main>
			<h1> {id} </h1>
			<div className="bg-red-700 p-10">
				<h1> {SelectedProduct.name} </h1>
				{SelectedProduct.images.map((img, index) => (
					<Image
						key={index}
						alt="images"
						loading="eager"
						src={img.src}
						width={120}
						height={120}
					></Image>
				))}
			</div>
		</main>
	);
}
