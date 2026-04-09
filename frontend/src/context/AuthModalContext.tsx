"use client";

import { createContext, useContext, useState } from "react";
import AuthModal from "@/src/components/AuthModal/AuthModal";

interface AuthModalContextValue {
    openAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
    openAuthModal: () => {},
});

export function useAuthModal() {
    return useContext(AuthModalContext);
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <AuthModalContext.Provider value={{ openAuthModal: () => setIsOpen(true) }}>
            {children}
            {isOpen && <AuthModal onClose={() => setIsOpen(false)} />}
        </AuthModalContext.Provider>
    );
}
