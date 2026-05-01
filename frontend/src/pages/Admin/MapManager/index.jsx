import { useState, useEffect, useCallback } from "react";

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

function StarRating({ value }) {
  const v = parseFloat(value) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#F59E0B" }}>
        {"★".repeat(Math.round(v))}{"☆".repeat(5 - Math.round(v))}
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

function Modal({ open, onClose, title, subtitle, footer, children, width = 600 }) {
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

// ── Category pill ──────────────────────────────────────────────────────────────
function CategoryPill({ name }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11.5, fontWeight: 500,
      padding: "3px 10px", borderRadius: 20,
      background: "#EFF4FF", color: "#2563EB",
      border: "1px solid #BFDBFE",
    }}>
      {name}
    </span>
  );
}

function MapDetailContent({ map }) {
  let gridData = { rows: 5, cols: 5, player: { x: 0, y: 2 }, target: { x: 4, y: 2 }, obstacles: [] };
  try {
    if (map.grid_data) {
      gridData = typeof map.grid_data === "string" ? JSON.parse(map.grid_data) : map.grid_data;
    }
  } catch {}

  const cells = Array.from({ length: gridData.rows }, (_, r) =>
    Array.from({ length: gridData.cols }, (_, c) => ({
      r, c,
      isPlayer:   gridData.player?.x === c && gridData.player?.y === r,
      isTarget:   gridData.target?.x === c && gridData.target?.y === r,
      isObstacle: gridData.obstacles?.some((o) => o.x === c && o.y === r),
      isCollectible: gridData.collectibles?.some((o) => o.x === c && o.y === r),
    }))
  );

  // categories: [{ id, name, description }] — trả về từ getMapById
  const categories = map.categories || [];

  return (
    <>
      {/* Thông tin cơ bản */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Mã màn chơi", value: map.map_code, mono: true },
          { label: "Tác giả",     value: `@${map.author_username || map.created_by?.username || "—"}` },
          { label: "Ngày tạo",    value: new Date(map.created_at).toLocaleDateString("vi-VN"), mono: true },
          { label: "Trạng thái",  value: <Badge type={map.is_published ? "published" : "draft"}>{map.is_published ? "Đã xuất bản" : "Bản nháp"}</Badge> },
        ].map((item) => (
          <div key={item.label} style={{ background: "#F7F7F5", borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#A8A89E", marginBottom: 5 }}>{item.label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, fontFamily: item.mono ? "'DM Mono', monospace" : undefined }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Lượt chơi",     value: (map.play_count || 0).toLocaleString() },
          { label: "Đánh giá TB",   value: <StarRating value={map.average_rating || 0} /> },
          { label: "Tổng đánh giá", value: map.total_ratings || 0 },
        ].map((s) => (
          <div key={s.label} style={{ background: "#F7F7F5", borderRadius: 6, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#A8A89E" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Danh mục ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "#F7F7F5", borderRadius: 6, padding: "12px 14px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#A8A89E", marginBottom: 8 }}>
          Danh mục
        </div>
        {categories.length === 0 ? (
          <span style={{ fontSize: 13, color: "#C0C0B8", fontStyle: "italic" }}>Chưa có danh mục</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {categories.map((cat) => (
              <CategoryPill key={cat.id} name={cat.name} />
            ))}
          </div>
        )}
      </div>

      {/* Grid preview */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Xem trước lưới</div>
        <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${gridData.cols}, 40px)`, gap: 3, background: "#F7F7F5", padding: 12, borderRadius: 8, border: "1px solid #E8E8E4" }}>
          {cells.flat().map(({ r, c, isPlayer, isTarget, isObstacle, isCollectible }) => (
            <div key={`${r}-${c}`} style={{
              width: 40, height: 40, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isCollectible ? 16 : 11, fontWeight: 700,
              background: isObstacle ? "#374151" : isPlayer ? "#EFF4FF" : isTarget ? "#F0FDF4" : isCollectible ? "#FFFBEB" : "white",
              border: `1px solid ${isObstacle ? "#1F2937" : isPlayer ? "#BFDBFE" : isTarget ? "#BBF7D0" : isCollectible ? "#FCD34D" : "#E8E8E4"}`,
              color: isObstacle ? "white" : isPlayer ? "#2563EB" : isTarget ? "#16A34A" : "#F59E0B",
            }}>
              {isPlayer ? "P" : isTarget ? "G" : isObstacle ? "X" : isCollectible ? "⭐" : ""}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 12, color: "#A8A89E", flexWrap: "wrap" }}>
          <span><span style={{ fontWeight: 600, color: "#2563EB" }}>P</span> Nhân vật</span>
          <span><span style={{ fontWeight: 600, color: "#16A34A" }}>G</span> Đích</span>
          <span><span style={{ fontWeight: 600, color: "#374151" }}>X</span> Chướng ngại vật</span>
          <span><span style={{ fontWeight: 600, color: "#F59E0B" }}>⭐</span> Thu thập</span>
        </div>
      </div>

      {/* Mô tả */}
      {map.description && (
        <div style={{ background: "#F7F7F5", borderRadius: 6, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#A8A89E", marginBottom: 5 }}>Mô tả</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{map.description}</div>
        </div>
      )}

      {/* Đánh giá */}
      {map.ratings?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Đánh giá gần nhất</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {map.ratings.map((r) => (
              <div key={r.id} style={{ background: "#F7F7F5", borderRadius: 6, padding: "10px 14px", border: "1px solid #E8E8E4" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>@{r.username}</span>
                  <StarRating value={r.rating} />
                </div>
                {r.review && <div style={{ fontSize: 12.5, color: "#6B6B65" }}>{r.review}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function MapManager() {
  const [maps, setMaps]             = useState([]);
  const [stats, setStats]           = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailMap, setDetailMap]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]           = useState(null);
  const [searchDebounced, setSearchDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMaps = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await http.get(`${API}/maps`, { search: searchDebounced, filter, page, limit: pagination.limit });
      setMaps(data.data);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err?.message || "Lỗi tải danh sách màn chơi", "danger");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, filter, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await http.get(`${API}/maps/stats`);
      setStats(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchMaps(1); }, [searchDebounced, filter]);
  useEffect(() => { fetchStats(); }, []);

  const openDetail = async (map) => {
    setDetailMap(map);
    setDetailLoading(true);
    try {
      const data = await http.get(`${API}/maps/${map.id}`);
      setDetailMap(data.data);
    } catch {
      showToast("Không thể tải chi tiết màn chơi", "danger");
    } finally {
      setDetailLoading(false);
    }
  };

  const togglePublish = async (map) => {
    try {
      const data = await http.patch(`${API}/maps/${map.id}/publish`, { is_published: !map.is_published });
      setMaps((prev) => prev.map((m) => m.id === map.id ? { ...m, is_published: !m.is_published } : m));
      if (detailMap?.id === map.id) setDetailMap((prev) => ({ ...prev, is_published: !prev.is_published }));
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
      const data = await http.delete(`${API}/maps/${deleteTarget.id}`);
      setMaps((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      fetchStats();
      showToast(data.message, "danger");
    } catch (err) {
      showToast(err?.message || "Lỗi khi xóa màn chơi", "danger");
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const FILTERS = [
    { key: "all",       label: "Tất cả" },
    { key: "published", label: "Đã xuất bản" },
    { key: "draft",     label: "Bản nháp" },
  ];

  const actionBtnStyle = (color) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 28, padding: "0 10px", borderRadius: 6,
    border: `1px solid ${color ? color + "40" : "#E8E8E4"}`,
    background: color ? color + "10" : "white",
    cursor: "pointer", fontSize: 11, fontWeight: 500,
    color: color || "#6B6B65", fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Topbar */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E8E4", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Quản lý màn chơi</div>
          <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 1 }}>Admin / Màn chơi cộng đồng</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F7F5", border: "1px solid #E8E8E4", borderRadius: 6, padding: "7px 12px", width: 240 }}>
          <svg width="13" height="13" fill="none" stroke="#A8A89E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã, tên, tác giả..." style={{ border: "none", background: "transparent", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#1A1A18", outline: "none", width: "100%" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Tổng màn chơi",  value: stats?.total_maps,    badge: `+${stats?.new_this_month ?? 0} tháng này`, color: "#EFF4FF" },
            { label: "Đã xuất bản",    value: stats?.published_maps, badge: "Hoạt động",                               color: "#F0FDF4" },
            { label: "Bản nháp",       value: stats?.draft_maps,    badge: "Chờ duyệt",                               color: "#FFFBEB" },
            { label: "Tổng lượt chơi", value: (stats?.total_plays || 0).toLocaleString(), badge: "Tất cả",            color: "#F0FDF4" },
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
            <div style={{ fontSize: 14, fontWeight: 600 }}>Danh sách màn chơi</div>
            <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 2 }}>
              {pagination.total} màn chơi · Trang {pagination.page}/{pagination.totalPages}
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
                {["Mã / Tên", "Tác giả", "Danh mục", "Trạng thái", "Lượt chơi", "Đánh giá", "Ngày tạo", "Thao tác"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: i === 7 ? "right" : "left", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#A8A89E", paddingLeft: i === 0 ? 20 : 16, paddingRight: i === 7 ? 20 : 16 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><Spinner /></td></tr>
              ) : maps.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#A8A89E", fontSize: 13 }}>Không tìm thấy màn chơi nào</td></tr>
              ) : maps.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #E8E8E4" }}>
                  <td style={{ padding: "14px 16px", paddingLeft: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, background: "#EFF4FF", color: "#2563EB", padding: "2px 7px", borderRadius: 4, border: "1px solid #BFDBFE" }}>{m.map_code}</span>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{m.title}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: "#6B6B65" }}>@{m.author_username}</div>
                    <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 1 }}>{m.author_name}</div>
                  </td>
                  {/* ── Cột danh mục trong bảng ── */}
                  <td style={{ padding: "14px 16px", maxWidth: 160 }}>
                    {(m.categories || []).length === 0 ? (
                      <span style={{ fontSize: 12, color: "#C0C0B8", fontStyle: "italic" }}>—</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(m.categories || []).slice(0, 2).map(cat => (
                          <span key={cat.id} style={{ fontSize: 10.5, fontWeight: 500, padding: "2px 7px", borderRadius: 20, background: "#EFF4FF", color: "#2563EB", border: "1px solid #BFDBFE", whiteSpace: "nowrap" }}>
                            {cat.name}
                          </span>
                        ))}
                        {(m.categories || []).length > 2 && (
                          <span style={{ fontSize: 10.5, color: "#A8A89E" }}>+{m.categories.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Badge type={m.is_published ? "published" : "draft"}>{m.is_published ? "Xuất bản" : "Bản nháp"}</Badge>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#6B6B65" }}>{(m.play_count || 0).toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StarRating value={m.average_rating || 0} />
                    <div style={{ fontSize: 11, color: "#A8A89E", marginTop: 2 }}>{m.total_ratings || 0} đánh giá</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#6B6B65" }}>{new Date(m.created_at).toLocaleDateString("vi-VN")}</span>
                  </td>
                  <td style={{ padding: "14px 20px 14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <button style={actionBtnStyle()} onClick={() => openDetail(m)}>Chi tiết</button>
                      <button style={actionBtnStyle(m.is_published ? "#D97706" : "#16A34A")} onClick={() => togglePublish(m)}>
                        {m.is_published ? "Ẩn" : "Xuất bản"}
                      </button>
                      <button style={actionBtnStyle("#DC2626")} onClick={() => setDeleteTarget(m)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E8E4", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7F7F5" }}>
            <div style={{ fontSize: 12.5, color: "#A8A89E" }}>Hiển thị {maps.length} / {pagination.total} màn chơi</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => fetchMaps(pagination.page - 1)} disabled={pagination.page <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "white", fontSize: 12.5, cursor: pagination.page <= 1 ? "not-allowed" : "pointer", color: "#6B6B65", opacity: pagination.page <= 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 1))
                .map((p) => (
                  <button key={p} onClick={() => fetchMaps(p)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: p === pagination.page ? "#2563EB" : "white", fontSize: 12.5, cursor: "pointer", color: p === pagination.page ? "white" : "#6B6B65", fontFamily: "'DM Sans', sans-serif" }}>{p}</button>
                ))}
              <button onClick={() => fetchMaps(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "white", fontSize: 12.5, cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer", color: "#6B6B65", opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailMap}
        onClose={() => setDetailMap(null)}
        title={detailMap?.title}
        subtitle={`${detailMap?.map_code} · Tác giả: @${detailMap?.author_username || detailMap?.created_by?.username || "—"}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDetailMap(null)}>Đóng</Btn>
            <Btn variant={detailMap?.is_published ? "outline" : "success"} onClick={() => { togglePublish(detailMap); setDetailMap(null); }}>
              {detailMap?.is_published ? "Ẩn màn chơi" : "Xuất bản"}
            </Btn>
          </>
        }
      >
        {detailLoading ? <Spinner /> : detailMap && <MapDetailContent map={detailMap} />}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa màn chơi"
        subtitle="Hành động này không thể hoàn tác"
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
            <div style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>Xóa "{deleteTarget.title}"?</div>
            <div style={{ fontSize: 12.5, color: "#9B1C1C", lineHeight: 1.6 }}>
              Màn chơi <strong>{deleteTarget.map_code}</strong> và toàn bộ lịch sử chơi ({deleteTarget.play_count || 0} lượt) sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}