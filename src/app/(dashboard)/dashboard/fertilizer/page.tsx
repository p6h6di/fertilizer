"use client";
import { useState } from "react";
import { Loader2, CheckCircle, FlaskConical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FormData {
  cropType: string;
  soilType: string;
  soilPh: string;
  currentN: string;
  currentP: string;
  currentK: string;
  area: string;
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

interface ApiResult {
  recommendations: FertilizerRec[];
  summary: {
    crop: string;
    area: number;
    nDeficit: number;
    pDeficit: number;
    kDeficit: number;
  };
  aiPowered: boolean;
}

const defaultForm: FormData = {
  cropType: "wheat",
  soilType: "loamy",
  soilPh: "7.0",
  currentN: "20",
  currentP: "15",
  currentK: "30",
  area: "1",
  growthStage: "pre-sowing",
};

export default function FertilizerPage() {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/fertilizer/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropType: form.cropType,
          soilType: form.soilType,
          soilPh: parseFloat(form.soilPh),
          currentN: parseFloat(form.currentN),
          currentP: parseFloat(form.currentP),
          currentK: parseFloat(form.currentK),
          area: parseFloat(form.area),
          growthStage: form.growthStage,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to get recommendations");
      }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fertilizer Recommendation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter your crop and soil details to get precise fertilizer recommendations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crop & Soil Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cropType">Crop Type</Label>
                <Select
                  id="cropType"
                  value={form.cropType}
                  onChange={(e) => handleField("cropType", e.target.value)}
                >
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                  <option value="maize">Maize / Corn</option>
                  <option value="cotton">Cotton</option>
                  <option value="sugarcane">Sugarcane</option>
                  <option value="potato">Potato</option>
                  <option value="tomato">Tomato</option>
                  <option value="soybean">Soybean</option>
                  <option value="groundnut">Groundnut</option>
                  <option value="chickpea">Chickpea</option>
                </Select>
              </div>

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
                <Label htmlFor="growthStage">Growth Stage</Label>
                <Select
                  id="growthStage"
                  value={form.growthStage}
                  onChange={(e) => handleField("growthStage", e.target.value)}
                >
                  <option value="pre-sowing">Pre-Sowing</option>
                  <option value="sowing">Sowing / Planting</option>
                  <option value="vegetative">Vegetative Stage</option>
                  <option value="flowering">Flowering Stage</option>
                  <option value="fruiting">Fruiting / Grain Fill</option>
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
                  placeholder="7.0"
                  value={form.soilPh}
                  onChange={(e) => handleField("soilPh", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currentN">Current Nitrogen (N) kg/ha</Label>
                <Input
                  id="currentN"
                  type="number"
                  min="0"
                  placeholder="20"
                  value={form.currentN}
                  onChange={(e) => handleField("currentN", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currentP">Current Phosphorus (P) kg/ha</Label>
                <Input
                  id="currentP"
                  type="number"
                  min="0"
                  placeholder="15"
                  value={form.currentP}
                  onChange={(e) => handleField("currentP", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currentK">Current Potassium (K) kg/ha</Label>
                <Input
                  id="currentK"
                  type="number"
                  min="0"
                  placeholder="30"
                  value={form.currentK}
                  onChange={(e) => handleField("currentK", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area">Farm Area (hectares)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1"
                  value={form.area}
                  onChange={(e) => handleField("area", e.target.value)}
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
                  Calculating...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Get Fertilizer Recommendations
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Recommended Fertilizers
            </h2>
            {result.aiPowered ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1">
                <Sparkles className="w-3 h-3" />
                AI Powered
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2.5 py-1">
                Rule-based
              </span>
            )}
          </div>

          {/* Deficit summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "N Deficit",
                value: `${result.summary.nDeficit} kg/ha`,
                color: "bg-blue-50 border-blue-200 text-blue-700",
              },
              {
                label: "P Deficit",
                value: `${result.summary.pDeficit} kg/ha`,
                color: "bg-orange-50 border-orange-200 text-orange-700",
              },
              {
                label: "K Deficit",
                value: `${result.summary.kDeficit} kg/ha`,
                color: "bg-purple-50 border-purple-200 text-purple-700",
              },
            ].map((s) => (
              <div key={s.label} className={`border rounded-lg p-3 text-center ${s.color}`}>
                <p className="text-xs font-medium">{s.label}</p>
                <p className="text-lg font-bold mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.recommendations.map((rec, idx) => (
              <Card key={rec.fertilizer} className={idx === 0 ? "border-green-400 shadow-md" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{rec.fertilizer}</CardTitle>
                    {idx === 0 && <Badge>Primary</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{rec.product}</p>
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
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Per Hectare</p>
                      <p className="font-semibold">
                        {rec.quantity} {rec.unit}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Total ({result.summary.area} ha)</p>
                      <p className="font-semibold">
                        {rec.totalQty} {rec.unit}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {rec.timing}
                  </Badge>
                  <p className="text-xs text-gray-600">{rec.method}</p>
                  <p className="text-xs text-gray-400">{rec.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
