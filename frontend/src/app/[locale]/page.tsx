import ProductCard from "@/src/components/cards/ProductCard/ProductCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50 text-slate-900">

			<MaxWidthWrapper>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
					<ProductCard />
					<ProductCard />
					<ProductCard />
					<ProductCard />
				</div>
			</MaxWidthWrapper>
		</main>
	);
}
