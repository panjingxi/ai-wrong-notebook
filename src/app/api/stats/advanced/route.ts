import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Fixed: Named import
import { Prisma } from "@prisma/client";
import { startOfDay, subDays, addDays, isBefore } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    try {
        // 1. Metacognitive Stats: Frequent Error Types (Last 30 days)
        const thirtyDaysAgo = subDays(now, 30);
        const errorTypesRaw = await prisma.errorItem.groupBy({
            by: ['errorReason'],
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo },
                errorReason: { not: null },
            },
            _count: {
                errorReason: true,
            },
            orderBy: {
                _count: {
                    errorReason: 'desc',
                },
            },
            take: 5,
        });

        const errorTypes = errorTypesRaw.map((item: any) => ({
            type: item.errorReason,
            count: item._count.errorReason,
        }));

        // 2. Review Warning: Ebbinghaus Forgetting Curve
        // Logic: 
        // New (Level 0) -> Review 1 day after creation
        // Reviewing (Level 1) -> Review 3 days after last update
        // Mastered (Level 2) -> Review 15 days after last update (Maintenance)
        const activeItems = await prisma.errorItem.findMany({
            where: {
                userId,
                // We consider items that might need review regardless of mastery, but focus on 0 and 1
                masteryLevel: { lt: 3 }, // Assuming 0,1,2 used.
            },
            select: {
                id: true,
                questionText: true,
                masteryLevel: true,
                createdAt: true,
                updatedAt: true,
                subjectId: true,
                subject: { select: { name: true } }
            },
        });

        const reviewQueue = activeItems.map((item: any) => {
            let nextReviewDate: Date;

            if (item.masteryLevel === 0) {
                // Level 0: 1 day after creation
                nextReviewDate = addDays(new Date(item.createdAt), 1);
            } else if (item.masteryLevel === 1) {
                // Level 1: 3 days after last update
                nextReviewDate = addDays(new Date(item.updatedAt), 3);
            } else {
                // Level 2: 7 days after last update (simplified Ebbinghaus tail)
                nextReviewDate = addDays(new Date(item.updatedAt), 7);
            }

            return {
                id: item.id,
                preview: item.questionText?.substring(0, 50) || "Image Question",
                subject: item.subject?.name || "Unknown",
                masteryLevel: item.masteryLevel,
                nextReviewDate: nextReviewDate.toISOString(),
                isDue: isBefore(nextReviewDate, now),
                daysOverdue: Math.floor((now.getTime() - nextReviewDate.getTime()) / (1000 * 3600 * 24))
            };
        }).filter((item: any) => item.isDue)
            .sort((a: any, b: any) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
            .slice(0, 5); // Start with top 5 due

        // 3. Interdisciplinary: History Period Stats (Heritage Mode)
        const heritageItems = await prisma.errorItem.findMany({
            where: {
                userId,
                mode: 'HERITAGE',
            },
            select: {
                knowledgePoints: true,
                tags: { select: { name: true } }
            }
        });

        // Helper to classify periods
        const periods = {
            'Ancient History': 0, // 古代史 (Pre-1840)
            'Modern History': 0, // 近代史 (1840-1949)
            'Contemporary': 0,   // 现代史/国史 (1949-Present)
            'World History': 0,  // 世界史
        };

        const periodKeywords: Record<string, string[]> = {
            'Ancient History': ['古代', '朝代', '秦', '汉', '唐', '宋', '元', '明', '清', '科举', '儒家'],
            'Modern History': ['近代', '鸦片战争', '辛亥革命', '抗日', '民国', '五四', '长征', '中共', '建党'],
            'Contemporary': ['现代', '建国', '改革开放', '新时代', '十八大', '十九大', '二十大', '强国', '脱贫'],
            'World History': ['世界', '文明', '工业革命', '战争', '全球化', '美国', '欧洲', '苏联'],
        };

        heritageItems.forEach((item: any) => {
            // Merge all text sources
            const text = (item.knowledgePoints || '') + ' ' + (Array.isArray(item.tags) ? item.tags.map((t: any) => t.name).join(' ') : '');

            let matched = false;
            for (const [period, keywords] of Object.entries(periodKeywords)) {
                if (keywords.some(k => text.includes(k))) {
                    periods[period as keyof typeof periods]++;
                    matched = true;
                }
            }
        });

        return NextResponse.json({
            metaCognitive: errorTypes,
            reviewQueue,
            historyPeriods: Object.entries(periods).map(([name, count]) => ({ name, count })).filter(p => p.count > 0),
        });

    } catch (error) {
        console.error("[StatsAPI] Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
