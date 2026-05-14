import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:5000/api";

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="w-7 h-7 rounded-full border-[3px] border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = { success: "bg-green-800", danger: "bg-red-800", info: "bg-gray-900" };

  return (
    <div className={`fixed bottom-6 right-6 z-[400] flex items-center gap-2.5 px-4 py-3 ${bg[type] || bg.info} text-white rounded-xl text-sm font-medium shadow-lg min-w-[240px] animate-[slideUp_0.2s_ease]`}>
      <style>{`@keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
      {message}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, footer, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-[200]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl overflow-y-auto shadow-2xl" style={{ width, maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 60px)" }}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md border border-gray-200 bg-transparent cursor-pointer text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex gap-2 justify-end px-6 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
function Btn({ variant = "outline", onClick, children, disabled = false }) {
  const vs = {
    primary: "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700",
    outline: "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50",
    ghost:   "bg-transparent text-gray-500 border border-transparent hover:bg-gray-50",
    danger:  "bg-red-600 text-white border border-red-600 hover:bg-red-700",
    success: "bg-green-600 text-white border border-green-600 hover:bg-green-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${vs[variant]} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, multiline = false, error }) {
  const base = `w-full px-3 py-2 rounded-md text-sm border bg-gray-50 text-gray-900 outline-none transition-colors ${error ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"}`;
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} className={`${base} resize-y`} />
        : <input value={value} onChange={onChange} placeholder={placeholder} className={base} autoFocus />
      }
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ─── CategoryForm ─────────────────────────────────────────────────────────────
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
      <div className="flex flex-col gap-4">
        <Field label="Tên danh mục *" value={form.name} placeholder="VD: Dễ, Trung bình, Mê cung..."
          onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErr(""); }}
          error={err} />
        <Field label="Mô tả" value={form.description} placeholder="Mô tả ngắn về danh mục..."
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} multiline />
      </div>
      <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-gray-100">
        <Btn variant="ghost" onClick={onClose}>Hủy</Btn>
        <Btn variant="primary" onClick={submit} disabled={loading}>
          {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm danh mục"}
        </Btn>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CategoryManager() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);
  const [delTarget, setDel]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [toast, setToast]       = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res  = await fetch(`${API_BASE_URL}/categories/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      showToast(`Đã ngừng hoạt động "${delTarget.name}"`, "danger");
      setDel(null);
      load();
    } catch (e) {
      showToast(e.message, "danger");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (item) => {
    if (!item) return;
    setRestoring(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/categories/${item.id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi");
      showToast(data.message || `Đã khôi phục "${item.name}"`, "success");
      load();
    } catch (e) {
      showToast(e.message, "danger");
    } finally {
      setRestoring(false);
    }
  };

  const filtered = list.filter(c =>
    (statusFilter === "all" || (c.status || "active") === statusFilter) &&
    (!search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = list.filter(c => (c.status || "active") === "active").length;
  const inactiveCount = list.filter(c => c.status === "inactive").length;
  const withDesc = list.filter(c => (c.status || "active") === "active" && c.description?.trim()).length;

  const stats = [
    { label: "Tổng danh mục", value: list.length,  badge: "Tất cả",     badgeColor: "bg-blue-50 text-blue-600",   icon: "bg-blue-50" },
    { label: "Có mô tả",      value: withDesc,      badge: "Đầy đủ",     badgeColor: "bg-green-50 text-green-600", icon: "bg-green-50" },
    { label: "Không hoạt động", value: inactiveCount, badge: "Khôi phục", badgeColor: "bg-amber-50 text-amber-600", icon: "bg-amber-50" },
  ];

  return (
    <div className="font-sans">

      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-8 h-[60px] flex items-center justify-between sticky top-0 z-50">
        <div>
          <div className="text-sm font-semibold text-gray-900">Quản lý danh mục</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin / Danh mục màn chơi</div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 w-52">
            <svg width="13" height="13" fill="none" stroke="#A8A89E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm danh mục..."
              className="border-none bg-transparent text-sm text-gray-900 outline-none w-full placeholder-gray-400" />
          </div>
          <Btn variant="primary" onClick={() => setModal({ mode: "add" })}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Thêm danh mục
          </Btn>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3.5 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${s.icon}`} />
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.badgeColor}`}>{s.badge}</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 leading-none mb-1">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Danh sách danh mục</div>
            <div className="text-xs text-gray-400 mt-0.5">{filtered.length} / {list.length} danh mục</div>
          </div>
          <div className="flex gap-1.5 bg-gray-50 border border-gray-200 rounded-md p-1">
            {[
              { key: "active", label: `Hoạt động (${activeCount})` },
              { key: "inactive", label: `Không hoạt động (${inactiveCount})` },
              { key: "all", label: `Tất cả (${list.length})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${statusFilter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["#", "Tên danh mục", "Mô tả", "Trạng thái", "Thao tác"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 ${i === 4 ? "text-right pr-5" : "text-left"} ${i === 0 ? "pl-5 w-12" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-gray-400">
                    {search ? "Không tìm thấy danh mục nào" : "Chưa có danh mục nào"}
                  </td>
                </tr>
              ) : filtered.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 pl-5">
                    <span className="font-mono text-xs text-gray-400">{String(idx + 1).padStart(2, "0")}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    {item.description
                      ? <span className="text-sm text-gray-500 truncate block">{item.description}</span>
                      : <span className="text-xs text-gray-300 italic">Chưa có mô tả</span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${(item.status || "active") === "active" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                      {(item.status || "active") === "active" ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 pr-5">
                    <div className="flex items-center gap-1.5 justify-end">
                      {(item.status || "active") === "active" ? (
                        <>
                          <button
                            onClick={() => setModal({ mode: "edit", data: item })}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDel(item)}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                          >
                            Ngừng
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(item)}
                          disabled={restoring}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer transition-colors disabled:opacity-60"
                        >
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-400">Hiển thị {filtered.length} / {list.length} danh mục</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
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

      {/* Delete Modal */}
      <Modal
        open={!!delTarget}
        onClose={() => setDel(null)}
        title="Ngừng hoạt động danh mục"
        subtitle="Danh mục sẽ bị ẩn khỏi danh sách chọn"
        width={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDel(null)} disabled={deleting}>Hủy</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Đang xử lý..." : "Ngừng hoạt động"}
            </Btn>
          </>
        }
      >
        {delTarget && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-red-600 mb-1.5">Ngừng hoạt động "{delTarget.name}"?</div>
            <div className="text-xs text-red-800 leading-relaxed">
              Danh mục <strong>{delTarget.name}</strong> sẽ không còn hiện khi tạo/sửa map. Các liên kết cũ vẫn được giữ trong dữ liệu.
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
