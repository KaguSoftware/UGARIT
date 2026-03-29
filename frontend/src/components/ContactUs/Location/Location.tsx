import Link from "next/link";
import { LOCATIONS } from "./constants";
import MaxWidthWrapper from "../../ui/MaxWidthWrapper";
import { MapPin } from "lucide-react";

export default function LocationsContact() {
    return (
        <MaxWidthWrapper>
            <div className="grid grid-cols-1 w-full p-3 items-center gap-x-6 mx-auto mt-10">
                {LOCATIONS.map((location) => (
                    <div
                        key={location.id}
                        className="text-center items-center shadow-xs rounded-b-2xl hover:shadow-md transition-all duration-400"
                    >
                        <div className="p-5 rounded-t-xl flex flex-col justify-center bg-gray-800 text-center items-center">
                            <h3 className="text-lg font-bold text-white flex gap-3 ">
                                <MapPin />
                                {location.adressName}
                            </h3>
                        </div>

                        <iframe
                            src={location.map}
                            width="100%"
                            height="600"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full rounded-b-2xl shadow-xs"
                        />
                    </div>
                ))}
            </div>
        </MaxWidthWrapper>
    );
}
