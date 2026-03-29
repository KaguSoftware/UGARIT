import Navbar from "@/src/components/navbar/Navbar";
import { Footer } from "@/src/components/footer/footer";

export default async function LocaleLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Navbar />
			{children}
			<Footer />
		</>
	);
}
