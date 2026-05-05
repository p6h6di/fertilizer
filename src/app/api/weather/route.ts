import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function generateFarmingAdvisory(
  temp: number,
  humidity: number,
  windSpeed: number,
  description: string
): string[] {
  const advisory: string[] = [];

  if (temp > 35) {
    advisory.push(
      "High temperature alert: Increase irrigation frequency and consider shade nets for sensitive crops."
    );
    advisory.push("Avoid field work during peak afternoon hours (12 PM – 3 PM) to prevent heat stress.");
  } else if (temp < 10) {
    advisory.push(
      "Cold weather alert: Protect frost-sensitive crops with row covers or mulching."
    );
    advisory.push("Delay transplanting activities until temperatures rise above 15°C.");
  } else if (temp >= 20 && temp <= 30) {
    advisory.push(
      "Optimal temperature range for most field crops. Good conditions for planting and crop growth."
    );
  }

  if (humidity > 80) {
    advisory.push(
      "High humidity increases risk of fungal diseases. Monitor crops for early signs of blight or mildew."
    );
    advisory.push("Apply preventive fungicide sprays and ensure good air circulation in plant canopy.");
  } else if (humidity < 30) {
    advisory.push(
      "Low humidity may cause soil moisture stress. Consider drip irrigation to conserve water."
    );
  }

  if (windSpeed > 10) {
    advisory.push(
      "Strong winds expected. Avoid pesticide spraying to prevent chemical drift and crop damage."
    );
  }

  if (description.includes("rain") || description.includes("drizzle")) {
    advisory.push(
      "Rainfall expected. Hold off on irrigation and fertilizer application to avoid nutrient runoff."
    );
    advisory.push("Good conditions for sowing dry seeds and establishing transplants.");
  } else if (description.includes("clear") || description.includes("sunny")) {
    advisory.push(
      "Clear weather: Good conditions for harvesting, crop spraying, and field operations."
    );
  }

  if (advisory.length === 0) {
    advisory.push("Weather conditions are moderate. Continue regular farm operations and monitoring.");
  }

  return advisory;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Weather API key not configured" }, { status: 500 });
  }

  let resolvedLat: string | null = lat;
  let resolvedLon: string | null = lon;

  // If city provided, geocode it
  if (city && (!lat || !lon)) {
    try {
      const geoRes = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          resolvedLat = String(geoData[0].lat);
          resolvedLon = String(geoData[0].lon);
        } else {
          return Response.json({ error: "City not found" }, { status: 404 });
        }
      }
    } catch {
      return Response.json({ error: "Geocoding failed" }, { status: 500 });
    }
  }

  if (!resolvedLat || !resolvedLon) {
    return Response.json({ error: "Latitude and longitude are required" }, { status: 400 });
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${resolvedLat}&lon=${resolvedLon}&appid=${apiKey}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${resolvedLat}&lon=${resolvedLon}&appid=${apiKey}&units=metric`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return Response.json({ error: "Failed to fetch weather data" }, { status: 502 });
    }

    const [current, forecast] = await Promise.all([
      currentRes.json(),
      forecastRes.json(),
    ]);

    const advisory = generateFarmingAdvisory(
      current.main.temp,
      current.main.humidity,
      current.wind.speed,
      current.weather[0]?.description ?? ""
    );

    // Save extreme weather alerts to DB
    if (userId) {
      const isExtreme =
        current.main.temp > 40 ||
        current.main.temp < 5 ||
        current.wind.speed > 15 ||
        (current.rain && (current.rain["1h"] ?? 0) > 50);

      if (isExtreme) {
        try {
          const user = await prisma.user.findUnique({ where: { clerkId: userId } });
          if (user) {
            let alertType = "WEATHER_ALERT";
            let message = "Extreme weather conditions detected.";
            let severity = "moderate";

            if (current.main.temp > 40) {
              alertType = "HEAT_WAVE";
              message = `Extreme heat: ${Math.round(current.main.temp)}°C at ${current.name}`;
              severity = "severe";
            } else if (current.main.temp < 5) {
              alertType = "FROST_WARNING";
              message = `Frost risk: ${Math.round(current.main.temp)}°C at ${current.name}`;
              severity = "severe";
            } else if (current.wind.speed > 15) {
              alertType = "HIGH_WIND";
              message = `Strong winds: ${current.wind.speed} m/s at ${current.name}`;
              severity = "moderate";
            }

            await prisma.weatherAlert.create({
              data: {
                userId: user.id,
                location: current.name ?? `${resolvedLat},${resolvedLon}`,
                alertType,
                message,
                severity,
                validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          }
        } catch (dbErr) {
          console.error("DB alert save error:", dbErr);
        }
      }
    }

    return Response.json({ current, forecast, advisory });
  } catch (err) {
    console.error("Weather fetch error:", err);
    return Response.json({ error: "Failed to fetch weather data" }, { status: 500 });
  }
}
