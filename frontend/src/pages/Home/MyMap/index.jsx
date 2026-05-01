import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{
    borderRadius: 14, height: 180,
    background: "linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s ease-in-out infinite",
  }}>
    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
  </div>
);

// ── Map Card ──────────────────────────────────────────────────────────────────
function MapCard({ map, selected, onSelect, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => onSelect(map)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        border: `0.5px solid ${selected ? "#7f77dd" : hov ? "#c4bff0" : "#e8eaf0"}`,
        background: "white",
        boxShadow: selected
          ? "0 0 0 3px #eeedfe, 0 4px 16px rgba(107,99,196,0.12)"
          : hov ? "0 6px 20px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.15s",
        transform: hov && !selected ? "translateY(-2px)" : "none",
        position: "relative",
      }}
    >
      {/* Selected tick */}
      {selected && (
        <div style={{
          position: "absolute", top: 8, right: 8, zIndex: 2,
          width: 20, height: 20, borderRadius: "50%",
          background: "#7f77dd", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "white",
        }}>✓</div>
      )}

      {/* Preview */}
      <div style={{
        height: 100,
        background: selected
          ? "linear-gradient(135deg,#eeedfe,#d4c8ff)"
          : "linear-gradient(135deg,#f8fafc,#f0f0f8)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,9px)", gap: 2 }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} style={{
              width: 9, height: 9, borderRadius: 2,
              background: i === 12 ? "#7f77dd" : i === 2 ? "#1D9E75" : [0,4,6,8,18,24].includes(i) ? "#334155" : "#e2e8f0",
            }} />
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 10px" }}>
        <div style={{ fontWeight: 500, fontSize: 13, color: "#1a1a2e", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {map.title || `Bản đồ #${map.id}`}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 99,
            background: map.is_published ? "#E1F5EE" : "#f0f0f8",
            color:      map.is_published ? "#0f6e56"  : "#8888aa",
          }}>
            {map.is_published ? "● Đã đăng" : "○ Chờ xét duyệt"}
          </span>
          <span style={{ fontSize: 11, color: "#a0a0c0" }}>
            🎮 {map.play_count || 0} · ⭐ {map.average_rating ? Number(map.average_rating).toFixed(1) : "—"}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(83,74,183,0.92)", backdropFilter: "blur(6px)",
        padding: "8px 10px", display: "flex", gap: 6,
        opacity: hov ? 1 : 0, transition: "opacity 0.15s",
      }}>
        <button onClick={e => { e.stopPropagation(); onEdit(map); }}
          style={{ flex: 1, padding: "5px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.2)", color: "white", fontWeight: 500, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
          ✏️ Sửa
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(map); }}
          style={{ flex: 1, padding: "5px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.7)", color: "white", fontWeight: 500, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
          🗑️ Xóa
        </button>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ map, onConfirm, onCancel, loading }) {
  if (!map) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onCancel}>
      <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", maxWidth: 380, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 500, fontSize: 17, textAlign: "center", marginBottom: 8, color: "#1a1a2e" }}>Xóa bản đồ?</div>
        <div style={{ fontSize: 13, color: "#7a8099", textAlign: "center", marginBottom: 22, lineHeight: 1.6 }}>
          Bản đồ <b>"{map.title}"</b> sẽ bị xóa vĩnh viễn cùng toàn bộ lịch sử và đánh giá.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 11, borderRadius: 10, border: "0.5px solid #e8eaf0", background: "#f0f0f8", color: "#534ab7", fontWeight: 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Huỷ
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#ef4444", color: "white", fontWeight: 500, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .6 : 1, fontFamily: "inherit" }}>
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "error" ? "#FCEBEB" : "#E1F5EE",
      color:      type === "error" ? "#A32D2D" : "#085041",
      borderRadius: 12, padding: "11px 18px", fontSize: 13, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <style>{`@keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      {type === "error" ? "❌ " : "✅ "}{msg}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyMap() {
  const navigate = useNavigate();

  const [maps,         setMaps]        = useState([]);
  const [selected,     setSelected]    = useState(null);
  const [isLoading,    setLoading]     = useState(true);
  const [deleteTarget, setDelete]      = useState(null);
  const [deleting,     setDeleting]    = useState(false);
  const [search,       setSearch]      = useState("");
  const [filterPub,    setFilterPub]   = useState("all");
  const [toast,        setToast]       = useState({ msg: "", type: "success" });

  const flash = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => { loadMaps(); }, []);

  const loadMaps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }
      const res = await fetch(`${API_BASE_URL}/community/my-maps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMaps(data.maps || []);
    } catch {
      flash("Không thể tải bản đồ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/community/maps/${deleteTarget.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setMaps(prev => prev.filter(m => m.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      flash(`Đã xóa "${deleteTarget.title}"`);
    } catch {
      flash("Xóa thất bại", "error");
    } finally {
      setDeleting(false); setDelete(null);
    }
  };

  const published = maps.filter(m =>  m.is_published).length;
  const drafts    = maps.filter(m => !m.is_published).length;

  const FILTERS = [
    { val: "all",       label: "Tất cả",  count: maps.length },
    { val: "published", label: "Đã đăng", count: published },
    { val: "draft",     label: "Chờ xét duyệt",    count: drafts },
  ];

  const filtered = maps
    .filter(m => filterPub === "all" || (filterPub === "published" ? m.is_published : !m.is_published))
    .filter(m => !search || (m.title || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: "", type: "success" })} />
      <DeleteModal map={deleteTarget} onConfirm={handleDelete} onCancel={() => setDelete(null)} loading={deleting} />

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "16px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, color: "#1a1a2e", marginBottom: 2 }}>Bản đồ của tôi</div>
              <div style={{ fontSize: 11, color: "#8888aa" }}>{maps.length} bản đồ</div>
            </div>
            <button
              onClick={() => navigate("/mymap/create")}
              style={{ padding: "8px 18px", background: "#7f77dd", color: "white", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              + Tạo mới
            </button>
          </div>

          {/* Filter + Search row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6 }}>
              {FILTERS.map(f => (
                <button key={f.val} onClick={() => setFilterPub(f.val)}
                  style={{
                    padding: "6px 14px", borderRadius: 99, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    fontFamily: "inherit", transition: "background .15s",
                    background: filterPub === f.val ? "#7f77dd" : "#f0f0f8",
                    color:      filterPub === f.val ? "white"    : "#8888aa",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {f.label}
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 99,
                    background: filterPub === f.val ? "rgba(255,255,255,.28)" : "#e2e8f0",
                    color:      filterPub === f.val ? "white" : "#8888aa",
                  }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#a0a0c0" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bản đồ..."
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  borderRadius: 99, border: "0.5px solid #e2e8f0",
                  fontSize: 12, outline: "none", background: "#fafafa", width: 180,
                  fontFamily: "inherit", color: "#1a1a2e",
                }}
                onFocus={e  => { e.target.style.borderColor = "#7f77dd"; e.target.style.boxShadow = "0 0 0 3px #eeedfe"; }}
                onBlur={e   => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px" }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 1rem", color: "#a0a0c0" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🗺️</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#4a5568", marginBottom: 6 }}>
              {search ? "Không tìm thấy bản đồ" : "Chưa có bản đồ nào"}
            </div>
            <div style={{ fontSize: 12, marginBottom: 20 }}>
              {search ? "Thử từ khóa khác" : "Hãy tạo bản đồ đầu tiên!"}
            </div>
            {!search && (
              <button onClick={() => navigate("/mymap/create")}
                style={{ padding: "9px 22px", background: "#7f77dd", color: "white", border: "none", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                + Tạo bản đồ mới
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {filtered.map(map => (
              <MapCard key={map.id} map={map}
                selected={selected?.id === map.id}
                onSelect={m => setSelected(prev => prev?.id === m.id ? null : m)}
                onEdit={m => navigate(`/mymap/create?edit=${m.id}`)}
                onDelete={m => setDelete(m)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}