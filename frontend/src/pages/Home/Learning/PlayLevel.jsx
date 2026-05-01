import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { EngineFactory, generateGridData, extractStats } from "@shared/engine";
import { GameEngine } from "@shared/engine/GameEngine"; // import để dùng COMMANDS
import GameGrid from "../../../components/game/GameGrid";

const API_BASE_URL      = "http://localhost:5000/api";
const DEFAULT_CELL_SIZE = 70;
const MAX_GAME_WIDTH    = 600;
const MAX_GAME_HEIGHT   = 450;
const MIN_CELL_SIZE     = 30;

// ── Style cho từng category — không chứa block data ──────────────────────────
const GROUP_CONFIG = {
  move:      { label: "Di chuyển", color: "#1D9E75", bg: "#E1F5EE", border: "#9fe1cb" },
  condition: { label: "Kiểm tra",  color: "#534ab7", bg: "#EEEDFE", border: "#cecbf6" },
  query:     { label: "Truy vấn",  color: "#534ab7", bg: "#EEEDFE", border: "#cecbf6" },
  loop:      { label: "Vòng lặp",  color: "#a32d2d", bg: "#FCEBEB", border: "#fca5a5" },
  if:        { label: "Điều kiện", color: "#0f6e56", bg: "#E1F5EE", border: "#9fe1cb" },
};

// ── Flatten tất cả blocks từ engine thành 1 mảng ─────────────────────────────
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
      onDragStart={e => {
        e.dataTransfer.setData("text/plain", block.code);
        e.dataTransfer.effectAllowed = "copy";
      }}
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

