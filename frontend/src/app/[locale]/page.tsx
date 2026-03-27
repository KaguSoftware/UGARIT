import CategoryCard from "@/src/components/cards/CategoryCard/categoryCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { CATEGORIES } from "@/src/components/cards/CategoryCard/constants";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50 ">

			<MaxWidthWrapper>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:grid-cols-4 mt-5">
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