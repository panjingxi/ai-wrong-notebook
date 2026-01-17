import { NextResponse } from "next/server";
import { getAIService } from "@/lib/ai";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { badRequest, createErrorResponse, ErrorCode } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const logger = createLogger('api:analyze:batch');

export async function POST(req: Request) {
    logger.info('Batch Analyze API called');

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { imageBase64, mimeType, language, source } = body;

        if (!imageBase64) {
            return badRequest("Missing image data");
        }
        if (!source || source.trim() === '') {
            return badRequest("Missing source (Exam Paper Name)");
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return createErrorResponse("User not found", 404, ErrorCode.NOT_FOUND);
        }

        logger.info({ source, userId: user.id }, 'Starting batch analysis');

        // 1. Call AI Service
        const aiService = getAIService();
        const items = await aiService.batchAnalyzeImage(imageBase64, mimeType, language);

        logger.info({ count: items.length }, 'AI returned items');

        if (items.length === 0) {
            return NextResponse.json({ count: 0, message: "No questions identified" });
        }

        // 2. Save to DB in transaction
        // We will create default Subjects if inferred ones don't exist, or link to existing ones.
        // For simplicity, we might default to "Uncategorized" if subject is missing, 
        // but AI usually returns a subject.

        let savedCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                // Find or create subject
                let subjectId: string | null = null;
                if (item.subject) {
                    // Try to find existing subject by name for this user
                    const existingSubject = await tx.subject.findFirst({
                        where: {
                            userId: user.id,
                            name: item.subject // Exact match logic
                        }
                    });

                    if (existingSubject) {
                        subjectId = existingSubject.id;
                    } else {
                        // Create new subject
                        const newSubject = await tx.subject.create({
                            data: {
                                name: item.subject,
                                userId: user.id
                            }
                        });
                        subjectId = newSubject.id;
                    }
                }

                // Resolve Tags first
                const tagIds: string[] = [];
                if (item.knowledgePoints && item.knowledgePoints.length > 0) {
                    for (const kp of item.knowledgePoints) {
                        // Find or create tag
                        // Note: We need to handle the unique constraint carefully.
                        // Using upsert or findFirst then create.
                        const tagWhere = {
                            subject: item.subject || '其他',
                            name: kp,
                            userId: user.id,
                            parentId: null // Flat tags
                        };

                        let tag = await tx.knowledgeTag.findFirst({
                            where: tagWhere
                        });

                        if (!tag) {
                            tag = await tx.knowledgeTag.create({
                                data: {
                                    ...tagWhere,
                                    isSystem: false
                                }
                            });
                        }
                        tagIds.push(tag.id);
                    }
                }

                // Create Error Item
                await tx.errorItem.create({
                    data: {
                        userId: user.id,
                        subjectId: subjectId,
                        originalImageUrl: "BATCH_UPLOAD_PLACEHOLDER",
                        ocrText: "Batch Extracted",
                        questionText: item.questionText,
                        answerText: item.answerText,
                        analysis: item.analysis,
                        source: source,
                        errorType: item.errorReason || "综合错误",
                        tags: {
                            connect: tagIds.map(id => ({ id }))
                        }
                    }
                });
                savedCount++;
            }
        });

        logger.info({ savedCount }, 'Successfully saved batch items to DB');

        return NextResponse.json({
            success: true,
            count: savedCount,
            message: `Successfully extracted and saved ${savedCount} questions.`
        });

    } catch (error: any) {
        logger.error({ error: error.message }, 'Batch analysis failed');
        return createErrorResponse(error.message || "Batch processing failed", 500, ErrorCode.INTERNAL_ERROR);
    }
}
