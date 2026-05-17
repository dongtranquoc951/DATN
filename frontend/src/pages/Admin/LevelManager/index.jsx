import { useState, useEffect, useCallback } from "react";
import AddLevelModal from "./LevelModal";

const API = "http://localhost:5000/api/admin";

const http = {
  async get(url, params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v !== undefined)
    ).toString();
    const res = await fetch(qs ? `${url}?${qs}` : url);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  async patch(url, body = {}) {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  async delete(url) {
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  async post(url, body = {}) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};

function Badge({ type, children }) {
  const styles = {
    published: "bg-green-50 text-green-600",
    draft: "bg-amber-50 text-amber-600",
  };
  const dots = {
    published: "bg-green-500",
    draft: "bg-amber-500",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-0.5 rounded-full ${styles[type]}`}>
      {dots[type] && <span className={`w-1.5 h-1.5 rounded-full ${dots[type]}`} />}
      {children}
    </span>
  );
}

function StarBar({ value, max = 3 }) {
  const v = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-amber-400">
        {"★".repeat(Math.round(v))}{"☆".repeat(max - Math.round(v))}
      </span>
      <span className="text-xs font-semibold text-gray-900">{v.toFixed(1)}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="w-7 h-7 rounded-full border-[3px] border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-green-800",
    danger: "bg-red-800",
    info: "bg-gray-900",
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[400] flex items-center gap-2.5 px-4 py-3 ${colors[type] || colors.info} text-white rounded-xl text-[13px] font-medium shadow-lg min-w-[240px] animate-[slideUp_0.2s_ease]`}>
      <style>{`@keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      {message}
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, footer, children, width = 640 }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-[200]"
    >
      <div
        className="bg-white rounded-2xl overflow-y-auto shadow-2xl"
        style={{ width, maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 60px)" }}
      >
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="text-base font-semibold tracking-tight">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md border border-gray-200 bg-transparent cursor-pointer text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">{footer}</div>
        )}
      </div>
    </div>
  );
}

function Btn({ variant = "outline", onClick, children, disabled = false, className = "" }) {
  const vs = {
    primary: "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700",
    outline: "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-500 border border-transparent hover:bg-gray-50",
    danger: "bg-red-600 text-white border border-red-600 hover:bg-red-700",
    success: "bg-green-600 text-white border border-green-600 hover:bg-green-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-colors ${vs[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function GridPreview({ gridData }) {
  if (!gridData) return null;
  let gd = gridData;
  try {
    if (typeof gd === "string") gd = JSON.parse(gd);
  } catch {
    return null;
  }
  const { rows = 5, cols = 5, player, target, obstacles = [] } = gd;
  return (
    <div>
      <div
        className="inline-grid gap-0.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200"
        style={{ gridTemplateColumns: `repeat(${cols}, 36px)` }}
      >
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const isPlayer = player?.x === c && player?.y === r;
            const isTarget = target?.x === c && target?.y === r;
            const isObstacle = obstacles?.some((o) => o.x === c && o.y === r);
            return (
              <div
                key={`${r}-${c}`}
                className={`w-9 h-9 rounded-[5px] flex items-center justify-center text-[10px] font-semibold border
                  ${isObstacle ? "bg-gray-700 border-gray-800 text-white"
                    : isPlayer ? "bg-blue-50 border-blue-200 text-blue-600"
                    : isTarget ? "bg-green-50 border-green-200 text-green-600"
                    : "bg-white border-gray-200 text-transparent"}`}
              >
                {isPlayer ? "P" : isTarget ? "G" : isObstacle ? "X" : ""}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-1.5 flex gap-3 text-[11.5px] text-gray-400">
        <span><span className="font-semibold text-blue-600">P</span> Nhân vật</span>
        <span><span className="font-semibold text-green-600">G</span> Đích</span>
        <span><span className="font-semibold text-gray-700">X</span> Chướng ngại</span>
      </div>
    </div>
  );
}

function LevelDetailContent({ level }) {
  const parseGridData = () => {
    try {
      let gData = typeof level.grid_data === "string" ? JSON.parse(level.grid_data) : level.grid_data;
      if (typeof gData === "string") gData = JSON.parse(gData);
      return gData || {};
    } catch (e) {
      console.error("Lá»—i parse dá»¯ liá»‡u:", e);
      return {};
    }
  };

  const normalizeList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const getEngineData = () => {
    try {
      let gData = typeof level.grid_data === "string" ? JSON.parse(level.grid_data) : level.grid_data;
      if (typeof gData === "string") gData = JSON.parse(gData);
      return gData?.engine || {};
    } catch (e) {
      console.error("Lỗi parse dữ liệu:", e);
      return {};
    }
  };

  const gridConfig = parseGridData();
  const engine = getEngineData();
  const concepts = normalizeList(gridConfig.concepts || level.concepts);
  const requiredCommands = normalizeList(
    gridConfig.required_commands || gridConfig.requiredCommands || level.required_commands
  );
  const allowedCommands = normalizeList(gridConfig.allowed_commands || level.allowed_commands);
  const displayItems = [];
  Object.keys(engine).forEach((key) => {
    if (Array.isArray(engine[key])) {
      engine[key].forEach((item, index) => {
        displayItems.push({ id: `${key}-${index}`, type: key, x: item.x, y: item.y });
      });
    }
  });

  return (
    <>
      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Level", value: `#${level.level_number}`, mono: true },
          { label: "Trạng thái", value: <Badge type={level.is_published ? "published" : "draft"}>{level.is_published ? "Đã xuất bản" : "Bản nháp"}</Badge> },
          { label: "Ngày tạo", value: new Date(level.created_at).toLocaleDateString("vi-VN"), mono: true },
          { label: "Cập nhật", value: new Date(level.updated_at || level.created_at).toLocaleDateString("vi-VN"), mono: true },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-md px-3.5 py-2.5">
            <div className="text-[10.5px] font-semibold tracking-widest uppercase text-gray-400 mb-1">{item.label}</div>
            <div className={`text-[13.5px] font-medium ${item.mono ? "font-mono" : ""}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Chỉ số thống kê */}
      {level.stats && (
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {[
            { label: "Lượt thử", value: level.stats.total_attempts || 0 },
            { label: "Hoàn thành", value: level.stats.completions || 0 },
            { label: "Sao TB", value: <StarBar value={level.stats.avg_stars || 0} /> },
            { label: "Bước TB", value: level.stats.avg_steps || "—" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-md p-2.5 text-center">
              <div className="text-base font-semibold tracking-tight mb-0.5">{s.value}</div>
              <div className="text-[11px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Yêu cầu bài học */}
      <div className="mb-4">
        <div className="text-[13px] font-semibold mb-2.5">Yêu cầu bài học</div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Concepts", items: concepts, empty: "Chưa cấu hình" },
            { label: "Lệnh bắt buộc", items: requiredCommands, empty: "Không bắt buộc" },
            { label: "Lệnh được dùng", items: allowedCommands, empty: "Tất cả" },
          ].map((group) => (
            <div key={group.label} className="bg-gray-50 rounded-md px-3.5 py-3 border border-gray-100">
              <div className="text-[10.5px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
                {group.label}
              </div>
              {group.items.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[11.5px] font-semibold text-blue-600 border border-blue-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[12.5px] text-gray-400">{group.empty}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Engine Data */}
      <div className="mb-4">
        <div className="text-[13px] font-semibold mb-2.5">Thông số Engine (Entity & Thông số)</div>
        {displayItems.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="grid gap-2 px-3.5 py-2.5 bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: "100px 1fr" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Loại</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tọa độ / Giá trị</div>
            </div>
            {displayItems.map((it, idx) => (
              <div
                key={it.id}
                className={`grid gap-2 px-3.5 py-3 items-center ${idx !== displayItems.length - 1 ? "border-b border-gray-100" : ""}`}
                style={{ gridTemplateColumns: "100px 1fr" }}
              >
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize w-fit
                  ${it.type === "collectibles" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}>
                  {it.type}
                </span>
                <div className="text-[12.5px] font-semibold text-gray-900">
                  x: <b>{it.x}</b>, y: <b>{it.y}</b>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-5 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs">
            Không tìm thấy dữ liệu trong object "engine".
          </div>
        )}
      </div>

      {/* Grid Preview */}
      <div className="mb-4">
        <div className="text-[13px] font-semibold mb-2.5">Xem trước lưới</div>
        <GridPreview gridData={level.grid_data} />
      </div>

      {/* Code khởi đầu */}
      {level.initial_code && (
        <div className="mb-4">
          <div className="text-[13px] font-semibold mb-2">Code khởi đầu</div>
          <pre className="bg-[#1E1E2E] text-[#CDD6F4] rounded-lg px-4 py-3.5 text-[12.5px] font-mono leading-relaxed m-0 overflow-x-auto whitespace-pre-wrap">
            {level.initial_code}
          </pre>
        </div>
      )}

      {/* Mô tả */}
      {level.description && (
        <div className="bg-gray-50 rounded-md px-3.5 py-3 mb-4">
          <div className="text-[10.5px] font-semibold tracking-widest uppercase text-gray-400 mb-1">Mô tả</div>
          <div className="text-[13.5px] leading-relaxed">{level.description}</div>
        </div>
      )}

      {/* Top players */}
      {level.top_players?.length > 0 && (
        <div>
          <div className="text-[13px] font-semibold mb-2.5">Top người chơi</div>
          <div className="flex flex-col gap-1.5">
            {level.top_players.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md border
                  ${idx === 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-400 font-mono w-4">#{idx + 1}</span>
                  <div>
                    <div className="text-[13px] font-medium">{p.full_name || p.username}</div>
                    <div className="text-[11.5px] text-gray-400">@{p.username}</div>
                  </div>
                </div>
                <div className="flex gap-3.5 items-center">
                  <StarBar value={p.stars} />
                  <div className="text-right text-xs text-gray-500">
                    <div><span className="font-mono">{p.best_steps}</span> bước</div>
                    <div>{p.attempts} lần thử</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const EMPTY_FORM = {
  title: "", level_number: "", description: "", initial_code: "",
  is_published: false, grid_rows: 5, grid_cols: 5,
  player_x: 0, player_y: 2, target_x: 4, target_y: 2,
};

export default function LevelManager() {
  const [levels, setLevels] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLevel, setDetailLevel] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchDebounced, setSearchDebounced] = useState("");
  const [editingLevel, setEditingLevel] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLevels = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await http.get(`${API}/levels`, { search: searchDebounced, filter, page, limit: pagination.limit });
      setLevels(data.data);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err?.message || "Lỗi tải danh sách level", "danger");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, filter, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await http.get(`${API}/levels/stats`);
      setStats(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchLevels(1); }, [searchDebounced, filter]);
  useEffect(() => { fetchStats(); }, []);

  const openDetail = async (level) => {
    setDetailLevel(level);
    setDetailLoading(true);
    try {
      const data = await http.get(`${API}/levels/${level.id}`);
      setDetailLevel(data.data);
    } catch {
      showToast("Không thể tải chi tiết level", "danger");
    } finally {
      setDetailLoading(false);
    }
  };

  const togglePublish = async (level) => {
    try {
      const data = await http.patch(`${API}/levels/${level.id}/publish`, { is_published: !level.is_published });
      setLevels((prev) => prev.map((l) => l.id === level.id ? { ...l, is_published: !l.is_published } : l));
      if (detailLevel?.id === level.id) setDetailLevel((prev) => ({ ...prev, is_published: !prev.is_published }));
      fetchStats();
      showToast(data.message, "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi cập nhật trạng thái", "danger");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const data = await http.delete(`${API}/levels/${deleteTarget.id}`);
      setLevels((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      fetchStats();
      showToast(data.message, "danger");
    } catch (err) {
      showToast(err?.message || "Lỗi khi xóa level", "danger");
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleCreate = async (payload) => {
    setCreateSaving(true);
    try {
      const data = await http.post(`${API}/levels`, payload);
      fetchLevels(1);
      fetchStats();
      setCreateOpen(false);
      showToast(data.message || "Tạo cấp độ thành công", "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi tạo cấp độ", "danger");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingLevel?.id) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const cleanApi = API.endsWith("/") ? API.slice(0, -1) : API;
      const url = `${cleanApi}/levels/${editingLevel.id}`;
      console.log("🚀 Gọi API Update:", url);

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("❌ Backend error:", result);
        throw new Error(result.message || "Không thể cập nhật level");
      }

      showToast(result.message || "Cập nhật thành công!", "success");
      setCreateOpen(false);
      setEditingLevel(null);
      if (typeof fetchLevels === "function") fetchLevels(pagination.page);
    } catch (err) {
      console.error("🔥 Lỗi handleUpdate:", err);
      showToast(err.message, "danger");
    } finally {
      setActionLoading(false);
    }
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const completionRate = (level) => {
    if (!level.total_attempts || level.total_attempts === 0) return null;
    return Math.round((level.total_completions / level.total_attempts) * 100);
  };

  const FILTERS = [
    { key: "all", label: "Tất cả" },
    { key: "published", label: "Đã xuất bản" },
    { key: "draft", label: "Bản nháp" },
  ];

  return (
    <div className="font-sans">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-8 h-[60px] flex items-center justify-between sticky top-0 z-50">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Quản lý cấp độ học</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin / Learning Levels</div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-[7px] w-60">
            <svg width="13" height="13" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, mô tả..."
              className="border-none bg-transparent text-[13px] text-gray-900 outline-none w-full placeholder:text-gray-400"
            />
          </div>
          <Btn variant="primary" onClick={() => setCreateOpen(true)}>+ Thêm cấp độ</Btn>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-7">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3.5 mb-6">
          {[
            { label: "Tổng cấp độ", value: stats?.total_levels, badge: "Lộ trình học", iconBg: "bg-blue-50" },
            { label: "Đã xuất bản", value: stats?.published_levels, badge: "Hoạt động", iconBg: "bg-green-50" },
            { label: "Bản nháp", value: stats?.draft_levels, badge: "Chờ duyệt", iconBg: "bg-amber-50" },
            { label: "Tổng hoàn thành", value: (stats?.total_completions || 0).toLocaleString(), badge: "Người chơi", iconBg: "bg-green-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${s.iconBg}`} />
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">{s.badge}</span>
              </div>
              <div className="text-[26px] font-semibold tracking-tight leading-none mb-1">{s.value ?? "—"}</div>
              <div className="text-[12.5px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Danh sách cấp độ</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {pagination.total} levels · Trang {pagination.page}/{pagination.totalPages}
            </div>
          </div>
          <div className="flex bg-gray-50 border border-gray-200 rounded-md p-0.5 gap-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 text-[12.5px] font-medium rounded cursor-pointer border-none transition-all
                  ${filter === f.key ? "bg-white text-gray-900 shadow-sm" : "bg-transparent text-gray-500"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Cấp độ / Tên", "Trạng thái", "Sao TB", "Lượt thử", "Hoàn thành", "Ngày tạo", "Thao tác"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 text-[11.5px] font-semibold tracking-widest uppercase text-gray-400
                      ${i === 6 ? "text-right pr-5 pl-4" : "text-left"} ${i === 0 ? "pl-5 pr-4" : "px-4"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Spinner /></td></tr>
              ) : levels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-[13px]">Không tìm thấy cấp độ nào</td>
                </tr>
              ) : levels.map((l) => {
                const rate = completionRate(l);
                return (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border
                          ${l.is_published ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                          <span className={`font-mono text-[13px] font-bold ${l.is_published ? "text-blue-600" : "text-gray-400"}`}>
                            {l.level_number}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-[13.5px]">{l.title}</div>
                          {l.description && (
                            <div className="text-[11.5px] text-gray-400 mt-0.5 max-w-[220px] truncate">
                              {l.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge type={l.is_published ? "published" : "draft"}>{l.is_published ? "Xuất bản" : "Bản nháp"}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <StarBar value={l.avg_stars || 0} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[12.5px] text-gray-500">{(l.total_attempts || 0).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {rate !== null ? (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`font-mono text-[12.5px] font-semibold
                              ${rate >= 70 ? "text-green-600" : rate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                              {rate}%
                            </span>
                            <span className="text-[11.5px] text-gray-400">{l.total_completions || 0} người</span>
                          </div>
                          <div className="w-20 h-1 bg-gray-200 rounded-sm overflow-hidden">
                            <div
                              className={`h-full rounded-sm transition-all duration-300
                                ${rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-amber-400" : "bg-red-500"}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Chưa có</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[12.5px] text-gray-500">
                        {new Date(l.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="inline-flex items-center justify-center h-[30px] px-2.5 rounded-md border border-gray-200 bg-white cursor-pointer text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                          title="Xem chi tiết"
                          onClick={() => openDetail(l)}
                        >
                          Chi tiết
                        </button>
                        <button
                          className="inline-flex items-center justify-center h-[30px] px-2.5 rounded-md border border-gray-200 bg-white cursor-pointer text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                          title="Sửa"
                          onClick={() => { setEditingLevel(l); setCreateOpen(true); }}
                        >
                          Sửa
                        </button>
                        <button
                          className={`inline-flex items-center justify-center h-[30px] px-2.5 rounded-md border cursor-pointer text-[11px] font-medium transition-colors
                            ${l.is_published
                              ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                              : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"}`}
                          onClick={() => togglePublish(l)}
                        >
                          {l.is_published ? "Ẩn" : "Xuất bản"}
                        </button>
                        <button
                          className="inline-flex items-center justify-center h-[30px] px-2.5 rounded-md border border-red-200 bg-red-50 cursor-pointer text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors"
                          onClick={() => setDeleteTarget(l)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-[12.5px] text-gray-400">Hiển thị {levels.length} / {pagination.total} cấp độ</div>
            <div className="flex gap-1">
              <button
                onClick={() => fetchLevels(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="w-7 h-7 rounded-md border border-gray-200 bg-white text-[12.5px] cursor-pointer text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 1))
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchLevels(p)}
                    className={`w-7 h-7 rounded-md border border-gray-200 text-[12.5px] cursor-pointer transition-colors
                      ${p === pagination.page ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => fetchLevels(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="w-7 h-7 rounded-md border border-gray-200 bg-white text-[12.5px] cursor-pointer text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailLevel}
        onClose={() => setDetailLevel(null)}
        title={detailLevel ? `Level ${detailLevel.level_number} — ${detailLevel.title}` : ""}
        subtitle={detailLevel?.description}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDetailLevel(null)}>Đóng</Btn>
            <Btn
              variant={detailLevel?.is_published ? "outline" : "success"}
              onClick={() => { togglePublish(detailLevel); setDetailLevel(null); }}
            >
              {detailLevel?.is_published ? "Ẩn level" : "Xuất bản"}
            </Btn>
          </>
        }
      >
        {detailLoading ? <Spinner /> : detailLevel && <LevelDetailContent level={detailLevel} />}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa cấp độ"
        subtitle="Toàn bộ tiến độ của người chơi sẽ bị xóa"
        width={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>Hủy</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Đang xóa..." : "Xác nhận Xóa"}
            </Btn>
          </>
        }
      >
        {deleteTarget && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-red-600 mb-1.5">
              Xóa Level {deleteTarget.level_number} — "{deleteTarget.title}"?
            </div>
            <div className="text-[12.5px] text-red-800 leading-relaxed">
              Toàn bộ tiến độ học tập ({deleteTarget.total_attempts || 0} lượt thử,{" "}
              {deleteTarget.total_completions || 0} người hoàn thành) sẽ bị xóa vĩnh viễn.
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Level Modal */}
      <AddLevelModal
        open={createOpen}
        initialData={editingLevel}
        onClose={() => {
          setCreateOpen(false);
          setEditingLevel(null);
        }}
        onSave={editingLevel ? handleUpdate : handleCreate}
        saving={actionLoading}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
