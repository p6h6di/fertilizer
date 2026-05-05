"use client";
import { useEffect, useState } from "react";
import { CloudSun, Thermometer, Droplets } from "lucide-react";

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  location: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            setWeather({
              temp: Math.round(data.current?.main?.temp ?? 0),
              description: data.current?.weather?.[0]?.description ?? "N/A",
              humidity: data.current?.main?.humidity ?? 0,
              location: data.current?.name ?? "Your Location",
            });
          }
        } catch {
          // silently fail
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );
  }, []);

  if (loading) {
    return (
      <div className="bg-muted rounded-xl p-4 animate-pulse">
        <div className="h-3 bg-border rounded w-20 mb-2" />
        <div className="h-5 bg-border rounded w-14" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-secondary border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-primary mb-1.5">
        <CloudSun className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold truncate">{weather.location}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Thermometer className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-base font-bold text-foreground">{weather.temp}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs text-muted-foreground">{weather.humidity}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground capitalize mt-1">{weather.description}</p>
    </div>
  );
}
