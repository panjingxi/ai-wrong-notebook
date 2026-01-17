import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:videos:search');

// Bilibili API endpoint
const BILIBILI_API_URL = "https://api.bilibili.com/x/web-interface/search/type";

export async function POST(req: Request) {
    try {
        const { keywords } = await req.json();

        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // Combine keywords into a single search query
        const query = keywords.join(" ");
        logger.info({ query }, 'Searching Bilibili videos');

        // Construct search URL
        // search_type=video, order=click (most clicked/viewed) or totalrank
        const params = new URLSearchParams({
            keyword: query,
            search_type: "video",
            order: "click", // Sort by clicks to get popular/relevant content
            page: "1",
            page_size: "6"
        });

        // Bilibili requires a User-Agent to return proper results
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com/",
            "Cookie": "buvid3=INFOC; PVID=1;" // Basic cookie often needed
        };

        const response = await fetch(`${BILIBILI_API_URL}?${params.toString()}`, { headers });

        if (!response.ok) {
            logger.error({ status: response.status }, 'Bilibili API failed');
            return NextResponse.json({ items: [] });
        }

        const data = await response.json();

        if (data.code !== 0 || !data.data || !data.data.result) {
            logger.info('No results found on Bilibili');
            return NextResponse.json({ items: [] });
        }

        // Transform results
        const videos = data.data.result.map((item: any) => ({
            id: item.bvid,
            title: item.title.replace(/<[^>]*>/g, ""), // Remove HTML tags from title
            cover: item.pic.startsWith('//') ? `https:${item.pic}` : item.pic,
            author: item.author,
            duration: item.duration,
            url: item.arcurl,
            description: item.description,
            playCount: item.play
        }));

        logger.info({ count: videos.length }, 'Found Bilibili videos');
        return NextResponse.json({ items: videos });

    } catch (error) {
        logger.error({ error }, 'Error searching Bilibili videos');
        return NextResponse.json({ items: [] }, { status: 500 });
    }
}
