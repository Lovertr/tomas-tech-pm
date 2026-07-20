"use client";
import { useEffect, useState, useCallback } from "react";
import { Car, Plus, Check, X, Clock, Truck, User, Calendar, MapPin, Filter, Edit3, Trash2, ChevronDown, AlertCircle, Eye } from "lucide-react";

type Lang = "th" | "en" | "jp";

interface Vehicle {
  id: string; license_plate: string; brand: string; model: string; color?: string;
  vehicle_type?: string; seat_count?: number; image_url?: string;
  mandatory_insurance_expiry?: string; voluntary_insurance_expiry?: string;
  voluntary_insurance_company?: string; voluntary_insurance_type?: string;
  current_mileage?: number; registration_date?: string; notes?: string;
  is_active?: boolean; created_at?: string;
}

interface Booking {
  id: string; vehicle_id: string; requester_id: string;
  start_datetime: string; end_datetime: string; destination: string;
  purpose: string; passenger_count?: number; mileage_before?: number;
  mileage_after?: number; status: string; approved_by?: string;
  approved_at?: string; rejection_reason?: string; notes?: string;
  vehicle?: { id: string; license_plate: string; brand: string; model: string; color?: string; vehicle_type?: string };
  requester?: { id: string; username: string; full_name?: string };
  approver?: { id: string; username: string; full_name?: string };
}

interface PersonalReq {
  id: string; requester_id: string; request_date: string; end_date?: string;
  reason: string; destination?: string; estimated_distance?: number;
  reimbursement_rate?: number; status: string; approved_by?: string;
  approved_at?: string; rejection_reason?: string; notes?: string;
  requester?: { id: string; username: string; full_name?: string };
  approver?: { id: string; username: string; full_name?: string };
}

