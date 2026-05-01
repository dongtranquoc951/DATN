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
    published: { background: "#F0FDF4", color: "#16A34A" },
    draft:     { background: "#FFFBEB", color: "#D97706" },
  };
  const dots = { published: "#16A34A", draft: "#D97706" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 20, ...styles[type] }}>
      {dots[type] && <span style={{ width: 5, height: 5, borderRadius: "50%", background: dots[type] }} />}
      {children}
    </span>
  );
}

function StarBar({ value, max = 3 }) {
  const v = parseFloat(value) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#F59E0B" }}>
        {"★".repeat(Math.round(v))}{"☆".repeat(max - Math.round(v))}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{v.toFixed(1)}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #E8E8E4", borderTopColor: "#2563EB", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = { success: "#166534", danger: "#991B1B", info: "#1A1A18" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 400, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: colors[type] || colors.info, color: "white", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", minWidth: 240, animation: "slideUp 0.2s ease" }}>
      <style>{`@keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      {message}
    </div>
  );
}

function Modal({ open, onClose, title, subtitle, footer, children, width = 640 }) {
  if (!open) return null;
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "white", borderRadius: 14, width, maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 60px)", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #E8E8E4", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: "#A8A89E", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "transparent", cursor: "pointer", fontSize: 14, color: "#6B6B65" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
        {footer && <div style={{ padding: "16px 24px", borderTop: "1px solid #E8E8E4", display: "flex", gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

function Btn({ variant = "outline", onClick, children, disabled = false, style = {} }) {
  const vs = {
    primary: { background: "#2563EB", color: "white", border: "1px solid #2563EB" },
    outline: { background: "white", color: "#6B6B65", border: "1px solid #E8E8E4" },
    ghost:   { background: "transparent", color: "#6B6B65", border: "1px solid transparent" },
    danger:  { background: "#DC2626", color: "white", border: "1px solid #DC2626" },
    success: { background: "#16A34A", color: "white", border: "1px solid #16A34A" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, ...vs[variant], ...style }}>
      {children}
    </button>
  );
}

function GridPreview({ gridData }) {
  if (!gridData) return null;
  let gd = gridData;
  try { if (typeof gd === "string") gd = JSON.parse(gd); } catch { return null; }
  const { rows = 5, cols = 5, player, target, obstacles = [] } = gd;
  return (
    <div>
      <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${cols}, 36px)`, gap: 2, background: "#F7F7F5", padding: 10, borderRadius: 8, border: "1px solid #E8E8E4" }}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const isPlayer   = player?.x === c && player?.y === r;
            const isTarget   = target?.x === c && target?.y === r;
            const isObstacle = obstacles?.some((o) => o.x === c && o.y === r);
            return (
              <div key={`${r}-${c}`} style={{ width: 36, height: 36, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, background: isObstacle ? "#374151" : isPlayer ? "#EFF4FF" : isTarget ? "#F0FDF4" : "white", border: `1px solid ${isObstacle ? "#1F2937" : isPlayer ? "#BFDBFE" : isTarget ? "#BBF7D0" : "#E8E8E4"}`, color: isObstacle ? "white" : isPlayer ? "#2563EB" : isTarget ? "#16A34A" : "transparent" }}>
                {isPlayer ? "P" : isTarget ? "G" : isObstacle ? "X" : ""}
              </div>
            );
          })
        )}
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 11.5, color: "#A8A89E" }}>
        <span><span style={{ fontWeight: 600, color: "#2563EB" }}>P</span> Nhân vật</span>
        <span><span style={{ fontWeight: 600, color: "#16A34A" }}>G</span> Đích</span>
        <span><span style={{ fontWeight: 600, color: "#374151" }}>X</span> Chướng ngại</span>
      </div>
    </div>
  );
}

