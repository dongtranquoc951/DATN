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
function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6B6B65", marginBottom: 5 }}>
      {children}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", min }) {
  return (
    <input type={type} min={min} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", padding: "8px 11px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", border: "1px solid #E8E8E4", borderRadius: 6, outline: "none", color: "#1A1A18", background: "white" }}
    />
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3, mono = false }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box", padding: "8px 11px", fontSize: 13, fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif", border: "1px solid #E8E8E4", borderRadius: 6, outline: "none", color: "#1A1A18", background: "white", resize: "vertical", lineHeight: 1.6 }}
    />
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

function AddLevelModal({ open, onClose, onSave, saving, initialData}) {
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [obstacles, setObstacles]       = useState([]);
  const [entities, setEntities]         = useState([]);
  const [activeEntity, setActiveEntity] = useState(null);
  const [paintMode, setPaintMode]       = useState("wall");
  const [engineItems, setEngineItems]   = useState([]);
  // engineItems: [{ id, rowType:"param"|"entity", ...fields }]
  // param:  { id, rowType:"param",  key:"", value:"" }
  // entity: { id, rowType:"entity", name:"", x:"", y:"" }
  const [showParamRef, setShowParamRef] = useState(false);
  const [error, setError]               = useState("");

  const ENTITY_COLORS = ["#DC2626","#D97706","#7C3AED","#0891B2","#059669","#DB2777","#EA580C","#4F46E5"];

  // ── Bảng tham khảo định nghĩa sẵn trong code ─────────────────────────────
  // Thêm/sửa dòng trực tiếp ở đây khi có engine param hay entity mới.
  // Cột "affects": liệt kê các thuộc tính/entity bị ảnh hưởng.
  // ─────────────────────────────────────────────────────────────────────────
  const PARAM_REF = [
    // ── Engine params ──
    { kind:"param",  key:"max_steps",      type:"number",  default:"50",    desc:"Số bước tối đa",                    affects:"player.steps, win_condition" },
    { kind:"param",  key:"gravity",        type:"boolean", default:"false", desc:"Bật vật lý trọng lực",               affects:"player.move, ice_tiles" },
    { kind:"param",  key:"fog_of_war",     type:"boolean", default:"false", desc:"Ẩn ô chưa khám phá",                 affects:"visibility, map_render" },
    { kind:"param",  key:"move_mode",      type:"string",  default:"4dir",  desc:"4dir = 4 hướng, 8dir = 8 hướng",     affects:"player.move" },
    { kind:"param",  key:"time_limit",     type:"number",  default:"0",     desc:"Giới hạn thời gian (s), 0 = tắt",    affects:"timer_ui, lose_condition" },
    { kind:"param",  key:"wind_direction", type:"string",  default:"",      desc:"Hướng gió: N/S/E/W",                 affects:"player.move, projectile" },
    { kind:"param",  key:"ice_tiles",      type:"boolean", default:"false", desc:"Ô băng: trượt thêm 1 bước",          affects:"player.move, gravity" },
    { kind:"param",  key:"teleport_pairs", type:"string",  default:"",      desc:"JSON cặp teleport",                  affects:"player.position" },
    // ── Entity types ──
    { kind:"entity", key:"trap",           type:"entity",  default:"",      desc:"Bẫy, kích hoạt khi player đi qua",  affects:"player.hp, lose_condition" },
    { kind:"entity", key:"key",            type:"entity",  default:"",      desc:"Chìa khóa, cần thu thập",            affects:"door.locked, inventory" },
    { kind:"entity", key:"door",           type:"entity",  default:"",      desc:"Cổng, mở khi có key",                affects:"key, win_condition" },
    { kind:"entity", key:"coin",           type:"entity",  default:"",      desc:"Xu, cộng điểm khi thu thập",         affects:"score, inventory" },
    // Thêm entity / engine param mới vào đây ↑
  ];
  // ─────────────────────────────────────────────────────────────────────────

useEffect(() => {
  if (open) {
    if (initialData) {
      // TRƯỜNG HỢP SỬA: Lấy dữ liệu từ initialData
      let grid = {};
      try {
        // Parse grid_data vì nó thường là chuỗi JSON từ database
        grid = typeof initialData.grid_data === 'string' 
               ? JSON.parse(initialData.grid_data) 
               : (initialData.grid_data || {});
      } catch (e) {
        console.error("Lỗi parse grid_data:", e);
      }

      // Đổ dữ liệu vào form chính
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

      // Nạp các chướng ngại vật (Tường)
      setObstacles(grid.obstacles || []);

      // Nạp các Entity (Những thứ vẽ trên lưới)
      if (grid.entities) {
        const loadedEntities = grid.entities.map((e, index) => ({
          id: `ent-${Date.now()}-${index}`,
          name: e.type,
          color: e.color,
          positions: e.positions || [],
          params: Object.entries(e.params || {}).map(([k, v]) => ({
            id: Math.random(),
            key: k,
            value: v
          }))
        }));
        setEntities(loadedEntities);
      } else {
        setEntities([]);
      }

      // Nạp Thông số Engine (Engine Items)
      const loadedEngineItems = [];
      if (grid.engine) {
        Object.entries(grid.engine).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Nếu là mảng -> Đây là Entity (tọa độ x, y)
            value.forEach(pos => {
              loadedEngineItems.push({ id: Math.random(), rowType: "entity", name: key, x: pos.x, y: pos.y });
            });
          } else {
            // Nếu là giá trị đơn -> Đây là Param (gravity, max_steps...)
            loadedEngineItems.push({ id: Math.random(), rowType: "param", key: key, value: value });
          }
        });
      }
      setEngineItems(loadedEngineItems);

    } else {
      // TRƯỜNG HỢP THÊM MỚI: Reset về trống
      setForm(EMPTY_FORM);
      setObstacles([]);
      setEntities([]);
      setEngineItems([]);
    }
  }
}, [open, initialData]); // QUAN TRỌNG: Phải có initialData ở đây

  // ── Grid helpers ──────────────────────────────────────────────────────────
  const isPlayer = (x,y) => x===Number(form.player_x) && y===Number(form.player_y);
  const isTarget = (x,y) => x===Number(form.target_x)  && y===Number(form.target_y);
  const isWall   = (x,y) => obstacles.some(o=>o.x===x&&o.y===y);
  const entityAt = (x,y) => entities.find(e=>e.positions.some(p=>p.x===x&&p.y===y));

  const handleCellClick = (x,y) => {
    if (isPlayer(x,y)||isTarget(x,y)) return;
    if (paintMode==="wall") {
      setEntities(prev=>prev.map(e=>({...e,positions:e.positions.filter(p=>!(p.x===x&&p.y===y))})));
      setObstacles(prev=>isWall(x,y)?prev.filter(o=>!(o.x===x&&o.y===y)):[...prev,{x,y}]);
    } else {
      const eid=paintMode;
      setObstacles(prev=>prev.filter(o=>!(o.x===x&&o.y===y)));
      setEntities(prev=>prev.map(e=>e.id===eid
        ?{...e,positions:e.positions.some(p=>p.x===x&&p.y===y)
            ?e.positions.filter(p=>!(p.x===x&&p.y===y))
            :[...e.positions,{x,y}]}
        :{...e,positions:e.positions.filter(p=>!(p.x===x&&p.y===y))}
      ));
    }
  };


  const updateEntity     = (id,field,val) => setEntities(prev=>prev.map(e=>e.id===id?{...e,[field]:val}:e));
  const removeEntity     = (id) => { setEntities(prev=>prev.filter(e=>e.id!==id)); if(paintMode===id)setPaintMode("wall"); if(activeEntity===id)setActiveEntity(null); };
  const addEntityParam   = (eid) => setEntities(prev=>prev.map(e=>e.id===eid?{...e,params:[...e.params,{id:Date.now(),key:"",value:""}]}:e));
  const updateEntityParam= (eid,pid,f,v) => setEntities(prev=>prev.map(e=>e.id===eid?{...e,params:e.params.map(p=>p.id===pid?{...p,[f]:v}:p)}:e));
  const removeEntityParam= (eid,pid) => setEntities(prev=>prev.map(e=>e.id===eid?{...e,params:e.params.filter(p=>p.id!==pid)}:e));

  // ── Engine items helpers ──────────────────────────────────────────────────
  const addEngineParam  = () => setEngineItems(prev=>[...prev,{id:Date.now(),rowType:"param", key:"",value:""}]);
  const addEngineEntity = () => setEngineItems(prev => [...prev, {
    id: Date.now(),
    rowType: "entity",
    coordinates: [{ id: Date.now(), x: "", y: "" }] // mảng tọa độ, mặc định 1 cái
  }]);
  const updateEngineItem= (id,field,val) => setEngineItems(prev=>prev.map(it=>it.id===id?{...it,[field]:val}:it));
  const removeEngineItem= (id) => setEngineItems(prev=>prev.filter(it=>it.id!==id));

  const set = (key)=>(e)=>setForm(f=>({...f,[key]:e.target.type==="checkbox"?e.target.checked:e.target.value}));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
  if (!form.title.trim()) return setError("Tên cấp độ không được để trống.");
  if (!form.level_number || isNaN(Number(form.level_number))) return setError("Số cấp độ phải là số hợp lệ.");
  setError("");

  // 1. Lấy các thông số cấu hình engine (max_steps, gravity,...)
  const engineParams = engineItems
    .filter(it => it.rowType === "param" && it.key.trim())
    .reduce((a, it) => ({ ...a, [it.key.trim()]: it.value }), {});

  // 2. CHỈNH SỬA TẠI ĐÂY: Nhóm các entity từ "Thông số engine" thành mảng tọa độ
  // Thay vì: { trap: {x:1, y:2} }
  // Thành: { trap: [{x:1, y:2}] }
  const engineEntityGroups = engineItems
    .filter(it => it.rowType === "entity" && it.name.trim())
    .reduce((a, it) => {
      const name = it.name.trim();
      if (!a[name]) a[name] = [];
      a[name].push({ x: Number(it.x), y: Number(it.y) });
      return a;
    }, {});

  // 3. Entity trực quan (đã vẽ trên lưới)
  const entityData = entities
    .filter(e => e.name.trim())
    .map(e => ({
      type: e.name.trim(), 
      color: e.color, 
      positions: e.positions,
      params: e.params.filter(p => p.key.trim()).reduce((a, p) => ({ ...a, [p.key.trim()]: p.value }), {}),
    }));

  onSave({
    title: form.title.trim(), 
    level_number: Number(form.level_number),
    description: form.description.trim(), 
    initial_code: form.initial_code.trim(),
    is_published: form.is_published,
    grid_data: JSON.stringify({
      rows: Number(form.grid_rows), 
      cols: Number(form.grid_cols),
      player: { x: Number(form.player_x), y: Number(form.player_y) },
      target: { x: Number(form.target_x), y: Number(form.target_y) },
      obstacles, 
      entities: entityData,
      // Gộp params và các entity đã nhóm mảng vào engine
      engine: { ...engineParams, ...engineEntityGroups },
    }),
  });
};

  const numStyle   = {width:"100%",boxSizing:"border-box",padding:"7px 9px",fontSize:13,fontFamily:"'DM Sans',sans-serif",border:"1px solid #E8E8E4",borderRadius:6,outline:"none",color:"#1A1A18",background:"white"};
  const monoInput  = {...numStyle,fontFamily:"'DM Mono',monospace",fontSize:12,padding:"6px 8px"};
  const smallLabel = {fontSize:11,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",color:"#A8A89E",marginBottom:4};
  const typeColor  = {number:"#2563EB",boolean:"#7C3AED",string:"#0891B2",entity:"#059669"};

  return (
    <Modal open={open} onClose={onClose} title="Thêm cấp độ mới" subtitle="Điền thông tin để tạo cấp độ học mới" width={700}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Hủy</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving?"Đang lưu...":"Tạo cấp độ"}
          </Btn>
        </>
      }
    >
      {error&&(
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"9px 13px",marginBottom:16,fontSize:12.5,color:"#DC2626"}}>{error}</div>
      )}

      {/* Số cấp độ + Tên */}
      <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:12,marginBottom:16}}>
        <div>
          <FieldLabel required>Số cấp độ</FieldLabel>
          <input type="number" min="1" value={form.level_number} onChange={set("level_number")} placeholder="1" style={numStyle}/>
        </div>
        <div>
          <FieldLabel required>Tên cấp độ</FieldLabel>
          <TextInput value={form.title} onChange={set("title")} placeholder="VD: Vòng lặp cơ bản"/>
        </div>
      </div>

      {/* Mô tả */}
      <div style={{marginBottom:16}}>
        <FieldLabel>Mô tả</FieldLabel>
        <TextareaInput value={form.description} onChange={set("description")} placeholder="Mô tả ngắn..." rows={2}/>
      </div>

      {/* Code khởi đầu */}
      <div style={{marginBottom:16}}>
        <FieldLabel>Code khởi đầu</FieldLabel>
        <TextareaInput value={form.initial_code} onChange={set("initial_code")} placeholder="# Code mẫu cho học viên" rows={5} mono/>
      </div>

      {/* ── Cấu hình lưới ── */}
      <div style={{background:"#F7F7F5",borderRadius:8,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:12.5,fontWeight:600,color:"#1A1A18",marginBottom:12}}>Cấu hình lưới</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
          {[
            {label:"Hàng",    key:"grid_rows",min:2},
            {label:"Cột",     key:"grid_cols",min:2},
            {label:"Player X",key:"player_x", min:0},
            {label:"Player Y",key:"player_y", min:0},
            {label:"Đích X",  key:"target_x", min:0},
            {label:"Đích Y",  key:"target_y", min:0},
          ].map(f=>(
            <div key={f.key}>
              <div style={smallLabel}>{f.label}</div>
              <input type="number" min={f.min} value={form[f.key]}
                onChange={e=>{
                  set(f.key)(e);
                  const val=Number(e.target.value);
                  if(["player_x","player_y","target_x","target_y"].includes(f.key)){
                    const nx=f.key==="player_x"?val:Number(form.player_x);
                    const ny=f.key==="player_y"?val:Number(form.player_y);
                    const tx=f.key==="target_x"?val:Number(form.target_x);
                    const ty=f.key==="target_y"?val:Number(form.target_y);
                    setObstacles(prev=>prev.filter(o=>!(o.x===nx&&o.y===ny)&&!(o.x===tx&&o.y===ty)));
                    setEntities(prev=>prev.map(e=>({...e,positions:e.positions.filter(p=>!(p.x===nx&&p.y===ny)&&!(p.x===tx&&p.y===ty))})));
                  }
                }}
                style={numStyle}/>
            </div>
          ))}
        </div>

        {/* Toolbar chế độ vẽ */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11.5,color:"#6B6B65",marginRight:4}}>Chế độ vẽ:</span>
          <button onClick={()=>setPaintMode("wall")}
            style={{padding:"3px 10px",borderRadius:5,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              border:paintMode==="wall"?"1px solid #374151":"1px solid #E8E8E4",
              background:paintMode==="wall"?"#374151":"white",
              color:paintMode==="wall"?"white":"#6B6B65"}}>
            Tường
          </button>
        </div>

        {/* Grid tương tác */}
        {(()=>{
          const rows=Math.max(2,Math.min(12,Number(form.grid_rows)||5));
          const cols=Math.max(2,Math.min(12,Number(form.grid_cols)||5));
          const cellSize=Math.min(40,Math.floor(600/cols));
          return(
            <div>
              <div style={{display:"inline-grid",gridTemplateColumns:`repeat(${cols},${cellSize}px)`,gap:2,userSelect:"none"}}>
                {Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{
                  const iP=isPlayer(c,r),iT=isTarget(c,r),iW=isWall(c,r),ent=entityAt(c,r);
                  let bg="#fff",border="#E8E8E4",clr="transparent",label="";
                  if(iP){bg="#DBEAFE";border="#93C5FD";clr="#1D4ED8";label="P";}
                  else if(iT){bg="#DCFCE7";border="#86EFAC";clr="#15803D";label="G";}
                  else if(iW){bg="#374151";border="#1F2937";clr="white";label="X";}
                  else if(ent){bg=ent.color+"22";border=ent.color;clr=ent.color;label=(ent.name||"?").slice(0,2).toUpperCase();}
                  return(
                    <div key={`${r}-${c}`} onClick={()=>handleCellClick(c,r)}
                      style={{width:cellSize,height:cellSize,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:Math.max(9,cellSize*0.28),fontWeight:700,cursor:(iP||iT)?"default":"pointer",
                        transition:"background 0.1s",background:bg,border:`1px solid ${border}`,color:clr}}>
                      {label}
                    </div>
                  );
                }))}
              </div>
              <div style={{marginTop:8,display:"flex",gap:12,flexWrap:"wrap",fontSize:11.5,color:"#A8A89E"}}>
                <span><span style={{fontWeight:700,color:"#1D4ED8"}}>P</span> Player</span>
                <span><span style={{fontWeight:700,color:"#15803D"}}>G</span> Đích</span>
                <span><span style={{display:"inline-block",width:10,height:10,background:"#374151",borderRadius:2,verticalAlign:"middle"}}/> Tường ({obstacles.length})</span>
                {entities.map(e=>(
                  <span key={e.id}><span style={{display:"inline-block",width:10,height:10,background:e.color,borderRadius:2,verticalAlign:"middle"}}/> {e.name||"?"} ({e.positions.length})</span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Entity config ── */}
      {entities.length>0&&(
        <div style={{background:"#F7F7F5",borderRadius:8,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:12.5,fontWeight:600,color:"#1A1A18",marginBottom:12}}>Cấu hình entity</div>
          {entities.map(e=>(
            <div key={e.id}
              style={{background:"white",border:`1px solid ${activeEntity===e.id?e.color:"#E8E8E4"}`,borderRadius:8,padding:"12px 14px",marginBottom:10,cursor:"pointer"}}
              onClick={()=>{setActiveEntity(e.id);setPaintMode(e.id);}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:activeEntity===e.id?10:0}}>
                <div style={{width:22,height:22,borderRadius:4,background:e.color,border:"2px solid white",boxShadow:"0 0 0 1px #E8E8E4",flexShrink:0}}/>
                <input value={e.name} onClick={ev=>ev.stopPropagation()}
                  onChange={ev=>updateEntity(e.id,"name",ev.target.value)}
                  placeholder="Tên entity (vd: trap, key, door...)"
                  style={{flex:1,padding:"5px 9px",fontSize:13,fontFamily:"'DM Sans',sans-serif",border:"1px solid #E8E8E4",borderRadius:5,outline:"none",color:"#1A1A18",background:"white"}}/>
                <span style={{fontSize:11.5,color:"#A8A89E",flexShrink:0}}>{e.positions.length} ô</span>
                <div style={{width:8,height:8,borderRadius:"50%",background:paintMode===e.id?e.color:"#E8E8E4",flexShrink:0}}/>
                <button onClick={ev=>{ev.stopPropagation();removeEntity(e.id);}}
                  style={{width:24,height:24,borderRadius:4,border:"1px solid #FECACA",background:"#FEF2F2",cursor:"pointer",color:"#DC2626",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  ×
                </button>
              </div>
              {activeEntity===e.id&&(
                <div onClick={ev=>ev.stopPropagation()}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:11.5,color:"#6B6B65",fontWeight:500}}>Thông số của {e.name||"entity"}</div>
                    <button onClick={()=>addEntityParam(e.id)}
                      style={{fontSize:11,padding:"2px 8px",borderRadius:4,border:`1px solid ${e.color}40`,background:`${e.color}10`,color:e.color,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                      + Thêm
                    </button>
                  </div>
                  {e.params.length===0&&(
                    <div style={{fontSize:12,color:"#C4C4BC",padding:"4px 0"}}>Chưa có thông số. Ví dụ: damage=10, requires_key=true</div>
                  )}
                  {e.params.length>0&&(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 24px",gap:6,marginBottom:4}}>
                        <div style={smallLabel}>Key</div><div style={smallLabel}>Value</div><div/>
                      </div>
                      {e.params.map(p=>(
                        <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 24px",gap:6,marginBottom:6,alignItems:"center"}}>
                          <input value={p.key} onChange={ev=>updateEntityParam(e.id,p.id,"key",ev.target.value)} placeholder="vd: damage" style={monoInput}/>
                          <input value={p.value} onChange={ev=>updateEntityParam(e.id,p.id,"value",ev.target.value)} placeholder="vd: 10" style={monoInput}/>
                          <button onClick={()=>removeEntityParam(e.id,p.id)}
                            style={{width:24,height:30,borderRadius:4,border:"1px solid #FECACA",background:"#FEF2F2",cursor:"pointer",color:"#DC2626",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
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
      <div style={{background:"#F7F7F5",borderRadius:8,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:12.5,fontWeight:600,color:"#1A1A18"}}>Thông số engine</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setShowParamRef(v=>!v)}
              style={{fontSize:11.5,fontWeight:500,padding:"3px 10px",borderRadius:5,border:"1px solid #E8E8E4",background:showParamRef?"#EFF4FF":"white",cursor:"pointer",color:showParamRef?"#2563EB":"#6B6B65",fontFamily:"'DM Sans',sans-serif"}}>
              {showParamRef?"Ẩn tham khảo":"Xem tham khảo"}
            </button>
            <button onClick={addEngineEntity}
              style={{fontSize:11.5,fontWeight:500,padding:"3px 10px",borderRadius:5,border:"1px solid #BBF7D0",background:"#F0FDF4",cursor:"pointer",color:"#059669",fontFamily:"'DM Sans',sans-serif"}}>
              + Entity
            </button>
            <button onClick={addEngineParam}
              style={{fontSize:11.5,fontWeight:500,padding:"3px 10px",borderRadius:5,border:"1px solid #BFDBFE",background:"#EFF4FF",cursor:"pointer",color:"#2563EB",fontFamily:"'DM Sans',sans-serif"}}>
              + Thông số
            </button>
          </div>
        </div>

        {/* Bảng tham khảo (định nghĩa trong code, chỉ đọc) */}
        {showParamRef&&(
          <div style={{marginBottom:14,border:"1px solid #E8E8E4",borderRadius:6,overflow:"hidden"}}>
            <div style={{background:"#1E1E2E",padding:"8px 12px",display:"grid",gridTemplateColumns:"130px 58px 80px 1fr 1fr",gap:8}}>
              {["Key / Type","Kiểu","Mặc định","Mô tả","Thuộc tính ảnh hưởng"].map(h=>(
                <div key={h} style={{fontSize:10.5,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:"#6B7280"}}>{h}</div>
              ))}
            </div>
            {PARAM_REF.map((p,i)=>(
              <div key={p.key} style={{padding:"7px 12px",display:"grid",gridTemplateColumns:"130px 58px 80px 1fr 1fr",gap:8,alignItems:"center",background:i%2===0?"#F7F7F5":"white",borderTop:"1px solid #E8E8E4"}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  {p.kind==="entity"&&<span style={{width:7,height:7,borderRadius:"50%",background:"#059669",display:"inline-block",flexShrink:0}}/>}
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#1A1A18",fontWeight:500}}>{p.key}</span>
                </div>
                <span style={{fontSize:11,fontWeight:600,padding:"1px 6px",borderRadius:3,background:typeColor[p.type]+"20",color:typeColor[p.type],fontFamily:"'DM Mono',monospace"}}>{p.type}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11.5,color:"#6B6B65"}}>{p.default||"—"}</span>
                <span style={{fontSize:12,color:"#6B6B65"}}>{p.desc}</span>
                <span style={{fontSize:11.5,color:"#7C3AED",fontFamily:"'DM Mono',monospace"}}>{p.affects}</span>
              </div>
            ))}
            <div style={{padding:"6px 12px",background:"#F0FDF4",borderTop:"1px solid #BBF7D0",display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#059669",display:"inline-block",flexShrink:0}}/>
              <span style={{fontSize:11,color:"#166534"}}>Dòng có chấm xanh = entity type. Sửa mảng <code style={{fontFamily:"'DM Mono',monospace",background:"#DCFCE7",padding:"1px 4px",borderRadius:3}}>PARAM_REF</code> trong code để thêm dòng mới.</span>
            </div>
          </div>
        )}

        {/* Danh sách engine items */}
        {engineItems.length===0&&!showParamRef&&(
          <div style={{fontSize:12,color:"#C4C4BC",textAlign:"center",padding:"6px 0 2px"}}>
            Nhấn "+ Entity" hoặc "+ Thông số" để thêm. Xem tham khảo để biết các key hợp lệ.
          </div>
        )}
        {engineItems.length>0&&(
          <div>
            {/* Header */}
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 24px",gap:8,marginBottom:6,paddingLeft:2}}>
              <div style={smallLabel}>Loại</div>
              <div style={smallLabel}>Key / Tên entity</div>
              <div style={smallLabel}>Value / Tọa độ (x, y)</div>
              <div/>
            </div>
            {engineItems.map(it=>(
              <div key={it.id} style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 24px",gap:8,marginBottom:7,alignItems:"center"}}>
                {/* Badge loại */}
                <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"3px 0",borderRadius:4,fontSize:11,fontWeight:600,
                  background:it.rowType==="entity"?"#F0FDF4":"#EFF4FF",
                  color:it.rowType==="entity"?"#059669":"#2563EB",
                  border:`1px solid ${it.rowType==="entity"?"#BBF7D0":"#BFDBFE"}`}}>
                  {it.rowType==="entity"?"Entity":"Thông số"}
                </div>

                {/* Key / Name */}
                <input value={it.rowType==="param"?it.key:it.name}
                  onChange={e=>updateEngineItem(it.id,it.rowType==="param"?"key":"name",e.target.value)}
                  placeholder={it.rowType==="param"?"vd: max_steps":"vd: trap"}
                  style={monoInput}/>

                {/* Value / x,y */}
                {it.rowType==="param"?(
                  <input value={it.value} onChange={e=>updateEngineItem(it.id,"value",e.target.value)}
                    placeholder="vd: 30" style={monoInput}/>
                ):(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    <input value={it.x} onChange={e=>updateEngineItem(it.id,"x",e.target.value)}
                      placeholder="x" type="number" min="0" style={{...monoInput,padding:"6px 6px"}}/>
                    <input value={it.y} onChange={e=>updateEngineItem(it.id,"y",e.target.value)}
                      placeholder="y" type="number" min="0" style={{...monoInput,padding:"6px 6px"}}/>
                  </div>
                )}

                <button onClick={()=>removeEngineItem(it.id)}
                  style={{width:24,height:34,borderRadius:4,border:"1px solid #FECACA",background:"#FEF2F2",cursor:"pointer",color:"#DC2626",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toggle xuất bản */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div onClick={()=>setForm(f=>({...f,is_published:!f.is_published}))}
          style={{width:36,height:20,borderRadius:10,background:form.is_published?"#16A34A":"#D1D5DB",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
          <div style={{position:"absolute",top:2,left:form.is_published?18:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
        </div>
        <span style={{fontSize:13,color:"#1A1A18"}}>
          {form.is_published?"Xuất bản ngay":"Lưu dưới dạng bản nháp"}
        </span>
      </div>
    </Modal>
  );
}
export default AddLevelModal;