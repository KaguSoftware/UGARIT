import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { LOCATIONS } from "@/src/components/cards/LocationCard/constants";
import { Locationtype } from "@/src/components/cards/LocationCard/types";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
			<MaxWidthWrapper className="max-w-420">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto py-1">
					{LOCATIONS.map((loc) => (
						<LocationCard
							key={loc.id}
							location={loc}
						/>
					))}
				</div>
			</MaxWidthWrapper>
		</main>


	);
}