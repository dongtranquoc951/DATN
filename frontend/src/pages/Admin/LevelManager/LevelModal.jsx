import React, { useState, useEffect } from "react";

const EMPTY_FORM = {
  title: "",
  level_number: "",
  description: "",
  initial_code: "",
  is_published: false,
  grid_rows: 5,
  grid_cols: 5,
  player_x: 0,
  player_y: 2,
  target_x: 4,
  target_y: 2,
};

const ENTITY_COLORS = ["#DC2626","#D97706","#7C3AED","#0891B2","#059669","#DB2777","#EA580C","#4F46E5"];

const PARAM_REF = [
  { kind:"param",  key:"max_steps",      type:"number",  default:"50",    desc:"Số bước tối đa",                    affects:"player.steps, win_condition" },
  { kind:"param",  key:"gravity",        type:"boolean", default:"false", desc:"Bật vật lý trọng lực",               affects:"player.move, ice_tiles" },
  { kind:"param",  key:"fog_of_war",     type:"boolean", default:"false", desc:"Ẩn ô chưa khám phá",                 affects:"visibility, map_render" },
  { kind:"param",  key:"move_mode",      type:"string",  default:"4dir",  desc:"4dir = 4 hướng, 8dir = 8 hướng",     affects:"player.move" },
  { kind:"param",  key:"time_limit",     type:"number",  default:"0",     desc:"Giới hạn thời gian (s), 0 = tắt",    affects:"timer_ui, lose_condition" },
  { kind:"param",  key:"wind_direction", type:"string",  default:"",      desc:"Hướng gió: N/S/E/W",                 affects:"player.move, projectile" },
  { kind:"param",  key:"ice_tiles",      type:"boolean", default:"false", desc:"Ô băng: trượt thêm 1 bước",          affects:"player.move, gravity" },
  { kind:"param",  key:"teleport_pairs", type:"string",  default:"",      desc:"JSON cặp teleport",                  affects:"player.position" },
  { kind:"entity", key:"trap",           type:"entity",  default:"",      desc:"Bẫy, kích hoạt khi player đi qua",  affects:"player.hp, lose_condition" },
  { kind:"entity", key:"key",            type:"entity",  default:"",      desc:"Chìa khóa, cần thu thập",            affects:"door.locked, inventory" },
  { kind:"entity", key:"door",           type:"entity",  default:"",      desc:"Cổng, mở khi có key",                affects:"key, win_condition" },
  { kind:"entity", key:"coin",           type:"entity",  default:"",      desc:"Xu, cộng điểm khi thu thập",         affects:"score, inventory" },
];

const typeColor = { number:"text-blue-600 bg-blue-50", boolean:"text-violet-600 bg-violet-50", string:"text-cyan-600 bg-cyan-50", entity:"text-emerald-600 bg-emerald-50" };

// ─── Small reusable components ────────────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <div className="text-[11px] font-semibold tracking-widest uppercase text-gray-400 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", min, className = "" }) {
  return (
    <input
      type={type} min={min} value={value} onChange={onChange} placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none text-gray-900 bg-white placeholder-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all font-['DM_Sans'] ${className}`}
    />
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3, mono = false }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none text-gray-900 bg-white placeholder-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-y leading-relaxed ${mono ? "font-['DM_Mono'] text-xs" : "font-['DM_Sans']"}`}
    />
  );
}

function MonoInput({ value, onChange, placeholder, type = "text", min }) {
  return (
    <input
      type={type} min={min} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-2 py-1.5 text-xs font-['DM_Mono'] border border-gray-200 rounded-md outline-none text-gray-900 bg-white placeholder-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
    />
  );
}

