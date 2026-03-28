import ContactSmallC from "./card/card";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";


export default function ContactPage() {
    return (
        <div className=" flex flex-col ">
            <h1 className="text-3xl text-gray-800 font-bold py-10">Contact Us</h1>
            <p className="text-black">Have a question about our products or pricing? We'd love to answer it!</p>
            <ContactSmallC />



        </div>

    )
}