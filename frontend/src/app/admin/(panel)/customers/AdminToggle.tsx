"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCustomerAdmin } from "../../actions";

/**
 * Grant/revoke a customer's admin access. Confirms before revoking, then
 * refreshes the list. The server action blocks self-demotion.
 */
export default function AdminToggle({
    profileId,
    isAdmin,
}: {
    profileId: string;
    isAdmin: boolean;
}) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const onClick = () => {
        if (
            isAdmin &&
            !confirm("Remove admin access from this customer?")
        )
            return;
        startTransition(async () => {
            try {
                await setCustomerAdmin(profileId, !isAdmin);
                router.refresh();
            } catch (e) {
                alert(
                    e instanceof Error
                        ? e.message
                        : "Could not update admin access."
                );
            }
        });
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className={
                isAdmin
                    ? "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    : "rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            }
        >
            {pending ? "…" : isAdmin ? "Revoke admin" : "Make admin"}
        </button>
    );
}
