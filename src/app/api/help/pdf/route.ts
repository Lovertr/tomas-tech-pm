import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { HELP_SECTIONS } from "@/lib/helpContent";

// Generate a simple HTML-to-PDF-friendly page for the user manual
export async function GET(req: NextRequest) {
  const token = getSessionFromCookie(req.cookies);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("token", token)
    .single();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lang = (req.nextUrl.searchParams.get("lang") ?? "th") as "th" | "en" | "jp";

  const titleMap = { th: "คู่มือผู้ใช้งาน — TOMAS TECH PM", en: "User Manual — TOMAS TECH PM", jp: "ユーザーマニュアル — TOMAS TECH PM" };

  const sections = HELP_SECTIONS.map(s => {
    const articles = s.articles.map(a => `
      <div class="article">
        <h3>${a.title[lang]}</h3>
        ${a.content[lang].split("\n").map(p => p.trim() ? `<p>${p}</p>` : "").join("")}
      </div>
    `).join("");
    return `<div class="section"><h2>${s.title[lang]}</h2>${articles}</div>`;
  }).join('<div class="page-break"></div>');

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<title>${titleMap[lang]}</title>
<style>
  @page { margin: 2cm; size: A4; }
  body { font-family: "Sarabun", "Noto Sans JP", "Segoe UI", sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.6; }
  .cover { text-align: center; padding: 120px 40px 60px; }
  .cover h1 { font-size: 28pt; color: #003087; margin-bottom: 8px; }
  .cover .subtitle { font-size: 14pt; color: #64748b; }
  .cover .company { font-size: 12pt; color: #F7941D; margin-top: 40px; font-weight: bold; }
  .cover .date { font-size: 10pt; color: #94a3b8; margin-top: 8px; }
  h2 { color: #003087; font-size: 16pt; border-bottom: 2px solid #00AEEF; padding-bottom: 4px; margin-top: 32px; }
  h3 { color: #1e40af; font-size: 13pt; margin-top: 20px; }
  p { margin: 4px 0; }
  .page-break { page-break-before: always; }
  .article { margin-bottom: 20px; }
  .toc { margin: 40px 0; }
  .toc h2 { border-bottom-color: #003087; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
  .toc li span { color: #003087; font-weight: 600; }
</style>
</head>
<body>
  <div class="cover">
    <h1>${titleMap[lang]}</h1>
    <div class="subtitle">${lang === "th" ? "ระบบบริหารจัดการโครงการ" : lang === "jp" ? "プロジェクト管理システム" : "Project Management System"}</div>
    <div class="company">TOMAS TECH CO., LTD.</div>
    <div class="date">${new Date().toLocaleDateString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <div class="page-break"></div>

  <div class="toc">
    <h2>${lang === "th" ? "สารบัญ" : lang === "jp" ? "目次" : "Table of Contents"}</h2>
    <ul>
      ${HELP_SECTIONS.map((s, i) => `<li><span>${i + 1}.</span> ${s.title[lang]}</li>`).join("")}
    </ul>
  </div>

  <div class="page-break"></div>

  ${sections}

  <div class="page-break"></div>
  <div style="text-align:center; color:#94a3b8; padding-top:60px;">
    <p>TOMAS TECH CO., LTD.</p>
    <p>${lang === "th" ? "สร้างโดยระบบอัตโนมัติ" : lang === "jp" ? "自動生成" : "Auto-generated"} — ${new Date().toISOString().slice(0, 10)}</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="TOMAS_TECH_User_Manual_${lang}.html"`,
    },
  });
}
