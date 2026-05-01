// pages/Home/Community/PlayLevel.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { EngineFactory, GameEngine, extractStats } from "@shared/engine";
import GameGrid from "../../../components/game/GameGrid";

const API_BASE_URL      = "http://localhost:5000/api";
const DEFAULT_CELL_SIZE = 70;
const MAX_GAME_WIDTH    = 600;
const MAX_GAME_HEIGHT   = 450;
const MIN_CELL_SIZE     = 30;

// ── Style cho từng category ───────────────────────────────────────────────────
const GROUP_CONFIG = {
  move:      { label: "Di chuyển", color: "#1D9E75", bg: "#E1F5EE", border: "#9fe1cb" },
  condition: { label: "Kiểm tra",  color: "#534ab7", bg: "#EEEDFE", border: "#cecbf6" },
  loop:      { label: "Vòng lặp",  color: "#a32d2d", bg: "#FCEBEB", border: "#fca5a5" },
  if:        { label: "Điều kiện", color: "#0f6e56", bg: "#E1F5EE", border: "#9fe1cb" },
};

const getAllEngineBlocks = () => [
  ...GameEngine.COMMANDS.moves,
  ...GameEngine.COMMANDS.conditions,
  ...GameEngine.COMMANDS.loops,
  ...GameEngine.COMMANDS.ifs,
];

// ── Block Item ────────────────────────────────────────────────────────────────
function BlockItem({ block, groupColor, groupBg, groupBorder, onInsert }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable
      title={block.hint}
      onDragStart={e => { e.dataTransfer.setData("text/plain", block.code); e.dataTransfer.effectAllowed = "copy"; }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onInsert(block.code)}
      style={{
        padding: "5px 9px", borderRadius: 7,
        border: `1px solid ${groupBorder}`,
        background: hov ? groupColor : groupBg,
        color: hov ? "white" : groupColor,
        fontSize: 11, fontWeight: 500,
        cursor: "grab", userSelect: "none",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        fontFamily: "Consolas, Monaco, monospace",
        transition: "all .12s",
      }}
    >
      {block.label}
    </div>
  );
}

