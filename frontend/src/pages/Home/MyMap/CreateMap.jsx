import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = "http://localhost:5000/api";
const CELL_SIZE = 38;

const TOOLS = [
  { id: 0, label: "Xóa",      icon: "✕",  color: "#888780", bg: "#F1EFE8" },
  { id: 1, label: "Tường",    icon: "🧱", color: "#3C3489", bg: "#EEEDFE" },
  { id: 2, label: "Bắt đầu", icon: "🟢", color: "#085041", bg: "#E1F5EE" },
  { id: 3, label: "Đích đến", icon: "🎯", color: "#712B13", bg: "#FAECE7" },
  { id: 4, label: "Sao",      icon: "⭐", color: "#633806", bg: "#FAEEDA" },
];

const CELL_COLORS = { 0: "#F8FAFC", 1: "#374151", 2: "#1D9E75", 3: "#D85A30", 4: "#EF9F27" };
const CELL_ICONS  = { 2: "🟢", 3: "🎯", 4: "⭐" };

const DEFAULT_CODE = '// Viết code của bạn ở đây\n// Các lệnh: moveRight(), moveLeft(), moveUp(), moveDown()\n';
const DEFAULT_W = 10, DEFAULT_H = 10;

// ── Build grid array from grid_data object ─────────────────────────────────
function buildGridFromData(gd) {
  const rows = gd.rows || DEFAULT_H;
  const cols = gd.cols || DEFAULT_W;
  const g    = Array(rows).fill(null).map(() => Array(cols).fill(0));
  (gd.obstacles    || []).forEach(({ x, y }) => { if (g[y]) g[y][x] = 1; });
  if (gd.player)              g[gd.player.y][gd.player.x] = 2;
  if (gd.target)              g[gd.target.y][gd.target.x] = 3;
  (gd.collectibles || []).forEach(({ x, y }) => { if (g[y]) g[y][x] = 4; });
  return { grid: g, rows, cols };
}

// ── Resize grid, preserving existing cell data ─────────────────────────────
function resizeGrid(oldGrid, oldRows, oldCols, newRows, newCols) {
  return Array(newRows).fill(null).map((_, i) =>
    Array(newCols).fill(0).map((_, j) =>
      i < oldRows && j < oldCols ? oldGrid[i][j] : 0
    )
  );
}

// ── Resize Confirm Modal ───────────────────────────────────────────────────
function ResizeConfirmModal({ show, newW, newH, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: "white", borderRadius: 20, padding: "28px 24px",
        maxWidth: 380, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 30, textAlign: "center", marginBottom: 8 }}>⚠️</div>
        <div style={{ fontWeight: 500, fontSize: 16, textAlign: "center", marginBottom: 8, color: "#1a1a2e" }}>
          Thay đổi kích thước lưới?
        </div>
        <div style={{ fontSize: 13, color: "#7a8099", textAlign: "center", marginBottom: 6, lineHeight: 1.6 }}>
          Lưới sẽ được điều chỉnh thành <b>{newW} × {newH}</b>.
        </div>
        <div style={{
          fontSize: 12, color: "#A32D2D", background: "#FCEBEB",
          borderRadius: 8, padding: "8px 12px", marginBottom: 22, lineHeight: 1.6,
        }}>
          ⚡ Các ô nằm ngoài vùng mới sẽ bị <b>mất</b>. Hành động này không thể hoàn tác.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, borderRadius: 10, border: "0.5px solid #e8eaf0",
            background: "#f0f0f8", color: "#534ab7", fontWeight: 500, fontSize: 13,
            cursor: "pointer", fontFamily: "inherit",
          }}>Huỷ</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 11, borderRadius: 10, border: "none",
            background: "#7f77dd", color: "white", fontWeight: 500, fontSize: 13,
            cursor: "pointer", fontFamily: "inherit",
          }}>Áp dụng</button>
        </div>
      </div>
    </div>
  );
}

