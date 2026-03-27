import CategoryCard from "@/src/components/cards/CategoryCard/categoryCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { CATEGORIES } from "@/src/components/cards/CategoryCard/constants";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50 text-slate-900">

			<MaxWidthWrapper>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
					{CATEGORIES.map((categoryWindow) => (
						<CategoryCard
							key={categoryWindow.id}
							category={categoryWindow}
						/>
					))}
				</div>
			</MaxWidthWrapper>
		</main>


	);
}