// ── Block Palette ngang ───────────────────────────────────────────────────────
function BlockPalette({ onInsert }) {
  const allBlocks = getAllEngineBlocks();

  const grouped = Object.entries(GROUP_CONFIG)
    .map(([key, cfg]) => ({
      key, ...cfg,
      blocks: allBlocks.filter(b => b.category === key),
    }))
    .filter(g => g.blocks.length > 0);

  const [activeTab, setActiveTab] = useState(() => grouped[0]?.key ?? "move");
  const currentGroup = grouped.find(g => g.key === activeTab) ?? grouped[0];

  return (
    <div style={{ background: "white", borderRadius: 16, border: "0.5px solid #e8eaf0", overflow: "hidden" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "0.5px solid #f0f0f8", overflowX: "auto" }}>
        {grouped.map(g => {
          const isActive = g.key === currentGroup?.key;
          return (
            <button
              key={g.key}
              onClick={() => setActiveTab(g.key)}
              style={{
                padding: "9px 14px", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 11, fontWeight: 500,
                whiteSpace: "nowrap", transition: "all .12s",
                background: isActive ? g.bg : "transparent",
                color: isActive ? g.color : "#a0a0c0",
                borderBottom: isActive ? `2px solid ${g.color}` : "2px solid transparent",
              }}
            >
              {g.label}
              <span style={{ marginLeft: 5, fontSize: 10, opacity: .6 }}>({g.blocks.length})</span>
            </button>
          );
        })}
      </div>

      {/* Blocks wrap ngang */}
      {currentGroup && (
        <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {currentGroup.blocks.map(b => (
            <BlockItem
              key={b.id} block={b}
              groupColor={currentGroup.color}
              groupBg={currentGroup.bg}
              groupBorder={currentGroup.border}
              onInsert={onInsert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Game Result Modal ─────────────────────────────────────────────────────────
function GameResultModal({ open, type, moves, failReason, errorMsg, onRate, onClose, onPlayAgain, onGoBack, rated, ratedValue }) {
  const [hovered, setHovered] = useState(0);
  const [animIn,  setAnimIn]  = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
    else setAnimIn(false);
  }, [open]);

  if (!open) return null;

  const isWin   = type === "win";
  const isFail  = type === "fail";
  const isError = type === "error";

  const cfg = {
    win:   { icon: "🏆", iconAnim: "iconBounce", title: "Hoàn thành!", sub: "Bạn đã giải quyết được map này", accent: "#1D9E75" },
    fail:  { icon: "💀", iconAnim: "iconShake",  title: "Thất bại!",   sub: failReason || "Chưa đến đích",   accent: "#EF4444" },
    error: { icon: "⚠️", iconAnim: "iconShake",  title: "Lỗi code",    sub: "Có lỗi xảy ra khi chạy",       accent: "#EF9F27" },
  }[type];

  const displayStar = hovered || ratedValue || 0;
  const rank = moves <= 10 ? "S" : moves <= 20 ? "A" : moves <= 35 ? "B" : "C";
  const rankColor = { S: "#534ab7", A: "#1D9E75", B: "#EF9F27", C: "#EF4444" }[rank];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,10,20,0.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: animIn ? 1 : 0, transition: "opacity 0.25s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 24,
          padding: "40px 44px 36px", width: 420,
          maxWidth: "calc(100vw - 40px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
          transform: animIn ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          textAlign: "center", position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, borderRadius: "24px 24px 0 0", background: cfg.accent }} />
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", border: "0.5px solid #e8eaf0", background: "white", cursor: "pointer", fontSize: 15, color: "#a0a0c0", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

        <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 8, animation: `${cfg.iconAnim} 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both` }}>{cfg.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a2e", marginBottom: 5 }}>{cfg.title}</div>
        <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 22 }}>{cfg.sub}</div>

        {isError && errorMsg && (
          <div style={{ background: "#FAEEDA", border: "0.5px solid #fac775", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#854f0b", textAlign: "left", fontFamily: "monospace", wordBreak: "break-word" }}>
            {errorMsg}
          </div>
        )}

        {(isWin || isFail) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ background: "#EEEDFE", borderRadius: 14, padding: "14px 0", flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 500, color: "#534ab7" }}>{moves}</div>
              <div style={{ fontSize: 10, color: "#a0a0e0", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>Bước đi</div>
            </div>
            {isWin && (
              <div style={{ background: "#f8f8ff", borderRadius: 14, padding: "14px 0", flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 500, color: rankColor }}>{rank}</div>
                <div style={{ fontSize: 10, color: "#a0a0c0", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>Xếp hạng</div>
              </div>
            )}
            {isFail && (
              <div style={{ background: "#FCEBEB", borderRadius: 14, padding: "14px 0", flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 500, color: "#EF4444" }}>✗</div>
                <div style={{ fontSize: 10, color: "#fca5a5", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>Thất bại</div>
              </div>
            )}
          </div>
        )}

        {isWin && (
          !rated ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#a0a0c0", marginBottom: 8 }}>Đánh giá map này</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s}
                    onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
                    onClick={() => onRate(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, filter: s <= displayStar ? "none" : "grayscale(1) opacity(0.3)", transform: s <= displayStar ? "scale(1.2)" : "scale(1)", transition: "all .15s", padding: "2px 3px" }}>
                    ⭐
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#c0c0c8" }}>
                {hovered === 1 ? "Tệ" : hovered === 2 ? "Không hay lắm" : hovered === 3 ? "Được" : hovered === 4 ? "Hay" : hovered === 5 ? "Tuyệt vời!" : "Nhấn sao để đánh giá"}
              </div>
            </div>
          ) : (
            <div style={{ background: "#FAEEDA", borderRadius: 10, padding: "10px 20px", fontSize: 13, color: "#854f0b", fontWeight: 500, marginBottom: 20 }}>
              Đã đánh giá {ratedValue} ⭐ — Cảm ơn bạn!
            </div>
          )
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPlayAgain}
            style={{ flex: 1, padding: "11px 0", background: cfg.accent, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
            {isWin ? "▶ Chơi lại" : "↺ Thử lại"}
          </button>
          <button onClick={onGoBack}
            style={{ flex: 1, padding: "11px 0", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
            ← Danh sách
          </button>
        </div>
      </div>

      <style>{`
        @keyframes iconBounce { 0%{transform:scale(0.3) rotate(-10deg);opacity:0} 60%{transform:scale(1.15) rotate(3deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes iconShake  { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.1);opacity:1} 65%{transform:translateX(-6px)} 80%{transform:translateX(6px)} 90%{transform:translateX(-3px)} 100%{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PlayLevel() {
  const { mapId }  = useParams();
  const navigate   = useNavigate();

  const [mapData,    setMapData]    = useState(null);
  const [code,       setCode]       = useState("");
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [gameState,  setGameState]  = useState(null);
  const [stats,      setStats]      = useState({});
  const [message,    setMessage]    = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const [modal,      setModal]      = useState({ open: false, type: "win", moves: 0, failReason: "", errorMsg: "" });
  const [rated,      setRated]      = useState(false);
  const [ratedValue, setRatedValue] = useState(0);

  const openModal  = (type, extra = {}) => setModal({ open: true, type, moves: 0, failReason: "", errorMsg: "", ...extra });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const engineRef   = useRef(null);
  const textareaRef = useRef(null);

  // ── Insert block tại vị trí con trỏ ──────────────────────────────────────
  const insertAtCursor = (snippet) => {
    const ta = textareaRef.current;
    if (!ta) { setCode(prev => prev + snippet); return; }

    const start  = ta.selectionStart ?? code.length;
    const end    = ta.selectionEnd   ?? code.length;
    const before = code.slice(0, start);
    const after  = code.slice(end);

    const lastNewline = before.lastIndexOf("\n");
    const currentLine = before.slice(lastNewline + 1);
    const indent      = currentLine.match(/^(\s*)/)[1];

    const indented = snippet
      .split("\n")
      .map((line, i) => (i === 0 ? line : indent + line))
      .join("\n");

    const newCode = before + indented + after;
    setCode(newCode);

    const newPos = start + indented.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  };

  const calculateCellSize = () => {
    if (!gameState) return DEFAULT_CELL_SIZE;
    const cw = Math.floor(MAX_GAME_WIDTH  / gameState.cols);
    const ch = Math.floor(MAX_GAME_HEIGHT / gameState.rows);
    return Math.max(Math.min(cw, ch, DEFAULT_CELL_SIZE), MIN_CELL_SIZE);
  };
  const dynamicCellSize = calculateCellSize();

  useEffect(() => { loadMapData(); }, [mapId]);

  const setupEngine = (gridConfig) => {
    const engine = EngineFactory.createEngine(gridConfig);
    engine.setCallbacks(
      s => {
        setGameState(s);
        setStats(extractStats(s, engine));
      },
      msg => setMessage(msg),
    );
    engineRef.current = engine;
    setGameState(engine.state);
    setStats(extractStats(engine.state, engine));
    return engine;
  };

  const loadMapData = async () => {
    try {
      setIsLoading(true); setError(null);
      const isCode = isNaN(mapId);
      const url    = isCode
        ? `${API_BASE_URL}/community/maps/code/${mapId}`
        : `${API_BASE_URL}/community/maps/${mapId}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Không thể tải dữ liệu map"); }

      const data = await res.json();
      const gd   = typeof data.map.grid_data === "string" ? JSON.parse(data.map.grid_data) : data.map.grid_data;
      if (!gd.player || !gd.target || !gd.rows || !gd.cols) throw new Error("Dữ liệu grid thiếu thông tin bắt buộc");

      setMapData(data.map);
      setCode(data.map?.initial_code || "// Viết code của bạn ở đây\n// Các lệnh: moveRight(), moveLeft(), moveUp(), moveDown()\n");

      setupEngine(gd);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRun = async () => {
    if (!code.trim()) { setMessage("⚠️ Vui lòng viết code trước khi chạy!"); return; }
    setIsRunning(true); setMessage("🎮 Đang chạy code..."); closeModal(); setRated(false); setRatedValue(0);
    try {
      const gd   = typeof mapData.grid_data === "string" ? JSON.parse(mapData.grid_data) : mapData.grid_data;
      await sleep(300);
      const engine = setupEngine(gd);
      const isWin = await engine.executeCode(code);
      if (isWin) {
        await submitMap(true, engine.state.moves);
        setMessage(""); openModal("win", { moves: engine.state.moves });
      } else {
        openModal("fail", { moves: engine.state.moves, failReason: "Chưa đến được đích" });
      }
    } catch (err) {
      openModal("error", { errorMsg: err.message }); setMessage("");
    } finally {
      setIsRunning(false);
    }
  };

  const submitMap = async (isCompleted, steps) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/maps/${mapData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ user_code: code, is_completed: isCompleted, steps_count: steps, time_spent: 0 }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Không thể lưu kết quả"); }
    } catch (err) { console.error("Submit error:", err); }
  };

  const handleRateMap = async (rating) => {
    try {
      const res = await fetch(`${API_BASE_URL}/community/maps/${mapData.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ rating, review: "" }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Không thể đánh giá"); }
      setRated(true); setRatedValue(rating);
    } catch (err) { console.error("Rate error:", err); }
  };

  const handleReset = () => {
    setCode(mapData?.initial_code || ""); setMessage("");
    if (mapData) {
      const gd   = typeof mapData.grid_data === "string" ? JSON.parse(mapData.grid_data) : mapData.grid_data;
      setupEngine(gd);
    }
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const formatRating = (r) => { const n = Number(r); return isNaN(n) ? "0.0" : n.toFixed(1); };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1.5s linear infinite" }}>🗺️</div>
        <div style={{ fontSize: 13, color: "#8888aa" }}>Đang tải map...</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
      <div style={{ background: "white", padding: "2rem", borderRadius: 20, textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#e53e3e", fontSize: 13, marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate("/community")} style={{ padding: "10px 24px", background: "#7f77dd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}>
          Quay lại Community
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } } @keyframes blink { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>

      <GameResultModal
        open={modal.open} type={modal.type} moves={modal.moves}
        failReason={modal.failReason} errorMsg={modal.errorMsg}
        rated={rated} ratedValue={ratedValue}
        onRate={handleRateMap} onClose={closeModal}
        onPlayAgain={() => { closeModal(); handleReset(); }}
        onGoBack={() => navigate("/community")}
      />

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <button
              onClick={() => navigate("/community")}
              style={{ padding: "6px 14px", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
            >
              ← Quay lại
            </button>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              🗺️ {mapData?.title}
            </div>
          </div>

          {/* Meta chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#eeedfe", color: "#534ab7", fontWeight: 500 }}>
              👤 {mapData?.creator_username}
            </span>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#f0f0f8", color: "#8888aa", fontWeight: 500 }}>
              🔑 {mapData?.map_code}
            </span>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#e1f5ee", color: "#0f6e56", fontWeight: 500 }}>
              🎮 {mapData?.play_count || 0} lượt
            </span>
            {mapData?.average_rating > 0 && (
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#faeeda", color: "#854f0b", fontWeight: 500 }}>
                ⭐ {formatRating(mapData.average_rating)}
              </span>
            )}
          </div>

          {mapData?.description && (
            <div style={{ fontSize: 11, color: "#8888aa", marginTop: 6 }}>{mapData.description}</div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* LEFT — Game */}
        <div style={{ background: "white", borderRadius: 16, border: "0.5px solid #e8eaf0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "13px 18px", borderBottom: "0.5px solid #f0f0f8" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#8888aa", textTransform: "uppercase", letterSpacing: ".05em" }}>Màn chơi</div>
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "24px", background: "#fafafe", minHeight: 420 }}>
            {gameState
              ? <GameGrid gameState={gameState} engineInstance={engineRef.current} cellSize={dynamicCellSize} />
              : <div style={{ color: "#a0a0c0", fontSize: 13 }}>Đang tải grid...</div>
            }
          </div>

          {gameState && (
            <div style={{ padding: "12px 18px", borderTop: "0.5px solid #f0f0f8", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, background: "#EEEDFE", color: "#534ab7", fontWeight: 500 }}>
                👟 Bước: <b>{stats.moves ?? gameState.moves ?? 0}</b>
              </span>
              <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, background: "#FAEEDA", color: "#854f0b", fontWeight: 500 }}>
                ⭐ Sao: <b>{stats.stars?.collected ?? gameState.collectedItems?.length ?? 0}/{stats.stars?.total ?? gameState.collectibles?.length ?? 0}</b>
              </span>
              {stats.switches && (
                <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, background: "#E1F5EE", color: "#0f6e56", fontWeight: 500 }}>
                  🔘 Switch: <b>{stats.switches.activated}/{stats.switches.total}</b>
                </span>
              )}
              {stats.shadowPosition && (
                <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, background: "#EEEDFE", color: "#534ab7", fontWeight: 500 }}>
                  👤 Shadow: <b>({stats.shadowPosition.x},{stats.shadowPosition.y})</b>
                </span>
              )}
              {stats.pressurePlates && (
                <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, background: "#FCEBEB", color: "#a32d2d", fontWeight: 500 }}>
                  ⚡ Plates: <b>{stats.pressurePlates.activated}/{stats.pressurePlates.total}</b>
                </span>
              )}
              {stats.triggers && (
                <span style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, background: "#FCEBEB", color: "#a32d2d", fontWeight: 500 }}>
                  🎯 Triggers: <b>{stats.triggers.activated}/{stats.triggers.total}</b>
                </span>
              )}
            </div>
          )}

          {message && !modal.open && (
            <div style={{ margin: "0 18px 14px", padding: "10px 14px", background: "#FAEEDA", color: "#854f0b", borderRadius: 10, fontSize: 12, fontWeight: 500 }}>
              {message}
            </div>
          )}
        </div>

        {/* RIGHT — Editor + Palette */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

          {/* Code editor */}
          <div style={{
            background: "white", borderRadius: 16,
            border: `1.5px solid ${isDragOver ? "#7f77dd" : "#e8eaf0"}`,
            boxShadow: isDragOver ? "0 0 0 3px #eeedfe" : "none",
            overflow: "hidden", display: "flex", flexDirection: "column",
            transition: "border-color .15s, box-shadow .15s",
          }}>
            <div style={{ padding: "13px 18px", borderBottom: "0.5px solid #f0f0f8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#8888aa", textTransform: "uppercase", letterSpacing: ".05em" }}>Code Editor</div>
              {isDragOver && <div style={{ fontSize: 10, color: "#7f77dd", fontWeight: 500, animation: "blink .6s ease infinite" }}>↓ Thả để chèn</div>}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={isRunning}
              placeholder={"// Viết code của bạn ở đây\n// Các lệnh: moveRight(), moveLeft(), moveUp(), moveDown()"}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragOver(true); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
              onDrop={e => {
                e.preventDefault(); setIsDragOver(false);
                const snippet = e.dataTransfer.getData("text/plain");
                if (snippet) insertAtCursor(snippet);
              }}
              style={{
                flex: 1, padding: "16px 18px", border: "none", outline: "none", resize: "none",
                fontSize: 13, fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                lineHeight: 1.7, color: "#1a1a2e",
                background: isRunning ? "#fafafe" : isDragOver ? "#f8f7ff" : "white",
                minHeight: 340, transition: "background .15s",
              }}
            />

            <div style={{ padding: "13px 18px", borderTop: "0.5px solid #f0f0f8", display: "flex", gap: 8 }}>
              <button
                onClick={handleRun} disabled={isRunning}
                style={{ flex: 1, padding: "11px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: isRunning ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "opacity .15s", background: isRunning ? "#D3D1C7" : "#1D9E75", color: isRunning ? "#888780" : "white" }}
                onMouseEnter={e => { if (!isRunning) e.currentTarget.style.opacity = ".85"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {isRunning ? "⏳ Đang chạy..." : "▶ Chạy code"}
              </button>
              <button
                onClick={handleReset} disabled={isRunning}
                style={{ padding: "11px 20px", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: isRunning ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isRunning ? .5 : 1, transition: "opacity .15s" }}
                onMouseEnter={e => { if (!isRunning) e.currentTarget.style.opacity = ".75"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = isRunning ? ".5" : "1"; }}
              >
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Block palette ngang */}
          <BlockPalette onInsert={insertAtCursor} />

        </div>
      </div>
    </div>
  );
}
