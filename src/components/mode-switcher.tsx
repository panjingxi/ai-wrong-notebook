"use client";

import { useMode } from "@/contexts/ModeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Zap, Target, Library, Film } from "lucide-react";

export function ModeSwitcher() {
    const { mode, toggleMode } = useMode();
    const { t } = useLanguage();

    const isAcademic = mode === "ACADEMIC";

    return (
        <button
            onClick={toggleMode}
            className={`
        relative group flex items-center p-1 h-10 w-24 rounded-full transition-all duration-500 cursor-pointer border-2
        ${isAcademic
                    ? "bg-blue-50/80 border-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:border-blue-300"
                    : "bg-amber-50/80 border-amber-200 shadow-[0_0_15px_rgba(180,83,9,0.2)] hover:border-amber-300"
                }
      `}
            aria-label={t.common?.edit || "Toggle Mode"} // Using 'edit' as proxy or better "Switch" if available. 
            // Actually let's just use hardcoded Chinese "切换模式" for simplicity if key missing or use english fallback
            title={isAcademic ? t.mode?.heritage : t.mode?.academic}
        >
            {/* Background Track Icons (Inactive State Visuals) */}
            <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                <span
                    className={`transition-opacity duration-300 ${isAcademic ? "opacity-0" : "opacity-40 text-amber-900"
                        }`}
                >
                    <Film size={14} strokeWidth={2} />
                </span>
                <span
                    className={`transition-opacity duration-300 ${isAcademic ? "opacity-40 text-blue-900" : "opacity-0"
                        }`}
                >
                    <Target size={14} strokeWidth={2} />
                </span>
            </div>

            {/* Sliding Knob */}
            <div
                className={`
          absolute top-0.5 bottom-0.5 rounded-full shadow-sm flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          h-8 w-10
          ${isAcademic ? "left-0.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "translate-x-12 left-0.5 bg-gradient-to-br from-red-600 to-amber-700 text-amber-50"}
        `}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Academic Icon */}
                    <div className={`absolute transition-all duration-300 transform ${isAcademic ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-90"}`}>
                        <Zap size={16} fill="currentColor" strokeWidth={0} className="drop-shadow-sm" />
                    </div>

                    {/* Heritage Icon */}
                    <div className={`absolute transition-all duration-300 transform ${!isAcademic ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 rotate-90"}`}>
                        <Library size={16} strokeWidth={2.5} className="drop-shadow-sm" />
                    </div>
                </div>
            </div>

            {/* Label Tooltip (Optional, hidden on mobile usually but good for context) */}
            <span className="sr-only">
                {isAcademic ? t.mode?.heritage : t.mode?.academic}
            </span>
        </button>
    );
}
