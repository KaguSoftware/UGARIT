import { NavItem } from "./types";

export const NAV_ITEMS: NavItem[] = [
	{
		labelKey: "nav.links.one",
		href: "/new-season",
		sections: [
			{
				labelKey: "nav.links.four",
				links: [
					{ labelKey: "nav.links.two", href: "/t-shirt" },
					{ labelKey: "nav.links.three", href: "/sweats" },
					{ labelKey: "nav.links.five", href: "/jacket" },
				],
			},
			{
				labelKey: "nav.links.six",
				links: [
					{ labelKey: "nav.links.eight", href: "/jeans" },
					{ labelKey: "nav.links.nine", href: "/shorts" },
				],
			},
		],
	},
	{
		labelKey: "nav.links.twelve",
		href: "/shoe",
	},
	{
		labelKey: "nav.links.thirteen",
		href: "/discount",
	},
];
