"use client";
import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Users, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  lang?: string;
}

interface AnalysisResult {
  summary: string;
  overloaded: { name: string; allocation: number; projects: string[] }[];
  underutilized: { name: string; allocation: number; skills: string[] }[];
  recommendations: { action: string; reason: string; priority: "high" | "medium" | "low" }[];
  projectGaps: { project: string; needed_roles: string[]; current_members: number }[];
}

const i18n: Record<string, Record<string, string>> = {
  title: { th: "AI วิเคราะห์ Manpower", en: "AI Manpower Analysis", jp: "AIマンパワー分析" },
  analyze: { th: "วิเคราะห์", en: "Analyze", jp: "分析" },
  analyzing: { th: "กำลังวิเคราะห์...", en: "Analyzing...", jp: "分析中..." },
  summary: { th: "สรุปภาพรวม", en: "Summary", jp: "概要" },
  overloaded: { th: "คนงานเกินโหลด", en: "Overloaded Members", jp: "過負荷メンバー" },
  underutilized: { th: "คนงานยังว่าง", en: "Underutilized Members", jp: "空きメンバー" },
  recommendations: { th: "คำแนะนำ AI", en: "AI Recommendations", jp: "AI推奨" },
  projectGaps: { th: "โปรเจคที่ขาดคน", en: "Project Gaps", jp: "プロジェクト欠員" },
  noData: { th: "ยังไม่มีข้อมูลวิเคราะห์ กดปุ่มวิเคราะห์เพื่อเริ่ม", en: "No analysis yet. Click Analyze to start.", jp: "分析データなし" },
  high: { th: "สำคัญมาก", en: "High", jp: "高" },
  medium: { th: "ปานกลาง", en: "Medium", jp: "中" },
  low: { th: "ต่ำ", en: "Low", jp: "低" },
  error: { th: "เกิดข้อผิดพลาด", en: "Error occurred", jp: "エラー" },
};

export default function ManpowerAIAnalysis({ lang = "th" }: Props) {
  const L = (k: string) => i18n[k]?.[lang] ?? i18n[k]?.en ?? k;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true, overloaded: true, underutilized: true, recommendations: true, projectGaps: false,
  });

  const toggleSection = (key: string) => setExpandedSections(s => ({ ...s, [key]: !s[key] }));

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manpower-ai", { method: "POST" });
      if (!res.ok) throw new Error("Analysis failed");
      const json = await res.json();
      setResult(json.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const prioColors = { high: "#EF4444", medium: "#F7941D", low: "#10B981" };
  const prioLabels = { high: L("high"), medium: L("medium"), low: L("low") };

  const Section = ({ id, icon: Icon, title, count, children }: {
    id: string; icon: typeof AlertTriangle; title: string; count?: number; children: React.ReactNode;
  }) => (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[#003087]" />
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {count !== undefined && <span className="text-xs bg-[#003087]/10 text-[#003087] px-2 py-0.5 rounded-full">{count}</span>}
        </div>
        {expandedSections[id] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {expandedSections[id] && <div className="p-4">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#F7941D]" />
          <h2 className="text-lg font-bold text-gray-800">{L("title")}</h2>
        </div>
        <button onClick={analyze} disabled={loading}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #003087, #00AEEF)" }}>
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? L("analyzing") : L("analyze")}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{L("error")}: {error}</div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-gray-400 text-sm">{L("noData")}</div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <Section id="summary" icon={BarChart3} title={L("summary")}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result.summary}</p>
          </Section>

          {/* Overloaded */}
          {result.overloaded.length > 0 && (
            <Section id="overloaded" icon={AlertTriangle} title={L("overloaded")} count={result.overloaded.length}>
              <div className="space-y-2">
                {result.overloaded.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{m.name}</span>
                      <div className="text-xs text-gray-500 mt-0.5">{m.projects.join(", ")}</div>
                    </div>
                    <span className="text-sm font-bold text-red-600">{m.allocation}%</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Underutilized */}
          {result.underutilized.length > 0 && (
            <Section id="underutilized" icon={Users} title={L("underutilized")} count={result.underutilized.length}>
              <div className="space-y-2">
                {result.underutilized.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{m.name}</span>
                      {m.skills.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {m.skills.slice(0, 3).map((s, j) => (
                            <span key={j} className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-green-600">{m.allocation}%</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Section id="recommendations" icon={TrendingUp} title={L("recommendations")} count={result.recommendations.length}>
              <div className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ background: prioColors[r.priority] }}>{prioLabels[r.priority]}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{r.action}</div>
                        <div className="text-xs text-gray-500 mt-1">{r.reason}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Project Gaps */}
          {result.projectGaps.length > 0 && (
            <Section id="projectGaps" icon={AlertTriangle} title={L("projectGaps")} count={result.projectGaps.length}>
              <div className="space-y-2">
                {result.projectGaps.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-50">
                    <div className="text-sm font-medium text-gray-800">{p.project}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Members: {p.current_members}</span>
                      <span className="text-xs text-amber-600">Needs: {p.needed_roles.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
