import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api/admin";

const http = {
  async get(url, params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v !== undefined)
    ).toString();
    const res = await fetch(qs ? `${url}?${qs}` : url);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  async patch(url) {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" } });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#6366F1,#8B5CF6)",
  "linear-gradient(135deg,#0EA5E9,#06B6D4)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#EC4899,#F43F5E)",
  "linear-gradient(135deg,#8B5CF6,#EC4899)",
];

const initials = (name) => {
  if (!name || typeof name !== "string") return "?";
  return name.trim().split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();
};

const providerLabel = (p) =>
  p === "google" ? "Google" : p === "github" ? "GitHub" : "Local";

function StatCard({ label, value, badge, badgeType }) {
  const bgMap = { blue: "#EFF4FF", green: "#F0FDF4", red: "#FEF2F2", yellow: "#FFFBEB" };
  return (
    <div style={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: bgMap[badgeType] }} />
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: badgeType === "red" ? "#FEF2F2" : "#F0FDF4", color: badgeType === "red" ? "#DC2626" : "#16A34A" }}>{badge}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12.5, color: "#A8A89E" }}>{label}</div>
    </div>
  );
}

function Badge({ type, children }) {
  const styles = {
    active: { background: "#F0FDF4", color: "#16A34A" },
    banned: { background: "#FEF2F2", color: "#DC2626" },
    admin:  { background: "#EFF4FF", color: "#2563EB" },
    user:   { background: "#F7F7F5", color: "#6B6B65", border: "1px solid #E8E8E4" },
  };
  const dotColors = { active: "#16A34A", banned: "#DC2626" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 20, ...styles[type] }}>
      {dotColors[type] && <span style={{ width: 5, height: 5, borderRadius: "50%", background: dotColors[type] }} />}
      {children}
    </span>
  );
}

