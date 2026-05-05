"use client";
import { useState, useEffect } from "react";
import { Leaf, Bug, MessageSquare, Calendar, Loader2, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CropRec {
  id: string;
  soilType: string;
  season: string | null;
  temperature: number | null;
  rainfall: number | null;
  recommendedCrops: { crop: string; confidence: number }[];
  createdAt: string;
}

interface DiseaseDetection {
  id: string;
  cropType: string | null;
  disease: string | null;
  confidence: number | null;
  severity: string | null;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string | null;
  language: string;
  createdAt: string;
  _count: { messages: number };
}

interface HistoryData {
  cropRecommendations: CropRec[];
  diseaseDetections: DiseaseDetection[];
  chatSessions: ChatSession[];
}

type Tab = "crops" | "disease" | "chats";

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("crops");
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/history");
        if (!res.ok) throw new Error("Failed to fetch history");
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Leaf; count?: number }[] = [
    {
      key: "crops",
      label: "Crop Recommendations",
      icon: Leaf,
      count: data?.cropRecommendations.length,
    },
    {
      key: "disease",
      label: "Disease Detections",
      icon: Bug,
      count: data?.diseaseDetections.length,
    },
    {
      key: "chats",
      label: "Chat Sessions",
      icon: MessageSquare,
      count: data?.chatSessions.length,
    },
  ];

  const getSeverityVariant = (severity: string | null) => {
    if (severity === "severe") return "destructive";
    if (severity === "moderate") return "default";
    return "secondary";
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review your past crop recommendations, disease detections, and chat sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-green-50 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    tab === t.key ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading history...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {tab === "crops" && (
            <div className="space-y-3">
              {data.cropRecommendations.length === 0 ? (
                <EmptyState icon={Leaf} label="No crop recommendations yet." />
              ) : (
                data.cropRecommendations.map((rec) => {
                  const topCrop =
                    Array.isArray(rec.recommendedCrops) ? rec.recommendedCrops[0] : null;
                  return (
                    <Card key={rec.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-lg mt-0.5">
                              <Leaf className="w-4 h-4 text-green-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">
                                {topCrop ? `Best: ${topCrop.crop}` : "Crop Recommendation"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {rec.soilType} soil — {rec.season ?? "N/A"} season
                              </p>
                              {rec.temperature && rec.rainfall && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {rec.temperature}°C, {rec.rainfall}mm rain
                                </p>
                              )}
                              {Array.isArray(rec.recommendedCrops) &&
                                rec.recommendedCrops.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {rec.recommendedCrops.slice(0, 4).map((c) => (
                                      <Badge key={c.crop} variant="secondary" className="capitalize text-xs">
                                        {c.crop} ({Math.round(c.confidence * 100)}%)
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {topCrop && (
                              <div className="flex items-center gap-1 text-green-700 mb-1">
                                <BarChart2 className="w-4 h-4" />
                                <span className="font-semibold text-sm">
                                  {Math.round(topCrop.confidence * 100)}%
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                              <Calendar className="w-3 h-3" />
                              {new Date(rec.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {tab === "disease" && (
            <div className="space-y-3">
              {data.diseaseDetections.length === 0 ? (
                <EmptyState icon={Bug} label="No disease detections yet." />
              ) : (
                data.diseaseDetections.map((det) => (
                  <Card key={det.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-100 p-2 rounded-lg mt-0.5">
                            <Bug className="w-4 h-4 text-red-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {det.disease ?? "Unknown Disease"}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              Crop: {det.cropType ?? "Unknown"}
                            </p>
                            {det.confidence && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Confidence: {Math.round(det.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          {det.severity && (
                            <Badge variant={getSeverityVariant(det.severity)}>
                              {det.severity}
                            </Badge>
                          )}
                          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            {new Date(det.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "chats" && (
            <div className="space-y-3">
              {data.chatSessions.length === 0 ? (
                <EmptyState icon={MessageSquare} label="No chat sessions yet." />
              ) : (
                data.chatSessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg mt-0.5">
                            <MessageSquare className="w-4 h-4 text-purple-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {session.title ?? "Farming Query"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Language: {session.language.toUpperCase()} —{" "}
                              {session._count?.messages ?? 0} messages
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <Icon className="w-10 h-10 mx-auto mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
