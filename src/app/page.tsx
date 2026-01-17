"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UploadZone } from "@/components/upload-zone";
import { CorrectionEditor } from "@/components/correction-editor";
import { ImageCropper } from "@/components/image-cropper";
import { ParsedQuestion } from "@/lib/ai";
import { UserWelcome } from "@/components/user-welcome";
import { apiClient } from "@/lib/api-client";
import { AnalyzeResponse, Notebook } from "@/types/api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMode } from "@/contexts/ModeContext";
import { processImageFile } from "@/lib/image-utils";
import { Upload, BookOpen, Tags, LogOut, BarChart3, Settings2, Sparkles, BrainCircuit } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import { BroadcastNotification } from "@/components/broadcast-notification";
import { signOut } from "next-auth/react";

import { ProgressFeedback, ProgressStatus } from "@/components/ui/progress-feedback";
import { frontendLogger } from "@/lib/frontend-logger";
import { cn } from "@/lib/utils";
import { ModeSwitcher } from "@/components/mode-switcher";

function HomeContent() {
    const [step, setStep] = useState<"upload" | "review">("upload");
    const [analysisStep, setAnalysisStep] = useState<ProgressStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [parsedData, setParsedData] = useState<ParsedQuestion | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    // Batch Mode State
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [paperName, setPaperName] = useState("");

    const { t, language } = useLanguage();
    const { mode, toggleMode } = useMode();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialNotebookId = searchParams.get("notebook");
    const [notebooks, setNotebooks] = useState<{ id: string; name: string }[]>([]);
    const [autoSelectedNotebookId, setAutoSelectedNotebookId] = useState<string | null>(null);

    // Cropper state
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    // Cleanup Blob URL to prevent memory leak
    useEffect(() => {
        return () => {
            if (croppingImage) {
                URL.revokeObjectURL(croppingImage);
            }
        };
    }, [croppingImage]);

    useEffect(() => {
        // Fetch notebooks for auto-selection
        apiClient.get<Notebook[]>("/api/notebooks")
            .then(data => setNotebooks(data))
            .catch(err => console.error("Failed to fetch notebooks:", err));
    }, []);

    // Simulate progress for smoother UX with timeout protection
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let timeout: NodeJS.Timeout;
        if (analysisStep !== 'idle') {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev; // Cap at 90% until complete
                    return prev + Math.random() * 10;
                });
            }, 500);

            // Safety timeout: auto-reset after 120s to prevent stuck overlay
            timeout = setTimeout(() => {
                console.warn('[Progress] Safety timeout triggered - resetting analysisStep');
                setAnalysisStep('idle');
            }, 130000); // 130 seconds (longer than API timeout of 120s)
        }
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [analysisStep]);

    const onImageSelect = (file: File) => {
        const imageUrl = URL.createObjectURL(file);
        setCroppingImage(imageUrl);
        setIsCropperOpen(true);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropperOpen(false);
        // Convert Blob to File
        const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
        handleAnalyze(file);
    };

    const handleAnalyze = async (file: File) => {
        const startTime = Date.now();
        frontendLogger.info('[HomeAnalyze]', 'Starting analysis flow', { isBatchMode });

        if (isBatchMode && !paperName.trim()) {
            alert(t.upload?.paperNamePlaceholder ? "Please enter exam paper name" : "请输入试卷名称");
            return;
        }

        try {
            frontendLogger.info('[HomeAnalyze]', 'Step 1: Compressing image');
            setAnalysisStep('compressing');
            const base64Image = await processImageFile(file);
            setCurrentImage(base64Image); // Keep for potential review if we add it later

            // BATCH MODE FLOW
            if (isBatchMode) {
                frontendLogger.info('[HomeAnalyze]', 'Batch Mode: Calling /api/analyze/batch');
                setAnalysisStep('analyzing');

                const response = await apiClient.post<{ success: boolean; count: number; message: string }>("/api/analyze/batch", {
                    imageBase64: base64Image,
                    mimeType: file.type,
                    language: language,
                    source: paperName,
                }, { timeout: 180000 }); // Longer timeout for batch

                frontendLogger.info('[HomeAnalyze]', 'Batch analysis complete', response);

                setAnalysisStep('processing');
                setProgress(100);

                alert(response.message || `Successfully added ${response.count} questions!`);

                // Reset flow
                setStep("upload");
                setCurrentImage(null);
                setPaperName("");
                // Optional: Redirect to notebook to see results? 
                // router.push('/notebooks');

                return;
            }

            // SINGLE MODE FLOW (Existing Logic)
            frontendLogger.info('[HomeAnalyze]', 'Step 2: Calling /api/analyze');
            setAnalysisStep('analyzing');
            const apiStartTime = Date.now();
            const data = await apiClient.post<AnalyzeResponse>("/api/analyze", {
                imageBase64: base64Image,
                language: language,
                subjectId: initialNotebookId || autoSelectedNotebookId || undefined,
                mode: mode,
            }, { timeout: 120000 });
            const apiDuration = Date.now() - apiStartTime;
            frontendLogger.info('[HomeAnalyze]', 'API response received', { apiDuration });

            // Validate response data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid API response');
            }

            setAnalysisStep('processing');
            setProgress(100);

            // Auto-select notebook logic
            if (data.subject) {
                const matchedNotebook = notebooks.find(n =>
                    n.name.includes(data.subject!) || data.subject!.includes(n.name)
                );
                if (matchedNotebook) {
                    setAutoSelectedNotebookId(matchedNotebook.id);
                }
            }

            setParsedData(data);
            setStep("review");

            frontendLogger.info('[HomeAnalyze]', 'Single analysis flow completed');

        } catch (error: any) {
            const errorDuration = Date.now() - startTime;
            frontendLogger.error('[HomeError]', 'Analysis failed', {
                errorDuration,
                error: error.message || String(error)
            });

            // Error handling logic (copied from existing)
            let errorMessage = t.common?.messages?.analysisFailed || 'Analysis failed';
            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            alert(errorMessage);
        } finally {
            setAnalysisStep('idle');
        }
    };

    const handleSave = async (finalData: ParsedQuestion & { subjectId?: string }): Promise<void> => {
        frontendLogger.info('[HomeSave]', 'Starting save process', {
            hasQuestionText: !!finalData.questionText,
            hasAnswerText: !!finalData.answerText,
            subjectId: finalData.subjectId,
            knowledgePointsCount: finalData.knowledgePoints?.length || 0,
            hasImage: !!currentImage,
            imageSize: currentImage?.length || 0,
        });

        try {
            const result = await apiClient.post<{ id: string; duplicate?: boolean }>("/api/error-items", {
                ...finalData,
                originalImageUrl: currentImage || "",
                mode, // Save current mode context
            });

            // 检查是否是重复提交（后端去重返回）
            if (result.duplicate) {
                frontendLogger.info('[HomeSave]', 'Duplicate submission detected, using existing record');
            }

            frontendLogger.info('[HomeSave]', 'Save successful');
            setStep("upload");
            setParsedData(null);
            setCurrentImage(null);
            alert(t.common?.messages?.saveSuccess || 'Saved successfully!');

            // Redirect to notebook page if subjectId is present
            if (finalData.subjectId) {
                router.push(`/notebooks/${finalData.subjectId}`);
            }
        } catch (error: any) {
            frontendLogger.error('[HomeSave]', 'Save failed', {
                errorStatus: error?.status,
                errorMessage: error?.data?.message || error?.message || String(error),
                errorData: error?.data,
            });
            alert(t.common?.messages?.saveFailed || 'Failed to save');
        }
    };

    const getProgressMessage = () => {
        switch (analysisStep) {
            case 'compressing': return t.common.progress?.compressing || "Compressing...";
            case 'uploading': return t.common.progress?.uploading || "Uploading...";
            case 'analyzing': return t.common.progress?.analyzing || "Analyzing...";
            case 'processing': return t.common.progress?.processing || "Processing...";
            default: return "";
        }
    };

    return (
        <main className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,oklch(0.7_0.2_260/0.1),transparent_50%)]" />

            <div className="absolute top-[-10% ] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse duration-[10000ms]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-pulse duration-[8000ms]" />
            <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[80px] -z-10 animate-pulse duration-[12000ms]" />

            <ProgressFeedback
                status={analysisStep}
                progress={progress}
                message={getProgressMessage()}
            />

            <div className="container mx-auto p-6 space-y-12 pb-20 max-w-6xl relative z-10">
                {/* Header Section */}
                <header className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-1000">
                    <UserWelcome />

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-card/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 dark:border-white/10 shadow-xl">
                            <BroadcastNotification />
                        </div>

                        <div className="flex items-center gap-2 bg-card/40 backdrop-blur-xl p-1.5 rounded-full border border-white/20 dark:border-white/10 shadow-xl">
                            <ModeSwitcher />
                            <SettingsDialog />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                title={t.app?.logout || 'Logout'}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Hero / Action Center */}
                {!initialNotebookId && step !== "review" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
                        {/* Primary Upload Card */}
                        <div
                            className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 glass-card rounded-3xl p-10 flex flex-col justify-between group cursor-pointer border-primary/20 hover:border-primary/40 relative overflow-hidden shadow-2xl shadow-primary/5"
                            onClick={() => setStep("upload")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-700" />

                            <div className="space-y-6 relative z-10">
                                <div className="p-4 bg-primary/20 w-fit rounded-2xl text-primary shadow-inner transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <Sparkles className="h-10 w-10" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{t.app.uploadNew}</h2>
                                    <p className="text-lg text-muted-foreground leading-relaxed">
                                        {t.app.uploadDescription}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between relative z-10">
                                <span className="text-base font-semibold text-primary group-hover:translate-x-2 transition-transform duration-500">{t.app.startAnalysis}</span>
                            </div>
                        </div>

                        {/* View Notebooks Card */}
                        <Link href="/notebooks" className="col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500 border-blue-500/10 hover:border-blue-500/30 shadow-2xl shadow-blue-500/5">
                            <div className="space-y-4">
                                <div className="p-3.5 bg-blue-500/20 w-fit rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500">
                                    <BookOpen className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold">{t.app.viewNotebook}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t.app.notebookDescription}
                                </p>
                            </div>
                        </Link>

                        {/* Stats Card */}
                        <Link href="/stats" className="col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500 border-green-500/10 hover:border-green-500/30 shadow-2xl shadow-green-500/5">
                            <div className="space-y-4">
                                <div className="p-3.5 bg-green-500/20 w-fit rounded-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-500">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold">{t.app?.stats || 'Stats'}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t.app.statsDescription}
                                </p>
                            </div>
                        </Link>

                        {/* Tags Card (Bottom Row) */}
                        <Link href="/tags" className="col-span-1 glass-card rounded-3xl p-8 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500 border-purple-500/10 hover:border-purple-500/30 shadow-2xl shadow-purple-500/5">
                            <div className="space-y-4">
                                <div className="p-3.5 bg-purple-500/20 w-fit rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-500">
                                    <Tags className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold">{t.app?.tags || 'Tags'}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t.app.tagsDescription}
                                </p>
                            </div>
                        </Link>

                        {/* Recent Activity / Quick Prompt Card */}
                        <div className="col-span-1 md:col-span-3 glass-card rounded-3xl p-8 flex items-center justify-center border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-500">
                            <div className="text-center space-y-3">
                                <div className="bg-primary/10 w-fit p-3 rounded-full mx-auto animate-bounce">
                                    <BrainCircuit className="h-8 w-8 text-primary/60" />
                                </div>
                                <p className="text-base font-medium text-foreground/60 tracking-wide">{t.app.comingSoon}</p>
                            </div>
                        </div>

                    </div>
                )}

                {/* Main Content Area (Upload / Review) */}
                <div className="animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-300">
                    {step === "upload" && (
                        <div className={cn(
                            "transition-all duration-700 ease-out",
                            !initialNotebookId && "bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[3rem] p-12 shadow-2xl shadow-primary/5"
                        )}>
                            {initialNotebookId && (
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">{t.app.addingToNotebook}</h2>
                                    <Button variant="ghost" onClick={() => router.push('/notebooks')} className="text-muted-foreground hover:text-foreground">
                                        {t.app.backToNotebooks}
                                    </Button>
                                </div>
                            )}
                            <UploadZone
                                onImageSelect={onImageSelect}
                                isAnalyzing={analysisStep !== 'idle'}
                                batchMode={isBatchMode}
                                onBatchModeChange={setIsBatchMode}
                                paperName={paperName}
                                onPaperNameChange={setPaperName}
                            />
                        </div>
                    )}

                    {croppingImage && (
                        <ImageCropper
                            imageSrc={croppingImage}
                            open={isCropperOpen}
                            onClose={() => setIsCropperOpen(false)}
                            onCropComplete={handleCropComplete}
                        />
                    )}

                    {step === "review" && parsedData && (
                        <CorrectionEditor
                            initialData={parsedData}
                            onSave={handleSave}
                            onCancel={() => setStep("upload")}
                            imagePreview={currentImage}
                            initialSubjectId={initialNotebookId || autoSelectedNotebookId || undefined}
                        />
                    )}
                </div>

            </div>
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <HomeContent />
        </Suspense>
    );
}
