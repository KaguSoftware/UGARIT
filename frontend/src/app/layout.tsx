import { Geist, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Footer } from "../components/footer/footer";
import Navbar from "../components/ui/navbar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
	variable: "--font-ibm-plex-sans-arabic",
	subsets: ["arabic"],
	weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata = {
	title: "MAZ",
	description: "Mohammed-Azzam Ahdab",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const locale = await getLocale();
	const messages = await getMessages();
	const fontVariable =
		locale === "ar" ? ibmPlexSansArabic.variable : geistSans.variable;

	return (
		<html
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
			suppressHydrationWarning
		>
			<body
				className={`${fontVariable} antialiased`}
				suppressHydrationWarning
			>
				<NextIntlClientProvider messages={messages}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}