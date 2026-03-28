import Link from "next/link";
import { LOCATIONS } from "./constants";
import { Locationtype } from "./types";

type LocationCardProps = { location: Locationtype };

export default function LocationCard({ location }: LocationCardProps) {
    return (
        <div className="flex flex-col w-full mx-auto bg-white shadow-xs hover:shadow-md rounded-xl cursor-pointer transition-all duration-300 hover:scale-110 max-w-420">
            <div className="h-30 rounded-xl border-2 border-gray-400 flex flex-col gap-1 px-5 p-4 text-center">
                <h3 className="ext-lg font-bold text-gray-500">{location.adressName}</h3>
                <Link
                    href={location.adressLink}
                    className="text-gray-500 mt-1 hover:text-gray-400 text-sm">
                    {location.exactLocName}
                </Link>
            </div>
        </div>
    );
}