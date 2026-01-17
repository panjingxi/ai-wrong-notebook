"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, ExternalLink, RefreshCw, MonitorPlay, User as UserIcon, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Video {
    id: string;
    title: string;
    cover: string;
    author: string;
    duration: string;
    url: string;
    description: string;
    playCount: number;
}

interface VideoRecommendationsProps {
    tags: string[];
    subjectName?: string;
    className?: string;
}

export function VideoRecommendations({ tags, subjectName, className }: VideoRecommendationsProps) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    // Combine tags and subject for better search
    const searchKeywords = [...tags];
    if (subjectName && !searchKeywords.includes(subjectName)) {
        searchKeywords.unshift(subjectName);
    }

    const fetchVideos = async () => {
        if (searchKeywords.length === 0) return;

        setLoading(true);
        try {
            const data = await apiClient.post<{ items: Video[] }>("/api/videos/search", {
                keywords: searchKeywords
            });
            setVideos(data.items);
        } catch (error) {
            console.error("Failed to fetch videos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [tags.join(",")]); // Re-fetch only when tags content changes

    if (searchKeywords.length === 0) return null;

    if (!loading && videos.length === 0) {
        // Only show if we tried and failed, or show nothing? 
        // Showing nothing allows the UI to stay clean if no relevant content found
        return null;
    }

    return (
        <Card className={`border-pink-200 dark:border-pink-900 ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                        <MonitorPlay className="h-5 w-5" />
                        {(t.detail as any)?.relatedVideos || "Related Videos"}
                        <Badge variant="outline" className="ml-2 bg-pink-50 text-pink-600 border-pink-200">Bilibili</Badge>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchVideos}
                        disabled={loading}
                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading && videos.length === 0 ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="min-w-[240px] h-[160px] bg-muted/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {videos.map((video) => (
                            <a
                                key={video.id}
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group min-w-[240px] w-[240px] space-y-2 block"
                            >
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50">
                                    {/* Using referrerPolicy="no-referrer" is CRITICAL for Bilibili images to load */}
                                    <img
                                        src={video.cover}
                                        alt={video.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <PlayCircle className="text-white opacity-0 group-hover:opacity-100 w-10 h-10 transition-opacity" />
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
                                        {video.duration}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-pink-600 transition-colors" title={video.title}>
                                        {video.title}
                                    </h4>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" /> {video.author}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ExternalLink className="h-3 w-3" />
                                            {(video.playCount / 10000).toFixed(1)}万
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
