"use client";

import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { useEffect, useState, type ChangeEvent } from "react";
import { useActionState } from "react";
import { SIGNUP } from "./constants";
import type { SignupFormData } from "./types";
import { Link, useRouter } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";
import { CreateUserAction } from "@/src/app/actions";

export default function Signup() {
    const INITIAL_STATE = {
        ZodError: null,
        strapiError: null,
        errorMessage: null,
        successMessage: null,
        jwt: null,
        user: null,
    };

    const router = useRouter();
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

    useEffect(() => {
        if (!formState?.successMessage) return;

        const timeout = setTimeout(() => {
            router.push("/user");
        }, 1500);

        return () => clearTimeout(timeout);
    }, [formState?.successMessage, router]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    }

    const nameErrors = formState?.ZodError?.name;
    const emailErrors = formState?.ZodError?.email;
    const passErrors = formState?.ZodError?.password;

    return (
        <MaxWidthWrapper>
            <form
                className="w-full flex flex-col h-200 justify-center items-center text-black"
                action={formAction}
            >
                <div className="bg-white shadow-xl justify-between rounded-2xl border-2 flex flex-col gap-5 p-5 py-12 md:p-10">
                    <h1 className="text-center justify-end text-6xl flex flex-col gap-4 ">
                        {t(SIGNUP.title)}{" "}
                        <p className="text-xl">{t(SIGNUP.desc)}</p>
                    </h1>

                    {formState?.successMessage && (
                        <div className="w-full rounded-xl border border-green-300 bg-green-100 p-3 text-center text-green-800">
                            {formState.successMessage} {t("signup.redirecting")}
                        </div>
                    )}

                    {formState?.errorMessage && (
                        <div className="w-full rounded-xl border border-red-300 bg-red-100 p-3 text-center text-red-800">
                            {formState.errorMessage}
                        </div>
                    )}

                    <label htmlFor="name">{t(SIGNUP.nameTitle)}</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={t(SIGNUP.namePlaceholder)}
                        value={form.name}
                        onChange={handleChange}
                        className="md:w-100 w-80 border p-2 border-gray-200"
                    />
                    {nameErrors?.[0] && (
                        <p className="text-red-500 text-sm">{nameErrors[0]}</p>
                    )}

                    <label htmlFor="email">{t(SIGNUP.emailTitle)}</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t(SIGNUP.emailPlaceholder)}
                        value={form.email}
                        onChange={handleChange}
                        className="md:w-100 w-80 border p-2 border-gray-200"
                    />
                    {emailErrors?.[0] && (
                        <p className="text-red-500 text-sm">{emailErrors[0]}</p>
                    )}

                    <label htmlFor="password">{t(SIGNUP.passwordTitle)}</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder={t(SIGNUP.passwordPlaceholder)}
                        value={form.password}
                        onChange={handleChange}
                        className="md:w-100 w-80 border p-2 border-gray-200"
                    />
                    {passErrors?.[0] && (
                        <p className="text-red-500 text-sm">{passErrors[0]}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full text-white rounded-2xl p-2 bg-gray-700"
                    >
                        {t(SIGNUP.signup)}
                    </button>

                    <Link
                        href="/signin"
                        className="w-full text-gray-500 mt-3 hover:text-gray-800 rounded-2xl text-center"
                    >
                        {t(SIGNUP.link)}
                    </Link>
                </div>
            </form>
        </MaxWidthWrapper>
    );
}
