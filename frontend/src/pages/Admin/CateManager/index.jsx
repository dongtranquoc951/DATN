import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:5000/api";

// ─── Shared primitives (matching MapManager style) ───────────────────────────

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

function Modal({ open, onClose, title, subtitle, footer, children, width = 480 }) {
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
        {footer && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #E8E8E4", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ variant = "outline", onClick, children, disabled = false, style: extraStyle = {} }) {
  const vs = {
    primary: { background: "#2563EB", color: "white",    border: "1px solid #2563EB" },
    outline: { background: "white",   color: "#6B6B65",  border: "1px solid #E8E8E4" },
    ghost:   { background: "transparent", color: "#6B6B65", border: "1px solid transparent" },
    danger:  { background: "#DC2626", color: "white",    border: "1px solid #DC2626" },
    success: { background: "#16A34A", color: "white",    border: "1px solid #16A34A" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, ...vs[variant], ...extraStyle }}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false, error }) {
  const base = {
    width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    border: `1px solid ${error ? "#FCA5A5" : "#E8E8E4"}`,
    outline: "none", boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif", color: "#1A1A18",
    background: "#FAFAFA",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6B6B65", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} onFocus={e => e.target.style.borderColor = "#2563EB"} onBlur={e => e.target.style.borderColor = error ? "#FCA5A5" : "#E8E8E4"} />
        : <input   value={value} onChange={onChange} placeholder={placeholder}           style={base}                               onFocus={e => e.target.style.borderColor = "#2563EB"} onBlur={e => e.target.style.borderColor = error ? "#FCA5A5" : "#E8E8E4"} autoFocus />
      }
      {error && <p style={{ fontSize: 12, color: "#DC2626", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}

// ─── Category form (inside Modal) ────────────────────────────────────────────

function CategoryForm({ data, onSave, onClose, loading }) {
  const isEdit = !!data;
  const [form, setForm] = useState({ name: data?.name || "", description: data?.description || "" });
  const [err, setErr]   = useState("");

  const submit = () => {
    if (!form.name.trim()) { setErr("Vui lòng nhập tên danh mục"); return; }
    onSave(form);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Tên danh mục *" value={form.name} placeholder="VD: Dễ, Trung bình, Mê cung..."
          onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErr(""); }}
          error={err} />
        <Field label="Mô tả" value={form.description} placeholder="Mô tả ngắn về danh mục..."
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} multiline />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #E8E8E4" }}>
        <Btn variant="ghost" onClick={onClose}>Hủy</Btn>
        <Btn variant="primary" onClick={submit} disabled={loading}>
          {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm danh mục"}
        </Btn>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CategoryManager() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);   // { mode: "add"|"edit", data? }
  const [delTarget, setDel]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      setList(data.categories || []);
    } catch {
      showToast("Không tải được danh sách danh mục", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const token  = localStorage.getItem("token");
      const isEdit = modal.mode === "edit";
      const res    = await fetch(
        isEdit ? `${API_BASE_URL}/categories/${modal.data.id}` : `${API_BASE_URL}/categories`,
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi");
      showToast(isEdit ? `Đã cập nhật "${form.name}"` : `Đã thêm "${form.name}"`, "success");
      setModal(null);
      load();
    } catch (e) {
      showToast(e.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_BASE_URL}/categories/${delTarget.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi");
      showToast(`Đã xóa "${delTarget.name}"`, "danger");
      setDel(null);
      load();
    } catch (e) {
      showToast(e.message, "danger");
    } finally {
      setDeleting(false);
    }
  };

  const actionBtn = (color) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 28, padding: "0 10px", borderRadius: 6,
    border: `1px solid ${color ? color + "40" : "#E8E8E4"}`,
    background: color ? color + "10" : "white",
    cursor: "pointer", fontSize: 11, fontWeight: 500,
    color: color || "#6B6B65", fontFamily: "'DM Sans', sans-serif",
  });

  const filtered = list.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase()));

  // Stats
  const withDesc    = list.filter(c => c.description && c.description.trim()).length;
  const withoutDesc = list.length - withDesc;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Topbar */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E8E4", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Quản lý danh mục</div>
          <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 1 }}>Admin / Danh mục màn chơi</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F7F5", border: "1px solid #E8E8E4", borderRadius: 6, padding: "7px 12px", width: 220 }}>
            <svg width="13" height="13" fill="none" stroke="#A8A89E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm danh mục..." style={{ border: "none", background: "transparent", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#1A1A18", outline: "none", width: "100%" }} />
          </div>
          <Btn variant="primary" onClick={() => setModal({ mode: "add" })}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm danh mục
          </Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Tổng danh mục",    value: list.length,    badge: "Tất cả",        color: "#EFF4FF" },
            { label: "Có mô tả",         value: withDesc,       badge: "Đầy đủ",         color: "#F0FDF4" },
            { label: "Chưa có mô tả",    value: withoutDesc,    badge: "Cần bổ sung",    color: "#FFFBEB" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", border: "1px solid #E8E8E4", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: s.color }} />
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: "#F0FDF4", color: "#16A34A" }}>{s.badge}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: "#A8A89E" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Danh sách danh mục</div>
            <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 2 }}>
              {filtered.length} / {list.length} danh mục
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #E8E8E4", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F7F7F5", borderBottom: "1px solid #E8E8E4" }}>
              <tr>
                {["#", "Tên danh mục", "Mô tả", "Thao tác"].map((h, i) => (
                  <th key={h} style={{
                    padding: "11px 16px",
                    textAlign: i === 3 ? "right" : "left",
                    fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#A8A89E",
                    paddingLeft: i === 0 ? 20 : 16,
                    paddingRight: i === 3 ? 20 : 16,
                    width: i === 0 ? 48 : undefined,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 32, color: "#A8A89E", fontSize: 13 }}>
                    {search ? "Không tìm thấy danh mục nào" : "Chưa có danh mục nào"}
                  </td>
                </tr>
              ) : filtered.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #E8E8E4" }}>
                  {/* Index */}
                  <td style={{ padding: "14px 16px", paddingLeft: 20 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#A8A89E" }}>{String(idx + 1).padStart(2, "0")}</span>
                  </td>

                  {/* Name */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 13.5, color: "#1A1A18" }}>{item.name}</span>
                    </div>
                  </td>

                  {/* Description */}
                  <td style={{ padding: "14px 16px", maxWidth: 320 }}>
                    {item.description
                      ? <span style={{ fontSize: 13, color: "#6B6B65", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{item.description}</span>
                      : <span style={{ fontSize: 12.5, color: "#C8C8C0", fontStyle: "italic" }}>Chưa có mô tả</span>
                    }
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 20px 14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <button style={actionBtn()} onClick={() => setModal({ mode: "edit", data: item })}>Sửa</button>
                      <button style={actionBtn("#DC2626")} onClick={() => setDel(item)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer bar */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E8E4", background: "#F7F7F5" }}>
            <div style={{ fontSize: 12.5, color: "#A8A89E" }}>Hiển thị {filtered.length} / {list.length} danh mục</div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        subtitle={modal?.mode === "edit" ? `Đang sửa: ${modal.data?.name}` : "Tạo danh mục mới cho màn chơi"}
      >
        {modal && (
          <CategoryForm
            data={modal.mode === "edit" ? modal.data : null}
            onSave={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!delTarget}
        onClose={() => setDel(null)}
        title="Xác nhận xóa danh mục"
        subtitle="Hành động này không thể hoàn tác"
        width={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDel(null)} disabled={deleting}>Hủy</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Đang xóa..." : "Xác nhận Xóa"}
            </Btn>
          </>
        }
      >
        {delTarget && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>Xóa "{delTarget.name}"?</div>
            <div style={{ fontSize: 12.5, color: "#9B1C1C", lineHeight: 1.6 }}>
              Danh mục <strong>{delTarget.name}</strong> sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}