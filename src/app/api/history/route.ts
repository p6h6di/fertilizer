import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return Response.json({
        cropRecommendations: [],
        diseaseDetections: [],
        chatSessions: [],
      });
    }

    const [cropRecommendations, diseaseDetections, chatSessions] = await Promise.all([
      prisma.cropRecommendation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          soilType: true,
          season: true,
          temperature: true,
          rainfall: true,
          recommendedCrops: true,
          createdAt: true,
        },
      }),
      prisma.diseaseDetection.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          cropType: true,
          disease: true,
          confidence: true,
          severity: true,
          createdAt: true,
        },
      }),
      prisma.chatSession.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          language: true,
          createdAt: true,
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return Response.json({ cropRecommendations, diseaseDetections, chatSessions });
  } catch (err) {
    console.error("History fetch error:", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
