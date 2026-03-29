import Link from "next/link";
import { LOCATIONS } from "./constants";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { MapPin } from "lucide-react";

export default function LocationCard() {
    return (
        <MaxWidthWrapper>
            <div className="grid grid-cols-1 p-3 items-center md:grid-cols-3 gap-6 mx-auto my-30">
                {LOCATIONS.map((location) => (
                    <Link
                        className="h-30 rounded-xl flex flex-col justify-center bg-linear-to-b from-gray-50 to-gray-300  hover:from-white hover:to-gray-300 text-center items-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-400 hover:scale-105"
                        href={location.adressLink}
                    >
                        <h3 className="text-lg font-bold text-gray-500 flex gap-3 ">
                            <MapPin />
                            {location.adressName}
                        </h3>
                        <p className="text-gray-500 mt-1 hover:text-gray-400 text-sm">
                            {location.exactLocName}
                        </p>
                    </Link>
                ))}
            </div>
        </MaxWidthWrapper>
    );
}
