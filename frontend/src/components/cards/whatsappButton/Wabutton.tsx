import Link from "next/link";
import Image from "next/image";
const WaButton = () => {
    return (
        <Link
            className="fixed bottom-8 flex justify-center right-8 z-999 h-20 w-20 rounded-full bg-green-500 shadow-lg"
            href={`https://wa.me/905015919054?text=Merhaba`}
        >
            <Image
                height={20}
                width={20}
                src={"/icons/whatsapp.svg"}
                alt="whatsapp icon"
                className="text-center self-center size-12  invert"
            />
        </Link>
    );
};

export default WaButton;
