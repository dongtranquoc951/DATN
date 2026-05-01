import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFF_THEME = {
  easy: {
    cardBg:  "linear-gradient(135deg, #e1f5ee, #b8f0d8)",
    badge:   "#085041", badgeBg: "#9fe1cb",
    btn:     "#1d9e75",
    code:    "#0f6e56", codeBg: "#e1f5ee",
    meta:    "#1d9e75",
    label:   "Dễ",
  },
  medium: {
    cardBg:  "linear-gradient(135deg, #eeedfe, #d4c8ff)",
    badge:   "#534ab7", badgeBg: "#cecbf6",
    btn:     "#7f77dd",
    code:    "#534ab7", codeBg: "#eeedfe",
    meta:    "#7f77dd",
    label:   "Trung bình",
  },
  hard: {
    cardBg:  "linear-gradient(135deg, #faeeda, #ffd199)",
    badge:   "#854f0b", badgeBg: "#fac775",
    btn:     "#ba7517",
    code:    "#854f0b", codeBg: "#faeeda",
    meta:    "#ba7517",
    label:   "Khó",
  },
};

const FILTERS = [
  ["all",     "Tất cả"],
  ["popular", "Phổ biến"],
  ["recent",  "Mới nhất"],
];


function determineDifficulty(rating) {
  const r = Number(rating) || 0;
  if (r >= 4)   return "hard";
  if (r >= 2.5) return "medium";
  return "easy";
}

function formatRating(r) {
  return (Number(r) || 0).toFixed(1);
}

function formatDate(str) {
  return new Date(str).toLocaleDateString("vi-VN");
}

// ─── Map Card ─────────────────────────────────────────────────────────────────
function MapCard({ map, onClick }) {
  const t = DIFF_THEME[map.difficulty] || DIFF_THEME.medium;

  return (
    <div
      onClick={() => onClick(map)}
      style={{
        background:   t.cardBg,
        borderRadius: 18,
        padding:      "16px 14px 14px",
        cursor:       "pointer",
        transition:   "transform .15s, box-shadow .15s",
        position:     "relative",
        overflow:     "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Top row: code + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 99, background: t.codeBg, color: t.code }}>
          {map.mapCode}
        </span>
        <span style={{ fontSize: 10, fontWeight: 500, padding: "3px 9px", borderRadius: 99, background: t.badge, color: t.badgeBg }}>
          {DIFF_THEME[map.difficulty].label}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a2e", marginBottom: 5, lineHeight: 1.3 }}>
        {map.title}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: "#5a6078", lineHeight: 1.6, marginBottom: 10, minHeight: 36 }}>
        {map.description || "Không có mô tả"}
      </div>

      {/* Author */}
      <div style={{ fontSize: 11, fontWeight: 500, color: t.meta, marginBottom: 12 }}>
        {map.author}
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7a8099", marginBottom: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,.06)" }}>
        <span>🎮 {map.plays}</span>
        <span>⭐ {formatRating(map.rating)}</span>
        <span>📅 {formatDate(map.createdAt)}</span>
      </div>

      {/* Button */}
      <button
        onClick={e => { e.stopPropagation(); onClick(map); }}
        style={{
          width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
          fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: t.btn, color: "white", fontFamily: "inherit",
          transition: "opacity .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        ▶ Chơi ngay
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MapList() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [maps,      setMaps]      = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [error,     setError]     = useState(null);
  const [search, setSearch]     = useState("");

  const searchQuery = new URLSearchParams(location.search).get("search") || "";

  useEffect(() => { loadMaps(); }, [filter, searchQuery]);

  const loadMaps = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sortBy = filter === "popular" ? "play_count" : "created_at";
      const params = new URLSearchParams({ sortBy, order: "DESC", limit: 20, offset: 0 });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`${API_BASE_URL}/community/maps?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Không thể tải danh sách map");
      }

      const data = await res.json();
      if (!data.maps || !Array.isArray(data.maps)) throw new Error("Dữ liệu không đúng định dạng");

      setMaps(data.maps.map(m => {
        const rating = m.average_rating ? Number(m.average_rating) : 0;
        return {
          id:           m.id,
          mapCode:      m.map_code,
          title:        m.title,
          description:  m.description,
          author:       m.creator_username,
          difficulty:   determineDifficulty(rating),
          plays:        m.play_count || 0,
          rating,
          createdAt:    m.created_at,
        };
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1.5s linear infinite" }}>🗺️</div>
          <p style={{ fontSize: 13, color: "#8888aa" }}>Đang tải map...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center", background: "white", padding: "2rem", borderRadius: 20, maxWidth: 360 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: "#e53e3e", marginBottom: 16, fontSize: 13 }}>{error}</p>
          <button onClick={loadMaps} style={{ padding: "10px 24px", background: "#7f77dd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const totalPlays  = maps.reduce((s, m) => s + (m.plays || 0), 0);
  const avgRating   = maps.length ? maps.reduce((s, m) => s + m.rating, 0) / maps.length : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", paddingBottom: "4rem" }}>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "20px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a2e", marginBottom: 2 }}>Map cộng đồng</div>
              <div style={{ fontSize: 11, color: "#8888aa" }}>
                {searchQuery
                  ? <>Kết quả cho "<b style={{ color: "#534ab7" }}>{searchQuery}</b>" · <span onClick={() => navigate("/community")} style={{ color: "#7f77dd", cursor: "pointer" }}>Xóa</span></>
                  : "Khám phá map từ cộng đồng"}
              </div>
            </div>
            <button
              onClick={() => navigate("/mymap/create")}
              style={{ padding: "9px 18px", background: "#7f77dd", color: "white", border: "none", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = ".88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              + Tạo map mới
            </button>
          </div>

          {/* Stats chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: "#eeedfe", color: "#534ab7" }}>
              🗺️ {maps.length} map
            </span>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: "#e1f5ee", color: "#0f6e56" }}>
              🎮 {totalPlays.toLocaleString()} lượt chơi
            </span>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: "#faeeda", color: "#854f0b" }}>
              ⭐ {formatRating(avgRating)} trung bình
            </span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: "6px 16px", borderRadius: 99, border: "none",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit",
                  background: filter === key ? "#7f77dd" : "#f0f0f8",
                  color:      filter === key ? "white"    : "#8888aa",
                  transition: "background .15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 24px" }}>
        {maps.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12 }}>
            {maps.map(map => (
              <MapCard key={map.id} map={map} onClick={m => navigate(`/community/${m.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "5rem 2rem", color: "#a0aec0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#4a5568", marginBottom: 8 }}>
              {searchQuery ? `Không tìm thấy map nào cho "${searchQuery}"` : "Chưa có map nào"}
            </div>
            <div style={{ fontSize: 13, color: "#a0aec0", marginBottom: 20 }}>
              {searchQuery ? "Thử từ khóa khác." : "Hãy là người đầu tiên tạo map!"}
            </div>
            {searchQuery
              ? <button onClick={() => navigate("/community")} style={{ padding: "10px 24px", background: "#7f77dd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}>Xem tất cả</button>
              : <button onClick={() => navigate("/mymap/create")} style={{ padding: "10px 24px", background: "#7f77dd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}>Tạo map đầu tiên</button>
            }
          </div>
        )}
      </div>
    </div>
  );
}