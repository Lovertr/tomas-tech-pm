"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Search, Plus, Edit3, Trash2, ChevronRight, Pin, Eye,
  Tag, Send, Bot, Loader2, ArrowLeft, X, Save, FolderOpen,
  Cpu, Truck, Warehouse, Factory, Settings, Layers, Monitor, HelpCircle,
} from "lucide-react";

// i18n
const L: Record<string, Record<string, string>> = {
  title: { th: "คลังความรู้", en: "Knowledge Base", jp: "ナレッジベース" },
  searchPlaceholder: { th: "ค้นหาบทความ...", en: "Search articles...", jp: "記事を検索..." },
  allCategories: { th: "ทั้งหมด", en: "All", jp: "すべて" },
  newArticle: { th: "บทความใหม่", en: "New Article", jp: "新規記事" },
  editArticle: { th: "แก้ไขบทความ", en: "Edit Article", jp: "記事を編集" },
  deleteConfirm: { th: "ยืนยันลบบทความนี้?", en: "Delete this article?", jp: "この記事を削除しますか？" },
  titleLabel: { th: "ชื่อบทความ (TH)", en: "Title (TH)", jp: "タイトル (TH)" },
  titleEn: { th: "ชื่อบทความ (EN)", en: "Title (EN)", jp: "タイトル (EN)" },
  titleJp: { th: "ชื่อบทความ (JP)", en: "Title (JP)", jp: "タイトル (JP)" },
  contentLabel: { th: "เนื้อหา (TH)", en: "Content (TH)", jp: "内容 (TH)" },
  contentEn: { th: "เนื้อหา (EN)", en: "Content (EN)", jp: "内容 (EN)" },
  contentJp: { th: "เนื้อหา (JP)", en: "Content (JP)", jp: "内容 (JP)" },
  category: { th: "หมวดหมู่", en: "Category", jp: "カテゴリ" },
  tags: { th: "แท็ก", en: "Tags", jp: "タグ" },
  tagsHint: { th: "คั่นด้วยคอมม่า", en: "Comma separated", jp: "カンマ区切り" },
  pinned: { th: "ปักหมุด", en: "Pinned", jp: "ピン留め" },
  save: { th: "บันทึก", en: "Save", jp: "保存" },
  cancel: { th: "ยกเลิก", en: "Cancel", jp: "キャンセル" },
  views: { th: "อ่าน", en: "views", jp: "閲覧" },
  articles: { th: "บทความ", en: "articles", jp: "記事" },
  noArticles: { th: "ยังไม่มีบทความ", en: "No articles yet", jp: "記事はまだありません" },
  aiAssistant: { th: "AI ถาม-ตอบ ความรู้", en: "AI Knowledge Q&A", jp: "AIナレッジQ&A" },
  aiPlaceholder: { th: "ถามเกี่ยวกับความรู้บริษัท...", en: "Ask about company knowledge...", jp: "会社のナレッジについて質問..." },
  aiThinking: { th: "กำลังค้นหาคำตอบ...", en: "Searching for answer...", jp: "回答を検索中..." },
  backToList: { th: "กลับ", en: "Back", jp: "戻る" },
  newCategory: { th: "หมวดใหม่", en: "New Category", jp: "新カテゴリ" },
  categoryName: { th: "ชื่อหมวด (TH)", en: "Category Name (TH)", jp: "カテゴリ名 (TH)" },
  categoryNameEn: { th: "ชื่อหมวด (EN)", en: "Category Name (EN)", jp: "カテゴリ名 (EN)" },
  noPermission: { th: "ไม่มีสิทธิ์แก้ไข", en: "No edit permission", jp: "編集権限がありません" },
  lastUpdated: { th: "อัปเดตล่าสุด", en: "Last updated", jp: "最終更新" },
};

const ICON_MAP: Record<string, any> = {
  Cpu, Truck, Warehouse, Factory, Settings, Layers, Monitor, BookOpen, HelpCircle, FolderOpen,
};

