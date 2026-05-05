import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    soilType: string;
    soilPh?: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    rainfall?: number;
    temperature?: number;
    humidity?: number;
    season?: string;
    latitude?: number;
    longitude?: number;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

  let recommendations: unknown[] = [];
  let inputSummary: unknown = {};

  try {
    const backendRes = await fetch(`${backendUrl}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soil_type: body.soilType,
        soil_ph: body.soilPh ?? 7.0,
        nitrogen: body.nitrogen ?? 50,
        phosphorus: body.phosphorus ?? 50,
        potassium: body.potassium ?? 50,
        rainfall: body.rainfall ?? 100,
        temperature: body.temperature ?? 25,
        humidity: body.humidity ?? 60,
        season: body.season ?? "Kharif",
        latitude: body.latitude,
        longitude: body.longitude,
      }),
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      recommendations = data.recommendations ?? [];
      inputSummary = data.input_summary ?? {};
    }
  } catch (err) {
    console.error("Backend unreachable:", err);
    // Fallback: simple rule-based response
    recommendations = [
      { crop: "millet", confidence: 0.7, reasons: ["Hardy crop for various conditions"], season: ["Kharif"] },
      { crop: "sorghum", confidence: 0.6, reasons: ["Drought-tolerant crop"], season: ["Kharif"] },
    ];
    inputSummary = { soil_type: body.soilType, temperature: body.temperature, rainfall: body.rainfall, season: body.season };
  }

  // Save to DB
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      await prisma.cropRecommendation.create({
        data: {
          userId: user.id,
          soilType: body.soilType,
          soilPh: body.soilPh,
          nitrogen: body.nitrogen,
          phosphorus: body.phosphorus,
          potassium: body.potassium,
          rainfall: body.rainfall,
          temperature: body.temperature,
          humidity: body.humidity,
          season: body.season,
          latitude: body.latitude,
          longitude: body.longitude,
          recommendedCrops: recommendations as object[],
          confidence: Array.isArray(recommendations) && recommendations.length > 0
            ? (recommendations[0] as { confidence: number }).confidence
            : null,
        },
      });
    }
  } catch (dbErr) {
    console.error("DB save error:", dbErr);
    // Don't fail the request if DB fails
  }

  return Response.json({ recommendations, input_summary: inputSummary });
}
