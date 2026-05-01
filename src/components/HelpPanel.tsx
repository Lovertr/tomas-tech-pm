"use client";
import { useState, useRef, useEffect } from "react";
import {
  BookOpen, Search, ChevronDown, ChevronRight, Download, Send,
  Bot, User, Loader2, ExternalLink, Rocket, LayoutDashboard,
  FolderKanban, ListTodo, Users, Building2, Wallet, Link2, Settings, CalendarDays,
} from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { HELP_SECTIONS, type HelpSection, type HelpArticle, getAllArticles } from "@/lib/helpContent";

interface Props { lang: Lang; }

const t = {
  th: {
    title: "ศูนย์ช่วยเหลือ", subtitle: "คู่มือผู้ใช้งาน TOMAS TECH PM",
    searchPlaceholder: "ค้นหาคู่มือ...", askAI: "ถาม AI", downloadPDF: "ดาวน์โหลดคู่มือ",
    askPlaceholder: "พิมพ์คำถามของคุณ...", noResults: "ไม่พบผลลัพธ์",
    aiThinking: "กำลังคิด...", aiTitle: "ถาม-ตอบ AI", backToList: "กลับ",
    allTopics: "หัวข้อทั้งหมด", aiWelcome: "สวัสดีครับ! ผมพร้อมตอบคำถามเกี่ยวกับระบบ TOMAS TECH PM ครับ",
  },
  en: {
    title: "Help Center", subtitle: "TOMAS TECH PM User Manual",
    searchPlaceholder: "Search manual...", askAI: "Ask AI", downloadPDF: "Download Manual",
    askPlaceholder: "Type your question...", noResults: "No results found",
    aiThinking: "Thinking...", aiTitle: "AI Q&A", backToList: "Back",
    allTopics: "All Topics", aiWelcome: "Hello! I'm ready to answer your questions about TOMAS TECH PM.",
  },
  jp: {
    title: "ヘルプセンター", subtitle: "TOMAS TECH PM ユーザーマニュアル",
    searchPlaceholder: "マニュアルを検索...", askAI: "AIに質問", downloadPDF: "マニュアルダウンロード",
    askPlaceholder: "質問を入力...", noResults: "結果が見つかりません",
    aiThinking: "考え中...", aiTitle: "AI Q&A", backToList: "戻る",
    allTopics: "すべてのトピック", aiWelcome: "こんにちは！TOMAS TECH PMに関するご質問にお答えします。",
  },
};

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket, LayoutDashboard, FolderKanban, ListTodo, Users, Building2, Wallet, Link2, Settings, CalendarDays,
};

interface ChatMsg { role: "user" | "ai"; text: string; }