type Category = {
  id: string;
  name: string;
  name_en?: string;
  name_jp?: string;
  description?: string;
  icon: string;
  sort_order: number;
  article_count: number;
};

type Article = {
  id: string;
  category_id: string;
  title: string;
  title_en?: string;
  title_jp?: string;
  content: string;
  content_en?: string;
  content_jp?: string;
  tags: string[];
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; name_en?: string; name_jp?: string; icon: string };
};

type ChatMsg = { role: "user" | "assistant"; content: string };

type Props = { lang: string; canManage: boolean };

export default function KnowledgeBasePanel({ lang, canManage }: Props) {
  const t = (key: string) => L[key]?.[lang] || L[key]?.en || key;
  const langKey = lang as "th" | "en" | "jp";

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [editForm, setEditForm] = useState({
    title: "", title_en: "", title_jp: "",
    content: "", content_en: "", content_jp: "",
    category_id: "", tags: "", is_pinned: false,
  });
  const [saving, setSaving] = useState(false);

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", name_en: "", icon: "BookOpen" });

  // Fetch
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge-base/categories");
      if (res.ok) { const d = await res.json(); setCategories(d.categories || []); }
    } catch {}
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCat !== "all") params.set("category_id", selectedCat);
      if (search) params.set("search", search);
      const res = await fetch(`/api/knowledge-base?${params}`);
      if (res.ok) { const d = await res.json(); setArticles(d.articles || []); }
    } catch {} finally { setLoading(false); }
  }, [selectedCat, search]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Open article detail
  const openArticle = async (article: Article) => {
    try {
      const res = await fetch(`/api/knowledge-base/${article.id}`);
      if (res.ok) { const d = await res.json(); setSelectedArticle(d.article); }
      else setSelectedArticle(article);
    } catch { setSelectedArticle(article); }
  };

  // Editor
  const openNewArticle = () => {
    setEditForm({ title: "", title_en: "", title_jp: "", content: "", content_en: "", content_jp: "", category_id: selectedCat === "all" ? "" : selectedCat, tags: "", is_pinned: false });
    setEditMode(false);
    setShowEditor(true);
  };

  const openEditArticle = (article: Article) => {
    setEditForm({
      title: article.title, title_en: article.title_en || "", title_jp: article.title_jp || "",
      content: article.content, content_en: article.content_en || "", content_jp: article.content_jp || "",
      category_id: article.category_id || "", tags: (article.tags || []).join(", "), is_pinned: article.is_pinned,
    });
    setEditMode(true);
    setShowEditor(true);
  };

  const saveArticle = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      const url = editMode && selectedArticle ? `/api/knowledge-base/${selectedArticle.id}` : "/api/knowledge-base";
      const method = editMode && selectedArticle ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const d = await res.json();
        setShowEditor(false);
        if (editMode && selectedArticle) setSelectedArticle(d.article);
        fetchArticles();
        fetchCategories();
      }
    } catch {} finally { setSaving(false); }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/knowledge-base/${id}`, { method: "DELETE" });
      if (res.ok) { setSelectedArticle(null); fetchArticles(); fetchCategories(); }
    } catch {}
  };

  // Category save
  const saveCategory = async () => {
    if (!catForm.name.trim()) return;
    try {
      const res = await fetch("/api/knowledge-base/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
      if (res.ok) { setShowCatModal(false); setCatForm({ name: "", name_en: "", icon: "BookOpen" }); fetchCategories(); }
    } catch {}
  };

  // AI Chat
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/knowledge-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, categoryId: selectedCat, lang }),
      });
      if (res.ok) {
        const d = await res.json();
        setChatMessages(prev => [...prev, { role: "assistant", content: d.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: "เกิดข้อผิดพลาด กรุณาลองใหม่" }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "เกิดข้อผิดพลาด กรุณาลองใหม่" }]);
    } finally { setChatLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Helpers
  const getTitle = (a: Article) => langKey === "en" ? (a.title_en || a.title) : langKey === "jp" ? (a.title_jp || a.title) : a.title;
  const getContent = (a: Article) => {
    const raw = langKey === "en" ? (a.content_en || a.content) : langKey === "jp" ? (a.content_jp || a.content) : a.content;
    // Fix literal \n and \t that were stored as escaped strings
    return raw.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  };
  const getCatName = (c: Category | Article["category"]) => {
    if (!c) return "";
    return langKey === "en" ? (c.name_en || c.name) : langKey === "jp" ? (c.name_jp || c.name) : c.name;
  };
  const CatIcon = ({ iconName, size = 18 }: { iconName: string; size?: number }) => {
    const Icon = ICON_MAP[iconName] || BookOpen;
    return <Icon size={size} />;
  };

  // === RENDER ===

  // Article Detail View
  if (selectedArticle && !showEditor) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-[#E2E8F0]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#E2E8F0]">
          <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-1 text-sm text-[#003087] hover:text-[#F7941D] transition">
            <ArrowLeft size={16} />{t("backToList")}
          </button>
          <div className="flex-1" />
          {canManage && (
            <div className="flex gap-2">
              <button onClick={() => openEditArticle(selectedArticle)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-[#003087] rounded-lg hover:bg-blue-100 transition"><Edit3 size={14} />{t("editArticle")}</button>
              <button onClick={() => deleteArticle(selectedArticle.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              {selectedArticle.is_pinned && <Pin size={14} className="text-[#F7941D]" />}
              {selectedArticle.category && (
                <span className="flex items-center gap-1 text-xs bg-blue-50 text-[#003087] px-2 py-0.5 rounded-full">
                  <CatIcon iconName={selectedArticle.category.icon} size={12} />
                  {getCatName(selectedArticle.category)}
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12} />{selectedArticle.view_count} {t("views")}</span>
              <span className="text-xs text-gray-400">{t("lastUpdated")}: {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{getTitle(selectedArticle)}</h1>
            {(selectedArticle.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedArticle.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"><Tag size={10} />{tag}</span>
                ))}
              </div>
            )}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">{getContent(selectedArticle)}</div>
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  if (showEditor) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-[#E2E8F0]">
        <div className="flex items-center gap-3 p-4 border-b border-[#E2E8F0]">
          <button onClick={() => setShowEditor(false)} className="flex items-center gap-1 text-sm text-[#003087] hover:text-[#F7941D] transition"><ArrowLeft size={16} />{t("cancel")}</button>
          <h2 className="text-lg font-bold text-gray-800">{editMode ? t("editArticle") : t("newArticle")}</h2>
          <div className="flex-1" />
          <button onClick={saveArticle} disabled={saving || !editForm.title.trim()} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{t("save")}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("category")}</label>
              <select value={editForm.category_id} onChange={e => setEditForm(p => ({ ...p, category_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20">
                <option value="">{t("allCategories")}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{getCatName(c)}</option>)}
              </select>
            </div>
            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("titleLabel")} *</label><input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("titleEn")}</label><input value={editForm.title_en} onChange={e => setEditForm(p => ({ ...p, title_en: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("titleJp")}</label><input value={editForm.title_jp} onChange={e => setEditForm(p => ({ ...p, title_jp: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" /></div>
            </div>
            {/* Content TH */}
            <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("contentLabel")} *</label><textarea value={editForm.content} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))} rows={10} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 resize-y" /></div>
            {/* Content EN */}
            <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("contentEn")}</label><textarea value={editForm.content_en} onChange={e => setEditForm(p => ({ ...p, content_en: e.target.value }))} rows={6} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 resize-y" /></div>
            {/* Content JP */}
            <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("contentJp")}</label><textarea value={editForm.content_jp} onChange={e => setEditForm(p => ({ ...p, content_jp: e.target.value }))} rows={6} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20 resize-y" /></div>
            {/* Tags + Pin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("tags")} <span className="text-gray-400">({t("tagsHint")})</span></label><input value={editForm.tags} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" placeholder="IoT, WMS, PLC" /></div>
              <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editForm.is_pinned} onChange={e => setEditForm(p => ({ ...p, is_pinned: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-[#003087] focus:ring-[#003087]" /><span className="text-sm text-gray-600"><Pin size={14} className="inline mr-1" />{t("pinned")}</span></label></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* Left: Categories + AI */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-3">
        {/* Category List */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">{t("category")}</h3>
            {canManage && <button onClick={() => setShowCatModal(true)} className="text-[#003087] hover:text-[#F7941D] transition"><Plus size={16} /></button>}
          </div>
          <button onClick={() => setSelectedCat("all")} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition mb-1 ${selectedCat === "all" ? "bg-[#003087] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            <FolderOpen size={16} /><span className="flex-1 text-left">{t("allCategories")}</span>
            <span className="text-xs opacity-70">{articles.length}</span>
          </button>
          <div className="space-y-0.5 max-h-[40vh] overflow-y-auto">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${selectedCat === cat.id ? "bg-[#003087] text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                <CatIcon iconName={cat.icon} size={16} />
                <span className="flex-1 text-left truncate">{getCatName(cat)}</span>
                <span className="text-xs opacity-70">{cat.article_count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Chat Toggle */}
        <button onClick={() => setChatOpen(!chatOpen)} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#003087] to-[#0050B3] text-white rounded-2xl shadow-sm hover:shadow-md transition text-sm font-medium">
          <Bot size={18} />{t("aiAssistant")}
          <ChevronRight size={14} className={`ml-auto transition ${chatOpen ? "rotate-90" : ""}`} />
        </button>

        {/* AI Chat Panel */}
        {chatOpen && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col" style={{ height: "350px" }}>
            <div className="p-3 border-b border-[#E2E8F0] flex items-center gap-2">
              <Bot size={16} className="text-[#003087]" />
              <span className="text-sm font-medium text-gray-700">{t("aiAssistant")}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-center text-xs text-gray-400 mt-8">{t("aiPlaceholder")}</div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-700"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />{t("aiThinking")}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2 border-t border-[#E2E8F0] flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder={t("aiPlaceholder")} className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="p-2 bg-[#003087] text-white rounded-lg hover:bg-[#0050B3] transition disabled:opacity-50"><Send size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Article List */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col min-h-0">
        {/* Search + Actions */}
        <div className="flex items-center gap-3 p-4 border-b border-[#E2E8F0]">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" />
          </div>
          {canManage && (
            <button onClick={openNewArticle} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition hover:shadow-md" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>
              <Plus size={16} /><span className="hidden sm:inline">{t("newArticle")}</span>
            </button>
          )}
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32"><Loader2 size={24} className="animate-spin text-[#003087]" /></div>
          ) : articles.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noArticles")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map(article => (
                <button key={article.id} onClick={() => openArticle(article)} className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-[#003087]/20 hover:bg-blue-50/30 transition group">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {article.is_pinned && <Pin size={12} className="text-[#F7941D] flex-shrink-0" />}
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[#003087] transition truncate">{getTitle(article)}</h3>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{getContent(article).slice(0, 150)}...</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.category && (
                          <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-[#003087] px-2 py-0.5 rounded-full">
                            <CatIcon iconName={article.category.icon} size={10} />{getCatName(article.category)}
                          </span>
                        )}
                        {(article.tags || []).slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Eye size={10} />{article.view_count}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#003087] flex-shrink-0 mt-1 transition" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{t("newCategory")}</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("categoryName")} *</label><input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{t("categoryNameEn")}</label><input value={catForm.name_en} onChange={e => setCatForm(p => ({ ...p, name_en: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003087]/20" /></div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(ICON_MAP).map(name => (
                    <button key={name} onClick={() => setCatForm(p => ({ ...p, icon: name }))} className={`p-2 rounded-lg border transition ${catForm.icon === name ? "border-[#003087] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <CatIcon iconName={name} size={18} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">{t("cancel")}</button>
              <button onClick={saveCategory} disabled={!catForm.name.trim()} className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