// ── Block Palette ngang — tab group trên, block wrap ngang bên dưới ──────────
function BlockPalette({ onInsert, allowedCommands }) {
  // Lọc theo allowedCommands từ level — nếu null/undefined thì hiện tất cả
  const visibleBlocks = getAllEngineBlocks().filter(b =>
    !allowedCommands || allowedCommands.includes(b.name)
  );

  // Group theo category, ẩn group nếu không có block nào
  const grouped = Object.entries(GROUP_CONFIG)
    .map(([key, cfg]) => ({
      key,
      ...cfg,
      blocks: visibleBlocks.filter(b => b.category === key),
    }))
    .filter(g => g.blocks.length > 0);

  const [activeTab, setActiveTab] = useState(() => grouped[0]?.key ?? "move");

  // Nếu tab đang active bị ẩn (level không có lệnh đó) → reset về tab đầu tiên
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

      {/* Blocks — wrap ngang */}
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
function GameResultModal({ open, type, moves, stars, failReason, errorMsg, onClose, onRetry, onNextLevel, onGoBack }) {
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => {
    if (open) requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
    else setAnimIn(false);
  }, [open]);
  if (!open) return null;

  const isWin   = type === "win";
  const isFail  = type === "fail";
  const isError = type === "error";
  const cfg = {
    win:   { icon: "🏆", iconAnim: "iconBounce", title: "Hoàn thành!", sub: "Bạn đã vượt qua level này", accent: "#1D9E75" },
    fail:  { icon: "💀", iconAnim: "iconShake",  title: "Thất bại!",   sub: failReason || "Chưa đến được đích", accent: "#EF4444" },
    error: { icon: "⚠️", iconAnim: "iconShake",  title: "Lỗi code",    sub: "Có lỗi xảy ra khi chạy",     accent: "#EF9F27" },
  }[type];
  const starCount = stars || 0;

  return (
    <div onClick={isWin ? undefined : onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,10,20,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", opacity: animIn ? 1 : 0, transition: "opacity 0.25s ease" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 24, padding: "40px 44px 36px", width: 420, maxWidth: "calc(100vw - 40px)", boxShadow: "0 32px 80px rgba(0,0,0,0.2)", transform: animIn ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, borderRadius: "24px 24px 0 0", background: cfg.accent }} />
        {!isWin && <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: "50%", border: "0.5px solid #e8eaf0", background: "white", cursor: "pointer", fontSize: 15, color: "#a0a0c0", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>}
        <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 8, animation: `${cfg.iconAnim} 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both` }}>{cfg.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a2e", marginBottom: 5 }}>{cfg.title}</div>
        <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 22 }}>{cfg.sub}</div>
        {isError && errorMsg && <div style={{ background: "#FAEEDA", border: "0.5px solid #fac775", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#854f0b", textAlign: "left", fontFamily: "monospace", wordBreak: "break-word" }}>{errorMsg}</div>}
        {(isWin || isFail) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            <div style={{ background: "#EEEDFE", borderRadius: 14, padding: "14px 0", flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 500, color: "#534ab7" }}>{moves}</div>
              <div style={{ fontSize: 10, color: "#a0a0e0", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>Bước đi</div>
            </div>
            {isWin && (
              <div style={{ background: "#FAEEDA", borderRadius: 14, padding: "14px 0", flex: 1 }}>
                <div style={{ fontSize: 22, lineHeight: 1.3 }}>{"⭐".repeat(starCount)}{"☆".repeat(3 - starCount)}</div>
                <div style={{ fontSize: 10, color: "#ba7517", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 6 }}>Xếp hạng</div>
              </div>
            )}
            {isFail && (
              <div style={{ background: "#FCEBEB", borderRadius: 14, padding: "14px 0", flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 500, color: "#ef4444" }}>✗</div>
                <div style={{ fontSize: 10, color: "#fca5a5", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>Thất bại</div>
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isWin && onNextLevel && (
            <button onClick={onNextLevel}
              style={{ width: "100%", padding: "12px 0", background: "#1D9E75", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              Level tiếp theo →
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onRetry}
              style={{ flex: 1, padding: "11px 0", background: isWin ? "#f0f0f8" : cfg.accent, color: isWin ? "#534ab7" : "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              ↺ Thử lại
            </button>
            <button onClick={onGoBack}
              style={{ flex: 1, padding: "11px 0", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = ".85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              ← Danh sách
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes iconBounce { 0%{transform:scale(0.3) rotate(-10deg);opacity:0} 60%{transform:scale(1.15) rotate(3deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes iconShake  { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.1);opacity:1} 65%{transform:translateX(-6px)} 80%{transform:translateX(6px)} 90%{transform:translateX(-3px)} 100%{transform:translateX(0);opacity:1} }
      `}</style>
    </div>
  );
}

// ── Stat Badge ────────────────────────────────────────────────────────────────
function StatBadge({ icon, label, value, bg = "#EEEDFE", color = "#534ab7" }) {
  return (
    <div style={{ padding: "6px 11px", background: bg, color, borderRadius: 99, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
      {icon && <span>{icon}</span>}
      <span style={{ opacity: .7 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PlayLevel() {
  const { level } = useParams();
  const navigate  = useNavigate();

  const [levelData,  setLevelData]  = useState(null);
  const [code,       setCode]       = useState("");
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [gameState,  setGameState]  = useState(null);
  const [gridData,   setGridData]   = useState([]);
  const [stats,      setStats]      = useState({});
  const [message,    setMessage]    = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const [modal, setModal] = useState({ open: false, type: "win", moves: 0, stars: 0, failReason: "", errorMsg: "" });
  const openModal  = (type, extra = {}) => setModal({ open: true, type, moves: 0, stars: 0, failReason: "", errorMsg: "", ...extra });
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

  useEffect(() => { loadLevelData(); }, [level]);

  const setupEngine = (gridConfig) => {
    const engine = EngineFactory.createEngine(gridConfig);
    engine.setCallbacks(
      s => { setGameState(s); setGridData(generateGridData(s, engine)); setStats(extractStats(s, engine)); },
      msg => setMessage(msg),
    );
    engineRef.current = engine;
    setGameState(engine.state);
    setGridData(generateGridData(engine.state, engine));
    setStats(extractStats(engine.state, engine));
    return engine;
  };

  const loadLevelData = async () => {
    try {
      setIsLoading(true); setError(null);
      setModal({ open: false, type: "win", moves: 0, stars: 0, failReason: "", errorMsg: "" });
      setMessage("");
      const response = await fetch(`${API_BASE_URL}/learning/levels/${level}`);
      if (response.status === 404) { navigate("/learning"); return; }
      if (!response.ok) throw new Error("Không thể tải level");
      const data = await response.json();
      setLevelData(data.level);
      setCode(data.level.initial_code || "// Viết code hoặc kéo block từ bảng bên cạnh\n");
      const gridConfig = typeof data.level.grid_data === "string" ? JSON.parse(data.level.grid_data) : data.level.grid_data;
      if (!gridConfig?.player || !gridConfig?.target || !gridConfig?.rows || !gridConfig?.cols)
        throw new Error(`Level ${data.level.level_number} chưa có dữ liệu grid hợp lệ`);
      setupEngine(gridConfig);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleRun = async () => {
    if (!code.trim()) { setMessage("⚠️ Vui lòng viết code trước khi chạy!"); return; }
    setIsRunning(true); setMessage("🎮 Đang chạy code..."); closeModal();
    try {
      const gridConfig = typeof levelData.grid_data === "string" ? JSON.parse(levelData.grid_data) : levelData.grid_data;
      await sleep(300);
      const engine = setupEngine(gridConfig);
      const isWin  = await engine.executeCode(code);
      const earnedStars = calculateStars(engine.state);
      if (isWin) {
        await submitProgress(true, engine.state.moves, earnedStars);
        setMessage("");
        openModal("win", { moves: engine.state.moves, stars: earnedStars });
      } else {
        openModal("fail", { moves: engine.state.moves, failReason: "Chưa đến được đích" });
      }
    } catch (err) { openModal("error", { errorMsg: err.message }); setMessage(""); }
    finally { setIsRunning(false); }
  };

  const submitProgress = async (isCompleted, steps, stars) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const res = await fetch(`${API_BASE_URL}/learning/levels/${levelData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_code: code, is_completed: isCompleted, steps_count: steps, time_spent: 0, stars: isCompleted ? stars : 0 }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  };

  const calculateStars = (state) => {
    const total     = (state.collectibles   || []).length;
    const collected = (state.collectedItems || []).length;
    if (total === 0)           return 3;
    if (collected === total)   return 3;
    if (collected > total / 2) return 2;
    return 1;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const handleReset = () => {
    setCode(levelData?.initial_code || ""); setMessage("");
    if (levelData) {
      const gc = typeof levelData.grid_data === "string" ? JSON.parse(levelData.grid_data) : levelData.grid_data;
      setupEngine(gc);
    }
  };

  const handleRetry  = () => { closeModal(); handleReset(); };

  const handleNextLevel = async () => {
    setModal({ open: false, type: "win", moves: 0, stars: 0, failReason: "", errorMsg: "" });
    try {
      const res  = await fetch(`${API_BASE_URL}/learning/levels`);
      if (!res.ok) { navigate("/learning"); return; }
      const data = await res.json();
      const sorted = [...data.levels].sort((a, b) => a.level_number - b.level_number);
      const idx    = sorted.findIndex(l => l.id === levelData?.id);
      const next   = sorted[idx + 1];
      if (next) navigate(`/learning/playlevel/${next.level_number}`);
      else navigate("/learning");
    } catch { navigate("/learning"); }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1.5s linear infinite" }}>⏳</div>
        <div style={{ fontSize: 13, color: "#8888aa" }}>Đang tải level...</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
      <div style={{ background: "white", padding: "2rem", borderRadius: 20, textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#e53e3e", fontSize: 13, marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate("/learning")} style={{ padding: "10px 24px", background: "#7f77dd", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 500 }}>
          Quay lại danh sách
        </button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } } @keyframes blink { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>

      <GameResultModal
        open={modal.open} type={modal.type} moves={modal.moves} stars={modal.stars}
        failReason={modal.failReason} errorMsg={modal.errorMsg}
        onClose={closeModal} onRetry={handleRetry}
        onNextLevel={modal.type === "win" ? handleNextLevel : undefined}
        onGoBack={() => navigate("/learning")}
      />

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "13px 20px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/learning")}
            style={{ padding: "6px 13px", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            ← Quay lại
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Level {levelData?.level_number}: {levelData?.title}
            </div>
            <div style={{ fontSize: 11, color: "#8888aa", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {levelData?.description}
            </div>
          </div>
        </div>
      </div>

      {/* 2-column layout: Game | Editor + Palette */}
      <div style={{ maxWidth: 1400, margin: "16px auto", padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>

        {/* LEFT — Game */}
        <div style={{ background: "white", borderRadius: 16, border: "0.5px solid #e8eaf0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #f0f0f8" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#8888aa", textTransform: "uppercase", letterSpacing: ".05em" }}>Màn chơi</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", background: "#fafafe", minHeight: 360 }}>
            <GameGrid gameState={gameState} engineInstance={engineRef.current} cellSize={dynamicCellSize} />
          </div>
          {stats && Object.keys(stats).length > 0 && (
            <div style={{ padding: "10px 14px", borderTop: "0.5px solid #f0f0f8", display: "flex", flexWrap: "wrap", gap: 5 }}>
              <StatBadge label="Bước" value={stats.moves ?? 0} bg="#EEEDFE" color="#534ab7" />
              {stats.stars           && <StatBadge icon="⭐" label="Sao"      value={`${stats.stars.collected}/${stats.stars.total}`}                  bg="#FAEEDA" color="#854f0b" />}
              {stats.switches        && <StatBadge icon="🔘" label="Switch"   value={`${stats.switches.activated}/${stats.switches.total}`}              bg="#E1F5EE" color="#0f6e56" />}
              {stats.shadowPosition  && <StatBadge icon="👤" label="Shadow"   value={`(${stats.shadowPosition.x},${stats.shadowPosition.y})`}            bg="#EEEDFE" color="#534ab7" />}
              {stats.pressurePlates  && <StatBadge icon="⚡" label="Plates"   value={`${stats.pressurePlates.activated}/${stats.pressurePlates.total}`}  bg="#FCEBEB" color="#a32d2d" />}
              {stats.teleports       && <StatBadge icon="🌀" label="Teleport" value={`${stats.teleports.used}/${stats.teleports.available}`}              bg="#E1F5EE" color="#0f6e56" />}
              {stats.timeRewind      && <StatBadge icon="⏪" label="Rewind"   value={`${stats.timeRewind.available}/${stats.timeRewind.maxCharges}`}      bg="#EEEDFE" color="#534ab7" />}
              {stats.movingObstacles && <StatBadge icon="🔴" label="Moving"   value={stats.movingObstacles}                                               bg="#FCEBEB" color="#a32d2d" />}
            </div>
          )}
          {message && !modal.open && (
            <div style={{ margin: "0 14px 12px", padding: "9px 13px", background: "#FAEEDA", color: "#854f0b", borderRadius: 10, fontSize: 12, fontWeight: 500 }}>
              {message}
            </div>
          )}
        </div>

        {/* RIGHT — Editor trên, Palette ngang bên dưới */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>

          {/* Code editor */}
          <div style={{
            background: "white", borderRadius: 16,
            border: `1.5px solid ${isDragOver ? "#7f77dd" : "#e8eaf0"}`,
            boxShadow: isDragOver ? "0 0 0 3px #eeedfe" : "none",
            overflow: "hidden", display: "flex", flexDirection: "column",
            transition: "border-color .15s, box-shadow .15s",
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #f0f0f8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#8888aa", textTransform: "uppercase", letterSpacing: ".05em" }}>Code Editor</div>
              {isDragOver && <div style={{ fontSize: 10, color: "#7f77dd", fontWeight: 500, animation: "blink .6s ease infinite" }}>↓ Thả để chèn</div>}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              disabled={isRunning}
              placeholder={"// Viết code hoặc kéo block từ bảng bên dưới\n// Lệnh: moveRight(), moveLeft(), moveUp(), moveDown()"}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragOver(true); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                const snippet = e.dataTransfer.getData("text/plain");
                if (snippet) insertAtCursor(snippet);
              }}
              style={{
                flex: 1, padding: "14px 16px",
                border: "none", outline: "none", resize: "none",
                fontSize: 13, fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                lineHeight: 1.7, color: "#1a1a2e",
                background: isRunning ? "#fafafe" : isDragOver ? "#f8f7ff" : "white",
                minHeight: 280, transition: "background .15s",
              }}
            />

            <div style={{ padding: "12px 16px", borderTop: "0.5px solid #f0f0f8", display: "flex", gap: 8 }}>
              <button onClick={handleRun} disabled={isRunning}
                style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: isRunning ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "opacity .15s", background: isRunning ? "#D3D1C7" : "#1D9E75", color: isRunning ? "#888780" : "white" }}
                onMouseEnter={e => { if (!isRunning) e.currentTarget.style.opacity = ".85"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                {isRunning ? "⏳ Đang chạy..." : "▶ Chạy code"}
              </button>
              <button onClick={handleReset} disabled={isRunning}
                style={{ padding: "10px 18px", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: isRunning ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: isRunning ? .5 : 1, transition: "opacity .15s" }}
                onMouseEnter={e => { if (!isRunning) e.currentTarget.style.opacity = ".75"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = isRunning ? ".5" : "1"; }}>
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Block palette — đọc từ engine, lọc theo level */}
          <BlockPalette
            onInsert={insertAtCursor}
            allowedCommands={levelData?.allowed_commands}
          />

        </div>
      </div>
    </div>
  );
}