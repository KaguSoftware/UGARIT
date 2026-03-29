import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { Filters } from "@/src/components/ui/filters/filters";

export default function CategoryTemplatePage() {
	return (
		<main className="min-h-screen py-8 bg-slate-50">
			<MaxWidthWrapper>
				<div className="flex flex-col lg:flex-row gap-8">
					<aside className="w-full lg:w-72 shrink-0">
						<div className="sticky top-24">
							<Filters />
						</div>
					</aside>

					<div className="flex-1">
						<div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
							<span className="text-sm font-medium text-slate-500">
								Showing products
							</span>
							<select className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:ring-2 focus:ring-slate-900">
								<option>Sort by: Featured</option>
								<option>Price: Low to High</option>
								<option>Price: High to Low</option>
							</select>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
							<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col">
								<div className="aspect-square bg-slate-100 relative">
									<div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
										Product Image
									</div>
								</div>
								<div className="p-5 flex flex-col flex-1">
									<h3 className="font-semibold text-slate-900 text-lg">
										Product Title
									</h3>
									<p className="text-slate-500 text-sm mt-1 line-clamp-2">
										A quick description of the product goes
										right here.
									</p>

									<div className="mt-auto pt-4 flex items-center justify-between">
										<span className="font-bold text-xl text-slate-900">
											$19.99
										</span>
										<button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
											Add to cart
										</button>
									</div>
								</div>
							</div>

							<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col">
								<div className="aspect-square bg-slate-100 relative">
									<div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
										Product Image
									</div>
								</div>
								<div className="p-5 flex flex-col flex-1">
									<h3 className="font-semibold text-slate-900 text-lg">
										Product Title
									</h3>
									<p className="text-slate-500 text-sm mt-1 line-clamp-2">
										A quick description of the product goes
										right here.
									</p>

									<div className="mt-auto pt-4 flex items-center justify-between">
										<span className="font-bold text-xl text-slate-900">
											$24.99
										</span>
										<button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition">
											Add to cart
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</MaxWidthWrapper>
		</main>
	);
}
