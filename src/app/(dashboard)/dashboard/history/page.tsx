"use client";
import { useState, useEffect } from "react";
import { FlaskConical, AlertTriangle, MessageSquare, Calendar, Loader2, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FertilizerRec {
  id: string;
  cropType: string;
  soilType: string;
  area: number | null;
  growthStage: string | null;
  recommendations: { fertilizer: string; quantity: number; unit: string; confidence: number }[];
  createdAt: string;
}

interface DeficiencyDetection {
  id: string;
  cropType: string | null;
  deficiency: string | null;
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
  fertilizerRecommendations: FertilizerRec[];
  deficiencyDetections: DeficiencyDetection[];
  chatSessions: ChatSession[];
}

type Tab = "fertilizer" | "deficiency" | "chats";

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("fertilizer");
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/history");
        if (!res.ok) throw new Error("Failed to fetch history");
        setData(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    {
      key: "fertilizer",
      label: "Fertilizer Recommendations",
      icon: FlaskConical,
      count: data?.fertilizerRecommendations.length,
    },
    {
      key: "deficiency",
      label: "Deficiency Analyses",
      icon: AlertTriangle,
      count: data?.deficiencyDetections.length,
    },
    {
      key: "chats",
      label: "Chat Sessions",
      icon: MessageSquare,
      count: data?.chatSessions.length,
    },
  ];

  const getSeverityVariant = (severity: string | null) => {
    if (severity === "severe") return "destructive" as const;
    if (severity === "moderate") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review your past fertilizer recommendations, deficiency analyses, and chat sessions.
        </p>
      </div>

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
          {tab === "fertilizer" && (
            <div className="space-y-3">
              {data.fertilizerRecommendations.length === 0 ? (
                <EmptyState icon={FlaskConical} label="No fertilizer recommendations yet." />
              ) : (
                data.fertilizerRecommendations.map((rec) => {
                  const top = Array.isArray(rec.recommendations) ? rec.recommendations[0] : null;
                  return (
                    <Card key={rec.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-green-100 p-2 rounded-lg mt-0.5">
                              <FlaskConical className="w-4 h-4 text-green-700" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">
                                {top ? `Primary: ${top.fertilizer}` : "Fertilizer Recommendation"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {rec.cropType} — {rec.soilType} soil
                                {rec.area ? ` — ${rec.area} ha` : ""}
                              </p>
                              {rec.growthStage && (
                                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                                  {rec.growthStage} stage
                                </p>
                              )}
                              {Array.isArray(rec.recommendations) && rec.recommendations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {rec.recommendations.slice(0, 4).map((r) => (
                                    <Badge key={r.fertilizer} variant="secondary" className="text-xs">
                                      {r.fertilizer} ({r.quantity} {r.unit})
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {top && (
                              <div className="flex items-center gap-1 text-green-700 mb-1">
                                <BarChart2 className="w-4 h-4" />
                                <span className="font-semibold text-sm">
                                  {Math.round(top.confidence * 100)}%
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

          {tab === "deficiency" && (
            <div className="space-y-3">
              {data.deficiencyDetections.length === 0 ? (
                <EmptyState icon={AlertTriangle} label="No deficiency analyses yet." />
              ) : (
                data.deficiencyDetections.map((det) => (
                  <Card key={det.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-orange-100 p-2 rounded-lg mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-orange-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {det.deficiency ?? "Unknown Deficiency"}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              Crop: {det.cropType ?? "Unknown"}
                            </p>
                            {det.confidence !== null && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Confidence: {Math.round(det.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
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
                              {session.title ?? "Fertilizer Query"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Language: {session.language.toUpperCase()} —{" "}
                              {session._count?.messages ?? 0} messages
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
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
