import Link from "next/link";
import Image from "next/image";
const WaButton = ({ phone = "905015919054" }: { phone?: string }) => {
    return (
        <Link
            className="fixed bottom-8 flex justify-center right-8 z-999 md:h-20 md:w-20 h-15 w-15 rounded-full bg-green-500 shadow-lg"
            href={`https://wa.me/${phone}?text=Merhaba`}
        >
            <Image
                height={20}
                width={20}
                src={"/icons/whatsapp.svg"}
                alt="whatsapp icon"
                className="text-center self-center md:size-12 size-9 invert"
            />
        </Link>
    );
};

export default WaButton;
