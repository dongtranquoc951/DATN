import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFF_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const STAR_STR   = (n) => ["", "⭐", "⭐⭐", "⭐⭐⭐"][n] || "";

const THEME = {
  easy: {
    hero:     "linear-gradient(135deg, #1d9e75, #0f6e56)",
    cardBg:   "linear-gradient(135deg, #e1f5ee, #b8f0d8)",
    num:      "#e1f5ee", numTxt: "#0f6e56",
    name:     "#0f6e56",
    badge:    "#0f6e56", badgeBg: "#9fe1cb",
    stat:     "#e1f5ee", statTxt: "#0f6e56", statLbl: "#1d9e75",
    skill:    "#1d9e75", skillBg: "#e1f5ee",
    btn:      "#1d9e75",
    dot:      "#0f6e56", dotRing: "#9fe1cb",
  },
  medium: {
    hero:     "linear-gradient(135deg, #7f77dd, #534ab7)",
    cardBg:   "linear-gradient(135deg, #eeedfe, #d4c8ff)",
    num:      "#eeedfe", numTxt: "#534ab7",
    name:     "#534ab7",
    badge:    "#534ab7", badgeBg: "#cecbf6",
    stat:     "#eeedfe", statTxt: "#534ab7", statLbl: "#7f77dd",
    skill:    "#534ab7", skillBg: "#eeedfe",
    btn:      "#7f77dd",
    dot:      "#7f77dd", dotRing: "#cecbf6",
  },
  hard: {
    hero:     "linear-gradient(135deg, #ef9f27, #ba7517)",
    cardBg:   "linear-gradient(135deg, #faeeda, #ffd199)",
    num:      "#faeeda", numTxt: "#854f0b",
    name:     "#854f0b",
    badge:    "#854f0b", badgeBg: "#fac775",
    stat:     "#faeeda", statTxt: "#854f0b", statLbl: "#ba7517",
    skill:    "#ba7517", skillBg: "#faeeda",
    btn:      "#ba7517",
    dot:      "#ba7517", dotRing: "#fac775",
  },
};

function determineDifficulty(n) {
  return n <= 3 ? "easy" : n <= 6 ? "medium" : "hard";
}

// ─── Level Card ───────────────────────────────────────────────────────────────
function LevelCard({ level, onClick }) {
  const { is_locked: locked, is_completed: done, difficulty: diff } = level;
  const current = !locked && !done;
  const t = THEME[diff] || THEME.medium;

  const cardBg = locked
    ? "#e8eaf0"
    : done
    ? "linear-gradient(135deg, #d4f5e8, #a8edcc)"
    : t.cardBg;

  return (
    <div
      onClick={() => !locked && onClick(level)}
      style={{
        background:   cardBg,
        borderRadius: 16,
        padding:      "14px 12px 12px",
        cursor:       locked ? "not-allowed" : "pointer",
        position:     "relative",
        overflow:     "hidden",
        opacity:      locked ? 0.45 : 1,
        transition:   "transform .15s, box-shadow .15s",
      }}
      onMouseEnter={e => {
        if (!locked) {
          e.currentTarget.style.transform  = "translateY(-3px)";
          e.currentTarget.style.boxShadow  = "0 8px 24px rgba(0,0,0,.12)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Status dot */}
      {done && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 9, height: 9, borderRadius: "50%",
          background: t.dot, boxShadow: `0 0 0 2px ${t.dotRing}`,
        }} />
      )}
      {current && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 9, height: 9, borderRadius: "50%",
          background: t.dot, boxShadow: `0 0 0 2px ${t.dotRing}`,
          animation: "pulseDot 1.5s ease infinite",
        }} />
      )}

      {/* Number */}
      <div style={{
        fontSize: 24, fontWeight: 500, marginBottom: 4,
        color: locked ? "#b4b2a9" : done ? "#085041" : t.numTxt,
      }}>
        {locked ? "?" : level.level_number}
      </div>

      {/* Name */}
      <div style={{
        fontSize: 10, fontWeight: 500, lineHeight: 1.5,
        marginBottom: 8, minHeight: 30,
        color: locked ? "#b4b2a9" : done ? "#0f6e56" : t.name,
      }}>
        {locked ? `Level ${level.level_number}` : level.title}
      </div>

      {/* Stars */}
      <div style={{ fontSize: 11, marginBottom: 6, minHeight: 16 }}>
        {done ? STAR_STR(level.stars) : " "}
      </div>

      {/* Difficulty badge */}
      <span style={{
        display: "inline-block", fontSize: 9, padding: "3px 8px",
        borderRadius: 99, fontWeight: 500,
        background: locked ? "#b4b2a9" : done ? "#085041" : t.badge,
        color:      locked ? "#f1efe8" : done ? "#9fe1cb"  : t.badgeBg,
      }}>
        {locked ? "Chưa mở" : DIFF_LABEL[diff]}
      </span>
    </div>
  );
}

