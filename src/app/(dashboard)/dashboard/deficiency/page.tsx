"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, FlaskConical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface DetectionResult {
  deficiency: string;
  deficiency_key: string;
  confidence: number;
  severity: string;
  crop_type: string;
  symptoms: string;
  treatment: string[];
  prevention: string[];
}

export default function DeficiencyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState("unknown");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const clearImage = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("cropType", cropType);
      const res = await fetch("/api/deficiency/detect", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Detection failed");
      }
      setResult(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityVariant = (severity: string) => {
    if (severity === "severe") return "destructive" as const;
    if (severity === "moderate") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nutrient Deficiency Detection</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a plant or leaf image for AI-powered nutrient deficiency diagnosis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Plant Image</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!preview ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-green-500 bg-green-50"
                    : "border-green-200 hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">
                  {isDragActive ? "Drop your image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG, WebP up to 10MB</p>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-green-200">
                  <Image
                    src={preview}
                    alt="Plant image"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">{file?.name}</span> —{" "}
                  {((file?.size ?? 0) / 1024).toFixed(0)} KB
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <Camera className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>
                For best results, photograph the affected leaves in natural daylight. You can also
                take a photo directly from your mobile camera.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cropType">Crop Type (optional)</Label>
              <Select
                id="cropType"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="max-w-xs"
              >
                <option value="unknown">Unknown / General</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="maize">Maize / Corn</option>
                <option value="tomato">Tomato</option>
                <option value="potato">Potato</option>
                <option value="cotton">Cotton</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="soybean">Soybean</option>
                <option value="groundnut">Groundnut</option>
                <option value="chickpea">Chickpea</option>
              </Select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={!file || loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Detect Nutrient Deficiency
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card
          className={
            result.deficiency_key === "healthy" ? "border-green-400" : "border-orange-300"
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {result.deficiency_key === "healthy" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
                {result.deficiency}
              </CardTitle>
              <Badge variant={getSeverityVariant(result.severity)}>
                {result.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Confidence</span>
                <span className="font-semibold text-green-700">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Symptoms Observed</p>
              <p className="text-sm text-yellow-700">{result.symptoms}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Fertilizer Treatment</p>
                <ul className="space-y-1.5">
                  {result.treatment.map((t) => (
                    <li key={t} className="text-xs text-red-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800 mb-2">Prevention</p>
                <ul className="space-y-1.5">
                  {result.prevention.map((p) => (
                    <li key={p} className="text-xs text-green-700 flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
