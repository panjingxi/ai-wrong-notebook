"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadCloud, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UploadZoneProps {
    onImageSelect: (file: File) => void;
    isAnalyzing: boolean;
    batchMode: boolean;
    onBatchModeChange: (isBatch: boolean) => void;
    paperName: string;
    onPaperNameChange: (name: string) => void;
}

export function UploadZone({
    onImageSelect,
    isAnalyzing,
    batchMode,
    onBatchModeChange,
    paperName,
    onPaperNameChange
}: UploadZoneProps) {
    const { t } = useLanguage();

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                // 直接传递 File 对象，让父组件处理压缩
                onImageSelect(file);
            }
        },
        [onImageSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png"],
        },
        maxFiles: 1,
        disabled: isAnalyzing,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-xl border border-border/50">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                        <label htmlFor="batch-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {t.upload?.batchMode || "Batch Mode"}
                        </label>
                        <Input
                            type="checkbox"
                            id="batch-mode"
                            className="h-4 w-4 accent-primary"
                            checked={batchMode}
                            onChange={(e) => onBatchModeChange(e.target.checked)}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                        {t.upload?.batchDesc || "Auto-extract multiple questions"}
                    </span>
                </div>

                {batchMode && (
                    <div className="w-full sm:w-1/2">
                        <Input
                            placeholder={t.upload?.paperNamePlaceholder || "Enter Exam Paper Name (e.g. 2023 Final)"}
                            value={paperName}
                            onChange={(e) => onPaperNameChange(e.target.value)}
                            className="w-full bg-background/50"
                        />
                    </div>
                )}
            </div>

            <div
                {...getRootProps()}
                className={`relative group border-2 border-dashed rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden ${isDragActive
                    ? "border-primary bg-primary/10 scale-[0.99]"
                    : "border-primary/20 hover:border-primary/40 bg-card/20 backdrop-blur-sm"
                    }`}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="flex flex-col items-center justify-center py-16 space-y-6 text-center min-h-[350px] relative z-10">
                    <input {...getInputProps()} />
                    <div className={`p-6 rounded-3xl transition-all duration-500 ${isAnalyzing ? "bg-primary/20 scale-110 rotate-12" : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
                        }`}>
                        {isAnalyzing ? (
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        ) : (
                            <UploadCloud className="h-12 w-12 text-primary group-hover:text-primary transition-colors" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-2xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            {isAnalyzing ? t.app.analyzing : (batchMode ? (t.upload?.batchTitle || "Upload Exam Paper") : t.upload.analyze)}
                        </h3>
                        <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
                            {isAnalyzing ? "Our AI is analyzing your question..." : t.app.dragDrop}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <span className="px-3 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary uppercase tracking-wider">
                                {t.upload.support || "JPG, PNG, JPEG"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </div>
        </div>
    );
}
