import ContactSmallC from "@/src/components/ContactUs/card/card";
import LocationsContact from "@/src/components/ContactUs/Location/Location";
import EmailForm from "@/src/components/email/EmailForm";
export default function ContactUs() {
	return (
		<main>
			<EmailForm />
			<ContactSmallC />
			<LocationsContact />
		</main>
	);
}
