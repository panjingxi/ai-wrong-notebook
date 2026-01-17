"use client";

import { useState, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserWelcome() {
    const { t, language } = useLanguage();
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Server always renders 'User' (no session). Client matches this initially.
    // After mount, we show the real name.
    const userName = mounted && session?.user ? (session.user.name || session.user.email) : 'User';

    return (
        <div className="flex items-center gap-3 bg-card/40 backdrop-blur-xl p-2 pr-5 rounded-full border border-white/20 dark:border-white/10 shadow-xl animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="bg-primary/20 p-2 rounded-full shadow-inner">
                <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.common.welcome || 'Welcome back'}</span>
                <span className="font-bold text-foreground">
                    {userName}
                </span>
            </div>
        </div>
    );
}
