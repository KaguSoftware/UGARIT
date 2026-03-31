import Image from "next/image";
import { MessageCircle, Ruler, Weight, Shirt } from "lucide-react";

const STRAPI_URL =
	process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getMediaUrl(url?: string | null) {
	if (!url) return "/mock-images/mockshirt.png";
	if (url.startsWith("http")) return url;
	return `${STRAPI_URL}${url}`;
}

async function getProduct(id: string) {
	const res = await fetch(
		`${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(id)}&populate=*`,
		{ cache: "no-store" },
	);

	if (!res.ok) return null;

	const json = await res.json();
	return json.data?.[0] || null;
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

	const mainImageUrl = getMediaUrl(strapiProduct.image?.[0]?.url);
	const allImages = strapiProduct.image || [];

	const sizeOptions = [
		{ label: "XS", isAvailable: strapiProduct.sizeXS },
		{ label: "S", isAvailable: strapiProduct.sizeS },
		{ label: "M", isAvailable: strapiProduct.sizeM },
		{ label: "L", isAvailable: strapiProduct.sizeL },
		{ label: "XL", isAvailable: strapiProduct.sizeXL },
		{ label: "XXL", isAvailable: strapiProduct.sizeXXL },
	];

	return (
		<main className="py-10 px-6">
			<div className="md:grid md:grid-cols-2 grid-cols-1">
				<div className="justify-items-center">
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
									src={getMediaUrl(img.url)}
									width={75}
									height={75}
									className="object-cover rounded-xl w-18.75 h-18.75"
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
						<p className="text-black text-4xl">
							₺{strapiProduct.price}
						</p>
					</div>

					{strapiProduct.description && (
						<>
							<h2 className="font-semibold text-xl mt-4">
								Ürün Açıklaması
							</h2>
							<p className="text-gray-500 tracking-tight text-xl mt-2 max-w-200">
								{strapiProduct.description}
							</p>
						</>
					)}

					<div className="flex gap-8 mt-4">
						<div>
							<h3 className="text-gray-700 font-bold tracking-tight text-lg">
								BEDEN
							</h3>
							<div className="flex font-bold mt-2 gap-2">
								{sizeOptions.map((size) => (
									<button
										key={size.label}
										disabled={!size.isAvailable}
										className={`h-10 w-10 border rounded-lg duration-150 flex items-center justify-center ${
											size.isAvailable
												? "border-gray-400 text-black hover:bg-black hover:text-white cursor-pointer"
												: "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
										}`}
									>
										{size.label}
									</button>
								))}
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-4 mt-6 font-bold">
						<button className="text-black bg-neutral-100 hover:bg-black hover:text-white rounded-xl duration-300 shadow-xl h-14">
							SEPETE EKLE
						</button>

						<button className="text-white flex gap-4 items-center justify-center h-14 shadow-xl rounded-xl hover:bg-green-400 duration-300 bg-green-500">
							<MessageCircle className="hover:fill-white duration-300 hover:text-green-600" />
							WHATSAPPtan iletisime gec
						</button>
					</div>

					{(strapiProduct.modelHeight ||
						strapiProduct.modelWeight ||
						strapiProduct.modelSize) && (
						<div className="text-lg text-center md:text-left mt-4">
							<h4 className="font-bold">Mankenin Ölçüleri:</h4>

							{strapiProduct.modelHeight && (
								<p className="flex gap-2">
									<Ruler className="hover:fill-gray-400" />
									Boy: {strapiProduct.modelHeight}
								</p>
							)}

							{strapiProduct.modelWeight && (
								<p className="flex gap-2">
									<Weight className="hover:fill-gray-400" />
									Kilo: {strapiProduct.modelWeight}
								</p>
							)}

							{strapiProduct.modelSize && (
								<p className="flex gap-2">
									<Shirt className="hover:fill-gray-400" />
									Beden: {strapiProduct.modelSize}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
