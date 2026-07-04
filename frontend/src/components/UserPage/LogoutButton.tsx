"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogoutAction } from "@/src/app/actions";

export default function LogoutButton() {
    const t = useTranslations();
    const [pending, startTransition] = useTransition();

    const onLogout = () => {
        startTransition(async () => {
            await LogoutAction();
            // Full reload so every server component re-reads the cleared session.
            window.location.href = "/";
        });
    };

    return (
        <button
            type="button"
            onClick={onLogout}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
            <LogOut size={18} />
            {pending ? "…" : t("userMenu.logout")}
        </button>
    );
}
