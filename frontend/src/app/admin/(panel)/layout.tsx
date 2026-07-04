import Link from "next/link";
import Image from "next/image";
import { adminSignOut } from "../actions";

export const metadata = {
    title: "UGARIT — Admin",
};

const NAV = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="grid grid-cols-[240px_1fr]">
                {/* Sidebar */}
                <aside className="sticky top-0 flex h-screen flex-col border-r border-neutral-200 bg-white">
                    <div className="flex items-center gap-2 px-6 py-5">
                        <Image
                            src="/LogoNoBg.png"
                            alt="UGARIT"
                            width={32}
                            height={32}
                        />
                        <span className="text-lg font-bold tracking-widest">
                            ADMIN
                        </span>
                    </div>

                    <nav className="flex-1 px-3 py-2">
                        {NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="border-t border-neutral-200 p-3">
                        <Link
                            href="/"
                            className="block rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
                        >
                            ← View store
                        </Link>
                        <form action={adminSignOut}>
                            <button
                                type="submit"
                                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                                Sign out
                            </button>
                        </form>
                    </div>
                </aside>

                {/* Main */}
                <main className="min-h-screen p-8">{children}</main>
            </div>
        </div>
    );
}
