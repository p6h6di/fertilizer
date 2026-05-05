"use client";
import { useState, useCallback } from "react";
import { MapPin, Loader2, CheckCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoiceInput } from "@/components/VoiceInput";

interface FormData {
  soilType: string;
  soilPh: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  rainfall: string;
  temperature: string;
  humidity: string;
  season: string;
}

interface Recommendation {
  crop: string;
  confidence: number;
  reasons: string[];
  season: string[];
}

interface ApiResult {
  recommendations: Recommendation[];
  input_summary: {
    soil_type: string;
    temperature: number;
    rainfall: number;
    season: string;
  };
}

const defaultForm: FormData = {
  soilType: "loamy",
  soilPh: "7.0",
  nitrogen: "50",
  phosphorus: "50",
  potassium: "50",
  rainfall: "100",
  temperature: "25",
  humidity: "60",
  season: "Kharif",
};

export default function CropsPage() {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVoice = useCallback(
    (transcript: string) => {
      // Try to parse voice input for temperature / rainfall
      const tempMatch = transcript.match(/(\d+)\s*degree/i);
      const rainMatch = transcript.match(/(\d+)\s*mm/i);
      const humidMatch = transcript.match(/humidity\s*(\d+)/i);
      if (tempMatch) handleField("temperature", tempMatch[1]);
      if (rainMatch) handleField("rainfall", rainMatch[1]);
      if (humidMatch) handleField("humidity", humidMatch[1]);
    },
    []
  );

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const temp = data.current?.main?.temp;
            const humidity = data.current?.main?.humidity;
            const rainfall = data.current?.rain?.["1h"] ?? data.current?.rain?.["3h"] ?? 0;
            if (temp) handleField("temperature", String(Math.round(temp)));
            if (humidity) handleField("humidity", String(humidity));
            if (rainfall) handleField("rainfall", String(Math.round(rainfall * 30)));
          }
        } catch {
          // ignore
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/crops/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soilType: form.soilType,
          soilPh: parseFloat(form.soilPh),
          nitrogen: parseFloat(form.nitrogen),
          phosphorus: parseFloat(form.phosphorus),
          potassium: parseFloat(form.potassium),
          rainfall: parseFloat(form.rainfall),
          temperature: parseFloat(form.temperature),
          humidity: parseFloat(form.humidity),
          season: form.season,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to get recommendations");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Crop Recommendation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter your farm parameters to get AI-powered crop suggestions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Farm Parameters</CardTitle>
            <div className="flex items-center gap-2">
              <VoiceInput onTranscript={handleVoice} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectLocation}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2" />
                )}
                Auto-Detect
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="soilType">Soil Type</Label>
                <Select
                  id="soilType"
                  value={form.soilType}
                  onChange={(e) => handleField("soilType", e.target.value)}
                >
                  <option value="clay">Clay</option>
                  <option value="sandy">Sandy</option>
                  <option value="loamy">Loamy</option>
                  <option value="silt">Silt</option>
                  <option value="black">Black Cotton</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="season">Season</Label>
                <Select
                  id="season"
                  value={form.season}
                  onChange={(e) => handleField("season", e.target.value)}
                >
                  <option value="Kharif">Kharif (Jun-Sep)</option>
                  <option value="Rabi">Rabi (Oct-Mar)</option>
                  <option value="Zaid">Zaid (Mar-Jun)</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="soilPh">Soil pH</Label>
                <Input
                  id="soilPh"
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  placeholder="6.5"
                  value={form.soilPh}
                  onChange={(e) => handleField("soilPh", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nitrogen">Nitrogen (N) kg/ha</Label>
                <Input
                  id="nitrogen"
                  type="number"
                  placeholder="50"
                  value={form.nitrogen}
                  onChange={(e) => handleField("nitrogen", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phosphorus">Phosphorus (P) kg/ha</Label>
                <Input
                  id="phosphorus"
                  type="number"
                  placeholder="50"
                  value={form.phosphorus}
                  onChange={(e) => handleField("phosphorus", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="potassium">Potassium (K) kg/ha</Label>
                <Input
                  id="potassium"
                  type="number"
                  placeholder="50"
                  value={form.potassium}
                  onChange={(e) => handleField("potassium", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rainfall">Rainfall (mm/month)</Label>
                <Input
                  id="rainfall"
                  type="number"
                  placeholder="100"
                  value={form.rainfall}
                  onChange={(e) => handleField("rainfall", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="25"
                  value={form.temperature}
                  onChange={(e) => handleField("temperature", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="60"
                  value={form.humidity}
                  onChange={(e) => handleField("humidity", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Leaf className="w-4 h-4 mr-2" />
                  Get Crop Recommendations
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recommended Crops
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.recommendations.map((rec, idx) => (
              <Card key={rec.crop} className={idx === 0 ? "border-green-400 shadow-md" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize text-lg">{rec.crop}</CardTitle>
                    {idx === 0 && <Badge>Best Match</Badge>}
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Confidence</span>
                      <span className="font-semibold text-green-700">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-green-100 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${rec.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Why this crop:</p>
                  <ul className="space-y-1">
                    {rec.reasons.map((reason) => (
                      <li key={reason} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {rec.season.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