// ─── Detail Page ─────────────────────────────────────────────────────────────
function DetailPage({ level, onBack, onPlay }) {
  const { difficulty: diff, is_completed: done } = level;
  const t = THEME[diff] || THEME.medium;

  const statItems = done
    ? [
        { v: STAR_STR(level.stars),                                        l: "Sao" },
        { v: level.best_steps ?? "—",                                      l: "Bước tốt nhất" },
        { v: level.best_time ? `${Math.round(level.best_time)}s` : "—",   l: "Thời gian" },
        { v: level.attempts,                                               l: "Lần chơi" },
      ]
    : [
        { v: "—", l: "Sao" },
        { v: "—", l: "Bước" },
        { v: "—", l: "Thời gian" },
        { v: 0,   l: "Lần chơi" },
      ];

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      animation: "slideDown .35s cubic-bezier(.4,0,.2,1)",
    }}>
      {/* Hero header */}
      <div style={{ background: t.hero, padding: "20px 20px 24px", flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 500,
            background: "rgba(255,255,255,.25)", color: "white",
            border: "none", padding: "6px 12px", borderRadius: 99,
            cursor: "pointer", marginBottom: 16, fontFamily: "inherit",
          }}
        >
          ← Quay lại
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 500,
            background: t.num, color: t.numTxt,
          }}>
            {level.level_number}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "white", marginBottom: 6 }}>
              {level.title}
            </div>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 500,
              background: "rgba(255,255,255,.25)", color: "white",
            }}>
              {DIFF_LABEL[diff]}
            </span>
          </div>
        </div>
      </div>

      {/* Body — white sheet sliding up from hero */}
      <div style={{
        background: "white", borderRadius: "24px 24px 0 0",
        flex: 1, overflowY: "auto", padding: 20,
      }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {statItems.map(s => (
            <div key={s.l} style={{ background: t.stat, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: t.statTxt, marginBottom: 2 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: t.statLbl }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase", color: "#a0aec0", marginBottom: 8 }}>
          Nội dung
        </div>
        <p style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.7, marginBottom: 20 }}>
          {level.description}
        </p>

        {/* Skills — optional field from API */}
        {level.skills?.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase", color: "#a0aec0", marginBottom: 8 }}>
              Kỹ năng học được
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
              {level.skills.map(s => (
                <span key={s} style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 99,
                  border: `1.5px solid ${t.skill}`,
                  color: t.skill, background: t.skillBg, fontWeight: 500,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Action button */}
        <button
          onClick={() => onPlay(level)}
          style={{
            width: "100%", padding: 14, borderRadius: 14, border: "none",
            fontSize: 14, fontWeight: 500, cursor: "pointer",
            background: t.btn, color: "white", fontFamily: "inherit",
            transition: "opacity .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = ".88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {done ? "✓ Chơi lại" : `▶ Bắt đầu level ${level.level_number}`}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LevelList() {
  const [levels,    setLevels]    = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const levelsRes = await fetch(`${API_BASE_URL}/learning/levels`);
      if (!levelsRes.ok) throw new Error("Không thể tải danh sách màn chơi");
      const { levels: rawLevels } = await levelsRes.json();

      const token = localStorage.getItem("token");
      let progressMap = {};

      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/learning/progress`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const { progress } = await res.json();
            progress.forEach(p => {
              progressMap[p.level_id] = {
                isCompleted: p.is_completed,
                stars:       p.stars || 0,
                bestSteps:   p.best_steps,
                bestTime:    p.best_time,
                attempts:    p.attempts,
              };
            });
          }
        } catch (_) {}
      }

      const sorted = [...rawLevels].sort((a, b) => a.level_number - b.level_number);
      const transformed = sorted.map((level, idx) => {
        const progress  = progressMap[level.id] || {};
        const prevLevel = sorted[idx - 1];
        const prevDone  = idx === 0 || !!(progressMap[prevLevel?.id]?.isCompleted);

        return {
          id:           level.id,
          level_number: level.level_number,
          title:        level.title,
          description:  level.description,
          skills:       level.skills || [],
          difficulty:   determineDifficulty(level.level_number),
          is_completed: progress.isCompleted || false,
          stars:        progress.stars || 0,
          best_steps:   progress.bestSteps,
          best_time:    progress.bestTime,
          attempts:     progress.attempts || 0,
          is_locked:    !prevDone,
        };
      });

      setLevels(transformed);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completedLevels = levels.filter(l => l.is_completed).length;
  const totalLevels     = levels.length;
  const totalStars      = levels.reduce((s, l) => s + l.stars, 0);
  const progressPct     = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1.5s linear infinite" }}>⏳</div>
          <p style={{ fontSize: 13, color: "#8888aa" }}>Đang tải...</p>
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
          <button
            onClick={loadData}
            style={{ padding: "10px 24px", background: "#7f77dd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", paddingBottom: "4rem" }}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes slideUp  { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
      `}</style>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "20px 24px" }}>
        <div style={{ maxWidth: "auto", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a2e", marginBottom: 2 }}>Màn học tập</div>
              <div style={{ fontSize: 11, color: "#8888aa" }}>Nhấn vào màn để xem chi tiết</div>
            </div>
            <span style={{ fontSize: 12, color: "#ba7517", background: "#faeeda", padding: "4px 12px", borderRadius: 99, fontWeight: 500 }}>
              ⭐ {totalStars} sao
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 8, background: "#dde3ff", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: "linear-gradient(90deg, #7f77dd, #a060ff)",
                borderRadius: 99, transition: "width .6s",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#8888aa", whiteSpace: "nowrap" }}>
              {completedLevels} / {totalLevels} màn
            </div>
          </div>

          {/* Chips */}
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: "#e1f5ee", color: "#0f6e56" }}>
              ✓ {completedLevels} hoàn thành
            </span>
            <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: "#eeedfe", color: "#534ab7" }}>
              {progressPct}% tiến độ
            </span>
          </div>
        </div>
      </div>

      {/* Grid + Detail */}
      <div style={{ maxWidth: "auto", margin: "0 auto", padding: "24px 24px 0", position: "relative", minHeight: 480 }}>
        {/* Card grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
          gap: 10,
          opacity:       selected ? 0 : 1,
          pointerEvents: selected ? "none" : "auto",
          transition:    "opacity .2s",
        }}>
          {levels.map(level => (
            <LevelCard key={level.id} level={level} onClick={setSelected} />
          ))}

          {levels.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem 0", color: "#a0aec0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <p style={{ fontSize: 14 }}>Chưa có màn chơi nào</p>
            </div>
          )}
        </div>

        {/* Detail overlay */}
        {selected && (
          <DetailPage
            level={selected}
            onBack={() => setSelected(null)}
            onPlay={(level) => navigate(`/learning/playlevel/${level.level_number}`)}
          />
        )}
      </div>
    </div>
  );
}