const T: Record<string, Record<Lang, string>> = {
  title: { th: "ระบบจองรถ", en: "Vehicle Booking", jp: "車両予約" },
  companyVehicles: { th: "จองรถบริษัท", en: "Company Vehicle", jp: "社用車予約" },
  personalVehicle: { th: "ขอใช้รถส่วนตัว", en: "Personal Vehicle", jp: "自家用車申請" },
  manageVehicles: { th: "จัดการรถ", en: "Manage Vehicles", jp: "車両管理" },
  addVehicle: { th: "เพิ่มรถ", en: "Add Vehicle", jp: "車両追加" },
  editVehicle: { th: "แก้ไขรถ", en: "Edit Vehicle", jp: "車両編集" },
  bookVehicle: { th: "จองรถ", en: "Book Vehicle", jp: "予約する" },
  requestPersonal: { th: "ขออนุญาต", en: "Request", jp: "申請する" },
  licensePlate: { th: "ทะเบียน", en: "License Plate", jp: "ナンバー" },
  brand: { th: "ยี่ห้อ", en: "Brand", jp: "メーカー" },
  model: { th: "รุ่น", en: "Model", jp: "モデル" },
  color: { th: "สี", en: "Color", jp: "色" },
  vehicleType: { th: "ประเภท", en: "Type", jp: "種類" },
  seatCount: { th: "ที่นั่ง", en: "Seats", jp: "座席数" },
  mileage: { th: "เลขไมล์", en: "Mileage", jp: "走行距離" },
  mandatoryIns: { th: "พ.ร.บ. หมดอายุ", en: "Mandatory Ins. Exp.", jp: "自賠責期限" },
  voluntaryIns: { th: "ประกันภัย หมดอายุ", en: "Voluntary Ins. Exp.", jp: "任意保険期限" },
  insCompany: { th: "บริษัทประกัน", en: "Insurance Company", jp: "保険会社" },
  insType: { th: "ประเภทประกัน", en: "Insurance Type", jp: "保険種類" },
  regDate: { th: "วันจดทะเบียน", en: "Registration Date", jp: "登録日" },
  destination: { th: "จุดหมาย", en: "Destination", jp: "行き先" },
  purpose: { th: "วัตถุประสงค์", en: "Purpose", jp: "目的" },
  startDate: { th: "วันเริ่มต้น", en: "Start Date", jp: "開始日" },
  endDate: { th: "วันสิ้นสุด", en: "End Date", jp: "終了日" },
  passengers: { th: "ผู้โดยสาร", en: "Passengers", jp: "乗車人数" },
  reason: { th: "เหตุผล", en: "Reason", jp: "理由" },
  distance: { th: "ระยะทาง (กม.)", en: "Distance (km)", jp: "距離 (km)" },
  notes: { th: "หมายเหตุ", en: "Notes", jp: "備考" },
  pending: { th: "รออนุมัติ", en: "Pending", jp: "承認待ち" },
  approved: { th: "อนุมัติแล้ว", en: "Approved", jp: "承認済み" },
  rejected: { th: "ปฏิเสธ", en: "Rejected", jp: "却下" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", jp: "キャンセル" },
  completed: { th: "เสร็จสิ้น", en: "Completed", jp: "完了" },
  approve: { th: "อนุมัติ", en: "Approve", jp: "承認" },
  reject: { th: "ปฏิเสธ", en: "Reject", jp: "却下" },
  cancel: { th: "ยกเลิก", en: "Cancel", jp: "取消" },
  complete: { th: "เสร็จสิ้น", en: "Complete", jp: "完了" },
  save: { th: "บันทึก", en: "Save", jp: "保存" },
  close: { th: "ปิด", en: "Close", jp: "閉じる" },
  all: { th: "ทั้งหมด", en: "All", jp: "全て" },
  requester: { th: "ผู้ขอ", en: "Requester", jp: "申請者" },
  approver: { th: "ผู้อนุมัติ", en: "Approved by", jp: "承認者" },
  rejectReason: { th: "เหตุผลปฏิเสธ", en: "Rejection Reason", jp: "却下理由" },
  mileageBefore: { th: "เลขไมล์ก่อนใช้", en: "Mileage Before", jp: "使用前距離" },
  mileageAfter: { th: "เลขไมล์หลังใช้", en: "Mileage After", jp: "使用後距離" },
  noVehicles: { th: "ยังไม่มีรถในระบบ", en: "No vehicles yet", jp: "車両がありません" },
  noBookings: { th: "ไม่มีรายการจอง", en: "No bookings", jp: "予約なし" },
  noRequests: { th: "ไม่มีคำขอ", en: "No requests", jp: "申請なし" },
  sedan: { th: "รถเก๋ง", en: "Sedan", jp: "セダン" },
  suv: { th: "SUV", en: "SUV", jp: "SUV" },
  van: { th: "รถตู้", en: "Van", jp: "バン" },
  pickup: { th: "กระบะ", en: "Pickup", jp: "ピックアップ" },
  truck: { th: "รถบรรทุก", en: "Truck", jp: "トラック" },
  requestDate: { th: "วันที่ขอ", en: "Request Date", jp: "申請日" },
  active: { th: "ใช้งาน", en: "Active", jp: "有効" },
  inactive: { th: "ไม่ใช้งาน", en: "Inactive", jp: "無効" },
  confirmDelete: { th: "ยืนยันปิดใช้งานรถคันนี้?", en: "Confirm deactivate this vehicle?", jp: "この車両を無効にしますか？" },
  imageUrl: { th: "URL รูปภาพ", en: "Image URL", jp: "画像URL" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
};

const VEHICLE_TYPES = ["sedan", "suv", "van", "pickup", "truck"];

export default function VehicleBookingPanel({
  lang = "th",
  role = "member",
  currentUserId,
}: {
  lang?: Lang;
  role?: string;
  currentUserId?: string;
}) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const canManage = role === "admin";
  const canApprove = role === "admin" || role === "manager";

  // Tab state
  const [tab, setTab] = useState<"booking" | "personal" | "manage">("booking");
  const [statusFilter, setStatusFilter] = useState("all");

  // Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [personalReqs, setPersonalReqs] = useState<PersonalReq[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ mileage_before: "", mileage_after: "" });
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [detailPersonal, setDetailPersonal] = useState<PersonalReq | null>(null);

  // Booking form
  const [bForm, setBForm] = useState({
    vehicle_id: "", start_datetime: "", end_datetime: "",
    destination: "", purpose: "", passenger_count: "1", notes: "",
  });

  // Personal request form
  const [pForm, setPForm] = useState({
    request_date: "", end_date: "", reason: "",
    destination: "", estimated_distance: "", notes: "",
  });

  // Vehicle form
  const [vForm, setVForm] = useState({
    license_plate: "", brand: "", model: "", color: "", vehicle_type: "sedan",
    seat_count: "5", image_url: "", mandatory_insurance_expiry: "",
    voluntary_insurance_expiry: "", voluntary_insurance_company: "",
    voluntary_insurance_type: "", current_mileage: "0", registration_date: "", notes: "",
  });

  // Fetch data
  const fetchVehicles = useCallback(async () => {
    const url = canManage ? "/api/vehicles?all=true" : "/api/vehicles";
    const r = await fetch(url);
    if (r.ok) { const d = await r.json(); setVehicles(d.vehicles || []); }
  }, [canManage]);

  const fetchBookings = useCallback(async () => {
    const r = await fetch("/api/vehicle-bookings");
    if (r.ok) { const d = await r.json(); setBookings(d.bookings || []); }
  }, []);

  const fetchPersonal = useCallback(async () => {
    const r = await fetch("/api/personal-vehicle-requests");
    if (r.ok) { const d = await r.json(); setPersonalReqs(d.requests || []); }
  }, []);

  useEffect(() => {
    Promise.all([fetchVehicles(), fetchBookings(), fetchPersonal()]).finally(() => setLoading(false));
  }, [fetchVehicles, fetchBookings, fetchPersonal]);

  // Actions: Booking
  const submitBooking = async () => {
    if (!bForm.vehicle_id || !bForm.start_datetime || !bForm.end_datetime || !bForm.destination || !bForm.purpose) return;
    const r = await fetch("/api/vehicle-bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bForm, passenger_count: Number(bForm.passenger_count) || 1 }),
    });
    if (r.ok) {
      setShowBookingForm(false);
      setBForm({ vehicle_id: "", start_datetime: "", end_datetime: "", destination: "", purpose: "", passenger_count: "1", notes: "" });
      fetchBookings();
    } else { const d = await r.json(); alert(d.error); }
  };

  const bookingAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    const r = await fetch("/api/vehicle-bookings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    if (r.ok) { fetchBookings(); setRejectingId(null); setRejectReason(""); setCompletingId(null); setCompleteForm({ mileage_before: "", mileage_after: "" }); }
    else { const d = await r.json(); alert(d.error); }
  };

  // Actions: Personal
  const submitPersonal = async () => {
    if (!pForm.request_date || !pForm.reason) return;
    const r = await fetch("/api/personal-vehicle-requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pForm,
        estimated_distance: pForm.estimated_distance ? Number(pForm.estimated_distance) : null,
      }),
    });
    if (r.ok) {
      setShowPersonalForm(false);
      setPForm({ request_date: "", end_date: "", reason: "", destination: "", estimated_distance: "", notes: "" });
      fetchPersonal();
    } else { const d = await r.json(); alert(d.error); }
  };

  const personalAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    const r = await fetch("/api/personal-vehicle-requests", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    if (r.ok) { fetchPersonal(); setRejectingId(null); setRejectReason(""); }
    else { const d = await r.json(); alert(d.error); }
  };

  // Actions: Vehicle CRUD
  const submitVehicle = async () => {
    if (!vForm.license_plate || !vForm.brand || !vForm.model) return;
    const payload = {
      ...vForm,
      seat_count: Number(vForm.seat_count) || 5,
      current_mileage: Number(vForm.current_mileage) || 0,
    };
    const method = editingVehicle ? "PUT" : "POST";
    const body = editingVehicle ? { id: editingVehicle.id, ...payload } : payload;
    const r = await fetch("/api/vehicles", {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setShowVehicleForm(false); setEditingVehicle(null);
      setVForm({ license_plate: "", brand: "", model: "", color: "", vehicle_type: "sedan", seat_count: "5", image_url: "", mandatory_insurance_expiry: "", voluntary_insurance_expiry: "", voluntary_insurance_company: "", voluntary_insurance_type: "", current_mileage: "0", registration_date: "", notes: "" });
      fetchVehicles();
    } else { const d = await r.json(); alert(d.error); }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm(L("confirmDelete"))) return;
    const r = await fetch(`/api/vehicles?id=${id}`, { method: "DELETE" });
    if (r.ok) fetchVehicles();
  };

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVForm({
      license_plate: v.license_plate, brand: v.brand, model: v.model,
      color: v.color || "", vehicle_type: v.vehicle_type || "sedan",
      seat_count: String(v.seat_count ?? 5), image_url: v.image_url || "",
      mandatory_insurance_expiry: v.mandatory_insurance_expiry?.split("T")[0] || "",
      voluntary_insurance_expiry: v.voluntary_insurance_expiry?.split("T")[0] || "",
      voluntary_insurance_company: v.voluntary_insurance_company || "",
      voluntary_insurance_type: v.voluntary_insurance_type || "",
      current_mileage: String(v.current_mileage ?? 0),
      registration_date: v.registration_date?.split("T")[0] || "", notes: v.notes || "",
    });
    setShowVehicleForm(true);
  };

  // Filtered data
  const filteredBookings = statusFilter === "all" ? bookings : bookings.filter(b => b.status === statusFilter);
  const filteredPersonal = statusFilter === "all" ? personalReqs : personalReqs.filter(p => p.status === statusFilter);
  const activeVehicles = vehicles.filter(v => v.is_active !== false);

  const fmtDate = (d?: string) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d.split("T")[0]; }
  };

  const fmtDateTime = (d?: string) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return d; }
  };

  const getName = (u?: { username: string; full_name?: string }) => u?.full_name || u?.username || "-";

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0072B8]" /></div>;

  // ── TABS ──
  const tabs = [
    { key: "booking" as const, label: L("companyVehicles"), icon: Car },
    { key: "personal" as const, label: L("personalVehicle"), icon: User },
    ...(canManage ? [{ key: "manage" as const, label: L("manageVehicles"), icon: Truck }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Car className="text-[#0072B8]" size={22} /> {L("title")}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setStatusFilter("all"); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? "bg-white text-[#0072B8] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      {tab !== "manage" && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400" />
          {["all", "pending", "approved", "rejected", ...(tab === "booking" ? ["completed", "cancelled"] : ["cancelled"])].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === s ? "bg-[#0072B8] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {L(s)}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════ TAB 1: Company Vehicle Booking ═══════════ */}
      {tab === "booking" && (
        <div className="space-y-4">
          <button onClick={() => setShowBookingForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0072B8] text-white rounded-lg hover:bg-[#002570] text-sm font-medium transition-colors">
            <Plus size={16} /> {L("bookVehicle")}
          </button>

          {/* Booking Form Modal */}
          {showBookingForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowBookingForm(false)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800">{L("bookVehicle")}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("licensePlate")} *</label>
                    <select value={bForm.vehicle_id} onChange={e => setBForm({ ...bForm, vehicle_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]">
                      <option value="">-- {lang === "th" ? "เลือกรถ" : "Select"} --</option>
                      {activeVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.license_plate} — {v.brand} {v.model} {v.color ? `(${v.color})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("startDate")} *</label>
                      <input type="datetime-local" value={bForm.start_datetime} onChange={e => setBForm({ ...bForm, start_datetime: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("endDate")} *</label>
                      <input type="datetime-local" value={bForm.end_datetime} onChange={e => setBForm({ ...bForm, end_datetime: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("destination")} *</label>
                    <input type="text" value={bForm.destination} onChange={e => setBForm({ ...bForm, destination: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("purpose")} *</label>
                    <textarea value={bForm.purpose} onChange={e => setBForm({ ...bForm, purpose: e.target.value })} rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("passengers")}</label>
                      <input type="number" min={1} value={bForm.passenger_count} onChange={e => setBForm({ ...bForm, passenger_count: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("notes")}</label>
                    <textarea value={bForm.notes} onChange={e => setBForm({ ...bForm, notes: e.target.value })} rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowBookingForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{L("close")}</button>
                  <button onClick={submitBooking} className="px-4 py-2 text-sm bg-[#0072B8] text-white rounded-lg hover:bg-[#002570]">{L("save")}</button>
                </div>
              </div>
            </div>
          )}

          {/* Booking List */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Car size={40} className="mx-auto mb-2 opacity-30" />
              <p>{L("noBookings")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status] || ""}`}>{L(b.status)}</span>
                        {b.vehicle && <span className="text-sm font-semibold text-gray-800">{b.vehicle.license_plate} — {b.vehicle.brand} {b.vehicle.model}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {b.destination}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDateTime(b.start_datetime)} → {fmtDateTime(b.end_datetime)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{b.purpose}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{L("requester")}: {getName(b.requester)}</span>
                        {b.approver && <span>{L("approver")}: {getName(b.approver)}</span>}
                        {b.rejection_reason && <span className="text-red-500">{L("rejectReason")}: {b.rejection_reason}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setDetailBooking(b)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Eye size={16} /></button>
                      {canApprove && b.status === "pending" && (
                        <>
                          <button onClick={() => bookingAction(b.id, "approve")} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title={L("approve")}><Check size={16} /></button>
                          <button onClick={() => { setRejectingId(`b-${b.id}`); setRejectReason(""); }} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title={L("reject")}><X size={16} /></button>
                        </>
                      )}
                      {b.status === "approved" && (b.requester_id === currentUserId || canManage) && (
                        <button onClick={() => { setCompletingId(b.id); setCompleteForm({ mileage_before: "", mileage_after: "" }); }} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium">{L("complete")}</button>
                      )}
                      {(b.status === "pending" || b.status === "approved") && (b.requester_id === currentUserId || canManage) && (
                        <button onClick={() => bookingAction(b.id, "cancel")} className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title={L("cancel")}><X size={16} /></button>
                      )}
                    </div>
                  </div>

                  {/* Reject form */}
                  {rejectingId === `b-${b.id}` && (
                    <div className="mt-3 flex items-center gap-2">
                      <input type="text" placeholder={L("rejectReason")} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <button onClick={() => bookingAction(b.id, "reject", { rejection_reason: rejectReason })}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm">{L("reject")}</button>
                      <button onClick={() => setRejectingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">{L("cancel")}</button>
                    </div>
                  )}

                  {/* Complete form */}
                  {completingId === b.id && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <input type="number" placeholder={L("mileageBefore")} value={completeForm.mileage_before}
                        onChange={e => setCompleteForm({ ...completeForm, mileage_before: e.target.value })}
                        className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <input type="number" placeholder={L("mileageAfter")} value={completeForm.mileage_after}
                        onChange={e => setCompleteForm({ ...completeForm, mileage_after: e.target.value })}
                        className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <button onClick={() => bookingAction(b.id, "complete", {
                        mileage_before: completeForm.mileage_before ? Number(completeForm.mileage_before) : null,
                        mileage_after: completeForm.mileage_after ? Number(completeForm.mileage_after) : null,
                      })} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">{L("complete")}</button>
                      <button onClick={() => setCompletingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">{L("cancel")}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB 2: Personal Vehicle Request ═══════════ */}
      {tab === "personal" && (
        <div className="space-y-4">
          <button onClick={() => setShowPersonalForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0072B8] text-white rounded-lg hover:bg-[#002570] text-sm font-medium transition-colors">
            <Plus size={16} /> {L("requestPersonal")}
          </button>

          {/* Personal Form Modal */}
          {showPersonalForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowPersonalForm(false)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800">{L("personalVehicle")}</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("requestDate")} *</label>
                      <input type="date" value={pForm.request_date} onChange={e => setPForm({ ...pForm, request_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("endDate")}</label>
                      <input type="date" value={pForm.end_date} onChange={e => setPForm({ ...pForm, end_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("reason")} *</label>
                    <textarea value={pForm.reason} onChange={e => setPForm({ ...pForm, reason: e.target.value })} rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("destination")}</label>
                    <input type="text" value={pForm.destination} onChange={e => setPForm({ ...pForm, destination: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("distance")}</label>
                      <input type="number" value={pForm.estimated_distance} onChange={e => setPForm({ ...pForm, estimated_distance: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("notes")}</label>
                    <textarea value={pForm.notes} onChange={e => setPForm({ ...pForm, notes: e.target.value })} rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowPersonalForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{L("close")}</button>
                  <button onClick={submitPersonal} className="px-4 py-2 text-sm bg-[#0072B8] text-white rounded-lg hover:bg-[#002570]">{L("save")}</button>
                </div>
              </div>
            </div>
          )}

          {/* Personal Request List */}
          {filteredPersonal.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User size={40} className="mx-auto mb-2 opacity-30" />
              <p>{L("noRequests")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPersonal.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[p.status] || ""}`}>{L(p.status)}</span>
                        <span className="text-sm font-semibold text-gray-800">{fmtDate(p.request_date)}{p.end_date ? ` → ${fmtDate(p.end_date)}` : ""}</span>
                      </div>
                      <p className="text-sm text-gray-600">{p.reason}</p>
                      {p.destination && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} /> {p.destination}</span>}
                      {p.estimated_distance && <span className="text-xs text-gray-400">{L("distance")}: {p.estimated_distance} km</span>}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{L("requester")}: {getName(p.requester)}</span>
                        {p.approver && <span>{L("approver")}: {getName(p.approver)}</span>}
                        {p.rejection_reason && <span className="text-red-500">{L("rejectReason")}: {p.rejection_reason}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setDetailPersonal(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Eye size={16} /></button>
                      {canApprove && p.status === "pending" && (
                        <>
                          <button onClick={() => personalAction(p.id, "approve")} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title={L("approve")}><Check size={16} /></button>
                          <button onClick={() => { setRejectingId(`p-${p.id}`); setRejectReason(""); }} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title={L("reject")}><X size={16} /></button>
                        </>
                      )}
                      {p.status === "pending" && (p.requester_id === currentUserId || canManage) && (
                        <button onClick={() => personalAction(p.id, "cancel")} className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title={L("cancel")}><X size={16} /></button>
                      )}
                    </div>
                  </div>

                  {rejectingId === `p-${p.id}` && (
                    <div className="mt-3 flex items-center gap-2">
                      <input type="text" placeholder={L("rejectReason")} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                      <button onClick={() => personalAction(p.id, "reject", { rejection_reason: rejectReason })}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm">{L("reject")}</button>
                      <button onClick={() => setRejectingId(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">{L("cancel")}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB 3: Manage Vehicles (Admin) ═══════════ */}
      {tab === "manage" && canManage && (
        <div className="space-y-4">
          <button onClick={() => { setEditingVehicle(null); setVForm({ license_plate: "", brand: "", model: "", color: "", vehicle_type: "sedan", seat_count: "5", image_url: "", mandatory_insurance_expiry: "", voluntary_insurance_expiry: "", voluntary_insurance_company: "", voluntary_insurance_type: "", current_mileage: "0", registration_date: "", notes: "" }); setShowVehicleForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0072B8] text-white rounded-lg hover:bg-[#002570] text-sm font-medium transition-colors">
            <Plus size={16} /> {L("addVehicle")}
          </button>

          {/* Vehicle Form Modal */}
          {showVehicleForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowVehicleForm(false)}>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800">{editingVehicle ? L("editVehicle") : L("addVehicle")}</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("licensePlate")} *</label>
                      <input type="text" value={vForm.license_plate} onChange={e => setVForm({ ...vForm, license_plate: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("vehicleType")}</label>
                      <select value={vForm.vehicle_type} onChange={e => setVForm({ ...vForm, vehicle_type: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]">
                        {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{L(vt)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("brand")} *</label>
                      <input type="text" value={vForm.brand} onChange={e => setVForm({ ...vForm, brand: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("model")} *</label>
                      <input type="text" value={vForm.model} onChange={e => setVForm({ ...vForm, model: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("color")}</label>
                      <input type="text" value={vForm.color} onChange={e => setVForm({ ...vForm, color: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("seatCount")}</label>
                      <input type="number" min={1} value={vForm.seat_count} onChange={e => setVForm({ ...vForm, seat_count: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("imageUrl")}</label>
                    <input type="url" value={vForm.image_url} onChange={e => setVForm({ ...vForm, image_url: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("mandatoryIns")}</label>
                      <input type="date" value={vForm.mandatory_insurance_expiry} onChange={e => setVForm({ ...vForm, mandatory_insurance_expiry: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("voluntaryIns")}</label>
                      <input type="date" value={vForm.voluntary_insurance_expiry} onChange={e => setVForm({ ...vForm, voluntary_insurance_expiry: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("insCompany")}</label>
                      <input type="text" value={vForm.voluntary_insurance_company} onChange={e => setVForm({ ...vForm, voluntary_insurance_company: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("insType")}</label>
                      <input type="text" value={vForm.voluntary_insurance_type} onChange={e => setVForm({ ...vForm, voluntary_insurance_type: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("mileage")}</label>
                      <input type="number" min={0} value={vForm.current_mileage} onChange={e => setVForm({ ...vForm, current_mileage: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">{L("regDate")}</label>
                      <input type="date" value={vForm.registration_date} onChange={e => setVForm({ ...vForm, registration_date: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">{L("notes")}</label>
                    <textarea value={vForm.notes} onChange={e => setVForm({ ...vForm, notes: e.target.value })} rows={2}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0072B8]/20 focus:border-[#0072B8]" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setShowVehicleForm(false); setEditingVehicle(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{L("close")}</button>
                  <button onClick={submitVehicle} className="px-4 py-2 text-sm bg-[#0072B8] text-white rounded-lg hover:bg-[#002570]">{L("save")}</button>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle List */}
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Truck size={40} className="mx-auto mb-2 opacity-30" />
              <p>{L("noVehicles")}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map(v => {
                const isExpiringSoon = (d?: string) => {
                  if (!d) return false;
                  const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                  return diff <= 30 && diff > 0;
                };
                const isExpired = (d?: string) => d ? new Date(d) < new Date() : false;

                return (
                  <div key={v.id} className={`bg-white rounded-xl border p-4 space-y-3 ${v.is_active === false ? "opacity-50 border-gray-300" : "border-gray-100 hover:shadow-md"} transition-shadow`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-bold text-[#0072B8]">{v.license_plate}</p>
                        <p className="text-sm text-gray-600">{v.brand} {v.model} {v.color ? `(${v.color})` : ""}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditVehicle(v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit3 size={14} /></button>
                        {v.is_active !== false && (
                          <button onClick={() => deleteVehicle(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-500">
                      <span>{L("vehicleType")}: {L(v.vehicle_type || "sedan")}</span>
                      <span>{L("seatCount")}: {v.seat_count ?? 5}</span>
                      <span>{L("mileage")}: {(v.current_mileage ?? 0).toLocaleString()} km</span>
                      {v.registration_date && <span>{L("regDate")}: {fmtDate(v.registration_date)}</span>}
                    </div>
                    {/* Insurance warnings */}
                    <div className="space-y-1">
                      {v.mandatory_insurance_expiry && (
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isExpired(v.mandatory_insurance_expiry) ? "bg-red-50 text-red-600" : isExpiringSoon(v.mandatory_insurance_expiry) ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                          {(isExpired(v.mandatory_insurance_expiry) || isExpiringSoon(v.mandatory_insurance_expiry)) && <AlertCircle size={12} />}
                          {L("mandatoryIns")}: {fmtDate(v.mandatory_insurance_expiry)}
                        </div>
                      )}
                      {v.voluntary_insurance_expiry && (
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isExpired(v.voluntary_insurance_expiry) ? "bg-red-50 text-red-600" : isExpiringSoon(v.voluntary_insurance_expiry) ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                          {(isExpired(v.voluntary_insurance_expiry) || isExpiringSoon(v.voluntary_insurance_expiry)) && <AlertCircle size={12} />}
                          {L("voluntaryIns")}: {fmtDate(v.voluntary_insurance_expiry)}
                          {v.voluntary_insurance_company && ` (${v.voluntary_insurance_company})`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {v.is_active !== false ? L("active") : L("inactive")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ DETAIL MODALS ═══════════ */}
      {/* Booking Detail */}
      {detailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setDetailBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Car size={18} className="text-[#0072B8]" /> {lang === "th" ? "รายละเอียดการจอง" : "Booking Detail"}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{L("licensePlate")}</span><span className="font-medium">{detailBooking.vehicle?.license_plate} — {detailBooking.vehicle?.brand} {detailBooking.vehicle?.model}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("startDate")}</span><span>{fmtDateTime(detailBooking.start_datetime)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("endDate")}</span><span>{fmtDateTime(detailBooking.end_datetime)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("destination")}</span><span>{detailBooking.destination}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("purpose")}</span><span>{detailBooking.purpose}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("passengers")}</span><span>{detailBooking.passenger_count ?? 1}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("requester")}</span><span>{getName(detailBooking.requester)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[detailBooking.status]}`}>{L(detailBooking.status)}</span></div>
              {detailBooking.approver && <div className="flex justify-between"><span className="text-gray-500">{L("approver")}</span><span>{getName(detailBooking.approver)}</span></div>}
              {detailBooking.rejection_reason && <div className="flex justify-between"><span className="text-gray-500">{L("rejectReason")}</span><span className="text-red-600">{detailBooking.rejection_reason}</span></div>}
              {detailBooking.mileage_before != null && <div className="flex justify-between"><span className="text-gray-500">{L("mileageBefore")}</span><span>{detailBooking.mileage_before?.toLocaleString()} km</span></div>}
              {detailBooking.mileage_after != null && <div className="flex justify-between"><span className="text-gray-500">{L("mileageAfter")}</span><span>{detailBooking.mileage_after?.toLocaleString()} km</span></div>}
              {detailBooking.notes && <div className="flex justify-between"><span className="text-gray-500">{L("notes")}</span><span>{detailBooking.notes}</span></div>}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setDetailBooking(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{L("close")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Detail */}
      {detailPersonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setDetailPersonal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <User size={18} className="text-[#0072B8]" /> {lang === "th" ? "รายละเอียดคำขอ" : "Request Detail"}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{L("requestDate")}</span><span>{fmtDate(detailPersonal.request_date)}{detailPersonal.end_date ? ` → ${fmtDate(detailPersonal.end_date)}` : ""}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{L("reason")}</span><span>{detailPersonal.reason}</span></div>
              {detailPersonal.destination && <div className="flex justify-between"><span className="text-gray-500">{L("destination")}</span><span>{detailPersonal.destination}</span></div>}
              {detailPersonal.estimated_distance && <div className="flex justify-between"><span className="text-gray-500">{L("distance")}</span><span>{detailPersonal.estimated_distance} km</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">{L("requester")}</span><span>{getName(detailPersonal.requester)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[detailPersonal.status]}`}>{L(detailPersonal.status)}</span></div>
              {detailPersonal.approver && <div className="flex justify-between"><span className="text-gray-500">{L("approver")}</span><span>{getName(detailPersonal.approver)}</span></div>}
              {detailPersonal.rejection_reason && <div className="flex justify-between"><span className="text-gray-500">{L("rejectReason")}</span><span className="text-red-600">{detailPersonal.rejection_reason}</span></div>}
              {detailPersonal.notes && <div className="flex justify-between"><span className="text-gray-500">{L("notes")}</span><span>{detailPersonal.notes}</span></div>}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setDetailPersonal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{L("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