export default function HelpPanel({ lang }: Props) {
  const l = t[lang] || t.th;
  const lk = lang === "jp" ? "jp" : lang === "en" ? "en" : "th";

  // States
  const [searchQ, setSearchQ] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showAI, setShowAI] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([{ role: "ai", text: l.aiWelcome }]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  // Search
  const allArticles = getAllArticles();
  const filtered = searchQ.trim()
    ? allArticles.filter(a => {
        const q = searchQ.toLowerCase();
        return a.title[lk].toLowerCase().includes(q) ||
               a.content[lk].toLowerCase().includes(q) ||
               a.tags.some(t => t.toLowerCase().includes(q));
      })
    : [];

  const toggleSection = (id: string) => setExpandedSections(s => ({ ...s, [id]: !s[id] }));

  // Get article to display
  const currentArticle = selectedArticle
    ? allArticles.find(a => a.id === selectedArticle) ?? null
    : null;

  // AI Chat
  const sendAI = async () => {
    const q = chatInput.trim();
    if (!q || aiLoading) return;
    setChatMsgs(m => [...m, { role: "user", text: q }]);
    setChatInput("");
    setAiLoading(true);
    try {
      const res = await fetch("/api/help/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, lang: lk }),
      });
      const data = await res.json();
      setChatMsgs(m => [...m, { role: "ai", text: data.answer || data.error || "Error" }]);
    } catch {
      setChatMsgs(m => [...m, { role: "ai", text: "Connection error" }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = () => {
    window.open(`/api/help/pdf?lang=${lk}`, "_blank");
  };

  // ── Render article content ──
  const renderContent = (article: HelpArticle) => (
    <div className="prose max-w-none">
      {article.content[lk].split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        if (line.startsWith("•")) return <p key={i} className="pl-4 text-gray-700 text-sm">{line}</p>;
        return <p key={i} className="text-gray-700 text-sm">{line}</p>;
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#003087] flex items-center gap-2">
            <BookOpen size={24} /> {l.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{l.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAI(!showAI)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition ${showAI ? "bg-[#003087] text-white" : "bg-blue-50 text-[#003087] hover:bg-blue-100"}`}>
            <Bot size={16} /> {l.askAI}
          </button>
          <button onClick={downloadPDF}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-orange-50 text-[#F7941D] hover:bg-orange-100 transition">
            <Download size={16} /> {l.downloadPDF}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
          placeholder={l.searchPlaceholder} value={searchQ} onChange={e => { setSearchQ(e.target.value); setSelectedArticle(null); setSelectedSection(null); }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Topics / Search Results */}
        <div className={`${showAI ? "lg:col-span-1" : "lg:col-span-1"} space-y-2`}>
          {searchQ.trim() ? (
            // Search results
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">{filtered.length} {l.noResults.includes("ไม่") ? "ผลลัพธ์" : "results"}</h3>
              {filtered.length === 0 && <p className="text-sm text-gray-400">{l.noResults}</p>}
              {filtered.map(a => (
                <button key={a.id} onClick={() => { setSelectedArticle(a.id); setSelectedSection(a.sectionId); }}
                  className={`w-full text-left p-2.5 rounded-lg text-sm transition ${selectedArticle === a.id ? "bg-blue-50 text-[#003087] font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
                  {a.title[lk]}
                </button>
              ))}
            </div>
          ) : (
            // Section list
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600">{l.allTopics}</h3>
              </div>
              {HELP_SECTIONS.map(s => {
                const Icon = ICON_MAP[s.icon] || BookOpen;
                const expanded = expandedSections[s.id] ?? false;
                return (
                  <div key={s.id} className="border-b border-gray-50 last:border-0">
                    <button onClick={() => toggleSection(s.id)}
                      className={`w-full flex items-center gap-2 p-3 text-sm text-left transition ${selectedSection === s.id ? "bg-blue-50 text-[#003087]" : "hover:bg-gray-50 text-gray-700"}`}>
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Icon size={16} className="text-[#003087]" />
                      <span className="font-medium">{s.title[lk]}</span>
                      <span className="ml-auto text-xs text-gray-400">{s.articles.length}</span>
                    </button>
                    {expanded && (
                      <div className="pl-9 pb-2 space-y-0.5">
                        {s.articles.map(a => (
                          <button key={a.id} onClick={() => { setSelectedArticle(a.id); setSelectedSection(s.id); }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${selectedArticle === a.id ? "bg-blue-100 text-[#003087] font-medium" : "hover:bg-gray-50 text-gray-600"}`}>
                            {a.title[lk]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: Article content */}
        <div className={`${showAI ? "lg:col-span-1" : "lg:col-span-2"}`}>
          {currentArticle ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-[#003087] mb-4">{currentArticle.title[lk]}</h3>
              {renderContent(currentArticle)}
            </div>
          ) : (
            // Landing: show section cards
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HELP_SECTIONS.map(s => {
                const Icon = ICON_MAP[s.icon] || BookOpen;
                return (
                  <button key={s.id} onClick={() => { toggleSection(s.id); setSelectedSection(s.id); if (s.articles[0]) setSelectedArticle(s.articles[0].id); }}
                    className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md hover:border-[#003087]/30 transition group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-[#003087] transition">
                        <Icon size={20} className="text-[#003087] group-hover:text-white transition" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{s.title[lk]}</h4>
                        <p className="text-xs text-gray-400">{s.articles.length} {lk === "th" ? "บทความ" : lk === "jp" ? "記事" : "articles"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        {showAI && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[500px]">
              <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <Bot size={18} className="text-[#003087]" />
                <h3 className="text-sm font-semibold text-[#003087]">{l.aiTitle}</h3>
              </div>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "ai" && <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><Bot size={14} className="text-[#003087]" /></div>}
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[#003087] text-white" : "bg-gray-50 text-gray-700"}`}>
                      {m.text.split("\n").map((line, j) => <p key={j} className={j > 0 ? "mt-1" : ""}>{line}</p>)}
                    </div>
                    {m.role === "user" && <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0"><User size={14} className="text-[#F7941D]" /></div>}
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"><Bot size={14} className="text-[#003087]" /></div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> {l.aiThinking}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Chat input */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <input type="text" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20"
                    placeholder={l.askPlaceholder} value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI(); }}} />
                  <button onClick={sendAI} disabled={aiLoading || !chatInput.trim()}
                    className="px-3 py-2 bg-[#003087] text-white rounded-lg hover:bg-[#002266] disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
