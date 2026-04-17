"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, FileArchive, Film, Music, File as FileIcon, Trash2, Download, Loader2 } from "lucide-react";

interface Attachment {
  id: string; task_id: string; file_name: string; file_path: string;
  file_size?: number | null; mime_type?: string | null; uploaded_by?: string | null;
  created_at?: string; url?: string | null;
  uploader?: { id: string; email: string } | null;
}

interface Props {
  taskId: string;
  canManage?: boolean;
  onChange?: () => void;
}

const fmtSize = (n?: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const iconFor = (mime?: string | null) => {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("audio/")) return Music;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z")) return FileArchive;
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("document") || mime.includes("sheet")) return FileText;
  return FileIcon;
};

export default function AttachmentsTab({ taskId, canManage = true, onChange }: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/tasks/${taskId}/attachments`);
      if (r.ok) { const d = await r.json(); setItems(d.attachments ?? []); }
    } finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upload = async (files: FileList | File[]) => {
    setErr(null); setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: fd });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || `Upload failed: ${f.name}`);
        }
      }
      await fetchAll();
      onChange?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("ลบไฟล์นี้?")) return;
    const r = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (r.ok) { fetchAll(); onChange?.(); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${dragOver ? "border-[#00AEEF] bg-[#00AEEF]/10" : "border-[#334155] hover:border-[#475569] bg-[#0F172A]/40"}`}
        >
          <input ref={inputRef} type="file" multiple className="hidden"
            onChange={(e) => e.target.files && upload(e.target.files)} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-slate-300 text-sm">
              <Loader2 size={18} className="animate-spin" /> กำลังอัปโหลด...
            </div>
          ) : (
            <div className="space-y-1">
              <Upload size={28} className="mx-auto text-slate-400" />
              <div className="text-sm text-slate-300">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</div>
              <div className="text-xs text-slate-500">สูงสุด 25 MB ต่อไฟล์</div>
            </div>
          )}
        </div>
      )}

      {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}

      {loading && !items.length && <div className="text-center text-sm text-slate-400 py-4">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center text-sm text-slate-500 py-6">ยังไม่มีไฟล์แนบ</div>
      )}

      <div className="space-y-2">
        {items.map((a) => {
          const Icon = iconFor(a.mime_type);
          const isImg = a.mime_type?.startsWith("image/");
          return (
            <div key={a.id} className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 flex items-center gap-3">
              {isImg && a.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={a.url} alt={a.file_name} className="w-12 h-12 rounded object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded bg-[#1E293B] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#00AEEF]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{a.file_name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{fmtSize(a.file_size)}</span>
                  {a.uploader?.email && <span>· {a.uploader.email}</span>}
                  {a.created_at && <span>· {new Date(a.created_at).toLocaleDateString("th-TH")}</span>}
                </div>
              </div>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer" download={a.file_name}
                  className="p-1.5 text-slate-400 hover:text-white" title="ดาวน์โหลด">
                  <Download size={16} />
                </a>
              )}
              {canManage && (
                <button onClick={() => remove(a.id)} className="p-1.5 text-red-400 hover:text-red-300" title="ลบ">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
