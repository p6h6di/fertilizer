import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function generateFertilizerResponse(message: string): string {
  const lower = message.toLowerCase();

  const responses: { keywords: string[]; answer: string }[] = [
    {
      keywords: ["urea", "nitrogen", "npk", "fertilizer", "fertiliser", "dap", "mop", "potash", "phosphorus"],
      answer:
        "Fertilizer guidelines:\n1. Conduct a soil test before applying any fertilizer.\n2. Urea (46% N) is the main nitrogen source — split into 2–3 doses to reduce loss.\n3. DAP (18-46-0) provides both nitrogen and phosphorus — apply as basal dose at sowing.\n4. MOP (0-0-60) supplies potassium — apply with basal or second irrigation.\n5. Avoid over-fertilization as it causes groundwater pollution and crop burning.\nUse the Fertilizer Recommendation tool for precise rates based on your soil test results.",
    },
    {
      keywords: ["deficiency", "yellow", "pale", "chlorosis", "nutrient", "micronutrient", "zinc", "iron", "magnesium"],
      answer:
        "Nutrient deficiency symptoms:\n• Nitrogen deficiency: yellowing starting from older/lower leaves, stunted growth.\n• Phosphorus deficiency: purple/reddish discoloration on leaf undersides.\n• Potassium deficiency: brown leaf edges (leaf scorch), starting on older leaves.\n• Iron deficiency: yellowing between veins on young leaves (interveinal chlorosis).\n• Zinc deficiency: small, mottled leaves, shortened internodes.\nUpload a plant image in the Deficiency Detection tool for AI-powered diagnosis.",
    },
    {
      keywords: ["soil", "ph", "acid", "alkaline", "lime", "gypsum"],
      answer:
        "Soil pH and fertilizer efficiency:\n1. Most crops prefer pH 6.0–7.0 for optimal nutrient uptake.\n2. Acidic soil (pH < 6): apply agricultural lime (CaCO₃) — 2–4 weeks before sowing.\n3. Alkaline soil (pH > 8): apply gypsum (CaSO₄) or sulfur to lower pH.\n4. At wrong pH, fertilizers become locked in soil and unavailable to plants.\n5. Test soil pH annually and adjust before the season.",
    },
    {
      keywords: ["organic", "compost", "manure", "biofertilizer", "vermicompost"],
      answer:
        "Organic and bio-fertilizers:\n1. Farm Yard Manure (FYM): apply 10–15 t/ha two weeks before sowing — improves soil structure.\n2. Vermicompost: apply 2–3 t/ha — high in micronutrients and beneficial microbes.\n3. Green manure crops (dhaincha, sunhemp): plow in before flowering to add 60–80 kg N/ha.\n4. Rhizobium biofertilizer: seed treat legumes (soybean, chickpea) to fix atmospheric nitrogen.\n5. Combine organic + chemical fertilizers to reduce chemical dose by 25–50%.",
    },
    {
      keywords: ["dose", "quantity", "how much", "rate", "kg", "apply"],
      answer:
        "General fertilizer doses by crop:\n• Rice: 120:60:60 kg N:P:K per hectare\n• Wheat: 120:60:40 kg/ha\n• Maize: 150:75:60 kg/ha\n• Cotton: 120:60:60 kg/ha\n• Potato: 180:100:150 kg/ha\n• Soybean: 30:60:40 kg/ha\nAlways subtract existing soil nutrient levels from these totals. Use the Fertilizer Recommendation tool for precise calculations including your soil test data.",
    },
    {
      keywords: ["time", "when", "schedule", "stage", "basal", "top dress"],
      answer:
        "Fertilizer application timing:\n1. Basal dose (at sowing): apply all P and K + 1/3 N.\n2. First top dressing (30 days after sowing): apply 1/3 N.\n3. Second top dressing (60 days after sowing): apply remaining 1/3 N.\n4. Avoid nitrogen application at flowering stage — it causes excess vegetative growth.\n5. Foliar spray of micronutrients (zinc sulfate, ferrous sulfate) is effective at early vegetative stage.",
    },
    {
      keywords: ["water", "irrigat", "fertigation", "drip"],
      answer:
        "Fertigation (fertilizer through irrigation):\n1. Drip fertigation saves 30–40% fertilizer vs. soil application.\n2. Use water-soluble fertilizers only (urea, potassium nitrate, MAP).\n3. Apply in split doses — fertilize with every 2nd or 3rd irrigation.\n4. Flush drip lines with plain water after each fertigation session.\n5. Fertigation is most effective for vegetables, sugarcane, and orchards.",
    },
    {
      keywords: ["weather", "rain", "temperature", "forecast"],
      answer:
        "Weather and fertilizer application:\n1. Do not apply fertilizer before heavy rain — nutrients will be washed away.\n2. Top dress nitrogen when soil is moist but not waterlogged.\n3. Avoid fertilizer application during extreme heat (>40°C) — causes leaf burn.\n4. Foliar sprays should be applied in early morning or evening to prevent scorching.\n5. Check the Weather Advisory tool for the 5-day forecast before planning fertilizer application.",
    },
  ];

  for (const { keywords, answer } of responses) {
    if (keywords.some((k) => lower.includes(k))) return answer;
  }

  return `Thank you for your fertilizer question. I'm your AI fertilizer advisor. I can help with:\n\n• Fertilizer types and NPK doses by crop\n• Nutrient deficiency identification and treatment\n• Soil pH correction and lime/gypsum application\n• Organic and bio-fertilizer recommendations\n• Fertilizer application timing and scheduling\n• Fertigation planning for drip irrigation\n• Weather-based fertilizer advisory\n\nAsk a specific question for detailed guidance, or use the Fertilizer Recommendation tool for precise calculations based on your soil test data.`;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message: string; language?: string; sessionId?: string | null };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, language = "en", sessionId } = body;
  if (!message?.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  let response = "";

  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const langName: Record<string, string> = {
        en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
        bn: "Bengali", mr: "Marathi", pa: "Punjabi", gu: "Gujarati",
      };

      const prompt = `You are an expert fertilizer and soil nutrition advisor for Indian farmers. Answer the following question in ${langName[language] ?? "English"}. Be practical, specific, and focused on fertilizer use, nutrient management, and soil health in the Indian agricultural context.

Question: ${message}

Provide a clear, actionable response with specific fertilizer product names, quantities, and application methods where relevant.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    } catch (err) {
      console.error("Gemini API error:", err);
    }
  }

  if (!response) {
    response = generateFertilizerResponse(message);
  }

  let savedSessionId = sessionId;
  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (user) {
      let chatSession;
      if (savedSessionId) {
        chatSession = await prisma.chatSession.findFirst({
          where: { id: savedSessionId, userId: user.id },
        });
      }
      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: { userId: user.id, language, title: message.slice(0, 50) },
        });
        savedSessionId = chatSession.id;
      }
      await prisma.chatMessage.createMany({
        data: [
          { sessionId: chatSession.id, role: "user", content: message },
          { sessionId: chatSession.id, role: "assistant", content: response },
        ],
      });
    }
  } catch (dbErr) {
    console.error("DB save error:", dbErr);
  }

  return Response.json({ response, sessionId: savedSessionId });
}
