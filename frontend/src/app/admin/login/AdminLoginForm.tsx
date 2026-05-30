"use client";

import { useActionState } from "react";
import { adminSignIn } from "../actions";

export default function AdminLoginForm() {
    const [state, formAction, pending] = useActionState(adminSignIn, {
        error: null as string | null,
    });

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {state.error}
                </p>
            )}

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Password
                </label>
                <input
                    type="password"
                    name="password"
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
            </div>

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
            >
                {pending ? "Signing in…" : "Sign in"}
            </button>
        </form>
    );
}
