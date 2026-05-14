import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const empty = {
    fertilizerRecommendations: [],
    deficiencyDetections: [],
    chatSessions: [],
  };

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return Response.json(empty);

    const [fertilizerRecommendations, deficiencyDetections, chatSessions] = await Promise.all([
      prisma.fertilizerRecommendation
        .findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            cropType: true,
            soilType: true,
            area: true,
            growthStage: true,
            recommendations: true,
            createdAt: true,
          },
        })
        .catch(() => []),

      prisma.deficiencyDetection
        .findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            cropType: true,
            deficiency: true,
            confidence: true,
            severity: true,
            createdAt: true,
          },
        })
        .catch(() => []),

      prisma.chatSession
        .findMany({
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
        })
        .catch(() => []),
    ]);

    return Response.json({ fertilizerRecommendations, deficiencyDetections, chatSessions });
  } catch (err) {
    console.error("History fetch error:", err);
    // Return empty state instead of 500 so the page still renders
    return Response.json(empty);
  }
}
