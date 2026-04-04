"use client";

import { useEffect, useState } from "react";
import { Link } from "@/src/i18n/routing";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
	MenuIcon,
	X,
	ArrowRight,
	Globe,
	ChevronDown,
	Search,
	ShoppingCartIcon,
} from "lucide-react";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import CartProductGrid from "../cart/cartproducts";
import { CartItem } from "@/src/types/cart";
import { LanguageMenuProps } from "./types";

type NavLink = { title: string; href: string };
type NavSection = { title: string; links: NavLink[] };
type NavItem = { title: string; href: string; sections?: NavSection[] };

const menuVariants: Variants = {
	initial: { x: "-100%" },
	animate: {
		x: 0,
		transition: {
			duration: 0.4,
			ease: [0.22, 1, 0.36, 1],
		},
	},
	exit: {
		x: "-100%",
		transition: {
			duration: 0.3,
		},
	},
};

const mobileMenuContentVariants: Variants = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.08,
		},
	},
	exit: {
		transition: {
			staggerChildren: 0.05,
			staggerDirection: -1,
		},
	},
};

const itemVariants: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 20 },
};

const menuIconFlipVariants: Variants = {
	initial: { rotate: -90, opacity: 0, scale: 0.85 },
	animate: {
		rotate: 0,
		opacity: 1,
		scale: 1,
		transition: {
			duration: 0.18,
			ease: [0.22, 1, 0.36, 1],
		},
	},
	exit: {
		rotate: 90,
		opacity: 0,
		scale: 0.85,
		transition: {
			duration: 0.14,
			ease: [0.55, 0, 1, 0.45],
		},
	},
};

export type StrapiCategory = {
	documentId: string;
	name: string;
	slug: string;
	showInNavbar: boolean;
	isMegaMenu: boolean;
	megaMenuContent: NavSection[] | null;
};

