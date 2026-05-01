import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{
        height: 80, borderRadius: 14,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e8edf2 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
        animationDelay: `${i * 0.1}s`,
      }} />
    ))}
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  </div>
);

// ── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({ session, index, onPlay }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 14,
        background: "white",
        border: "0.5px solid #e8eaf0",
        transition: "border-color .15s, transform .15s, box-shadow .15s",
        animation: "fadeSlide 0.3s ease both",
        animationDelay: `${index * 0.05}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#7f77dd";
        e.currentTarget.style.transform   = "translateY(-2px)";
        e.currentTarget.style.boxShadow   = "0 6px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e8eaf0";
        e.currentTarget.style.transform   = "translateY(0)";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      <style>{`@keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        background: "linear-gradient(135deg,#7f77dd,#534ab7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
        boxShadow: "0 4px 12px rgba(107,99,196,0.3)",
      }}>
        🗺️
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 500, fontSize: 14, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {session.map_title || `Bản đồ #${session.map_id}`}
          </span>
          {session.map_author && (
            <span style={{ fontSize: 11, color: "#a0a0c0", flexShrink: 0 }}>by {session.map_author}</span>
          )}
        </div>

        <div style={{ fontSize: 11, color: "#7a8099" }}>
          📅 {formatDate(session.played_at)}
        </div>
      </div>

      {/* Play button */}
      <div style={{ flexShrink: 0 }}>
        <button
          onClick={() => onPlay(session.map_id)}
          style={{
            padding: "5px 14px", borderRadius: 99, border: "none",
            background: "#7f77dd", color: "white",
            fontSize: 11, fontWeight: 500, cursor: "pointer",
            fontFamily: "inherit", transition: "opacity .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          ▶ Chơi lại
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CommunityHistory() {
  const navigate = useNavigate();

  const [sessions,  setSessions]  = useState([]);
  const [isLoading, setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      const res = await fetch(`${API_BASE_URL}/community/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không thể tải lịch sử");
      const data = await res.json();

      const sessions = (data.history || []).map((h, index) => ({
        _sid:       `${h.id ?? h.map_id}-${index}`,
        map_id:     h.map_id,
        map_title:  h.map_title,
        map_author: h.map_author,
        played_at:  h.updated_at || h.completed_at || null,
      }));

      sessions.sort((a, b) => new Date(b.played_at) - new Date(a.played_at));
      setSessions(sessions.slice(0, 20));

    } catch (e) {
      console.error(e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueMaps = new Set(sessions.map(s => s.map_id)).size;

  const filtered = sessions.filter(s =>
    !search ||
    (s.map_title || "").toLowerCase().includes(search.toLowerCase()) ||
    String(s.map_id).includes(search)
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", paddingBottom: "3rem" }}>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "18px 24px", marginBottom: 20 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, color: "#1a1a2e", marginBottom: 2 }}>Lịch sử cộng đồng</div>
              <div style={{ fontSize: 11, color: "#8888aa" }}>20 bản đồ đã chơi gần nhất</div>
            </div>
            <button
              onClick={() => navigate("/community")}
              style={{ padding: "7px 16px", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              Khám phá map →
            </button>
          </div>

          {/* Stat chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: "#eeedfe", color: "#534ab7" }}>
              🎮 {sessions.length} map chơi
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar + List */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>

        {/* Search */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#a0a0c0" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm bản đồ..."
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                borderRadius: 99, border: "0.5px solid #e2e8f0",
                fontSize: 12, outline: "none", background: "white", width: 170,
                fontFamily: "inherit", color: "#1a1a2e",
              }}
              onFocus={e  => { e.target.style.borderColor = "#7f77dd"; e.target.style.boxShadow = "0 0 0 3px #eeedfe"; }}
              onBlur={e   => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#a0a0c0" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#4a5568", marginBottom: 6 }}>
              {search ? "Không tìm thấy bản đồ" : "Chưa có lịch sử chơi"}
            </div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>
              {search ? "Thử từ khóa khác" : "Khám phá và chơi các bản đồ cộng đồng!"}
            </div>
            {!search && (
              <button
                onClick={() => navigate("/community")}
                style={{ padding: "9px 22px", background: "#7f77dd", color: "white", border: "none", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              >
                Khám phá cộng đồng →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((session, i) => (
              <SessionCard
                key={session._sid}
                session={session}
                index={i}
                onPlay={id => navigate(`/community/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}