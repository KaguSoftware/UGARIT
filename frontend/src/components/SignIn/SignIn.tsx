"use client";
import MaxWidthWrapper from "../ui/MaxWidthWrapper";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { SIGNIN } from "./constants";
import type { SigninFormData } from "./types";

export default function SignIn() {
    const [form, setForm] = useState<SigninFormData>({
        email: "",
        password: "",
    });

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { id, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [id]: value,
        }));
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log(form);
    }

    return (
        <MaxWidthWrapper>
            <form
                className="w-full flex flex-col h-200 justify-center  items-center text-black"
                onSubmit={handleSubmit}
            >
                <div className="bg-white h-120 shadow-xl justify-between rounded-2xl border-2 flex flex-col gap-3 p-10">
                    <h1 className="text-center justify-end text-6xl flex flex-col gap-4 ">
                        {SIGNIN.title} <p className="text-xl">{SIGNIN.desc}</p>
                    </h1>

                    <label htmlFor="email" className="">
                        {SIGNIN.emailTitle}
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder={SIGNIN.emailPlaceholder}
                        value={form.email}
                        onChange={handleChange}
                        className="w-100 border p-2 border-gray-200"
                    />
                    <label htmlFor="password">{SIGNIN.passwordTitle}</label>
                    <input
                        id="password"
                        type="password"
                        placeholder={SIGNIN.passwordPlaceholder}
                        value={form.password}
                        onChange={handleChange}
                        className="w-100 border p-2 border-gray-200"
                    />
                    <button className="w-full text-white rounded-2xl p-2 bg-gray-700">
                        {SIGNIN.signin}
                    </button>
                </div>
            </form>
        </MaxWidthWrapper>
    );
}
