"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot, Send, Loader2, TrendingUp, AlertTriangle, Target, Users,
  DollarSign, Clock, ChevronRight, Sparkles, MessageSquare, BarChart3,
  RefreshCcw, Briefcase, ArrowRight,
} from "lucide-react";

interface Props {
  lang?: string;
  currentUserId?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DealInsight {
  id: string;
  title: string;
  stage: string;
  value: number;
  client: string;
  daysInStage: number;
  risk: "low" | "medium" | "high";
  suggestion: string;
}

interface SalesSnapshot {
  totalDeals: number;
  totalValue: number;
  avgDaysInStage: number;
  stuckDeals: number;
  hotDeals: number;
  closedThisMonth: number;
  closedValue: number;
  insights: DealInsight[];
  loading: boolean;
}

const STAGE_LABELS: Record<string, Record<string, string>> = {
  new_lead: { th: "ลีดใหม่", en: "New Lead", jp: "新規リード" },
  waiting_present: { th: "รอนำเสนอ", en: "Waiting Present", jp: "プレゼン待ち" },
  contacted: { th: "ติดต่อแล้ว", en: "Contacted", jp: "連絡済み" },
  proposal_created: { th: "สร้าง Proposal", en: "Proposal Created", jp: "提案作成" },
  proposal_submitted: { th: "เสนอ Proposal", en: "Proposal Submitted", jp: "提案提出" },
  proposal_confirmed: { th: "คอนเฟิร์ม Proposal", en: "Proposal Confirmed", jp: "提案確認" },
  quotation: { th: "เสนอราคา", en: "Quotation", jp: "見積" },
  negotiation: { th: "เจรจาต่อรอง", en: "Negotiation", jp: "交渉中" },
  waiting_po: { th: "รอ PO", en: "Waiting PO", jp: "PO待ち" },
  po_received: { th: "ได้รับ PO", en: "PO Received", jp: "PO受領" },
  payment_received: { th: "ได้รับยอดชำระ", en: "Payment Received", jp: "入金済み" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", jp: "キャンセル" },
  refused: { th: "ปฏิเสธ", en: "Refused", jp: "拒否" },
};

const CLOSED_STAGES = ["po_received", "payment_received"];
const STUCK_THRESHOLD_DAYS = 14;

const i18n: Record<string, Record<string, string>> = {
  title: { th: "AI ผู้ช่วยขาย", en: "AI Sales Assistant", jp: "AI営業アシスタント" },
  subtitle: { th: "วิเคราะห์ดีลและให้คำแนะนำอัจฉริยะ", en: "Analyze deals & get smart recommendations", jp: "ディール分析とスマートな推奨" },
  overview: { th: "ภาพรวมการขาย", en: "Sales Overview", jp: "営業概要" },
  totalDeals: { th: "ดีลทั้งหมด", en: "Total Deals", jp: "全ディール" },
  pipelineValue: { th: "มูลค่า Pipeline", en: "Pipeline Value", jp: "パイプライン値" },
  stuckDeals: { th: "ดีลค้าง", en: "Stuck Deals", jp: "停滞ディール" },
  hotDeals: { th: "ดีลร้อน", en: "Hot Deals", jp: "ホットディール" },
  closedMonth: { th: "ปิดเดือนนี้", en: "Closed This Month", jp: "今月成約" },
  closedValue: { th: "มูลค่าปิด", en: "Closed Value", jp: "成約額" },
  aiInsights: { th: "AI วิเคราะห์ดีล", en: "AI Deal Insights", jp: "AIディール分析" },
  askAI: { th: "ถาม AI ผู้ช่วยขาย", en: "Ask AI Sales Assistant", jp: "AI営業アシスタントに質問" },
  placeholder: { th: "ถามอะไรก็ได้เกี่ยวกับการขาย เช่น วิเคราะห์ดีลนี้, ร่างอีเมลลูกค้า, เตรียมนัดลูกค้า...", en: "Ask anything about sales, e.g. analyze this deal, draft client email, prep for meeting...", jp: "営業に関する質問は何でも、例：ディール分析、顧客メール下書き、会議準備..." },
  thinking: { th: "AI กำลังคิด...", en: "AI is thinking...", jp: "AIが考え中..." },
  refresh: { th: "รีเฟรช", en: "Refresh", jp: "更新" },
  noDeals: { th: "ยังไม่มีดีล", en: "No deals yet", jp: "ディールなし" },
  risk_high: { th: "เสี่ยงสูง", en: "High Risk", jp: "高リスク" },
  risk_medium: { th: "เสี่ยงปานกลาง", en: "Medium Risk", jp: "中リスク" },
  risk_low: { th: "เสี่ยงต่ำ", en: "Low Risk", jp: "低リスク" },
  quickActions: { th: "คำถามด่วน", en: "Quick Actions", jp: "クイックアクション" },
  q_analyze: { th: "วิเคราะห์ดีลทั้งหมดของผม", en: "Analyze all my deals", jp: "全ディールを分析" },
  q_stuck: { th: "ดีลไหนค้างนานที่สุด?", en: "Which deals are stuck longest?", jp: "最も停滞しているディールは？" },
  q_priority: { th: "ควรโฟกัสดีลไหนก่อน?", en: "Which deals should I prioritize?", jp: "どのディールを優先すべき？" },
  q_email: { th: "ช่วยร่างอีเมลติดตามลูกค้า", en: "Help draft a follow-up email", jp: "フォローアップメール下書き" },
  q_meeting: { th: "ช่วยเตรียมข้อมูลก่อนไปพบลูกค้า", en: "Help prepare for client meeting", jp: "顧客訪問の準備を手伝って" },
  q_forecast: { th: "พยากรณ์ยอดขายเดือนนี้", en: "Forecast this month sales", jp: "今月の売上予測" },
  days: { th: "วัน", en: "days", jp: "日" },
  welcomeMsg: { th: "สวัสดีครับ! ผมเป็น AI ผู้ช่วยขายส่วนตัวของคุณ ถามอะไรก็ได้เกี่ยวกับดีล ลูกค้า หรือกลยุทธ์การขาย ผมจะดึงข้อมูลจริงจากระบบมาวิเคราะห์ให้ครับ", en: "Hello! I am your personal AI sales assistant. Ask me anything about deals, customers, or sales strategy. I will analyze real data from the system for you.", jp: "こんにちは！私はあなた専属のAI営業アシスタントです。ディール、顧客、営業戦略について何でもお聞きください。システムの実データを分析してお答えします。" },
  errorMsg: { th: "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่", en: "Sorry, an error occurred. Please try again.", jp: "申し訳ございません。エラーが発生しました。もう一度お試しください。" },
  aiNotConfigured: { th: "ยังไม่ได้ตั้งค่า AI — กรุณาเพิ่ม API Key ในระบบ", en: "AI not configured — please add API Key", jp: "AI未設定 — APIキーを追加してください" },
  analyzeDeal: { th: "วิเคราะห์ดีลนี้", en: "Analyze", jp: "分析" },
  proposalGen: { th: "สร้าง Proposal อัตโนมัติ", en: "Auto-Generate Proposal", jp: "提案書自動生成" },
  proposalDesc: { th: "สร้างเอกสาร Proposal นำเสนอลูกค้าผ่าน LINE Bot อัตโนมัติ", en: "Generate customer proposal documents via LINE Bot automatically", jp: "LINE Botで顧客提案書を自動生成" },
};

export default function SalesAIPanel({ lang = "th", currentUserId }: Props) {
  const L = (k: string) => i18n[k]?.[lang] ?? i18n[k]?.en ?? k;
  const stageLabel = (s: string) => STAGE_LABELS[s]?.[lang] ?? STAGE_LABELS[s]?.en ?? s;

  const [snapshot, setSnapshot] = useState<SalesSnapshot>({
    totalDeals: 0, totalValue: 0, avgDaysInStage: 0, stuckDeals: 0,
    hotDeals: 0, closedThisMonth: 0, closedValue: 0, insights: [], loading: true,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch sales snapshot
  const fetchSnapshot = useCallback(async () => {
    setSnapshot(s => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/deals");
      if (!res.ok) return;
      const data = await res.json();
      const allDeals = data.deals || data.data || data || [];
      if (!Array.isArray(allDeals)) return;

      // Filter to only show deals owned by current user or where user is collaborator
      const deals = currentUserId
        ? allDeals.filter((d: any) => d.owner_id === currentUserId || d.owner?.id === currentUserId)
        : allDeals;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const activeDeals = deals.filter((d: any) => !["cancelled", "refused"].includes(d.stage));
      const totalValue = activeDeals.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);

      // Calculate days in stage
      const withDays = activeDeals.map((d: any) => {
        const updated = new Date(d.updated_at || d.created_at);
        const days = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
        return { ...d, daysInStage: days };
      });

      const stuckDeals = withDays.filter((d: any) => d.daysInStage >= STUCK_THRESHOLD_DAYS && !CLOSED_STAGES.includes(d.stage));
      const hotDeals = withDays.filter((d: any) => ["negotiation", "waiting_po", "quotation"].includes(d.stage));
      const closedThisMonth = deals.filter((d: any) => CLOSED_STAGES.includes(d.stage) && d.updated_at >= monthStart);
      const closedValue = closedThisMonth.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
      const avgDays = withDays.length > 0 ? Math.round(withDays.reduce((s: number, d: any) => s + d.daysInStage, 0) / withDays.length) : 0;

      // Build insights for top priority deals
      const priorityDeals = [...withDays]
        .filter((d: any) => !CLOSED_STAGES.includes(d.stage))
        .sort((a: any, b: any) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 6);

      const insights: DealInsight[] = priorityDeals.map((d: any) => {
        let risk: "low" | "medium" | "high" = "low";
        let suggestion = "";
        if (d.daysInStage >= 21) { risk = "high"; suggestion = lang === "th" ? "ค้างนานมาก ควรติดตามด่วน!" : "Stuck too long, follow up ASAP!"; }
        else if (d.daysInStage >= STUCK_THRESHOLD_DAYS) { risk = "medium"; suggestion = lang === "th" ? "เริ่มค้าง ควรติดตาม" : "Getting stale, follow up soon"; }
        else if (["negotiation", "waiting_po"].includes(d.stage)) { suggestion = lang === "th" ? "ใกล้ปิดแล้ว ผลักดันต่อ!" : "Almost closed, keep pushing!"; }
        else { suggestion = lang === "th" ? "ดำเนินการปกติ" : "On track"; }
        return {
          id: d.id, title: d.title || "Untitled", stage: d.stage,
          value: Number(d.value) || 0, client: d.customers?.company_name || d.client_name || "-",
          daysInStage: d.daysInStage, risk, suggestion,
        };
      });

      setSnapshot({
        totalDeals: activeDeals.length, totalValue, avgDaysInStage: avgDays,
        stuckDeals: stuckDeals.length, hotDeals: hotDeals.length,
        closedThisMonth: closedThisMonth.length, closedValue, insights, loading: false,
      });
    } catch {
      setSnapshot(s => ({ ...s, loading: false }));
    }
  }, [lang]);

  useEffect(() => { fetchSnapshot(); }, [fetchSnapshot]);

  // Send message to AI
  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput("");
    setAiError(null);

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch("/api/ai/sales-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) { setAiError(L("aiNotConfigured")); }
        throw new Error(data.error || "AI error");
      }
      const aiMsg: ChatMessage = { role: "assistant", content: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      if (!aiError) {
        const errMsg: ChatMessage = { role: "assistant", content: L("errorMsg"), timestamp: new Date() };
        setMessages(prev => [...prev, errMsg]);
      }
    } finally {
      setSending(false);
    }
  };

  const askAboutDeal = (dealId: string, title: string) => {
    const msg = lang === "th"
      ? `วิเคราะห์ดีล "${title}" ให้หน่อย พร้อมแนะนำกลยุทธ์ next step`
      : `Analyze the deal "${title}" and suggest next step strategy`;
    sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const riskColor = (r: string) => r === "high" ? "#EF4444" : r === "medium" ? "#F59E0B" : "#10B981";
  const riskBg = (r: string) => r === "high" ? "bg-red-50" : r === "medium" ? "bg-amber-50" : "bg-green-50";
  const fmtValue = (v: number) => v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : String(v);

  const quickActions = [
    { key: "q_analyze", icon: BarChart3 },
    { key: "q_stuck", icon: AlertTriangle },
    { key: "q_priority", icon: Target },
    { key: "q_email", icon: MessageSquare },
    { key: "q_meeting", icon: Users },
    { key: "q_forecast", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #003087, #00AEEF)" }}>
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{L("title")}</h1>
            <p className="text-xs text-gray-500">{L("subtitle")}</p>
          </div>
        </div>
        <button onClick={fetchSnapshot} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-[#003087] bg-white border border-gray-200 rounded-lg hover:border-[#003087]/30 transition">
          <RefreshCcw size={13} /> {L("refresh")}
        </button>
      </div>

      {/* LINE Proposal Auto-Gen Banner */}
      <a href="https://lin.ee/O9LF81d" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl border border-[#06C755]/30 bg-gradient-to-r from-[#06C755]/10 to-[#06C755]/5 hover:from-[#06C755]/20 hover:to-[#06C755]/10 transition group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M12 2C6.48 2 2 5.83 2 10.5c0 3.77 3.01 6.96 7.12 7.93.28.06.58.1.88.14V22l3.54-3.07c.33.02.66.07 1 .07C18.52 19 22 15.17 22 10.5 22 5.83 17.52 2 12 2z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#06C755] group-hover:text-[#05a848]">{L("proposalGen")}</div>
          <div className="text-xs text-gray-500 truncate">{L("proposalDesc")}</div>
        </div>
        <ArrowRight size={16} className="text-[#06C755] group-hover:translate-x-1 transition-transform flex-shrink-0" />
      </a>

      {/* Sales Overview Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 size={15} className="text-[#003087]" /> {L("overview")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: L("totalDeals"), value: snapshot.totalDeals, icon: Briefcase, color: "#003087", bg: "bg-blue-50" },
            { label: L("pipelineValue"), value: "฿" + fmtValue(snapshot.totalValue), icon: DollarSign, color: "#10B981", bg: "bg-emerald-50" },
            { label: L("stuckDeals"), value: snapshot.stuckDeals, icon: AlertTriangle, color: "#EF4444", bg: "bg-red-50" },
            { label: L("hotDeals"), value: snapshot.hotDeals, icon: TrendingUp, color: "#F59E0B", bg: "bg-amber-50" },
            { label: L("closedMonth"), value: snapshot.closedThisMonth, icon: Target, color: "#8B5CF6", bg: "bg-purple-50" },
            { label: L("closedValue"), value: "฿" + fmtValue(snapshot.closedValue), icon: DollarSign, color: "#059669", bg: "bg-green-50" },
          ].map((card, i) => (
            <div key={i} className={`${card.bg} rounded-xl p-3 text-center`}>
              {snapshot.loading ? (
                <Loader2 size={20} className="animate-spin mx-auto text-gray-300 my-2" />
              ) : (
                <>
                  <card.icon size={18} className="mx-auto mb-1" style={{ color: card.color }} />
                  <div className="text-lg font-bold" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{card.label}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Deal Insights */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-[#F7941D]" /> {L("aiInsights")}
        </h2>
        {snapshot.loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : snapshot.insights.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-8 bg-gray-50 rounded-xl">{L("noDeals")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {snapshot.insights.map(deal => (
              <div key={deal.id} className={`${riskBg(deal.risk)} rounded-xl p-4 border border-gray-100 hover:shadow-md transition`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{deal.title}</div>
                    <div className="text-xs text-gray-500 truncate">{deal.client}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0" style={{ background: riskColor(deal.risk) + "20", color: riskColor(deal.risk) }}>
                    {L("risk_" + deal.risk)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                  <span className="px-2 py-0.5 bg-white/80 rounded">{stageLabel(deal.stage)}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {deal.daysInStage} {L("days")}</span>
                  <span className="font-medium">{"฿"}{deal.value != null ? deal.value.toLocaleString() : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600 italic flex-1">{deal.suggestion}</p>
                  <button onClick={() => askAboutDeal(deal.id, deal.title)}
                    className="flex items-center gap-1 text-xs text-[#003087] hover:text-blue-700 font-medium ml-2 flex-shrink-0">
                    {L("analyzeDeal")} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat with AI */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #003087 0%, #0050B3 100%)" }}>
          <MessageSquare size={16} className="text-white" />
          <h2 className="text-sm font-semibold text-white">{L("askAI")}</h2>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="text-xs text-gray-500 mb-2">{L("quickActions")}</div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(qa => (
              <button key={qa.key} onClick={() => sendMessage(L(qa.key))}
                disabled={sending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full hover:border-[#003087]/40 hover:text-[#003087] transition text-gray-600 disabled:opacity-50">
                <qa.icon size={12} /> {L(qa.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4" style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)" }}>
          {messages.length === 0 && !sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #003087, #00AEEF)" }}>
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-gray-100 max-w-[85%]">
                <p className="text-sm text-gray-700 leading-relaxed">{L("welcomeMsg")}</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #003087, #00AEEF)" }}>
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div className={`rounded-2xl p-4 max-w-[85%] ${
                msg.role === "user"
                  ? "bg-[#003087] text-white rounded-tr-sm"
                  : "bg-white shadow-sm border border-gray-100 rounded-tl-sm"
              }`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "text-white" : "text-gray-700"}`}>
                  {msg.content}
                </p>
                <div className={`text-[10px] mt-2 ${msg.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                  {msg.timestamp.toLocaleTimeString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-600 text-xs font-bold">
                  You
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #003087, #00AEEF)" }}>
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> {L("thinking")}
                </div>
              </div>
            </div>
          )}

          {aiError && (
            <div className="mx-auto text-center text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-2 max-w-md">
              {aiError}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={L("placeholder")}
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#003087] outline-none transition bg-gray-50 text-gray-800 placeholder-gray-400"
              style={{ maxHeight: "120px" }}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #003087, #0050B3)" }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