function LevelDetailContent({ level }) {
// 1. XỬ LÝ DATA: Giải mã grid_data và tìm object engine
  const getEngineData = () => {
    try {
      // Parse lần 1
      let gData = typeof level.grid_data === "string" ? JSON.parse(level.grid_data) : level.grid_data;
      
      // Nếu sau khi parse vẫn là string (do double stringify), parse lần 2
      if (typeof gData === "string") gData = JSON.parse(gData);

      // Lấy engine object từ gData
      return gData?.engine || {};
    } catch (e) {
      console.error("Lỗi parse dữ liệu:", e);
      return {};
    }
  };

  const engine = getEngineData();
  
  // Chuyển đổi object engine thành mảng để hiển thị (collectibles, obstacles, shadows...)
  const displayItems = [];
  Object.keys(engine).forEach(key => {
    if (Array.isArray(engine[key])) {
      engine[key].forEach((item, index) => {
        displayItems.push({
          id: `${key}-${index}`,
          type: key, // ví dụ: collectibles, obstacles
          x: item.x,
          y: item.y
        });
      });
    }
  });

  // 2. Định nghĩa Style (Cần thiết cho phần hiển thị bảng)
  const smallLabel = { 
    fontSize: 10, 
    fontWeight: 700, 
    textTransform: "uppercase", 
    color: "#A8A89E", 
    letterSpacing: "0.04em" 
  };

  return (
    <>
      {/* Thông tin cơ bản */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Level",       value: `#${level.level_number}`,                                     mono: true },
          { label: "Trạng thái",  value: <Badge type={level.is_published ? "published" : "draft"}>{level.is_published ? "Đã xuất bản" : "Bản nháp"}</Badge> },
          { label: "Ngày tạo",    value: new Date(level.created_at).toLocaleDateString("vi-VN"),         mono: true },
          { label: "Cập nhật",    value: new Date(level.updated_at || level.created_at).toLocaleDateString("vi-VN"), mono: true },
        ].map((item) => (
          <div key={item.label} style={{ background: "#F7F7F5", borderRadius: 6, padding: "11px 14px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A8A89E", marginBottom: 5 }}>{item.label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, fontFamily: item.mono ? "'DM Mono', monospace" : undefined }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Chỉ số thống kê */}
      {level.stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Lượt thử",   value: level.stats.total_attempts || 0 },
            { label: "Hoàn thành", value: level.stats.completions || 0 },
            { label: "Sao TB",     value: <StarBar value={level.stats.avg_stars || 0} /> },
            { label: "Bước TB",    value: level.stats.avg_steps || "—" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#F7F7F5", borderRadius: 6, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#A8A89E" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* PHẦN CẤU HÌNH CHI TIẾT ĐÃ ĐỒNG BỘ VỚI MODAL SỬA */}
{/* HIỂN THỊ ENGINE DATA */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Thông số Engine (Entity & Thông số)</div>
        
        {displayItems.length > 0 ? (
          <div style={{ border: "1px solid #E8E8E4", borderRadius: 8, overflow: "hidden", background: "white" }}>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, padding: "10px 14px", background: "#F7F7F5", borderBottom: "1px solid #E8E8E4" }}>
              <div style={smallLabel}>Loại</div>
              <div style={smallLabel}>Tọa độ / Giá trị</div>
            </div>

            {displayItems.map((it, idx) => (
              <div key={it.id} style={{ 
                display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, padding: "12px 14px", alignItems: "center",
                borderBottom: idx === displayItems.length - 1 ? "none" : "1px solid #F0F0EE"
              }}>
                <div>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: it.type === "collectibles" ? "#FEF3C7" : "#F3F4F6",
                    color: it.type === "collectibles" ? "#B45309" : "#374151",
                    textTransform: "capitalize"
                  }}>
                    {it.type}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1A1A18" }}>
                  x: <b>{it.x}</b>, y: <b>{it.y}</b>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", background: "#F7F7F5", borderRadius: 8, border: "1px dashed #D1D5DB", color: "#A8A89E", fontSize: 12 }}>
            Không tìm thấy dữ liệu trong object "engine".
          </div>
        )}
      </div>

      {/* Xem trước bản đồ */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Xem trước lưới</div>
        <GridPreview gridData={level.grid_data} />
      </div>

      {/* Code khởi đầu */}
      {level.initial_code && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Code khởi đầu</div>
          <pre style={{ background: "#1E1E2E", color: "#CDD6F4", borderRadius: 8, padding: "14px 16px", fontSize: 12.5, fontFamily: "'DM Mono', monospace", lineHeight: 1.6, margin: 0, overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {level.initial_code}
          </pre>
        </div>
      )}

      {/* Mô tả */}
      {level.description && (
        <div style={{ background: "#F7F7F5", borderRadius: 6, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A8A89E", marginBottom: 5 }}>Mô tả</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{level.description}</div>
        </div>
      )}

      {/* Bảng xếp hạng */}
      {level.top_players?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Top người chơi</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {level.top_players.map((p, idx) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: idx === 0 ? "#FFFBEB" : "#F7F7F5", borderRadius: 6, border: `1px solid ${idx === 0 ? "#FDE68A" : "#E8E8E4"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#A8A89E", fontFamily: "'DM Mono', monospace", minWidth: 18 }}>#{idx + 1}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.full_name || p.username}</div>
                    <div style={{ fontSize: 11.5, color: "#A8A89E" }}>@{p.username}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <StarBar value={p.stars} />
                  <div style={{ textAlign: "right", fontSize: 12, color: "#6B6B65" }}>
                    <div><span style={{ fontFamily: "'DM Mono', monospace" }}>{p.best_steps}</span> bước</div>
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

// ── Danh sách thông số engine có thể dùng ────────────────────────────────────
// Khi thêm level, tham khảo bảng này để điền vào phần "Thông số tùy chỉnh".
// Key             | Kiểu    | Mặc định | Mô tả
// ─────────────────────────────────────────────────────────────────────────────
// max_steps       | number  | 50       | Số bước tối đa người chơi được đi
// gravity         | boolean | false    | Bật vật lý trọng lực
// fog_of_war      | boolean | false    | Ẩn các ô chưa khám phá
// move_mode       | string  | "4dir"   | "4dir" = 4 hướng, "8dir" = 8 hướng
// time_limit      | number  | 0        | Giới hạn thời gian (giây), 0 = không giới hạn
// wind_direction  | string  | ""       | Hướng gió ảnh hưởng di chuyển: "N","S","E","W"
// ice_tiles       | boolean | false    | Ô băng: nhân vật trượt thêm 1 bước
// teleport_pairs  | string  | ""       | JSON array các cặp teleport [{"from":{x,y},"to":{x,y}}]
// ─────────────────────────────────────────────────────────────────────────────

export default function LevelManager() {
  const [levels, setLevels]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLevel, setDetailLevel]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [createOpen, setCreateOpen]       = useState(false);
  const [createSaving, setCreateSaving]   = useState(false);
  const [toast, setToast]           = useState(null);
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
    
    // Sử dụng URL object để tránh lỗi dư/thiếu dấu gạch chéo
    // Đảm bảo API của bạn là http://localhost:5000/api/admin
    const cleanApi = API.endsWith('/') ? API.slice(0, -1) : API;
    const url = `${cleanApi}/levels/${editingLevel.id}`;
    
    console.log("🚀 Gọi API Update:", url);

    const res = await fetch(url, {
      method: "PUT", // ĐÚNG với router.put trong admin.routes.js
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const result = await res.json();

    if (!res.ok) {
      // Log lỗi cụ thể từ Backend trả về
      console.error("❌ Backend error:", result);
      throw new Error(result.message || "Không thể cập nhật level");
    }

    // ✅ Thành công
    showToast(result.message || "Cập nhật thành công!", "success");
    setCreateOpen(false);
    setEditingLevel(null);
    
    // Reload danh sách
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
    { key: "all",       label: "Tất cả" },
    { key: "published", label: "Đã xuất bản" },
    { key: "draft",     label: "Bản nháp" },
  ];

  const btnStyle = () => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 6, border: "1px solid #E8E8E4",
    background: "white", cursor: "pointer", fontSize: 11, fontWeight: 500,
    color: "#6B6B65", fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Topbar */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E8E4", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Quản lý cấp độ học</div>
          <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 1 }}>Admin / Learning Levels</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F7F5", border: "1px solid #E8E8E4", borderRadius: 6, padding: "7px 12px", width: 240 }}>
            <svg width="13" height="13" fill="none" stroke="#A8A89E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, mô tả..." style={{ border: "none", background: "transparent", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#1A1A18", outline: "none", width: "100%" }} />
          </div>
          <Btn variant="primary" onClick={() => setCreateOpen(true)}>+ Thêm cấp độ</Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Tổng cấp độ",     value: stats?.total_levels,          badge: "Lộ trình học",  color: "#EFF4FF" },
            { label: "Đã xuất bản",     value: stats?.published_levels,      badge: "Hoạt động",     color: "#F0FDF4" },
            { label: "Bản nháp",        value: stats?.draft_levels,          badge: "Chờ duyệt",     color: "#FFFBEB" },
            { label: "Tổng hoàn thành", value: (stats?.total_completions || 0).toLocaleString(), badge: "Người chơi", color: "#F0FDF4" },
          ].map((s) => (
            <div key={s.label} style={{ background: "white", border: "1px solid #E8E8E4", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: s.color }} />
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: "#F0FDF4", color: "#16A34A" }}>{s.badge}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{s.value ?? "—"}</div>
              <div style={{ fontSize: 12.5, color: "#A8A89E" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Danh sách cấp độ</div>
            <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 2 }}>
              {pagination.total} levels · Trang {pagination.page}/{pagination.totalPages}
            </div>
          </div>
          <div style={{ display: "flex", background: "#F7F7F5", border: "1px solid #E8E8E4", borderRadius: 6, padding: 3, gap: 2 }}>
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 12px", fontSize: 12.5, fontWeight: 500, borderRadius: 4, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", background: filter === f.key ? "white" : "transparent", color: filter === f.key ? "#1A1A18" : "#6B6B65", boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #E8E8E4", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F7F7F5", borderBottom: "1px solid #E8E8E4" }}>
              <tr>
                {["Cấp độ / Tên", "Trạng thái", "Sao TB", "Lượt thử", "Hoàn thành", "Ngày tạo", "Thao tác"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: i === 6 ? "right" : "left", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#A8A89E", paddingLeft: i === 0 ? 20 : 16, paddingRight: i === 6 ? 20 : 16 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Spinner /></td></tr>
              ) : levels.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#A8A89E", fontSize: 13 }}>Không tìm thấy cấp độ nào</td></tr>
              ) : levels.map((l) => {
                const rate = completionRate(l);
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #E8E8E4" }}>
                    <td style={{ padding: "14px 16px", paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: l.is_published ? "#EFF4FF" : "#F7F7F5", border: `1px solid ${l.is_published ? "#BFDBFE" : "#E8E8E4"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: l.is_published ? "#2563EB" : "#A8A89E" }}>{l.level_number}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{l.title}</div>
                          {l.description && (
                            <div style={{ fontSize: 11.5, color: "#A8A89E", marginTop: 2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {l.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Badge type={l.is_published ? "published" : "draft"}>{l.is_published ? "Xuất bản" : "Bản nháp"}</Badge>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StarBar value={l.avg_stars || 0} />
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#6B6B65" }}>{(l.total_attempts || 0).toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {rate !== null ? (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, fontWeight: 600, color: rate >= 70 ? "#16A34A" : rate >= 40 ? "#D97706" : "#DC2626" }}>{rate}%</span>
                            <span style={{ fontSize: 11.5, color: "#A8A89E" }}>{l.total_completions || 0} người</span>
                          </div>
                          <div style={{ width: 80, height: 4, background: "#E8E8E4", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${rate}%`, height: "100%", background: rate >= 70 ? "#16A34A" : rate >= 40 ? "#F59E0B" : "#DC2626", borderRadius: 2, transition: "width 0.3s" }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "#A8A89E" }}>Chưa có</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#6B6B65" }}>{new Date(l.created_at).toLocaleDateString("vi-VN")}</span>
                    </td>
                    <td style={{ padding: "14px 20px 14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <button style={btnStyle()} title="Xem chi tiết" onClick={() => openDetail(l)}>Chi tiết</button>
                        <button 
                          style={btnStyle()} 
                          title="Sửa" 
                          onClick={() => {
                            setEditingLevel(l); // 1. Lưu dữ liệu level này lại
                            setCreateOpen(true);    // 2. Mở modal
                          }}
                        >
                          Sửa
                        </button>
                        <button style={{ ...btnStyle(), color: l.is_published ? "#D97706" : "#16A34A", borderColor: l.is_published ? "#FDE68A" : "#BBF7D0", background: l.is_published ? "#FFFBEB" : "#F0FDF4" }} onClick={() => togglePublish(l)}>
                          {l.is_published ? "Ẩn" : "Xuất bản"}
                        </button>
                        <button style={{ ...btnStyle(), color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }} onClick={() => setDeleteTarget(l)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E8E4", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7F7F5" }}>
            <div style={{ fontSize: 12.5, color: "#A8A89E" }}>Hiển thị {levels.length} / {pagination.total} cấp độ</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => fetchLevels(pagination.page - 1)} disabled={pagination.page <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "white", fontSize: 12.5, cursor: pagination.page <= 1 ? "not-allowed" : "pointer", color: "#6B6B65", opacity: pagination.page <= 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 1))
                .map((p) => (
                  <button key={p} onClick={() => fetchLevels(p)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: p === pagination.page ? "#2563EB" : "white", fontSize: 12.5, cursor: "pointer", color: p === pagination.page ? "white" : "#6B6B65", fontFamily: "'DM Sans', sans-serif" }}>{p}</button>
                ))}
              <button onClick={() => fetchLevels(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "white", fontSize: 12.5, cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer", color: "#6B6B65", opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>›</button>
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
            <Btn variant={detailLevel?.is_published ? "outline" : "success"} onClick={() => { togglePublish(detailLevel); setDetailLevel(null); }}>
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
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>
              Xóa Level {deleteTarget.level_number} — "{deleteTarget.title}"?
            </div>
            <div style={{ fontSize: 12.5, color: "#9B1C1C", lineHeight: 1.6 }}>
              Toàn bộ tiến độ học tập ({deleteTarget.total_attempts || 0} lượt thử,{" "}
              {deleteTarget.total_completions || 0} người hoàn thành) sẽ bị xóa vĩnh viễn.
            </div>
          </div>
        )}
      </Modal>

      {/* Add Level Modal */}
      <AddLevelModal
        open={createOpen}
        initialData={editingLevel} // Truyền level đang sửa vào đây
        onClose={() => {
          setCreateOpen(false);
          setEditingLevel(null);   // Quan trọng: Reset về null khi đóng để lần sau bấm "Thêm mới" không bị dính dữ liệu cũ
        }}
        onSave={editingLevel ? handleUpdate : handleCreate} // Tự động chọn hàm Lưu hoặc Tạo mới
        saving={actionLoading}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}