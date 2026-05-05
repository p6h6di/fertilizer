"use client";
import { useState } from "react";
import {
  MapPin,
  Loader2,
  Thermometer,
  Droplets,
  Wind,
  CloudSun,
  Search,
  Leaf,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WeatherCurrent {
  name: string;
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  weather: { description: string; icon: string; main: string }[];
  wind: { speed: number };
  clouds: { all: number };
  rain?: { "1h"?: number; "3h"?: number };
}

interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: { temp_min: number; temp_max: number; humidity: number };
  weather: { description: string; icon: string }[];
  rain?: { "3h"?: number };
}

interface WeatherApiResponse {
  current: WeatherCurrent;
  forecast: { list: ForecastItem[] };
  advisory: string[];
}

export default function WeatherPage() {
  const [locationInput, setLocationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [data, setData] = useState<WeatherApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to fetch weather");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Location access denied. Please enter a location manually.");
      }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    // Geocode using OpenWeather Geocoding API via our backend
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/weather?city=${encodeURIComponent(locationInput.trim())}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "City not found");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Get daily forecasts (one per day)
  const dailyForecasts = data?.forecast.list.filter((_, i) => i % 8 === 0).slice(0, 5) ?? [];

  const iconUrl = (icon: string) =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weather Advisory</h1>
        <p className="text-gray-500 text-sm mt-1">
          Get real-time weather data and farming advisories for your location.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Enter city name (e.g. Mumbai, Delhi)"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading || !locationInput.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </form>
            <Button
              type="button"
              variant="outline"
              onClick={detectLocation}
              disabled={locating || loading}
            >
              {locating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Use My Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Current Weather */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    {data.current.name}
                  </div>
                  <div className="flex items-center gap-3">
                    {data.current.weather[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={iconUrl(data.current.weather[0].icon)}
                        alt={data.current.weather[0].description}
                        width={64}
                        height={64}
                      />
                    )}
                    <div>
                      <p className="text-5xl font-bold text-gray-900">
                        {Math.round(data.current.main.temp)}°C
                      </p>
                      <p className="text-gray-500 capitalize text-sm">
                        {data.current.weather[0]?.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Feels Like</p>
                      <p className="font-semibold">{Math.round(data.current.main.feels_like)}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Humidity</p>
                      <p className="font-semibold">{data.current.main.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Wind</p>
                      <p className="font-semibold">{data.current.wind.speed} m/s</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudSun className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-xs text-gray-500">Cloud Cover</p>
                      <p className="font-semibold">{data.current.clouds.all}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5-Day Forecast */}
          {dailyForecasts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5-Day Forecast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {dailyForecasts.map((f) => {
                  const date = new Date(f.dt * 1000);
                  return (
                    <Card key={f.dt} className="text-center">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                        {f.weather[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={iconUrl(f.weather[0].icon)}
                            alt={f.weather[0].description}
                            width={48}
                            height={48}
                            className="mx-auto"
                          />
                        )}
                        <p className="font-bold text-gray-900 text-sm">
                          {Math.round(f.main.temp_max)}°
                        </p>
                        <p className="text-xs text-gray-400">{Math.round(f.main.temp_min)}°</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {f.weather[0]?.description}
                        </p>
                        {f.rain?.["3h"] && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {f.rain["3h"].toFixed(1)}mm
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Farming Advisory */}
          {data.advisory && data.advisory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  Farming Advisory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.advisory.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 bg-green-50 rounded-lg p-3">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-700">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <CloudSun className="w-12 h-12 mx-auto mb-3" />
          <p>Enter a city name or use your location to get weather data.</p>
        </div>
      )}
    </div>
  );
}