function Btn({ variant = "outline", onClick, children, disabled = false, className = "" }) {
  const variants = {
    primary: "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700",
    outline: "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50",
    ghost:   "bg-transparent text-gray-500 border border-transparent hover:bg-gray-50",
    danger:  "bg-red-600 text-white border border-red-600 hover:bg-red-700",
    success: "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700",
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium font-['DM_Sans'] transition-all ${variants[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {children}
    </button>
  );
}

function SmallBadge({ children, color }) {
  const colors = {
    blue:    "bg-blue-50 text-blue-600 border border-blue-200",
    green:   "bg-emerald-50 text-emerald-600 border border-emerald-200",
    red:     "bg-red-50 text-red-600 border border-red-200",
  };
  return (
    <button className={`text-[11px] font-semibold px-2.5 py-1 rounded-md font-['DM_Sans'] cursor-pointer transition-all hover:opacity-80 ${colors[color]}`}>
      {children}
    </button>
  );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, subtitle, footer, children, width = 640 }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-y-auto"
        style={{ width, maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 60px)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <div className="text-base font-semibold tracking-tight text-gray-900">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-gray-200 bg-transparent hover:bg-gray-50 cursor-pointer text-sm text-gray-400 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function AddLevelModal({ open, onClose, onSave, saving, initialData }) {
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [obstacles, setObstacles]       = useState([]);
  const [entities, setEntities]         = useState([]);
  const [activeEntity, setActiveEntity] = useState(null);
  const [paintMode, setPaintMode]       = useState("wall");
  const [engineItems, setEngineItems]   = useState([]);
  const [showParamRef, setShowParamRef] = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    if (open) {
      if (initialData) {
        let grid = {};
        try {
          grid = typeof initialData.grid_data === "string"
            ? JSON.parse(initialData.grid_data)
            : (initialData.grid_data || {});
        } catch (e) { console.error("Lỗi parse grid_data:", e); }

        setForm({
          title: initialData.title || "",
          level_number: initialData.level_number || "",
          description: initialData.description || "",
          initial_code: initialData.initial_code || "",
          is_published: initialData.is_published || false,
          grid_rows: grid.rows || 5,
          grid_cols: grid.cols || 5,
          player_x: grid.player?.x ?? 0,
          player_y: grid.player?.y ?? 0,
          target_x: grid.target?.x ?? 0,
          target_y: grid.target?.y ?? 0,
        });
        setObstacles(grid.obstacles || []);

        if (grid.entities) {
          setEntities(grid.entities.map((e, i) => ({
            id: `ent-${Date.now()}-${i}`,
            name: e.type,
            color: e.color,
            positions: e.positions || [],
            params: Object.entries(e.params || {}).map(([k, v]) => ({ id: Math.random(), key: k, value: v })),
          })));
        } else { setEntities([]); }

        const loaded = [];
        if (grid.engine) {
          Object.entries(grid.engine).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(pos => loaded.push({ id: Math.random(), rowType: "entity", name: key, x: pos.x, y: pos.y }));
            } else {
              loaded.push({ id: Math.random(), rowType: "param", key, value });
            }
          });
        }
        setEngineItems(loaded);
      } else {
        setForm(EMPTY_FORM);
        setObstacles([]);
        setEntities([]);
        setEngineItems([]);
      }
    }
  }, [open, initialData]);

  // ── Grid helpers ──
  const isPlayer = (x, y) => x === Number(form.player_x) && y === Number(form.player_y);
  const isTarget = (x, y) => x === Number(form.target_x)  && y === Number(form.target_y);
  const isWall   = (x, y) => obstacles.some(o => o.x === x && o.y === y);
  const entityAt = (x, y) => entities.find(e => e.positions.some(p => p.x === x && p.y === y));

  const handleCellClick = (x, y) => {
    if (isPlayer(x, y) || isTarget(x, y)) return;
    if (paintMode === "wall") {
      setEntities(prev => prev.map(e => ({ ...e, positions: e.positions.filter(p => !(p.x === x && p.y === y)) })));
      setObstacles(prev => isWall(x, y) ? prev.filter(o => !(o.x === x && o.y === y)) : [...prev, { x, y }]);
    } else {
      const eid = paintMode;
      setObstacles(prev => prev.filter(o => !(o.x === x && o.y === y)));
      setEntities(prev => prev.map(e =>
        e.id === eid
          ? { ...e, positions: e.positions.some(p => p.x === x && p.y === y) ? e.positions.filter(p => !(p.x === x && p.y === y)) : [...e.positions, { x, y }] }
          : { ...e, positions: e.positions.filter(p => !(p.x === x && p.y === y)) }
      ));
    }
  };

  const updateEntity      = (id, field, val) => setEntities(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  const removeEntity      = (id) => { setEntities(prev => prev.filter(e => e.id !== id)); if (paintMode === id) setPaintMode("wall"); if (activeEntity === id) setActiveEntity(null); };
  const addEntityParam    = (eid) => setEntities(prev => prev.map(e => e.id === eid ? { ...e, params: [...e.params, { id: Date.now(), key: "", value: "" }] } : e));
  const updateEntityParam = (eid, pid, f, v) => setEntities(prev => prev.map(e => e.id === eid ? { ...e, params: e.params.map(p => p.id === pid ? { ...p, [f]: v } : p) } : e));
  const removeEntityParam = (eid, pid) => setEntities(prev => prev.map(e => e.id === eid ? { ...e, params: e.params.filter(p => p.id !== pid) } : e));

  const addEngineParam    = () => setEngineItems(prev => [...prev, { id: Date.now(), rowType: "param", key: "", value: "" }]);
  const addEngineEntity   = () => setEngineItems(prev => [...prev, { id: Date.now(), rowType: "entity", name: "", x: "", y: "" }]);
  const updateEngineItem  = (id, field, val) => setEngineItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));
  const removeEngineItem  = (id) => setEngineItems(prev => prev.filter(it => it.id !== id));

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) return setError("Tên cấp độ không được để trống.");
    if (!form.level_number || isNaN(Number(form.level_number))) return setError("Số cấp độ phải là số hợp lệ.");
    setError("");

    const engineParams = engineItems
      .filter(it => it.rowType === "param" && it.key.trim())
      .reduce((a, it) => ({ ...a, [it.key.trim()]: it.value }), {});

    const engineEntityGroups = engineItems
      .filter(it => it.rowType === "entity" && it.name.trim())
      .reduce((a, it) => {
        const name = it.name.trim();
        if (!a[name]) a[name] = [];
        a[name].push({ x: Number(it.x), y: Number(it.y) });
        return a;
      }, {});

    const entityData = entities.filter(e => e.name.trim()).map(e => ({
      type: e.name.trim(), color: e.color, positions: e.positions,
      params: e.params.filter(p => p.key.trim()).reduce((a, p) => ({ ...a, [p.key.trim()]: p.value }), {}),
    }));

    onSave({
      title: form.title.trim(), level_number: Number(form.level_number),
      description: form.description.trim(), initial_code: form.initial_code.trim(),
      is_published: form.is_published,
      grid_data: JSON.stringify({
        rows: Number(form.grid_rows), cols: Number(form.grid_cols),
        player: { x: Number(form.player_x), y: Number(form.player_y) },
        target: { x: Number(form.target_x), y: Number(form.target_y) },
        obstacles, entities: entityData,
        engine: { ...engineParams, ...engineEntityGroups },
      }),
    });
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={initialData ? "Chỉnh sửa cấp độ" : "Thêm cấp độ mới"}
      subtitle="Điền thông tin để tạo cấp độ học mới"
      width={700}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Hủy</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : initialData ? "Lưu thay đổi" : "Tạo cấp độ"}
          </Btn>
        </>
      }
    >
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Số cấp độ + Tên */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "110px 1fr" }}>
        <div>
          <FieldLabel required>Số cấp độ</FieldLabel>
          <TextInput type="number" min="1" value={form.level_number} onChange={set("level_number")} placeholder="1" />
        </div>
        <div>
          <FieldLabel required>Tên cấp độ</FieldLabel>
          <TextInput value={form.title} onChange={set("title")} placeholder="VD: Vòng lặp cơ bản" />
        </div>
      </div>

      {/* Mô tả */}
      <div className="mb-4">
        <FieldLabel>Mô tả</FieldLabel>
        <TextareaInput value={form.description} onChange={set("description")} placeholder="Mô tả ngắn..." rows={2} />
      </div>

      {/* Code khởi đầu */}
      <div className="mb-4">
        <FieldLabel>Code khởi đầu</FieldLabel>
        <TextareaInput value={form.initial_code} onChange={set("initial_code")} placeholder="# Code mẫu cho học viên" rows={5} mono />
      </div>

      {/* ── Cấu hình lưới ── */}
      <div className="bg-gray-50 rounded-xl p-4 mb-3">
        <div className="text-[12.5px] font-semibold text-gray-800 mb-3">Cấu hình lưới</div>

        <div className="grid grid-cols-6 gap-2.5 mb-4">
          {[
            { label: "Hàng",     key: "grid_rows", min: 2 },
            { label: "Cột",      key: "grid_cols", min: 2 },
            { label: "Player X", key: "player_x",  min: 0 },
            { label: "Player Y", key: "player_y",  min: 0 },
            { label: "Đích X",   key: "target_x",  min: 0 },
            { label: "Đích Y",   key: "target_y",  min: 0 },
          ].map(f => (
            <div key={f.key}>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-1">{f.label}</div>
              <TextInput
                type="number" min={f.min} value={form[f.key]}
                onChange={e => {
                  set(f.key)(e);
                  const val = Number(e.target.value);
                  if (["player_x","player_y","target_x","target_y"].includes(f.key)) {
                    const nx = f.key === "player_x" ? val : Number(form.player_x);
                    const ny = f.key === "player_y" ? val : Number(form.player_y);
                    const tx = f.key === "target_x" ? val : Number(form.target_x);
                    const ty = f.key === "target_y" ? val : Number(form.target_y);
                    setObstacles(prev => prev.filter(o => !(o.x===nx&&o.y===ny) && !(o.x===tx&&o.y===ty)));
                    setEntities(prev => prev.map(e => ({ ...e, positions: e.positions.filter(p => !(p.x===nx&&p.y===ny) && !(p.x===tx&&p.y===ty)) })));
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11.5px] text-gray-400 mr-1">Chế độ vẽ:</span>
          <button
            onClick={() => setPaintMode("wall")}
            className={`px-3 py-1 rounded-md text-xs font-medium font-['DM_Sans'] cursor-pointer transition-all border ${
              paintMode === "wall"
                ? "bg-gray-700 border-gray-700 text-white"
                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Tường
          </button>
          {entities.map(e => (
            <button
              key={e.id}
              onClick={() => { setPaintMode(e.id); setActiveEntity(e.id); }}
              className={`px-3 py-1 rounded-md text-xs font-medium font-['DM_Sans'] cursor-pointer transition-all border`}
              style={{
                background: paintMode === e.id ? e.color : "white",
                borderColor: e.color,
                color: paintMode === e.id ? "white" : e.color,
              }}
            >
              {e.name || "Entity"}
            </button>
          ))}
        </div>

        {/* Grid */}
        {(() => {
          const rows = Math.max(2, Math.min(12, Number(form.grid_rows) || 5));
          const cols = Math.max(2, Math.min(12, Number(form.grid_cols) || 5));
          const cellSize = Math.min(40, Math.floor(600 / cols));
          return (
            <div>
              <div
                className="inline-grid gap-0.5 select-none"
                style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}
              >
                {Array.from({ length: rows }, (_, r) =>
                  Array.from({ length: cols }, (_, c) => {
                    const iP = isPlayer(c, r), iT = isTarget(c, r), iW = isWall(c, r), ent = entityAt(c, r);
                    let bg = "#fff", borderClr = "#E8E8E4", textClr = "transparent", label = "";
                    if (iP)        { bg = "#DBEAFE"; borderClr = "#93C5FD"; textClr = "#1D4ED8"; label = "P"; }
                    else if (iT)   { bg = "#DCFCE7"; borderClr = "#86EFAC"; textClr = "#15803D"; label = "G"; }
                    else if (iW)   { bg = "#374151"; borderClr = "#1F2937"; textClr = "white";   label = "X"; }
                    else if (ent)  { bg = ent.color + "22"; borderClr = ent.color; textClr = ent.color; label = (ent.name || "?").slice(0, 2).toUpperCase(); }
                    return (
                      <div
                        key={`${r}-${c}`} onClick={() => handleCellClick(c, r)}
                        className="flex items-center justify-center rounded font-bold transition-colors duration-100"
                        style={{
                          width: cellSize, height: cellSize,
                          fontSize: Math.max(9, cellSize * 0.28),
                          cursor: (iP || iT) ? "default" : "pointer",
                          background: bg,
                          border: `1px solid ${borderClr}`,
                          color: textClr,
                        }}
                      >
                        {label}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-2 flex gap-3 flex-wrap text-[11.5px] text-gray-400">
                <span><span className="font-bold text-blue-700">P</span> Player</span>
                <span><span className="font-bold text-emerald-700">G</span> Đích</span>
                <span>
                  <span className="inline-block w-2.5 h-2.5 bg-gray-700 rounded-sm align-middle mr-0.5" />
                  Tường ({obstacles.length})
                </span>
                {entities.map(e => (
                  <span key={e.id}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-0.5" style={{ background: e.color }} />
                    {e.name || "?"} ({e.positions.length})
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Entity config ── */}
      {entities.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-3">
          <div className="text-[12.5px] font-semibold text-gray-800 mb-3">Cấu hình entity</div>
          {entities.map(e => (
            <div
              key={e.id}
              className="bg-white rounded-xl p-3.5 mb-2.5 cursor-pointer transition-all"
              style={{ border: `1px solid ${activeEntity === e.id ? e.color : "#E8E8E4"}` }}
              onClick={() => { setActiveEntity(e.id); setPaintMode(e.id); }}
            >
              <div className={`flex items-center gap-2 ${activeEntity === e.id ? "mb-3" : ""}`}>
                <div
                  className="w-5 h-5 rounded flex-shrink-0"
                  style={{ background: e.color, border: "2px solid white", boxShadow: "0 0 0 1px #E8E8E4" }}
                />
                <input
                  value={e.name}
                  onClick={ev => ev.stopPropagation()}
                  onChange={ev => updateEntity(e.id, "name", ev.target.value)}
                  placeholder="Tên entity (vd: trap, key, door...)"
                  className="flex-1 px-2.5 py-1 text-sm border border-gray-200 rounded-lg outline-none text-gray-900 font-['DM_Sans'] focus:border-blue-400 transition-all"
                />
                <span className="text-xs text-gray-400 flex-shrink-0">{e.positions.length} ô</span>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                  style={{ background: paintMode === e.id ? e.color : "#E8E8E4" }}
                />
                <button
                  onClick={ev => { ev.stopPropagation(); removeEntity(e.id); }}
                  className="w-6 h-6 rounded-md border border-red-200 bg-red-50 cursor-pointer text-red-500 text-sm flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-all"
                >×</button>
              </div>

              {activeEntity === e.id && (
                <div onClick={ev => ev.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11.5px] text-gray-500 font-medium">Thông số của {e.name || "entity"}</div>
                    <button
                      onClick={() => addEntityParam(e.id)}
                      className="text-[11px] px-2 py-0.5 rounded border cursor-pointer font-['DM_Sans'] font-medium transition-all hover:opacity-80"
                      style={{ borderColor: e.color + "66", background: e.color + "18", color: e.color }}
                    >+ Thêm</button>
                  </div>
                  {e.params.length === 0 && (
                    <div className="text-xs text-gray-300 py-1">Chưa có thông số. Ví dụ: damage=10, requires_key=true</div>
                  )}
                  {e.params.length > 0 && (
                    <div>
                      <div className="grid grid-cols-[1fr_1fr_24px] gap-1.5 mb-1.5">
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Key</div>
                        <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Value</div>
                        <div />
                      </div>
                      {e.params.map(p => (
                        <div key={p.id} className="grid grid-cols-[1fr_1fr_24px] gap-1.5 mb-1.5 items-center">
                          <MonoInput value={p.key} onChange={ev => updateEntityParam(e.id, p.id, "key", ev.target.value)} placeholder="vd: damage" />
                          <MonoInput value={p.value} onChange={ev => updateEntityParam(e.id, p.id, "value", ev.target.value)} placeholder="vd: 10" />
                          <button
                            onClick={() => removeEntityParam(e.id, p.id)}
                            className="w-6 h-8 rounded border border-red-200 bg-red-50 cursor-pointer text-red-500 text-sm flex items-center justify-center hover:bg-red-100 transition-all"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Thông số engine ── */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12.5px] font-semibold text-gray-800">Thông số engine</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowParamRef(v => !v)}
              className={`text-[11.5px] font-medium px-2.5 py-1 rounded-md border cursor-pointer font-['DM_Sans'] transition-all ${showParamRef ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              {showParamRef ? "Ẩn tham khảo" : "Xem tham khảo"}
            </button>
            <button
              onClick={addEngineEntity}
              className="text-[11.5px] font-medium px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 cursor-pointer font-['DM_Sans'] hover:bg-emerald-100 transition-all"
            >+ Entity</button>
            <button
              onClick={addEngineParam}
              className="text-[11.5px] font-medium px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-600 cursor-pointer font-['DM_Sans'] hover:bg-blue-100 transition-all"
            >+ Thông số</button>
          </div>
        </div>

        {/* Param Reference Table */}
        {showParamRef && (
          <div className="mb-3.5 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-800 px-3 py-2 grid gap-2" style={{ gridTemplateColumns: "130px 58px 80px 1fr 1fr" }}>
              {["Key / Type","Kiểu","Mặc định","Mô tả","Thuộc tính ảnh hưởng"].map(h => (
                <div key={h} className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">{h}</div>
              ))}
            </div>
            {PARAM_REF.map((p, i) => (
              <div
                key={p.key}
                className="px-3 py-2 grid gap-2 items-center border-t border-gray-100"
                style={{ gridTemplateColumns: "130px 58px 80px 1fr 1fr", background: i % 2 === 0 ? "#F9F9F7" : "white" }}
              >
                <div className="flex items-center gap-1.5">
                  {p.kind === "entity" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" />}
                  <span className="font-['DM_Mono'] text-xs text-gray-800 font-medium">{p.key}</span>
                </div>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded font-['DM_Mono'] ${typeColor[p.type]}`}>{p.type}</span>
                <span className="font-['DM_Mono'] text-xs text-gray-500">{p.default || "—"}</span>
                <span className="text-xs text-gray-500">{p.desc}</span>
                <span className="text-[11px] text-violet-600 font-['DM_Mono']">{p.affects}</span>
              </div>
            ))}
            <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[11px] text-emerald-700">
                Dòng có chấm xanh = entity type. Sửa mảng{" "}
                <code className="font-['DM_Mono'] bg-emerald-100 px-1 rounded">PARAM_REF</code>{" "}
                trong code để thêm dòng mới.
              </span>
            </div>
          </div>
        )}

        {/* Engine items list */}
        {engineItems.length === 0 && !showParamRef && (
          <div className="text-xs text-gray-300 text-center py-1.5">
            Nhấn "+ Entity" hoặc "+ Thông số" để thêm. Xem tham khảo để biết các key hợp lệ.
          </div>
        )}
        {engineItems.length > 0 && (
          <div>
            <div className="grid gap-2 mb-1.5 pl-0.5" style={{ gridTemplateColumns: "80px 1fr 1fr 24px" }}>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Loại</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Key / Tên entity</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Value / Tọa độ (x, y)</div>
              <div />
            </div>
            {engineItems.map(it => (
              <div key={it.id} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: "80px 1fr 1fr 24px" }}>
                <div
                  className={`flex items-center justify-center py-1 rounded text-[11px] font-semibold border ${
                    it.rowType === "entity"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}
                >
                  {it.rowType === "entity" ? "Entity" : "Thông số"}
                </div>
                <MonoInput
                  value={it.rowType === "param" ? it.key : it.name}
                  onChange={e => updateEngineItem(it.id, it.rowType === "param" ? "key" : "name", e.target.value)}
                  placeholder={it.rowType === "param" ? "vd: max_steps" : "vd: trap"}
                />
                {it.rowType === "param" ? (
                  <MonoInput value={it.value} onChange={e => updateEngineItem(it.id, "value", e.target.value)} placeholder="vd: 30" />
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <MonoInput type="number" min="0" value={it.x} onChange={e => updateEngineItem(it.id, "x", e.target.value)} placeholder="x" />
                    <MonoInput type="number" min="0" value={it.y} onChange={e => updateEngineItem(it.id, "y", e.target.value)} placeholder="y" />
                  </div>
                )}
                <button
                  onClick={() => removeEngineItem(it.id)}
                  className="w-6 h-8 rounded border border-red-200 bg-red-50 cursor-pointer text-red-500 text-sm flex items-center justify-center hover:bg-red-100 transition-all"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toggle xuất bản */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
          className="relative w-9 h-5 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0"
          style={{ background: form.is_published ? "#16A34A" : "#D1D5DB" }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm"
            style={{ left: form.is_published ? "18px" : "2px" }}
          />
        </div>
        <span className="text-sm text-gray-800">
          {form.is_published ? "Xuất bản ngay" : "Lưu dưới dạng bản nháp"}
        </span>
      </div>
    </Modal>
  );
}

export default AddLevelModal;