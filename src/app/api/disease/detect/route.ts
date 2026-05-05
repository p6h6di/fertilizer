import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

  let result: {
    disease: string;
    disease_key: string;
    confidence: number;
    severity: string;
    crop_type: string;
    symptoms: string;
    treatment: string[];
    prevention: string[];
  };

  try {
    const backendForm = new FormData();
    backendForm.append("file", imageFile);
    backendForm.append("crop_type", cropType);

    const backendRes = await fetch(`${backendUrl}/detect`, {
      method: "POST",
      body: backendForm,
    });

    if (!backendRes.ok) throw new Error("Backend detection failed");
    result = await backendRes.json();
  } catch (err) {
    console.error("Backend unreachable:", err);
    // Fallback response
    result = {
      disease: "Unable to detect (backend offline)",
      disease_key: "unknown",
      confidence: 0,
      severity: "unknown",
      crop_type: cropType,
      symptoms: "Backend service unavailable. Please try again later.",
      treatment: ["Ensure the backend service is running"],
      prevention: ["Contact support if the issue persists"],
    };
  }

  // Save to DB
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      await prisma.diseaseDetection.create({
        data: {
          userId: user.id,
          imageUrl: imageFile.name,
          cropType,
          disease: result.disease,
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
