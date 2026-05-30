import Image from "next/image";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "UGARIT — Admin Login" };

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex flex-col items-center gap-2">
                    <Image
                        src="/LogoNoBg.png"
                        alt="UGARIT"
                        width={48}
                        height={48}
                    />
                    <h1 className="text-xl font-bold tracking-widest">
                        ADMIN
                    </h1>
                </div>

                {error === "not-admin" && (
                    <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                        That account doesn&rsquo;t have admin access.
                    </p>
                )}

                <AdminLoginForm />
            </div>
        </div>
    );
}
