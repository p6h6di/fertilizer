import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

interface DeficiencyResult {
  deficiency: string;
  deficiency_key: string;
  confidence: number;
  severity: string;
  crop_type: string;
  symptoms: string;
  treatment: string[];
  prevention: string[];
}

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  cropType: string
): Promise<Omit<DeficiencyResult, "crop_type"> | null> {
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!geminiKey) return null;

  const prompt = `You are an expert agronomist specializing in plant nutrition. Analyze this plant/leaf image and identify any nutrient deficiency.
Crop type hint: ${cropType === "unknown" ? "General/Unknown" : cropType}

Respond ONLY with a valid JSON object matching this exact schema (no extra text):
{
  "deficiency": "Human-readable name e.g. 'Nitrogen Deficiency' or 'Healthy Plant'",
  "deficiency_key": "snake_case key e.g. 'nitrogen_deficiency', 'phosphorus_deficiency', 'iron_deficiency', 'potassium_deficiency', 'magnesium_deficiency', 'healthy'",
  "confidence": <number 0.0-1.0>,
  "severity": "none|mild|moderate|severe",
  "symptoms": "Brief description of observed symptoms in the image",
  "treatment": ["Fertilizer/treatment step 1", "Step 2", "Step 3"],
  "prevention": ["Prevention measure 1", "Prevention measure 2"]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as Omit<DeficiencyResult, "crop_type">;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const imageFile = formData.get("image") as File | null;
  const cropType = (formData.get("cropType") as string) ?? "unknown";

  if (!imageFile) {
    return Response.json({ error: "No image file provided" }, { status: 400 });
  }

  const imageBuffer = await imageFile.arrayBuffer();
  const imageBase64 = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageFile.type || "image/jpeg";

  const geminiResult = await analyzeWithGemini(imageBase64, mimeType, cropType);

  const result: DeficiencyResult = geminiResult
    ? { ...geminiResult, crop_type: cropType }
    : {
        deficiency: "Analysis Unavailable",
        deficiency_key: "unknown",
        confidence: 0,
        severity: "unknown",
        crop_type: cropType,
        symptoms:
          "Unable to analyze image. Configure GOOGLE_GEMINI_API_KEY to enable AI-powered deficiency detection.",
        treatment: [
          "Set GOOGLE_GEMINI_API_KEY in your .env.local file",
          "Conduct a soil test for accurate NPK and micronutrient levels",
          "Consult a local agronomist for manual diagnosis",
        ],
        prevention: [
          "Run regular soil tests every season",
          "Monitor plant color and growth patterns weekly",
        ],
      };

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      await prisma.deficiencyDetection.create({
        data: {
          userId: user.id,
          imageUrl: imageFile.name,
          cropType,
          deficiency: result.deficiency,
          confidence: result.confidence,
          severity: result.severity,
          treatment: result.treatment,
          prevention: result.prevention,
        },
      });
    }
  } catch (dbErr) {
    console.error("DB save error:", dbErr);
  }

  return Response.json(result);
}
