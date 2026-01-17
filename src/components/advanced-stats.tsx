"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertCircle, CalendarClock, History, BrainCircuit } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PERIOD_COLORS = ['#d97706', '#be185d', '#059669', '#2563eb'];

interface MetaCognitiveStat {
    type: string;
    count: number;
}

interface ReviewItem {
    id: string;
    preview: string;
    subject: string;
    masteryLevel: number;
    nextReviewDate: string;
    isDue: boolean;
    daysOverdue: number;
}

interface HistoryPeriod {
    name: string;
    count: number;
    [key: string]: any;
}

interface AdvancedStatsData {
    metaCognitive: MetaCognitiveStat[];
    reviewQueue: ReviewItem[];
    historyPeriods: HistoryPeriod[];
}

export function AdvancedStats() {
    const [data, setData] = useState<AdvancedStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await apiClient.get<AdvancedStatsData>("/api/stats/advanced");
                setData(result);
            } catch (error) {
                console.error("Failed to fetch advanced stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">{t.common.loading}</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Row: Review Warning */}
            <div className="grid gap-6 md:grid-cols-12">
                <Card className="md:col-span-8 lg:col-span-8 border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BrainCircuit size={120} />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <BrainCircuit className="h-5 w-5" />
                            {t.advancedStats?.metaTitle || "Metacognitive Radar"}
                        </CardTitle>
                        <CardDescription>
                            {t.advancedStats?.metaDesc || "Identify your most frequent thinking traps."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            {data.metaCognitive.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.metaCognitive} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 12 }}>
                                            {data.metaCognitive.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    {t.advancedStats?.noData || "No analysis data yet."}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-4 lg:col-span-4 border-l-4 border-l-amber-500 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <CalendarClock className="h-5 w-5" />
                            {t.advancedStats?.reviewTitle || "Review Queue"}
                        </CardTitle>
                        <CardDescription>
                            {t.advancedStats?.reviewDesc || "Ebbinghaus forgetting curve alerts."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto max-h-[300px] pr-2">
                        {data.reviewQueue.length > 0 ? (
                            <div className="space-y-3">
                                {data.reviewQueue.map((item) => (
                                    <Link href={`/error-items/${item.id}`} key={item.id} className="block group">
                                        <div className="p-3 bg-secondary/30 rounded-lg group-hover:bg-secondary/60 transition-colors border border-transparent group-hover:border-border/50">
                                            <div className="flex justify-between items-start mb-1">
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-200 bg-amber-50 text-amber-700">
                                                    {item.subject}
                                                </Badge>
                                                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    {t.advancedStats?.daysOverdue?.replace('{days}', String(item.daysOverdue)) || `${item.daysOverdue} days overdue`}
                                                </span>
                                            </div>
                                            <p className="text-sm line-clamp-2 text-foreground/90 font-medium leading-snug">
                                                {item.preview}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                                <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8 mt-2">
                                    {t.advancedStats?.viewAll || "View All Due Items"}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full items-center justify-center text-muted-foreground text-sm gap-2">
                                <CheckCircleIcon className="h-8 w-8 text-green-500/50" />
                                <p>{t.advancedStats?.caughtUp || "All caught up!"}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Heritage Stats */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-l-4 border-l-red-700 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 p-4 opacity-5 pointer-events-none">
                        <History size={150} />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-400">
                            <History className="h-5 w-5" />
                            {t.advancedStats?.historyTitle || "History Archive Analysis"}
                        </CardTitle>
                        <CardDescription>
                            {t.advancedStats?.historyDesc || "Distribution of historical periods."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full flex items-center justify-center">
                            {data.historyPeriods.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.historyPeriods}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                        >
                                            {data.historyPeriods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PERIOD_COLORS[index % PERIOD_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    {t.advancedStats?.noData || "No heritage data yet."}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-primary/5 to-transparent border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-[320px] text-center p-8 space-y-4">
                        <div className="p-4 bg-background rounded-full shadow-sm">
                            <BrainCircuit className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{t.advancedStats?.coachInsights || "AI Coach Insights"}</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto" dangerouslySetInnerHTML={{ __html: (t.advancedStats?.coachInsightsMessage || "Based on your \"Vague Concept\" errors, the AI recommends reviewing {topic}.").replace('{topic}', '<span class="font-semibold text-foreground">Quadratic Functions</span>') }} />
                        </div>
                        <Button variant="secondary" size="sm">
                            {t.advancedStats?.generatePractice || "Generate Practice Set"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
