import CategoryCard from "@/src/components/cards/CategoryCard/categoryCard";
import LocationCard from "@/src/components/cards/LocationCard/LocationCard";
import { LOCATIONS } from "@/src/components/cards/LocationCard/constants";
import { Locationtype } from "@/src/components/cards/LocationCard/types";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";

export default function Home() {
    return (
        <main>
            <MaxWidthWrapper>
                <LocationCard />
            </MaxWidthWrapper>
        </main>
    );
}
