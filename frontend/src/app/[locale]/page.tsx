// 1. Fetching (Make sure to include ?populate=* to get the image!)
async function getProducts() {
	const res = await fetch("http://localhost:1337/api/products?populate=*", {
		cache: "no-store",
	});
	const response = await res.json();
	return response.data;
}

export default async function Home() {
	const products = await getProducts();

	return (
		<main className="p-10 bg-slate-50 min-h-screen">
			<h1 className="text-3xl font-bold mb-8">Ferel Moda Test</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{products?.map((product: any) => {
					// Strapi 5 Image Logic
					const imageUrl = product.Image
						? `http://localhost:1337${product.Image.url}`
						: "https://via.placeholder.com/300";

					return (
						<div
							key={product.id}
							className="bg-white p-4 shadow-sm rounded-xl border"
						>
							{/* The Image */}
							<div className="relative w-full h-64 mb-4 overflow-hidden rounded-lg">
								<img
									src={imageUrl}
									alt={product.title}
									className="object-cover w-full h-full"
								/>
							</div>

							{/* The Text - Matching your exact screenshot names */}
							<h2 className="text-xl font-semibold capitalize">
								{product.title}
							</h2>
							<p className="text-blue-600 font-bold mt-2">
								${product.Price}
							</p>

							{/* Optional: Show status based on your 'Display' boolean */}
							{product.Display && (
								<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-2 inline-block">
									Live on Store
								</span>
							)}
						</div>
					);
				})}
			</div>
		</main>
	);
}
