"use client";

import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { useActionState, useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { SIGNIN } from "./constants";
import type { SigninFormData } from "./types";
import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { LoginUserAction } from "@/src/app/actions";

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

export default function SignIn({ next }: { next?: string }) {
    const t = useTranslations();

    const [form, setForm] = useState<SigninFormData>({
        email: "",
        password: "",
    });

    const [formState, formAction] = useActionState(
        LoginUserAction,
        INITIAL_STATE
    );

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { id, value } = event.target;
        setForm((currentForm) => ({ ...currentForm, [id]: value }));
    }

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
                        <h1 className="text-3xl font-bold">{t(SIGNIN.title)}</h1>
                        <p className="mt-1 text-sm text-neutral-500">
                            {t(SIGNIN.desc)}
                        </p>
                    </div>

                    {formState?.errorMessage && (
                        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
                            {formState.errorMessage}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-neutral-700"
                            >
                                {t(SIGNIN.emailTitle)}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder={t(SIGNIN.emailPlaceholder)}
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
                                {t(SIGNIN.passwordTitle)}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder={t(SIGNIN.passwordPlaceholder)}
                                value={form.password}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
                            />
                            {passErrors?.[0] && (
                                <p className="mt-1 text-sm text-red-600">
                                    {passErrors[0]}
                                </p>
                            )}
                        </div>

                        <SubmitButton label={t(SIGNIN.signin)} />
                    </div>

                    <Link
                        href="/signup"
                        className="mt-5 block text-center text-sm text-neutral-500 transition-colors hover:text-neutral-800"
                    >
                        {t(SIGNIN.link)}
                    </Link>
                </form>
            </div>
        </MaxWidthWrapper>
    );
}
