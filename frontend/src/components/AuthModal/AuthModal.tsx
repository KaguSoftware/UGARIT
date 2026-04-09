"use client";

import { useTranslations } from "next-intl";
import { X, Heart } from "lucide-react";
import { Link } from "@/src/i18n/routing";

interface AuthModalProps {
    onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
    const t = useTranslations();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                        <Heart className="w-7 h-7 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {t("authModal.title")}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {t("authModal.desc")}
                    </p>

                    <div className="flex flex-col gap-3 w-full mt-2">
                        <Link
                            href="/signin"
                            onClick={onClose}
                            className="w-full bg-black text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-center"
                        >
                            {t("authModal.signinTab")}
                        </Link>
                        <Link
                            href="/signup"
                            onClick={onClose}
                            className="w-full border border-gray-300 text-gray-800 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-center"
                        >
                            {t("authModal.signupTab")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
