import Image from "next/image";
import { MessageCircle, Ruler, Weight, Shirt } from "lucide-react";

async function getProduct(id: string) {
	const res = await fetch(
		`http://127.0.0.1:1337/api/products?filters[documentId][$eq]=${id}&populate=*`,
		{
			cache: "no-store",
		},
	);

	if (!res.ok) return null;

	const json = await res.json();
	return json.data[0];
}

export default async function ProductDetail({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const id = (await params).id;
	const strapiProduct = await getProduct(id);

	if (!strapiProduct) {
		return (
			<main className="text-center py-20 text-xl font-bold">
				Product not found
			</main>
		);
	}

	const mainImageUrl = strapiProduct.image?.[0]?.url
		? `http://127.0.0.1:1337${strapiProduct.image[0].url}`
		: "/placeholder-image.jpg";

	const allImages = strapiProduct.image || [];

	return (
		<main className="py-10 px-6">
			<div className="md:grid md:grid-cols-2 grid-cols-1">
				<div className="justify-items-center ">
					<Image
						className="object-cover w-auto md:h-screen rounded-2xl"
						alt={strapiProduct.title || "Product Image"}
						src={mainImageUrl}
						width={1000}
						height={750}
					/>
					<div className="justify-items-center">
						<p className="font-bold text-sm mt-6">
							RENK SEÇENEKLERİ
						</p>
						<div className="flex mt-2 gap-4 flex-wrap justify-center">
							{allImages.map((img: any, index: number) => (
								<Image
									key={index}
									alt="gallery thumbnail"
									src={`http://127.0.0.1:1337${img.url}`}
									width={75}
									height={75}
									className="object-cover rounded-xl w-[75px] h-[75px]"
								/>
							))}
						</div>
					</div>
				</div>
				<div className="px-6">
					<h1 className="text-3xl tracking-tighter font-bold md:mt-0 mt-4 max-w-200">
						{strapiProduct.title}
					</h1>
					<div className="flex items-center font-bold mt-2 gap-4">
						<p className=" text-black text-4xl ">
							₺{strapiProduct.price}
						</p>
					</div>
					<h2 className="font-semibold text-xl mt-4">
						Ürün Açıklaması
					</h2>
					<p className="text-gray-500 tracking-tight text-xl mt-2 max-w-200">
						{strapiProduct.description || "Açıklama bulunamadı."}
					</p>
					<div className="flex gap-8 mt-4">
						<div>
							<h3 className="text-gray-700 font-bold tracking-tight text-lg">
								BEDEN
							</h3>
							<div className="flex font-bold mt-2 gap-2">
								<button className="h-10 w-10 border border-gray-400 rounded-lg hover:text-white hover:bg-gray-700 duration-150">
									S
								</button>
								<button className="h-10 w-10 border border-gray-400 rounded-lg hover:text-white hover:bg-gray-700 duration-150 ">
									M
								</button>
								<button className="h-10 w-10 border border-gray-400 rounded-lg hover:text-white hover:bg-gray-700 duration-150">
									L
								</button>
							</div>
						</div>
					</div>
					<div className="flex flex-col gap-4 mt-6 font-bold">
						<button className=" text-black bg-neutral-100 hover:bg-black hover:text-white rounded-xl duration-300 shadow-xl h-14">
							SEPETE EKLE
						</button>
						<button className="text-white flex gap-4 items-center justify-center h-14 shadow-xl rounded-xl hover:bg-green-400 duration-300 bg-green-500 ">
							<MessageCircle className="hover:fill-white duration-300 hover:text-green-600" />
							WHATSAPPtan iletisime gec
						</button>
					</div>
					{/* Hardcoded model sizing for now until we add it to Strapi */}
					<div className="text-lg text-center md:text-left mt-4 ">
						<h4 className="font-bold"> Mankenin Ölçüleri:</h4>
						<p className="flex gap-2">
							{" "}
							<Ruler className="hover:fill-gray-400" /> Boy:
							185cm{" "}
						</p>
						<p className="flex gap-2">
							{" "}
							<Weight className="hover:fill-gray-400" /> Kilo:
							80kg
						</p>
						<p className="flex gap-2">
							{" "}
							<Shirt className="hover:fill-gray-400" /> Beden: L
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