export default function CreateMap() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const editId          = searchParams.get('edit');

  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editId);
  const [loadError,     setLoadError]     = useState(null);

  const [gridWidth,  setGridWidth]  = useState(DEFAULT_W);
  const [gridHeight, setGridHeight] = useState(DEFAULT_H);
  const [tempWidth,  setTempWidth]  = useState(DEFAULT_W);
  const [tempHeight, setTempHeight] = useState(DEFAULT_H);
  const [grid,       setGrid]       = useState(() => Array(DEFAULT_H).fill(null).map(() => Array(DEFAULT_W).fill(0)));
  const [selectedTool, setSelectedTool] = useState(1);
  const [isDrawing,  setIsDrawing]  = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);

  // Resize confirmation
  const [showResizeConfirm, setShowResizeConfirm] = useState(false);
  const [pendingResize,     setPendingResize]      = useState(null);

  // Categories from DB
  const [allCategories,      setAllCategories]      = useState([]);
  const [isCategoriesLoading, setCategoriesLoading] = useState(true);

  const [mapInfo, setMapInfo] = useState({
    title: '', description: '', mapCode: '', initialCode: DEFAULT_CODE,
    categoryIds: [], // number[]
  });

  // ── Load categories from API ───────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_BASE_URL}/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Không thể tải danh mục');
        const data = await res.json();
        setAllCategories(data.categories || []);
      } catch (err) {
        console.error('Load categories error:', err);
        // Non-fatal: danh mục rỗng vẫn cho phép tạo map
        setAllCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ── Load existing map when in edit mode ───────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      try {
        setIsLoadingEdit(true);
        setLoadError(null);
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_BASE_URL}/community/maps/${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Không thể tải dữ liệu map');
        const data = await res.json();
        const map  = data.map;
        const gd   = typeof map.grid_data === 'string' ? JSON.parse(map.grid_data) : map.grid_data;
        const { grid: loadedGrid, rows, cols } = buildGridFromData(gd);

        setGridWidth(cols);  setTempWidth(cols);
        setGridHeight(rows); setTempHeight(rows);
        setGrid(loadedGrid);

        // map.categories: [{ id, name, icon, color }] trả về từ getMapById
        const existingCatIds = (map.categories || []).map(c => c.id);

        setMapInfo({
          title:       map.title        || '',
          description: map.description  || '',
          mapCode:     map.map_code     || '',
          initialCode: map.initial_code || DEFAULT_CODE,
          categoryIds: existingCatIds,
        });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setIsLoadingEdit(false);
      }
    };
    load();
  }, [editId]);

  // ── Grid helpers ──────────────────────────────────────────────────────────
  const applyGridSize = (w, h) => {
    const newW = Math.min(Math.max(parseInt(w) || 5, 3), 20);
    const newH = Math.min(Math.max(parseInt(h) || 5, 3), 20);
    setGridWidth(newW); setGridHeight(newH);
    setTempWidth(newW); setTempHeight(newH);
    setGrid(prev => resizeGrid(prev, gridHeight, gridWidth, newH, newW));
  };

  const createFreshGrid = () => {
    const w = Math.min(Math.max(parseInt(tempWidth)  || 5, 3), 20);
    const h = Math.min(Math.max(parseInt(tempHeight) || 5, 3), 20);
    setGridWidth(w); setGridHeight(h);
    setGrid(Array(h).fill(null).map(() => Array(w).fill(0)));
    setMapInfo({ title: '', description: '', mapCode: '', initialCode: DEFAULT_CODE, categoryIds: [] });
  };

  const requestResize = () => {
    const w = Math.min(Math.max(parseInt(tempWidth)  || 5, 3), 20);
    const h = Math.min(Math.max(parseInt(tempHeight) || 5, 3), 20);
    if (w === gridWidth && h === gridHeight) return;
    setPendingResize({ w, h });
    setShowResizeConfirm(true);
  };

  const confirmResize = () => {
    if (!pendingResize) return;
    applyGridSize(pendingResize.w, pendingResize.h);
    setShowResizeConfirm(false);
    setPendingResize(null);
  };

  const updateCell = (row, col) => {
    const newGrid = grid.map(r => [...r]);
    if (selectedTool === 2 || selectedTool === 3) {
      for (let i = 0; i < gridHeight; i++)
        for (let j = 0; j < gridWidth; j++)
          if (newGrid[i][j] === selectedTool) newGrid[i][j] = 0;
    }
    newGrid[row][col] = selectedTool;
    setGrid(newGrid);
  };

  const handleMouseDown  = (r, c) => { setIsDrawing(true); updateCell(r, c); };
  const handleMouseEnter = (r, c) => { if (isDrawing) updateCell(r, c); };
  const handleMouseUp    = ()      => setIsDrawing(false);
  const clearGrid        = ()      => setGrid(Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0)));

  const findCell = (val) => {
    for (let i = 0; i < gridHeight; i++)
      for (let j = 0; j < gridWidth; j++)
        if (grid[i][j] === val) return { x: j, y: i };
    return null;
  };

  const getAll = (val) => {
    const out = [];
    for (let i = 0; i < gridHeight; i++)
      for (let j = 0; j < gridWidth; j++)
        if (grid[i][j] === val) out.push({ x: j, y: i });
    return out;
  };

  // ── Category toggle ────────────────────────────────────────────────────────
  const toggleCategory = (catId) => {
    setMapInfo(prev => {
      const exists = prev.categoryIds.includes(catId);
      return {
        ...prev,
        categoryIds: exists
          ? prev.categoryIds.filter(id => id !== catId)
          : [...prev.categoryIds, catId],
      };
    });
  };

  const hasStartAndGoal = () => findCell(2) !== null && findCell(3) !== null;
  const canSave = hasStartAndGoal() && mapInfo.title && mapInfo.mapCode && !isSaving;

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveMap = async () => {
    if (!hasStartAndGoal()) return alert('⚠️ Map cần có điểm bắt đầu và đích đến!');
    if (!mapInfo.title || !mapInfo.mapCode) return alert('⚠️ Vui lòng điền đầy đủ thông tin!');

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body  = JSON.stringify({
        map_code:     mapInfo.mapCode,
        title:        mapInfo.title,
        description:  mapInfo.description,
        initial_code: mapInfo.initialCode,
        category_ids: mapInfo.categoryIds,   // số[] — controller sẽ sync
        grid_data: {
          rows: gridHeight, cols: gridWidth,
          player:       findCell(2),
          target:       findCell(3),
          obstacles:    getAll(1),
          collectibles: getAll(4),
        },
      });

      const url    = editId ? `${API_BASE_URL}/community/maps/${editId}` : `${API_BASE_URL}/community/maps`;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Không thể lưu map');
      }

      alert(editId ? 'Map đã được cập nhật!' : 'Map đã được tạo thành công!');
      navigate('/mymap');
    } catch (err) {
      alert('❌ Lỗi khi lưu map: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = {
    padding: '9px 12px', fontSize: 13, width: '100%',
    border: '0.5px solid #e2e8f0', borderRadius: 10,
    background: '#fafafa', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box', color: '#1a202c',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 500,
    color: '#8888aa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em',
  };
  const sectionStyle = {
    background: 'white', borderRadius: 16,
    border: '0.5px solid #e8eaf0', padding: '16px', marginBottom: 12,
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (isLoadingEdit) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 1.5s linear infinite' }}>⏳</div>
          <div style={{ fontSize: 13, color: '#8888aa' }}>Đang tải dữ liệu map...</div>
        </div>
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: 20, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 16 }}>{loadError}</p>
          <button onClick={() => navigate('/mymap')} style={{ padding: '10px 24px', background: '#7f77dd', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 500 }}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh', paddingBottom: '3rem' }}>
      <style>{`
        input:focus, textarea:focus { border-color: #7f77dd !important; box-shadow: 0 0 0 3px #eeedfe; }
        .tool-btn:hover { opacity: .85; }
        .cell:hover { opacity: .75; }
        .cat-btn:hover { opacity: .85; transform: translateY(-1px); }
      `}</style>

      <ResizeConfirmModal
        show={showResizeConfirm}
        newW={pendingResize?.w}
        newH={pendingResize?.h}
        onConfirm={confirmResize}
        onCancel={() => {
          setShowResizeConfirm(false);
          setPendingResize(null);
          setTempWidth(gridWidth);
          setTempHeight(gridHeight);
        }}
      />

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '0.5px solid #e8eaf0', padding: '16px 24px', marginBottom: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#1a1a2e', marginBottom: 2 }}>
              {editId ? '✏️ Chỉnh sửa map' : 'Tạo map mới'}
            </div>
            <div style={{ fontSize: 11, color: '#8888aa' }}>Lưới {gridWidth} × {gridHeight}</div>
          </div>
          <button
            onClick={() => navigate('/mymap')}
            style={{ padding: '7px 16px', background: '#f0f0f8', color: '#534ab7', border: 'none', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* LEFT */}
        <div>
          {/* Grid size */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              Kích thước lưới
              {editId && (
                <span style={{ fontSize: 10, background: '#FFF3CD', color: '#7a4f00', padding: '2px 8px', borderRadius: 99, fontWeight: 500 }}>
                  ⚡ Thay đổi có thể mất dữ liệu
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rộng (3–20)</label>
                <input type="number" min="3" max="20" value={tempWidth}
                  onChange={e => setTempWidth(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Cao (3–20)</label>
                <input type="number" min="3" max="20" value={tempHeight}
                  onChange={e => setTempHeight(e.target.value)} style={inputStyle} />
              </div>
              {editId ? (
                <button onClick={requestResize} style={{
                  padding: '9px 18px', background: '#7f77dd', color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>Áp dụng</button>
              ) : (
                <button onClick={createFreshGrid} style={{
                  padding: '9px 18px', background: '#7f77dd', color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}>Tạo lại</button>
              )}
            </div>
            {editId && (
              <div style={{ fontSize: 11, color: '#a0a0c0', marginTop: 8, lineHeight: 1.5 }}>
                💡 <b>Áp dụng</b> giữ lại nội dung trong vùng mới.{' '}
                <button onClick={() => {
                  const w = Math.min(Math.max(parseInt(tempWidth) || 5, 3), 20);
                  const h = Math.min(Math.max(parseInt(tempHeight) || 5, 3), 20);
                  setGridWidth(w); setGridHeight(h);
                  setGrid(Array(h).fill(null).map(() => Array(w).fill(0)));
                }} style={{
                  background: 'none', border: 'none', color: '#7f77dd',
                  cursor: 'pointer', fontSize: 11, fontWeight: 500, padding: 0, fontFamily: 'inherit',
                }}>Reset lưới →</button>
              </div>
            )}
          </div>

          {/* Tools */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Công cụ vẽ</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TOOLS.map(t => (
                <button key={t.id} className="tool-btn" onClick={() => setSelectedTool(t.id)}
                  style={{
                    padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                    background:    selectedTool === t.id ? t.color : t.bg,
                    color:         selectedTool === t.id ? 'white'  : t.color,
                    outline:       selectedTool === t.id ? `2px solid ${t.color}` : 'none',
                    outlineOffset: 2, transition: 'all .15s',
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
              <button onClick={clearGrid} style={{
                padding: '7px 14px', borderRadius: 99, border: 'none',
                background: '#FCEBEB', color: '#A32D2D', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto',
              }}>Xóa hết</button>
            </div>
          </div>

          {/* Grid canvas */}
          <div style={{ ...sectionStyle, overflowX: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
              Lưới {gridWidth} × {gridHeight} · click hoặc kéo để vẽ
            </div>
            <div
              onMouseLeave={handleMouseUp}
              onDragStart={e => e.preventDefault()}
              style={{ display: 'inline-block', border: '2px solid #7f77dd', borderRadius: 12, padding: 4, background: 'white', userSelect: 'none' }}
            >
              {grid.map((row, i) => (
                <div key={i} style={{ display: 'flex' }}>
                  {row.map((cell, j) => (
                    <div key={`${i}-${j}`} className="cell"
                      onMouseDown={() => handleMouseDown(i, j)}
                      onMouseEnter={() => handleMouseEnter(i, j)}
                      onMouseUp={handleMouseUp}
                      style={{
                        width: CELL_SIZE, height: CELL_SIZE,
                        border: '1px solid #e2e8f0',
                        background: CELL_COLORS[cell] || CELL_COLORS[0],
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: cell === 1 ? CELL_SIZE * 0.7 : 18,
                        borderRadius: cell === 1 ? 4 : 2,
                        transition: 'opacity .1s', boxSizing: 'border-box',
                      }}>
                      {cell === 1 ? '🧱' : CELL_ICONS[cell] || ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* Map info */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Thông tin map</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Tên map *</label>
                <input type="text" placeholder="VD: Mê cung khó" value={mapInfo.title}
                  onChange={e => setMapInfo({ ...mapInfo, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mã map * (chữ in hoa)</label>
                <input type="text" placeholder="VD: MAP001" value={mapInfo.mapCode}
                  onChange={e => setMapInfo({ ...mapInfo, mapCode: e.target.value.toUpperCase() })}
                  style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 500, letterSpacing: '.05em' }} />
              </div>
              <div>
                <label style={labelStyle}>Mô tả</label>
                <textarea placeholder="Mô tả ngắn gọn về map của bạn..." rows={3} value={mapInfo.description}
                  onChange={e => setMapInfo({ ...mapInfo, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div>
                <label style={labelStyle}>Code khởi tạo</label>
                <textarea rows={5} value={mapInfo.initialCode}
                  onChange={e => setMapInfo({ ...mapInfo, initialCode: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'Consolas, Monaco, monospace', fontSize: 12, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            </div>
          </div>

          {/* ── Danh mục từ DB ─────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Danh mục <span style={{ fontSize: 10, color: '#b0b0c0', textTransform: 'none', fontWeight: 400 }}>— tuỳ chọn, chọn nhiều</span></span>
              {mapInfo.categoryIds.length > 0 && (
                <button onClick={() => setMapInfo(prev => ({ ...prev, categoryIds: [] }))}
                  style={{ fontSize: 10, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                  Bỏ hết ×
                </button>
              )}
            </div>

            {isCategoriesLoading ? (
              /* Skeleton */
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[80, 64, 96, 72, 88, 60].map((w, i) => (
                  <div key={i} style={{
                    height: 28, width: w, borderRadius: 99,
                    background: 'linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.4s ease-in-out infinite',
                  }} />
                ))}
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
              </div>
            ) : allCategories.length === 0 ? (
              <div style={{ fontSize: 12, color: '#b0b0c0', textAlign: 'center', padding: '12px 0' }}>
                Chưa có danh mục nào
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {allCategories.map(cat => {
                  const selected = mapInfo.categoryIds.includes(cat.id);
                  // Dùng color từ DB nếu có, fallback về màu mặc định
                  const color  = cat.color || '#7f77dd';
                  // Tạo bg nhạt từ color (dùng hex opacity)
                  const bg     = selected ? color : `${color}18`;
                  return (
                    <button
                      key={cat.id}
                      className="cat-btn"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
                        background: bg,
                        color:      selected ? 'white' : color,
                        outline:    selected ? `2px solid ${color}` : 'none',
                        outlineOffset: 2, transition: 'all .15s',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                      {cat.icon && <span>{cat.icon}</span>}
                      {cat.name}
                      {selected && <span style={{ fontSize: 9, opacity: 0.8 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {mapInfo.categoryIds.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#8888aa' }}>
                Đã chọn: <b style={{ color: '#534ab7' }}>{mapInfo.categoryIds.length} danh mục</b>
                {' · '}
                {allCategories
                  .filter(c => mapInfo.categoryIds.includes(c.id))
                  .map(c => `${c.icon || ''} ${c.name}`.trim())
                  .join(', ')}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div style={{ ...sectionStyle, background: '#faeeda', border: '0.5px solid #fac775' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#854f0b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Checklist</div>
            {[
              { ok: findCell(2) !== null,          label: 'Có điểm bắt đầu 🟢' },
              { ok: findCell(3) !== null,          label: 'Có đích đến 🎯' },
              { ok: !!mapInfo.title,               label: 'Đã đặt tên map' },
              { ok: !!mapInfo.mapCode,             label: 'Đã có mã map' },
              { ok: mapInfo.categoryIds.length > 0, label: 'Đã chọn danh mục', optional: true },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                color: item.ok ? '#085041' : item.optional ? '#a0a0c0' : '#854f0b',
                marginBottom: 5,
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  background: item.ok ? '#1D9E75' : item.optional ? '#d0d0e0' : '#EF9F27',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: 'white',
                }}>
                  {item.ok ? '✓' : item.optional ? '○' : '!'}
                </span>
                {item.label}
                {item.optional && !item.ok && (
                  <span style={{ fontSize: 10, color: '#b0b0c0' }}>(tuỳ chọn)</span>
                )}
              </div>
            ))}
          </div>

          {/* Save */}
          <button onClick={saveMap} disabled={!canSave}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              fontSize: 14, fontWeight: 500, cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'opacity .15s',
              background: canSave ? '#1D9E75' : '#D3D1C7',
              color:      canSave ? 'white'    : '#888780',
            }}
            onMouseEnter={e => { if (canSave) e.currentTarget.style.opacity = '.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {isSaving
              ? '⏳ Đang lưu...'
              : canSave
              ? editId ? '💾 Cập nhật map' : '💾 Lưu map'
              : '⚠️ Chưa đủ điều kiện'}
          </button>
        </div>
      </div>
    </div>
  );
}