function Avatar({ name, index, size = 34 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: AVATAR_COLORS[index % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600, color: "white", flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

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

function Modal({ open, onClose, title, subtitle, footer, children, width = 680 }) {
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
  const variants = {
    primary: { background: "#2563EB", color: "white", border: "1px solid #2563EB" },
    outline: { background: "white", color: "#6B6B65", border: "1px solid #E8E8E4" },
    ghost:   { background: "transparent", color: "#6B6B65", border: "1px solid transparent" },
    danger:  { background: "#DC2626", color: "white", border: "1px solid #DC2626" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function UserDetailContent({ user, idx }) {
  if (!user) return <Spinner />;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, background: "#F7F7F5", borderRadius: 10, marginBottom: 20 }}>
        <Avatar name={user.full_name} index={idx} size={56} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{user.full_name}</div>
          <div style={{ fontSize: 13, color: "#A8A89E", marginTop: 3 }}>{user.email}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Badge type={user.is_active ? "active" : "banned"}>{user.is_active ? "Hoạt động" : "Đã ban"}</Badge>
            <Badge type={user.role === "admin" ? "admin" : "user"}>{user.role === "admin" ? "Admin" : "User"}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Username",       value: `@${user.username}`,                                  mono: true },
          { label: "Đăng nhập qua",  value: providerLabel(user.auth_provider) },
          { label: "Ngày tham gia",  value: new Date(user.created_at).toLocaleDateString("vi-VN"), mono: true },
          { label: "Số màn đã tạo",  value: `${user.maps?.length ?? 0} màn chơi` },
        ].map((item) => (
          <div key={item.label} style={{ background: "#F7F7F5", borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#A8A89E", marginBottom: 5 }}>{item.label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, fontFamily: item.mono ? "'DM Mono', monospace" : undefined }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Màn chơi đã tạo
        <span style={{ fontSize: 11, background: "#EFF4FF", color: "#2563EB", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>{user.maps?.length ?? 0} maps</span>
      </div>

      {!user.maps?.length ? (
        <div style={{ textAlign: "center", padding: 24, color: "#A8A89E", fontSize: 13 }}>Chưa tạo màn chơi nào</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {user.maps.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "#F7F7F5", borderRadius: 6, border: "1px solid #E8E8E4" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11.5, background: "white", border: "1px solid #E8E8E4", padding: "2px 7px", borderRadius: 4, color: "#2563EB" }}>{m.map_code}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.title}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#A8A89E" }}>{m.average_rating} sao · {m.play_count} lượt chơi</div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ val: m.play_count, lbl: "Lượt chơi" }, { val: m.average_rating, lbl: "Điểm" }].map((s) => (
                  <div key={s.lbl} style={{ textAlign: "center", fontSize: 12, color: "#A8A89E" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>{s.val}</div>
                    {s.lbl}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function UserManager() {
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [loading, setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banTarget, setBanTarget]   = useState(null);
  const [toast, setToast]           = useState(null);
  const [searchDebounced, setSearchDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await http.get(`${API}/users`, { search: searchDebounced, filter, page, limit: pagination.limit });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      showToast(err?.message || "Lỗi tải danh sách người dùng", "danger");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, filter, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await http.get(`${API}/users/stats`);
      setStats(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(1); }, [searchDebounced, filter]);
  useEffect(() => { fetchStats(); }, []);

  const openDetail = async (user, idx) => {
    setDetailUser({ user, idx });
    setDetailLoading(true);
    try {
      const data = await http.get(`${API}/users/${user.id}`);
      setDetailUser({ user: data.data, idx });
    } catch {
      showToast("Không thể tải chi tiết người dùng", "danger");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    setActionLoading(true);
    try {
      const data = await http.patch(`${API}/users/${banTarget.id}/ban`);
      setUsers((prev) => prev.map((u) => u.id === banTarget.id ? { ...u, is_active: false } : u));
      fetchStats();
      showToast(data.message, "danger");
    } catch (err) {
      showToast(err?.message || "Lỗi khi ban tài khoản", "danger");
    } finally {
      setActionLoading(false);
      setBanTarget(null);
    }
  };

  const handleUnban = async (user) => {
    try {
      const data = await http.patch(`${API}/users/${user.id}/unban`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: true } : u));
      fetchStats();
      showToast(data.message, "success");
    } catch (err) {
      showToast(err?.message || "Lỗi khi mở khóa tài khoản", "danger");
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Username", "Họ tên", "Email", "Role", "Provider", "Trạng thái", "Ngày tạo"];
    const rows = users.map((u) => [
      u.id, u.username, u.full_name, u.email, u.role,
      u.auth_provider, u.is_active ? "Hoạt động" : "Đã ban",
      new Date(u.created_at).toLocaleDateString("vi-VN"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const FILTERS = [
    { key: "all",    label: "Tất cả" },
    { key: "active", label: "Hoạt động" },
    { key: "banned", label: "Đã ban" },
    { key: "admin",  label: "Admin" },
  ];

  const actionBtnStyle = (color) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 28, padding: "0 10px", borderRadius: 6,
    border: `1px solid ${color ? color + "40" : "#E8E8E4"}`,
    background: color ? color + "10" : "white",
    cursor: "pointer", fontSize: 11, fontWeight: 500,
    color: color || "#6B6B65", fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Topbar */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E8E4", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Quản lý người dùng</div>
          <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 1 }}>Admin / Người dùng</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F7F7F5", border: "1px solid #E8E8E4", borderRadius: 6, padding: "7px 12px", width: 240 }}>
            <svg width="13" height="13" fill="none" stroke="#A8A89E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên, email, username..." style={{ border: "none", background: "transparent", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#1A1A18", outline: "none", width: "100%" }} />
          </div>
          <Btn variant="outline" onClick={exportCSV}>Xuất CSV</Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <StatCard label="Tổng người dùng"  value={stats?.total_users?.toLocaleString()}  badge={`+${stats?.new_this_month ?? 0} tháng này`} badgeType="blue"   />
          <StatCard label="Đang hoạt động"   value={stats?.active_users?.toLocaleString()} badge="Đang online"                                 badgeType="green"  />
          <StatCard label="Đã bị ban"        value={stats?.banned_users?.toLocaleString()} badge={`+${stats?.new_this_week ?? 0} tuần này`}   badgeType="red"    />
          <StatCard label="Màn chơi đã tạo"  value={stats?.total_maps?.toLocaleString()}   badge="Community maps"                              badgeType="yellow" />
        </div>

        {/* Table header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Danh sách người dùng</div>
            <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 2 }}>
              {pagination.total} người dùng · Trang {pagination.page}/{pagination.totalPages}
            </div>
          </div>
          <div style={{ display: "flex", background: "#F7F7F5", border: "1px solid #E8E8E4", borderRadius: 6, padding: 3, gap: 2 }}>
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 12px", fontSize: 12.5, fontWeight: 500, borderRadius: 4, cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif", background: filter === f.key ? "white" : "transparent", color: filter === f.key ? "#1A1A18" : "#6B6B65", boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "white", border: "1px solid #E8E8E4", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F7F7F5", borderBottom: "1px solid #E8E8E4" }}>
              <tr>
                {["Người dùng", "Trạng thái", "Vai trò", "Đăng nhập qua", "Màn chơi", "Ngày tham gia", "Thao tác"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: i === 6 ? "right" : "left", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#A8A89E", paddingLeft: i === 0 ? 20 : 16, paddingRight: i === 6 ? 20 : 16 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Spinner /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#A8A89E", fontSize: 13 }}>Không tìm thấy người dùng nào</td></tr>
              ) : users.map((u, idx) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #E8E8E4", background: !u.is_active ? "#FFF8F8" : "transparent" }}>
                  <td style={{ padding: "14px 16px", paddingLeft: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={u.full_name} index={idx} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{u.full_name}</div>
                        <div style={{ fontSize: 12, color: "#A8A89E", marginTop: 1 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Badge type={u.is_active ? "active" : "banned"}>{u.is_active ? "Hoạt động" : "Đã ban"}</Badge>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <Badge type={u.role === "admin" ? "admin" : "user"}>{u.role === "admin" ? "Admin" : "User"}</Badge>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#6B6B65", background: "#F7F7F5", padding: "3px 8px", borderRadius: 4, border: "1px solid #E8E8E4", fontFamily: "'DM Mono', monospace" }}>
                      {providerLabel(u.auth_provider)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#6B6B65" }}>{u.maps_count ?? 0} maps</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12.5, color: "#6B6B65" }}>
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px 14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <button style={actionBtnStyle()} onClick={() => openDetail(u, idx)}>Chi tiết</button>
                      {u.is_active
                        ? <button style={actionBtnStyle("#DC2626")} onClick={() => setBanTarget(u)}>Ban</button>
                        : <button style={actionBtnStyle("#16A34A")} onClick={() => handleUnban(u)}>Mở khóa</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E8E4", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7F7F5" }}>
            <div style={{ fontSize: 12.5, color: "#A8A89E" }}>Hiển thị {users.length} / {pagination.total} người dùng</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "white", fontSize: 12.5, cursor: pagination.page <= 1 ? "not-allowed" : "pointer", color: "#6B6B65", opacity: pagination.page <= 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 1))
                .map((p) => (
                  <button key={p} onClick={() => fetchUsers(p)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: p === pagination.page ? "#2563EB" : "white", fontSize: 12.5, cursor: "pointer", color: p === pagination.page ? "white" : "#6B6B65", fontFamily: "'DM Sans', sans-serif" }}>{p}</button>
                ))}
              <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E8E8E4", background: "white", fontSize: 12.5, cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer", color: "#6B6B65", opacity: pagination.page >= pagination.totalPages ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title={detailUser?.user.full_name}
        subtitle={`@${detailUser?.user.username} · ${detailUser?.user.email}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDetailUser(null)}>Đóng</Btn>
            <Btn variant="primary">Chỉnh sửa</Btn>
          </>
        }
      >
        {detailLoading ? <Spinner /> : detailUser && <UserDetailContent user={detailUser.user} idx={detailUser.idx} />}
      </Modal>

      {/* Ban Confirm Modal */}
      <Modal
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        title="Xác nhận ban tài khoản"
        subtitle="Hành động này có thể hoàn tác sau"
        width={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setBanTarget(null)} disabled={actionLoading}>Hủy</Btn>
            <Btn variant="danger" onClick={handleBan} disabled={actionLoading}>
              {actionLoading ? "Đang xử lý..." : "Xác nhận Ban"}
            </Btn>
          </>
        }
      >
        {banTarget && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>Ban "{banTarget.full_name}"?</div>
            <div style={{ fontSize: 12.5, color: "#9B1C1C", lineHeight: 1.6 }}>
              Tài khoản của {banTarget.full_name} ({banTarget.email}) sẽ bị vô hiệu hóa. Người dùng không thể đăng nhập hoặc chơi game cho đến khi được mở khóa bởi admin.
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}