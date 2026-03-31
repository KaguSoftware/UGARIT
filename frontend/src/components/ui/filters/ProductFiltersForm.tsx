import { Link } from "@/src/i18n/routing";

export default function ProductFiltersForm({
	filters,
	clearHref,
}: {
	filters?: {
		min?: string;
		max?: string;
		size?: string;
		sort?: string;
		featured?: string;
	};
	clearHref: string;
}) {
	return (
		<form
			method="GET"
			className="rounded-2xl border bg-white p-4 space-y-4"
		>
			<h2 className="text-lg font-bold">Filters</h2>

			<div className="space-y-2">
				<label className="block text-sm font-medium">Min price</label>
				<input
					type="number"
					name="min"
					defaultValue={filters?.min || ""}
					className="w-full rounded-lg border px-3 py-2"
				/>
			</div>

			<div className="space-y-2">
				<label className="block text-sm font-medium">Max price</label>
				<input
					type="number"
					name="max"
					defaultValue={filters?.max || ""}
					className="w-full rounded-lg border px-3 py-2"
				/>
			</div>

			<div className="space-y-2">
				<label className="block text-sm font-medium">Size</label>
				<select
					name="size"
					defaultValue={filters?.size || ""}
					className="w-full rounded-lg border px-3 py-2"
				>
					<option value="">All</option>
					<option value="XS">XS</option>
					<option value="S">S</option>
					<option value="M">M</option>
					<option value="L">L</option>
					<option value="XL">XL</option>
					<option value="XXL">XXL</option>
				</select>
			</div>

			<div className="space-y-2">
				<label className="block text-sm font-medium">Sort</label>
				<select
					name="sort"
					defaultValue={filters?.sort || ""}
					className="w-full rounded-lg border px-3 py-2"
				>
					<option value="">Default</option>
					<option value="price-asc">Price: Low to High</option>
					<option value="price-desc">Price: High to Low</option>
					<option value="title-asc">Title: A-Z</option>
				</select>
			</div>

			<label className="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					name="featured"
					value="true"
					defaultChecked={filters?.featured === "true"}
				/>
				Featured only
			</label>

			<div className="flex gap-2">
				<button
					type="submit"
					className="rounded-lg bg-black text-white px-4 py-2"
				>
					Apply
				</button>

				<Link href={clearHref} className="rounded-lg border px-4 py-2">
					Clear
				</Link>
			</div>
		</form>
	);
}
