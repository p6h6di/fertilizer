import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

interface FertilizerInput {
  cropType: string;
  soilType: string;
  soilPh: number;
  currentN: number;
  currentP: number;
  currentK: number;
  area: number;
  growthStage: string;
}

interface FertilizerRec {
  fertilizer: string;
  product: string;
  quantity: number;
  unit: string;
  totalQty: number;
  timing: string;
  method: string;
  reason: string;
  confidence: number;
}

interface Summary {
  crop: string;
  area: number;
  nDeficit: number;
  pDeficit: number;
  kDeficit: number;
}

// ── Gemini AI recommendation ──────────────────────────────────────────────────
async function getGeminiRecommendations(
  input: FertilizerInput
): Promise<{ recommendations: FertilizerRec[]; summary: Summary } | null> {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!geminiKey) return null;

  const prompt = `You are an expert agronomist specializing in fertilizer management for Indian farmers.

Analyze the following farm data and provide precise fertilizer recommendations:

Crop: ${input.cropType}
Soil Type: ${input.soilType}
Soil pH: ${input.soilPh}
Current Soil Nitrogen (N): ${input.currentN} kg/ha
Current Soil Phosphorus (P): ${input.currentP} kg/ha
Current Soil Potassium (K): ${input.currentK} kg/ha
Farm Area: ${input.area} hectares
Growth Stage: ${input.growthStage}

Provide 2–4 specific fertilizer products suitable for these exact conditions. Consider:
- The actual NPK deficit based on crop requirements vs current soil levels
- The growth stage for split-dose timing
- Soil pH impact on nutrient availability
- Indian market fertilizer products (Urea, DAP, MOP, SSP, NPK blends, micronutrients if needed)

Respond ONLY with a valid JSON object — no extra text, no markdown:
{
  "recommendations": [
    {
      "fertilizer": "Short product name e.g. Urea",
      "product": "Full product name with grade e.g. Urea (46-0-0)",
      "quantity": <integer kg per hectare>,
      "unit": "kg/ha",
      "totalQty": <quantity multiplied by ${input.area}>,
      "timing": "Specific timing based on growth stage",
      "method": "Specific application method",
      "reason": "Why this fertilizer is recommended for these exact soil conditions and crop",
      "confidence": <float 0.0 to 1.0>
    }
  ],
  "summary": {
    "crop": "${input.cropType}",
    "area": ${input.area},
    "nDeficit": <estimated N deficit in kg/ha as integer>,
    "pDeficit": <estimated P deficit in kg/ha as integer>,
    "kDeficit": <estimated K deficit in kg/ha as integer>
  }
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) return null;
    return parsed as { recommendations: FertilizerRec[]; summary: Summary };
  } catch (err) {
    console.error("Gemini API error:", err);
    return null;
  }
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
const CROP_NPK: Record<string, { n: number; p: number; k: number }> = {
  rice: { n: 120, p: 60, k: 60 },
  wheat: { n: 120, p: 60, k: 40 },
  maize: { n: 150, p: 75, k: 60 },
  cotton: { n: 120, p: 60, k: 60 },
  sugarcane: { n: 250, p: 112, k: 112 },
  potato: { n: 180, p: 100, k: 150 },
  tomato: { n: 120, p: 80, k: 80 },
  soybean: { n: 30, p: 60, k: 40 },
  groundnut: { n: 25, p: 50, k: 75 },
  chickpea: { n: 25, p: 50, k: 50 },
};

function calculateFallback(input: FertilizerInput): {
  recommendations: FertilizerRec[];
  summary: Summary;
} {
  const req = CROP_NPK[input.cropType] ?? { n: 100, p: 50, k: 50 };
  const nDeficit = Math.max(0, req.n - input.currentN);
  const pDeficit = Math.max(0, req.p - input.currentP);
  const kDeficit = Math.max(0, req.k - input.currentK);
  const recommendations: FertilizerRec[] = [];

  if (nDeficit > 0) {
    const qty = Math.round(nDeficit / 0.46);
    recommendations.push({
      fertilizer: "Urea",
      product: "Urea (46-0-0)",
      quantity: qty,
      unit: "kg/ha",
      totalQty: Math.round(qty * input.area),
      timing:
        input.growthStage === "pre-sowing"
          ? "Split: 50% at sowing + 25% at 30 days + 25% at 60 days"
          : "Apply as top dressing at current stage",
      method: "Broadcast and incorporate into soil, or apply via fertigation",
      reason: `N deficit of ${nDeficit} kg/ha. Urea provides 46% Nitrogen.`,
      confidence: 0.88,
    });
  }
  if (pDeficit > 0) {
    const qty = Math.round(pDeficit / 0.46);
    recommendations.push({
      fertilizer: "DAP",
      product: "Di-Ammonium Phosphate (18-46-0)",
      quantity: qty,
      unit: "kg/ha",
      totalQty: Math.round(qty * input.area),
      timing: "Apply as basal dose at sowing",
      method: "Place in furrow or broadcast before plowing",
      reason: `P deficit of ${pDeficit} kg/ha. DAP provides 46% P₂O₅ + 18% N.`,
      confidence: 0.85,
    });
  }
  if (kDeficit > 0) {
    const qty = Math.round(kDeficit / 0.6);
    recommendations.push({
      fertilizer: "MOP",
      product: "Muriate of Potash (0-0-60)",
      quantity: qty,
      unit: "kg/ha",
      totalQty: Math.round(qty * input.area),
      timing: "Apply as basal dose or split with second irrigation",
      method: "Broadcast and mix into soil",
      reason: `K deficit of ${kDeficit} kg/ha. MOP provides 60% K₂O.`,
      confidence: 0.83,
    });
  }
  if (input.soilPh < 6.0) {
    const qty = Math.round((6.5 - input.soilPh) * 500);
    recommendations.push({
      fertilizer: "Lime",
      product: "Agricultural Lime (CaCO₃)",
      quantity: qty,
      unit: "kg/ha",
      totalQty: Math.round(qty * input.area),
      timing: "Apply 2–4 weeks before sowing",
      method: "Broadcast and incorporate by plowing",
      reason: `pH ${input.soilPh} is acidic. Lime corrects pH to 6.0–7.0 range.`,
      confidence: 0.82,
    });
  } else if (input.soilPh > 8.0) {
    recommendations.push({
      fertilizer: "Gypsum",
      product: "Agricultural Gypsum (CaSO₄)",
      quantity: 500,
      unit: "kg/ha",
      totalQty: Math.round(500 * input.area),
      timing: "Apply before last plowing",
      method: "Broadcast and mix into top 15 cm of soil",
      reason: `pH ${input.soilPh} is alkaline. Gypsum lowers pH and improves structure.`,
      confidence: 0.8,
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      fertilizer: "Organic Compost",
      product: "Farm Yard Manure (FYM)",
      quantity: 5000,
      unit: "kg/ha",
      totalQty: 5000 * input.area,
      timing: "Apply 2 weeks before sowing",
      method: "Broadcast and incorporate by plowing",
      reason: "NPK levels are adequate. Apply organic matter to maintain soil health.",
      confidence: 0.78,
    });
  }

  return {
    recommendations,
    summary: {
      crop: input.cropType,
      area: input.area,
      nDeficit: Math.round(nDeficit),
      pDeficit: Math.round(pDeficit),
      kDeficit: Math.round(kDeficit),
    },
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: FertilizerInput;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Try Gemini first, fall back to rule-based
  const gemini = await getGeminiRecommendations(body);
  const { recommendations, summary } = gemini ?? calculateFallback(body);

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      await prisma.fertilizerRecommendation.create({
        data: {
          userId: user.id,
          cropType: body.cropType,
          soilType: body.soilType,
          soilPh: body.soilPh,
          currentN: body.currentN,
          currentP: body.currentP,
          currentK: body.currentK,
          area: body.area,
          growthStage: body.growthStage,
          recommendations: recommendations as object[],
          confidence: recommendations[0]?.confidence ?? null,
        },
      });
    }
  } catch (dbErr) {
    console.error("DB save error:", dbErr);
  }

  return Response.json({ recommendations, summary, aiPowered: gemini !== null });
}
