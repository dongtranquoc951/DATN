import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";


const NAV_ITEMS = [
  {
    group: "Tổng quan",
    items: [
      { to: "/admin", label: "Dashboard", exact: true, icon: <IconGrid /> },
    ],
  },
  {
    group: "Quản lý",
    items: [
      { to: "/admin/users", label: "Người dùng", icon: <IconUsers /> },
      { to: "/admin/maps", label: "Cộng đồng", icon: <IconMap /> },
      { to: "/admin/levels", label: "Học tập", icon: <IconGlobe /> },
      { to: "/admin/categories", label: "Danh mục", icon: <IconChart /> },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { to: "", label: "Cài đặt", icon: <IconSettings /> },
    ],
  },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    ["token", "username", "userId"].forEach((k) => localStorage.removeItem(k));
    navigate("/");
  };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F7F5", fontFamily: "'DM Sans', sans-serif" }}>
      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 60 : 220,
        background: "#fff",
        borderRight: "1px solid #E8E8E4",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 16px 24px", borderBottom: "1px solid #E8E8E4", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: "#2563EB", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 16, flexShrink: 0,
            }}>⚡</div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "#1A1A18" }}>
                  CodingGame
                </div>
                <div style={{ fontSize: 11, color: "#A8A89E", fontFamily: "'DM Mono', monospace" }}>
                  admin panel
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "0 10px", flex: 1, overflowY: "auto" }}>
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "#A8A89E",
                  padding: "0 8px", margin: "16px 0 6px",
                }}>
                  {group.group}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 6,
                    color: isActive ? "#2563EB" : "#6B6B65",
                    background: isActive ? "#EFF4FF" : "transparent",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: 13.5,
                    textDecoration: "none",
                    marginBottom: 2,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  })}
                >
                  <span style={{ flexShrink: 0, opacity: 0.8 }}>{item.icon}</span>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 10px 0", borderTop: "1px solid #E8E8E4" }}>

          {/* Nút quay lại trang chủ */}
          <NavLink to="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 6,
            color: "#6B6B65", textDecoration: "none",
            fontSize: 13.5, marginBottom: 4,
            transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F7F5"; e.currentTarget.style.color = "#1A1A18"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B6B65"; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.8 }}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {!collapsed && "Trang chủ"}
          </NavLink>

          {/* Nút đăng xuất */}
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 6,
            color: "#e53e3e", background: "transparent",
            border: "none", cursor: "pointer",
            fontSize: 13.5, width: "100%", marginBottom: 8,
            transition: "all 0.15s", fontFamily: "inherit",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.8 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            {!collapsed && "Đăng xuất"}
          </button>

          {/* Avatar Admin — giữ nguyên */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: "#2563EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "white", fontWeight: 600, flexShrink: 0,
            }}>A</div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1A1A18" }}>Admin</div>
                <div style={{ fontSize: 11, color: "#A8A89E" }}>Super Admin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: collapsed ? 60 : 220, flex: 1, transition: "margin-left 0.2s ease" }}>
        <Outlet />
      </main>
    </div>
  );
}

/* ── SVG Icons ── */
function IconGrid() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function IconUsers() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconMap() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
}
function IconGlobe() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function IconChart() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconSettings() {
  return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 1 0 19.07 19.07"/></svg>;
}