import Link from "next/link";
import { LOCATIONS } from "./constants";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { MapPin } from "lucide-react";

export default function LocationCard() {
    return (
        <MaxWidthWrapper>
            <div className="grid items-center gap-6 mx-auto my-30">
                {LOCATIONS.map((location) => (
                    <Link
                        className="h-60 rounded-xl flex border-2 border-black shadow-black/20 flex-col justify-center bg-linear-to-b bg-white text-center items-center cursor-pointer shadow-md hover:shadow-md transition-all duration-400 hover:scale-105"
                        href={location.adressLink}
                        key={location.adressName}
                    >
                        <h3 className="text-lg font-bold text-black flex gap-3 ">
                            <MapPin />
                            {location.adressName}
                        </h3>
                        <p className="text-gray-600 mt-1 hover:text-gray-400 text-sm max-w-[95%]">
                            {location.exactLocName}
                        </p>
                    </Link>
                ))}
            </div>
        </MaxWidthWrapper>
    );
}
