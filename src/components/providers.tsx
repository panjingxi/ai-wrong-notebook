"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { SessionProvider } from "next-auth/react";

import { ModeProvider } from "@/contexts/ModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <LanguageProvider>
                <ModeProvider>
                    {children}
                </ModeProvider>
            </LanguageProvider>
        </SessionProvider>
    );
}
