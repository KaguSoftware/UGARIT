"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { USERPAGE } from "./constants";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";

type StrapiUser = {
	id: number;
	username: string;
	email: string;
};

function getCookie(name: string) {
	if (typeof document === "undefined") return null;

	const match = document.cookie.match(
		new RegExp(
			"(?:^|; )" +
				name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") +
				"=([^;]*)",
		),
	);

	return match ? decodeURIComponent(match[1]) : null;
}

export default function UserPage() {
	const [showInfo, setShowInfo] = useState(false);
	const [user, setUser] = useState<StrapiUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const t = useTranslations();

	useEffect(() => {
		const savedUser = localStorage.getItem("user");

		if (savedUser) {
			try {
				setUser(JSON.parse(savedUser));
				setError(null);
				setLoading(false);
				return;
			} catch {
				localStorage.removeItem("user");
			}
		}

		const userId = getCookie("userId");
		const username = getCookie("username");
		const userEmail = getCookie("userEmail");

		if (userId) {
			setUser({
				id: Number(userId),
				username: username ?? "User",
				email: userEmail ?? "",
			});
			setError(null);
			setLoading(false);
			return;
		}

		setError("No logged-in user found.");
		setLoading(false);
	}, []);

	return (
		<div className="mx-auto flex max-w-md flex-col relative top-15 items-center gap-4 w-[90%] justify-between rounded-xl border bg-white p-6 md:h-160 h-140 shadow-sm">
			<h1 className="text-5xl flex flex-col items-center border md:mt-25 mt-10 gap-4 p-4 rounded-full font-bold">
				<User className="size-12" />
			</h1>
			<h2 className="text-3xl">{t(USERPAGE.welcome)}</h2>
			<h3 className="text-4xl font-bold">
				{loading ? "Loading..." : (user?.username ?? "User")}
			</h3>

			{error && (
				<div className="w-full rounded-xl border border-red-300 bg-red-100 p-3 text-center text-red-800">
					{error}
				</div>
			)}

			<div className="flex flex-col w-full gap-3 ">
				<Link
					href="/profile"
					className="rounded-lg bg-white px-4 py-2 text-center w-full border-2 transition text-xl hover:bg-red-200"
				>
					{t(USERPAGE.liked)}
				</Link>
				<Link
					href="/settings"
					className="rounded-lg bg-white px-4 py-2 text-center w-full border-2 transition text-xl hover:bg-gray-100"
				>
					{t(USERPAGE.cart)}
				</Link>
			</div>
			<div className="w-full flex flex-col gap-7 h-full">
				<button
					type="button"
					onClick={() => setShowInfo((prev) => !prev)}
					className="rounded-lg bg-gray-600 px-4 py-2 text-center w-full text-xl text-white transition hover:bg-gray-700"
				>
					{showInfo
						? `${t(USERPAGE.user.show)}`
						: `${t(USERPAGE.user.hide)}`}
				</button>
				{showInfo && (
					<div className="text-md">
						<p>
							<span className="font-semibold">
								{t(USERPAGE.name)}:
							</span>
							{user?.username ?? "-"}
						</p>
						<p>
							<span className="font-semibold">
								{t(USERPAGE.last)}:
							</span>
							-
						</p>
						<p>
							<span className="font-semibold">
								{t(USERPAGE.email)}:
							</span>
							{user?.email ?? "-"}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
