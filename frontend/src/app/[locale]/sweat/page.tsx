import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";

export default function GenericPage() {
	return (
		<main className="min-h-screen py-16 md:py-24">
			<MaxWidthWrapper>
				<div className="max-w-3xl mx-auto space-y-8">
					<div className="space-y-4 border-b border-slate-200 pb-8">
						<h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
							Page Title
						</h1>
						<p className="text-lg text-slate-600">
							A quick subtitle or description for this page goes
							here.
						</p>
					</div>

					<div className="prose prose-slate max-w-none text-slate-700">
						<p>
							This is your placeholder content. Just swap out the
							title, description, and this text area when you are
							ready to build the actual page out.
						</p>

						<div className="h-64 bg-slate-50 border border-slate-200 rounded-xl animate-pulse mt-8 flex items-center justify-center text-slate-400">
							Component Placeholder
						</div>
					</div>
				</div>
			</MaxWidthWrapper>
		</main>
	);
}