function LanguageMenu({
	locale,
	isOpen,
	setIsOpen,
	onLocaleChange,
	mobile = false,
}: LanguageMenuProps) {
	const triggerClassName = mobile
		? "flex items-center gap-2 text-sm font-bold uppercase text-neutral-900"
		: "flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-neutral-400";

	return (
		<div
			className="relative"
			onMouseEnter={!mobile ? () => setIsOpen(true) : undefined}
			onMouseLeave={!mobile ? () => setIsOpen(false) : undefined}
		>
			<button
				type="button"
				onClick={
					mobile
						? () => setIsOpen((prev: boolean) => !prev)
						: undefined
				}
				className={triggerClassName}
			>
				<Globe size={mobile ? 20 : 16} />
				{locale}
			</button>

			{isOpen && (
				<div
					className={
						mobile
							? "absolute right-0 top-full z-1003 mt-2 w-24 overflow-hidden rounded-xl p-2 shadow-lg"
							: "absolute right-0 top-full z-50 w-24 pt-2"
					}
				>
					<div className="space-y-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
						{["en", "ar", "tr"].map((lang) => (
							<button
								key={lang}
								type="button"
								onClick={() => onLocaleChange(lang)}
								className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-widest text-neutral-700 transition-colors hover:bg-neutral-100"
							>
								<Image
									src={`/${
										lang === "en"
											? "ukicon"
											: lang === "ar"
												? "arIcon"
												: "TrIcon"
									}.svg`}
									alt={lang}
									width={14}
									height={14}
								/>
								{lang}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default function Navbar({
	strapiCategories = [],
	cartItems = [],
}: {
	strapiCategories?: StrapiCategory[];
	cartItems?: CartItem[];
}) {
	const locale = useLocale();
	const tNav = useTranslations("Nav");

	const staticNavItems = tNav.raw("items") as NavItem[];

	const dynamicNavItems: NavItem[] = strapiCategories
		.filter((cat) => cat.showInNavbar)
		.map((cat) => ({
			title: cat.name,
			href: `/categories/${cat.slug}`,
			sections:
				cat.isMegaMenu && cat.megaMenuContent
					? cat.megaMenuContent
					: undefined,
		}));

	const navItems = [...staticNavItems, ...dynamicNavItems];

	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [isLangOpen, setIsLangOpen] = useState(false);
	const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
	const [mobileSubmenuIndex, setMobileSubmenuIndex] = useState<number | null>(
		null,
	);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		document.body.style.overflow = isMobileOpen ? "hidden" : "unset";
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isMobileOpen]);

	const handleLocaleChange = (newLocale: string) => {
		setIsLangOpen(false);
		setIsMobileOpen(false);
		setMobileSubmenuIndex(null);
		setIsMobileSearchOpen(false);

		const currentPath = window.location.pathname;
		const cleanPath =
			currentPath.replace(
				/^\/(?:en|ar|tr)(?:\/(?:en|ar|tr))*?(?=\/|$)/,
				"",
			) || "/";
		const normalizedPath = cleanPath.startsWith("/")
			? cleanPath
			: `/${cleanPath}`;
		const targetPath =
			normalizedPath === "/"
				? `/${newLocale}`
				: `/${newLocale}${normalizedPath}`;

		window.location.assign(targetPath);
	};

	return (
		<nav className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 shadow-sm backdrop-blur-md">
			<MaxWidthWrapper className="grid h-20 grid-cols-3 items-center md:grid md:grid-cols-[1fr_auto_1fr]">
				<div className="order-1 flex items-center justify-self-start md:order-0 md:hidden">
					<button
						onClick={() => {
							setIsMobileOpen((prev: boolean) => {
								const next = !prev;
								if (next) {
									setIsMobileSearchOpen(false);
								} else {
									setMobileSubmenuIndex(null);
									setIsLangOpen(false);
								}
								return next;
							});
						}}
						className="relative z-1002 flex h-10 w-10 items-center justify-center text-neutral-900"
						aria-label={isMobileOpen ? "Close menu" : "Open menu"}
					>
						<AnimatePresence mode="wait" initial={false}>
							{isMobileOpen ? (
								<motion.span
									key="close"
									variants={menuIconFlipVariants}
									initial="initial"
									animate="animate"
									exit="exit"
									className="absolute inset-0 flex items-center justify-center"
								>
									<X size={24} />
								</motion.span>
							) : (
								<motion.span
									key="menu"
									variants={menuIconFlipVariants}
									initial="initial"
									animate="animate"
									exit="exit"
									className="absolute inset-0 flex items-center justify-center"
								>
									<MenuIcon size={24} />
								</motion.span>
							)}
						</AnimatePresence>
					</button>

					<button
						type="button"
						onClick={() => {
							setIsMobileSearchOpen((prev: boolean) => !prev);
							setIsMobileOpen(false);
							setMobileSubmenuIndex(null);
							setIsLangOpen(false);
						}}
						className="flex h-10 w-10 items-center justify-center text-neutral-900"
						aria-label={
							isMobileSearchOpen ? "Close search" : "Open search"
						}
					>
						<Search size={22} />
					</button>
				</div>

				<div className="order-2 justify-self-center md:order-0 md:justify-self-start">
					<Link href="/">
						<Image
							src="/LogoNoBg.png"
							width={100}
							height={40}
							alt="Logo"
							priority
						/>
					</Link>
				</div>

				<div className="order-3 flex items-center justify-self-end gap-3 md:hidden">
					<Link href={"/cart"}>
						<div className="relative flex items-center justify-center">
							<ShoppingCartIcon size={22} />
							{cartItems && cartItems.length > 0 && (
								<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
									{cartItems.length}
								</span>
							)}
						</div>
					</Link>
					<LanguageMenu
						locale={locale}
						isOpen={isLangOpen}
						setIsOpen={setIsLangOpen}
						onLocaleChange={handleLocaleChange}
						mobile
					/>
				</div>

				<div className="hidden h-full items-center justify-center gap-8 md:flex md:flex-1">
					{navItems.map((item, index) => (
						<div
							key={item.title}
							className="relative flex h-full items-center"
							onMouseEnter={() =>
								item.sections && setActiveDropdown(index)
							}
							onMouseLeave={() => setActiveDropdown(null)}
						>
							<Link
								href={item.href}
								className="flex items-center gap-1 py-2 text-sm font-bold uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900"
							>
								{item.title}
								{item.sections && (
									<ChevronDown
										size={14}
										className={`transition-transform duration-200 ${
											activeDropdown === index
												? "rotate-180"
												: ""
										}`}
									/>
								)}
							</Link>

							<AnimatePresence>
								{activeDropdown === index && item.sections && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 5 }}
										className="absolute left-1/2 top-full w-150 -translate-x-1/2 pt-4"
									>
										<div className="grid grid-cols-2 gap-10 rounded-2xl border border-neutral-100 bg-white p-8 shadow-2xl">
											{item.sections.map((section) => (
												<div
													key={section.title}
													className="flex flex-col gap-3"
												>
													<h4 className="text-xs font-black uppercase tracking-tighter text-neutral-400">
														{section.title}
													</h4>
													<div className="flex flex-col gap-3">
														{section.links.map(
															(link) => (
																<Link
																	key={
																		link.title
																	}
																	href={
																		link.href
																	}
																	className="group flex items-center text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
																>
																	{link.title}
																	<ArrowRight
																		size={
																			14
																		}
																		className="ml-2 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
																	/>
																</Link>
															),
														)}
													</div>
												</div>
											))}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					))}
				</div>

				<div className="hidden items-center justify-self-end gap-3 md:flex">
					<div className="relative w-130 max-w-xs">
						<input
							type="search"
							placeholder="Search"
							className="h-11 w-full rounded-full border border-neutral-400 bg-white/50 pl-5 pr-12 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400"
						/>
						<Search
							size={18}
							className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
						/>
					</div>

					<div
						className="relative"
						onMouseEnter={() => setIsCartOpen(true)}
						onMouseLeave={() => setIsCartOpen(false)}
					>
						<Link
							href={"/cart"}
							type="button"
							className="flex h-10 w-10 items-center justify-center text-neutral-900"
							aria-label="Open cart preview"
						>
							<div className="relative flex items-center justify-center">
								<ShoppingCartIcon size={22} />
								{cartItems && cartItems.length > 0 && (
									<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
										{cartItems.length}
									</span>
								)}
							</div>
						</Link>

						<AnimatePresence>
							{isCartOpen && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 8 }}
									className="absolute right-0 top-full z-50 pt-5"
								>
									<div className="py-5 rounded-2xl border border-neutral-200 bg-white shadow-2xl">
										<div className="max-h-90 overflow-y-auto">
											<CartProductGrid
												cartproducts={cartItems}
											/>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<LanguageMenu
						locale={locale}
						isOpen={isLangOpen}
						setIsOpen={setIsLangOpen}
						onLocaleChange={handleLocaleChange}
					/>
				</div>
			</MaxWidthWrapper>

			<AnimatePresence>
				{isMobileSearchOpen && (
					<motion.div
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						className="absolute left-0 top-full w-full border-t border-neutral-100 px-4 py-3 md:hidden"
					>
						<div className="mx-auto w-full max-w-sm">
							<div className="relative flex justify-center">
								<input
									type="search"
									placeholder="Search"
									className="h-12 w-[90%] rounded-2xl border border-neutral-200 bg-white/96 pl-4 pr-12 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400"
								/>
								<Search
									size={18}
									className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-neutral-500"
								/>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{mounted &&
				createPortal(
					<AnimatePresence>
						{isMobileOpen && !isMobileSearchOpen && (
							<motion.div
								variants={menuVariants}
								initial="initial"
								animate="animate"
								exit="exit"
								className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-white px-6 pb-8 pt-24"
							>
								<motion.div
									variants={mobileMenuContentVariants}
									initial="initial"
									animate="animate"
									exit="exit"
									className="flex flex-col"
								>
									{navItems.map((item) => (
										<div
											key={item.title}
											className="flex flex-col gap-2 border-b border-neutral-100 pb-6"
										>
											<motion.div variants={itemVariants}>
												<Link
													href={item.href}
													onClick={() => {
														setIsMobileOpen(false);
														setMobileSubmenuIndex(
															null,
														);
													}}
													className="flex items-center justify-between border-b border-neutral-100 text-lg font-bold uppercase text-neutral-900"
												>
													{item.title}
													<ArrowRight size={18} />
												</Link>
											</motion.div>

											{item.sections && (
												<div className="flex flex-col gap-3">
													{item.sections.map(
														(section) => (
															<div
																key={
																	section.title
																}
																className="flex flex-col"
															>
																<motion.h4
																	variants={
																		itemVariants
																	}
																	className="text-xs font-black uppercase tracking-tighter text-neutral-400"
																>
																	{
																		section.title
																	}
																</motion.h4>

																<div className="flex flex-col">
																	{section.links.map(
																		(
																			link,
																		) => (
																			<motion.div
																				key={
																					link.title
																				}
																				variants={
																					itemVariants
																				}
																			>
																				<Link
																					href={
																						link.href
																					}
																					onClick={() => {
																						setIsMobileOpen(
																							false,
																						);
																						setMobileSubmenuIndex(
																							null,
																						);
																					}}
																					className="flex items-center justify-between border-b border-neutral-100 py-3 text-lg font-bold uppercase text-neutral-900"
																				>
																					{
																						link.title
																					}
																					<ArrowRight
																						size={
																							18
																						}
																					/>
																				</Link>
																			</motion.div>
																		),
																	)}
																</div>
															</div>
														),
													)}
												</div>
											)}
										</div>
									))}
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body,
				)}
		</nav>
	);
}
