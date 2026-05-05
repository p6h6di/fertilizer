import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Rule-based farming advisor fallback
function generateFarmingResponse(message: string, language: string): string {
  const lower = message.toLowerCase();

  const responses: { keywords: string[]; answer: string }[] = [
    {
      keywords: ["crop", "recommend", "grow", "plant", "sow", "cultivate"],
      answer:
        "For crop recommendation, consider your soil type, local climate, and season. Kharif crops (rice, maize, soybean) are grown in monsoon (June-Sep). Rabi crops (wheat, mustard, chickpea) are grown in winter (Oct-Mar). Please use the Crop Recommendation tool for precise suggestions based on your soil parameters.",
    },
    {
      keywords: ["disease", "pest", "blight", "fungus", "infection", "rot", "mildew", "rust"],
      answer:
        "For plant diseases: 1) Remove infected plant material immediately. 2) Apply appropriate fungicide or pesticide. 3) Improve field drainage and air circulation. 4) Use the Disease Detection tool for photo-based diagnosis. Common treatments include copper-based fungicides for fungal diseases and neem oil for pests.",
    },
    {
      keywords: ["water", "irrigat", "drip", "flood"],
      answer:
        "Irrigation tips: 1) Water deeply but infrequently to encourage deep root growth. 2) Drip irrigation saves 30-50% water vs flood irrigation. 3) Water in early morning to reduce evaporation. 4) Check soil moisture before irrigation — insert finger 2 inches deep. 5) Match irrigation schedule to crop growth stage.",
    },
    {
      keywords: ["fertilizer", "npk", "nitrogen", "phosphorus", "potassium", "urea"],
      answer:
        "Fertilizer guidelines: 1) Conduct soil test before applying fertilizers. 2) Apply NPK based on soil deficiency and crop requirement. 3) Use organic manure (compost, vermicompost) to improve soil health. 4) Split nitrogen application into 2-3 doses. 5) Avoid over-fertilization which causes groundwater pollution.",
    },
    {
      keywords: ["weather", "rain", "temperature", "forecast", "climate"],
      answer:
        "Weather affects farming significantly. Use the Weather Advisory tool for real-time data. Generally: 1) Avoid pesticide application before rain. 2) Harvest before heavy rainfall. 3) Cover seedlings during extreme heat or frost. 4) Sow seeds when soil temperature is optimal for the crop.",
    },
    {
      keywords: ["harvest", "yield", "production", "output"],
      answer:
        "To maximize yield: 1) Use certified high-yielding variety seeds. 2) Follow proper spacing and planting depth. 3) Ensure timely irrigation and fertilization. 4) Monitor and control pests early. 5) Harvest at the right maturity stage to avoid post-harvest losses.",
    },
    {
      keywords: ["soil", "ph", "sandy", "clay", "loamy", "black"],
      answer:
        "Soil management tips: 1) Test soil pH annually — most crops prefer 6.0-7.0. 2) Add lime to raise pH and sulfur to lower it. 3) Improve sandy soil with organic matter. 4) Improve clay soil drainage with gypsum and organic compost. 5) Practice crop rotation to maintain soil health.",
    },
    {
      keywords: ["market", "price", "sell", "profit", "income", "msp"],
      answer:
        "Market tips for farmers: 1) Check MSP (Minimum Support Price) rates from government portals. 2) Join Farmer Producer Organizations (FPOs) for better negotiating power. 3) Use e-NAM (National Agricultural Market) for online price discovery. 4) Store produce in proper facilities to sell when prices are favorable.",
    },
  ];

  for (const { keywords, answer } of responses) {
    if (keywords.some((k) => lower.includes(k))) {
      return answer;
    }
  }

  return `Thank you for your question about farming. I'm your AI agricultural assistant. I can help you with:\n\n• Crop selection and recommendations\n• Disease identification and treatment\n• Irrigation and water management\n• Fertilizer application\n• Weather-based farming advice\n• Soil health management\n• Market information\n\nPlease ask a specific question and I'll provide detailed guidance. For best results, also use the specialized tools (Crop Recommendation, Disease Detection, Weather Advisory) available in your dashboard.`;
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

  // Try Google Gemini API if configured
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const langName = {
        en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu",
        bn: "Bengali", mr: "Marathi", pa: "Punjabi", gu: "Gujarati",
      }[language] ?? "English";

      const prompt = `You are an expert agricultural advisor for Indian farmers. Answer the following farming question in ${langName}. Be practical, concise, and specific to Indian agricultural context.

Question: ${message}

Provide a helpful, accurate response focused on practical farming advice.`;

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
        response =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    } catch (err) {
      console.error("Gemini API error:", err);
    }
  }

  // Fallback to rule-based response
  if (!response) {
    response = generateFarmingResponse(message, language);
  }

  // Save to DB
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
          data: {
            userId: user.id,
            language,
            title: message.slice(0, 50),
          },
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
