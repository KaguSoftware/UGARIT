export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50 text-slate-900">
			<div className="max-w-2xl w-full text-center space-y-6">
				<h1 className="text-5xl font-extrabold tracking-tight">
					Next.js is ready.
				</h1>

				<p className="text-lg text-slate-600">
					The backend is currently disconnected, so we are showing
					this static placeholder instead of your product list.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
					<div className="p-6 text-left bg-white border border-slate-200 rounded-xl shadow-sm">
						<h2 className="font-bold text-lg mb-2">Frontend</h2>
						<p className="text-sm text-slate-500">
							The Next.js dev server is running with Turbopack.
							You can edit this file in
							<code className="bg-slate-100 px-1 rounded">
								src/app/[locale]/page.tsx
							</code>
						</p>
					</div>

					<div className="p-6 text-left bg-white border border-slate-200 rounded-xl shadow-sm">
						<h2 className="font-bold text-lg mb-2">
							Backend Status
						</h2>
						<p className="text-sm text-slate-500 italic">
							Offline. Switch back to your fetch logic once your
							Strapi server is running on port 1337.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
