"use client";

import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { SIGNUP } from "./constants";
import type { SignupFormData } from "./types";
import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { CreateUserAction } from "@/src/app/actions";

const INITIAL_STATE = {
    ZodError: null,
    errorMessage: null,
    successMessage: null,
    success: false,
    user: null,
    redirectTo: null,
};

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
            {pending ? "…" : label}
        </button>
    );
}

export default function Signup({ next }: { next?: string }) {
    const t = useTranslations();

    const [form, setForm] = useState<SignupFormData>({
        email: "",
        password: "",
        name: "",
    });

    const [formState, formAction] = useActionState(
        CreateUserAction,
        INITIAL_STATE
    );

    // Signup succeeded but needs email confirmation → toast + inline panel.
    const awaitingConfirmation = Boolean(
        formState?.success && formState?.successMessage
    );

    useEffect(() => {
        if (awaitingConfirmation) {
            toast.success(t("signup.checkEmail"), { duration: 6000 });
        }
    }, [awaitingConfirmation, t]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setForm((currentForm) => ({ ...currentForm, [name]: value }));
    }

    const nameErrors = formState?.ZodError?.name;
    const emailErrors = formState?.ZodError?.email;
    const passErrors = formState?.ZodError?.password;

    return (
        <MaxWidthWrapper>
            <div className="flex min-h-[70vh] items-center justify-center py-12 text-black">
                <form
                    action={formAction}
                    className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg md:p-10"
                >
                    {next && <input type="hidden" name="next" value={next} />}

                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold">{t(SIGNUP.title)}</h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            {t(SIGNUP.desc)}
                        </p>
                    </div>

                    {awaitingConfirmation ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-green-300 bg-green-50 p-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                <Mail className="h-7 w-7 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-green-800">
                                {t("signup.checkEmail")}
                            </p>
                            <Link
                                href="/signin"
                                className="mt-1 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                            >
                                {t(SIGNUP.link)}
                            </Link>
                        </div>
                    ) : (
                    <>
                    {formState?.errorMessage && (
                        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
                            {formState.errorMessage}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                {t(SIGNUP.nameTitle)}
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="username"
                                placeholder={t(SIGNUP.namePlaceholder)}
                                value={form.name}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                            />
                            {nameErrors?.[0] && (
                                <p className="mt-1 text-sm text-red-600">
                                    {nameErrors[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                {t(SIGNUP.emailTitle)}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder={t(SIGNUP.emailPlaceholder)}
                                value={form.email}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                            />
                            {emailErrors?.[0] && (
                                <p className="mt-1 text-sm text-red-600">
                                    {emailErrors[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                {t(SIGNUP.passwordTitle)}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                placeholder={t(SIGNUP.passwordPlaceholder)}
                                value={form.password}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                            />
                            {passErrors?.[0] ? (
                                <p className="mt-1 text-sm text-red-600">
                                    {passErrors[0]}
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-neutral-400">
                                    At least 8 characters.
                                </p>
                            )}
                        </div>

                        <SubmitButton label={t(SIGNUP.signup)} />
                    </div>

                    <Link
                        href="/signin"
                        className="mt-5 block text-center text-sm text-neutral-500 transition-colors hover:text-neutral-800"
                    >
                        {t(SIGNUP.link)}
                    </Link>
                    </>
                    )}
                </form>
            </div>
        </MaxWidthWrapper>
    );
}
