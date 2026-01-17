'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type AppMode = 'ACADEMIC' | 'HERITAGE';

interface ModeContextType {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<AppMode>('ACADEMIC');

    // Load from local storage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('app_mode') as AppMode;
        if (savedMode && (savedMode === 'ACADEMIC' || savedMode === 'HERITAGE')) {
            setMode(savedMode);
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('app_mode', mode);
        // Sync to DOM for global styling
        document.documentElement.setAttribute('data-mode', mode);

        // Update theme color meta tag based on mode
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', mode === 'ACADEMIC' ? '#3b82f6' : '#9a3412');
        }
    }, [mode]);

    const toggleMode = () => {
        setMode((prev) => (prev === 'ACADEMIC' ? 'HERITAGE' : 'ACADEMIC'));
    };

    return (
        <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
            {children}
        </ModeContext.Provider>
    );
}

export function useMode() {
    const context = useContext(ModeContext);
    if (context === undefined) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
}
