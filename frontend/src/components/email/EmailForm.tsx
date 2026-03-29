"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FormStatus } from "./types";
import { FORM_RESET_TIMEOUT, fadeUpVariant, alertVariant } from "./constants";

export default function EmailForm() {
	const t = useTranslations("Contact");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<FormStatus>("idle");

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setLoading(true);
		setStatus("idle");

		// Fake network request to test the UI loading state
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// When ready to connect backend, replace the fake promise above with your action
		setStatus("success");
		(e.target as HTMLFormElement).reset();
		setLoading(false);

		setTimeout(() => setStatus("idle"), FORM_RESET_TIMEOUT);
	}

	return (
		<div className="min-h-screen pt-44 pb-20 px-6">
			<div className="mx-auto max-w-2xl">
				<motion.div
					variants={fadeUpVariant}
					initial="initial"
					animate="animate"
					className="space-y-12"
				>
					<div className="space-y-4">
						<h1 className="text-5xl md:text-7xl font-black text-gray-800 uppercase tracking-tighter leading-none">
							{t("title")}
						</h1>
						<div className="h-1.5 w-24 bg-gray-400" />
					</div>

					<form onSubmit={handleSubmit} className="space-y-8">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-3">
								<label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
									{t("name")}
								</label>
								<input
									name="name"
									type="text"
									required
									className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-black placeholder:text-neutral-400 focus:border-black focus:outline-none transition-all"
								/>
							</div>
							<div className="space-y-3">
								<label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
									{t("email")}
								</label>
								<input
									name="email"
									type="email"
									required
									className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-black placeholder:text-neutral-400 focus:border-black focus:outline-none transition-all"
								/>
							</div>
						</div>

						<div className="space-y-3">
							<label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">
								{t("details")}
							</label>
							<textarea
								name="message"
								required
								rows={6}
								className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-black placeholder:text-neutral-400 focus:border-black focus:outline-none transition-all resize-none"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="group relative w-full overflow-hidden rounded-xl bg-gray-800 py-6 font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
						>
							<div className="relative z-10 flex items-center justify-center gap-3">
								{loading ? (
									<>
										<Loader2
											className="animate-spin"
											size={20}
										/>
										<span>{t("sending")}</span>
									</>
								) : (
									<>
										<Send size={18} />
										<span>{t("submit")}</span>
									</>
								)}
							</div>
						</button>
					</form>

					<AnimatePresence>
						{status !== "idle" && (
							<motion.div
								variants={alertVariant}
								initial="initial"
								animate="animate"
								exit="exit"
								className={`flex items-center gap-4 rounded-xl p-6 border ${
									status === "success"
										? "border-green-500/20 bg-green-50 text-green-600"
										: "border-red-500/20 bg-red-50 text-red-600"
								}`}
							>
								{status === "success" ? (
									<CheckCircle size={24} />
								) : (
									<AlertCircle size={24} />
								)}
								<p className="font-bold uppercase tracking-widest">
									{status === "success"
										? t("success")
										: t("error")}
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</div>
		</div>
	);
}
