export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				{/* Your header, footer, or providers go here */}
				{children}
			</body>
		</html>
	);
}
