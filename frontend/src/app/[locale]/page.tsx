import ContactSmallC from "@/src/components/ContactUs/card/card";
import { CARDCONTACT } from "@/src/components/ContactUs/card/constants";
import { Card } from "@/src/components/ContactUs/card/types";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ContactPage from "@/src/components/ContactUs/contactUs";

export default function Home() {
	return (
		<main>
			<MaxWidthWrapper>
				<ContactPage />
			</MaxWidthWrapper>
		</main>

	);
}