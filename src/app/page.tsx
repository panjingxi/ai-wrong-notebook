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
import { processImageFile } from "@/lib/image-utils";
import { Upload, BookOpen, Tags, LogOut, BarChart3, Settings2, Sparkles, BrainCircuit } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import { BroadcastNotification } from "@/components/broadcast-notification";
import { signOut } from "next-auth/react";

import { ProgressFeedback, ProgressStatus } from "@/components/ui/progress-feedback";
import { frontendLogger } from "@/lib/frontend-logger";
import { cn } from "@/lib/utils";

function HomeContent() {
    const [step, setStep] = useState<"upload" | "review">("upload");
    const [analysisStep, setAnalysisStep] = useState<ProgressStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [parsedData, setParsedData] = useState<ParsedQuestion | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const { t, language } = useLanguage();
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
        frontendLogger.info('[HomeAnalyze]', 'Starting analysis flow');

        try {
            frontendLogger.info('[HomeAnalyze]', 'Step 1/5: Compressing image');
            setAnalysisStep('compressing');
            const base64Image = await processImageFile(file);
            setCurrentImage(base64Image);
            frontendLogger.info('[HomeAnalyze]', 'Image compressed successfully', {
                size: base64Image.length
            });

            frontendLogger.info('[HomeAnalyze]', 'Step 2/5: Calling API endpoint /api/analyze');
            setAnalysisStep('analyzing');
            const apiStartTime = Date.now();
            const data = await apiClient.post<AnalyzeResponse>("/api/analyze", {
                imageBase64: base64Image,
                language: language,
                subjectId: initialNotebookId || autoSelectedNotebookId || undefined
            }, { timeout: 120000 }); // 2 分钟超时，匹配 Safety timeout
            const apiDuration = Date.now() - apiStartTime;
            frontendLogger.info('[HomeAnalyze]', 'API response received, validating data', {
                apiDuration
            });

            // Validate response data
            if (!data || typeof data !== 'object') {
                frontendLogger.error('[HomeAnalyze]', 'Validation failed - invalid response data', {
                    data
                });
                throw new Error('Invalid API response: data is null or not an object');
            }
            frontendLogger.info('[HomeAnalyze]', 'Response data validated successfully');

            frontendLogger.info('[HomeAnalyze]', 'Step 3/5: Setting processing state and progress to 100%');
            setAnalysisStep('processing');
            setProgress(100);
            frontendLogger.info('[HomeAnalyze]', 'Progress updated to 100%');

            frontendLogger.info('[HomeAnalyze]', 'Step 4/5: Setting parsed data and auto-selecting notebook');
            const dataSize = JSON.stringify(data).length;
            // Auto-select notebook based on subject
            if (data.subject) {
                const matchedNotebook = notebooks.find(n =>
                    n.name.includes(data.subject!) || data.subject!.includes(n.name)
                );
                if (matchedNotebook) {
                    setAutoSelectedNotebookId(matchedNotebook.id);
                    frontendLogger.info('[HomeAnalyze]', 'Auto-selected notebook', {
                        notebook: matchedNotebook.name,
                        subject: data.subject
                    });
                }
            }
            const setDataStart = Date.now();
            setParsedData(data);
            const setDataDuration = Date.now() - setDataStart;
            frontendLogger.info('[HomeAnalyze]', 'Parsed data set successfully', {
                dataSize,
                setDataDuration
            });

            frontendLogger.info('[HomeAnalyze]', 'Step 5/5: Switching to review page');
            const setStepStart = Date.now();
            setStep("review");
            const setStepDuration = Date.now() - setStepStart;
            frontendLogger.info('[HomeAnalyze]', 'Step switched to review', {
                setStepDuration
            });
            const totalDuration = Date.now() - startTime;
            frontendLogger.info('[HomeAnalyze]', 'Analysis completed successfully', {
                totalDuration
            });
        } catch (error: any) {
            const errorDuration = Date.now() - startTime;
            frontendLogger.error('[HomeError]', 'Analysis failed', {
                errorDuration,
                error: error.message || String(error)
            });

            // 安全的错误处理逻辑，防止在报错时二次报错
            try {
                let errorMessage = t.common?.messages?.analysisFailed || 'Analysis failed, please try again';

                // ApiError 的结构：error.data.message 包含后端返回的错误类型
                const backendErrorType = error?.data?.message;

                if (backendErrorType && typeof backendErrorType === 'string') {
                    // 检查是否是已知的 AI 错误类型
                    if (t.errors && typeof t.errors === 'object' && backendErrorType in t.errors) {
                        const mappedError = (t.errors as any)[backendErrorType];
                        if (typeof mappedError === 'string') {
                            errorMessage = mappedError;
                            frontendLogger.info('[HomeError]', `Matched error type: ${backendErrorType}`, {
                                errorMessage
                            });
                        }
                    } else {
                        // 使用后端返回的具体错误消息
                        errorMessage = backendErrorType;
                        frontendLogger.info('[HomeError]', 'Using backend error message', {
                            errorMessage
                        });
                    }
                } else if (error?.message) {
                    // Fallback：检查 error.message（用于非 API 错误）
                    if (error.message.includes('fetch') || error.message.includes('network')) {
                        errorMessage = t.errors?.AI_CONNECTION_FAILED || '网络连接失败';
                    } else if (typeof error.data === 'string') {
                        frontendLogger.info('[HomeError]', 'Raw error data', {
                            errorDataPreview: error.data.substring(0, 100)
                        });
                        errorMessage += ` (${error.status || 'Error'})`;
                    }
                }

                alert(errorMessage);
            } catch (innerError) {
                frontendLogger.error('[HomeError]', 'Failed to process error message', {
                    innerError: String(innerError)
                });
                alert('Analysis failed. Please try again.');
            }
        } finally {
            // Always reset analysis state, even if setState throws
            frontendLogger.info('[HomeAnalyze]', 'Finally: Resetting analysis state to idle');
            setAnalysisStep('idle');
            frontendLogger.info('[HomeAnalyze]', 'Analysis state reset complete');
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
        <main className="min-h-screen bg-background relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-sidebar via-background to-transparent opacity-60 -z-10" />
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10" />

            <ProgressFeedback
                status={analysisStep}
                progress={progress}
                message={getProgressMessage()}
            />

            <div className="container mx-auto p-6 space-y-12 pb-20 max-w-6xl">
                {/* Header Section */}
                <header className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <UserWelcome />

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-card/50 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm">
                            <BroadcastNotification />
                        </div>

                        <div className="flex items-center gap-1 bg-card/50 backdrop-blur-md p-1 rounded-full border shadow-sm">
                            <SettingsDialog />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        {/* Primary Upload Card */}
                        <div
                            className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 glass-card rounded-2xl p-8 flex flex-col justify-between group cursor-pointer border-primary/10 hover:border-primary/30 relative overflow-hidden"
                            onClick={() => setStep("upload")}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="space-y-4 relative z-10">
                                <div className="p-3 bg-primary/10 w-fit rounded-xl text-primary transform group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight mb-2">{t.app.uploadNew}</h2>
                                    <p className="text-muted-foreground">
                                        Use AI to analyze and organize your wrong questions instantly.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between relative z-10">
                                <span className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">Start Analysis →</span>
                            </div>
                        </div>

                        {/* View Notebooks Card */}
                        <Link href="/notebooks" className="col-span-1 glass-card rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                            <div className="space-y-3">
                                <div className="p-2.5 bg-blue-500/10 w-fit rounded-lg text-blue-600 dark:text-blue-400">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">{t.app.viewNotebook}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Access your subject notebooks and review history.
                                </p>
                            </div>
                        </Link>

                        {/* Stats Card */}
                        <Link href="/stats" className="col-span-1 glass-card rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                            <div className="space-y-3">
                                <div className="p-2.5 bg-green-500/10 w-fit rounded-lg text-green-600 dark:text-green-400">
                                    <BarChart3 className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">{t.app?.stats || 'Stats'}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Track mastery levels and learning progress.
                                </p>
                            </div>
                        </Link>

                        {/* Tags Card (Bottom Row) */}
                        <Link href="/tags" className="col-span-1 glass-card rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                            <div className="space-y-3">
                                <div className="p-2.5 bg-purple-500/10 w-fit rounded-lg text-purple-600 dark:text-purple-400">
                                    <Tags className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">{t.app?.tags || 'Tags'}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Manage knowledge points and topic structure.
                                </p>
                            </div>
                        </Link>

                        {/* Recent Activity / Quick Prompt (Future Feature) card can go here */}
                        <div className="col-span-1 md:col-span-3 glass-card rounded-2xl p-6 flex items-center justify-center border-dashed border-border/60">
                            <div className="text-center space-y-2">
                                <BrainCircuit className="h-8 w-8 mx-auto text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">More AI features coming soon...</p>
                            </div>
                        </div>

                    </div>
                )}

                {/* Main Content Area (Upload / Review) */}
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
                    {step === "upload" && (
                        <div className={cn("transition-all duration-500", !initialNotebookId && "bg-card/30 backdrop-blur-sm border rounded-3xl p-8 shadow-sm")}>
                            {initialNotebookId && (
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Adding to Notebook</h2>
                                    <Button variant="ghost" onClick={() => router.push('/notebooks')} className="text-muted-foreground hover:text-foreground">
                                        Back to Notebooks
                                    </Button>
                                </div>
                            )}
                            <UploadZone onImageSelect={onImageSelect} isAnalyzing={analysisStep !== 'idle'} />
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
