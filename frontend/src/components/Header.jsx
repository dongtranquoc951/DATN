import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTokenPayload } from "../utils/auth";



const NAV_LINKS = [
  { to: "/learning",   label: "Học tập" },
  { to: "/community",  label: "Cộng đồng" },
];

const USER_MENU_ITEMS = [
  { to: "/profile", label: "Thông tin tài khoản" },
  { to: "/mymap",   label: "Màn chơi của tôi" },
  { to: "/settings", label: "Cài đặt" },
];

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [username, setUsername]         = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef  = useRef(null);
  const navigate = useNavigate();

  // Sửa useEffect đọc token
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("username");
    if (token && user) {
      setIsLoggedIn(true);
      setUsername(user);
      const payload = getTokenPayload();         // ← thêm
      if (payload?.role === 'admin') setIsAdmin(true); // ← thêm
    }
  }, []);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  // Sửa handleLogout — reset isAdmin khi logout
  const handleLogout = () => {
    ["token", "username", "userId"].forEach((k) => localStorage.removeItem(k));
    setIsLoggedIn(false);
    setUsername("");
    setIsAdmin(false);   // ← thêm
    setShowUserMenu(false);
    navigate("/");
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) navigate(`/community?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header style={styles.header}>
      <div style={styles.inner}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={{ fontSize: "1.8rem" }}>🎮</span>
          CodeQuest
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={styles.searchWrap}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm màn chơi, map..."
            style={styles.searchInput}
            onFocus={(e)  => (e.target.style.backgroundColor = "white")}
            onBlur={(e)   => (e.target.style.backgroundColor = "rgba(255,255,255,0.9)")}
          />
          <button type="submit" style={styles.searchBtn} aria-label="Tìm kiếm">
            <svg width="15" height="15" fill="none" stroke="#667eea" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </form>

        {/* Nav */}
        <nav style={styles.nav}>
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} style={styles.navLink}
              onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.target.style.transform = "translateY(0)";    e.target.style.opacity = "1"; }}
            >
              {label}
            </Link>
          ))}

          {isLoggedIn ? (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button onClick={() => setShowUserMenu((v) => !v)} style={styles.userBtn}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span>👤</span>
                <span>{username}</span>
                <span style={{ fontSize: "0.75rem", transform: showUserMenu ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>

              {showUserMenu && (
                <div style={styles.dropdown}>
                  {/* User info */}
                  <div style={styles.dropdownHeader}>
                    <div style={styles.avatar}>👤</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1a202c" }}>{username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#718096" }}>Thành viên</div>
                    </div>
                  </div>

                  {/* Links */}
                  <div style={{ padding: "0.4rem 0" }}>
                    {USER_MENU_ITEMS.map(({ to, label }) => (
                      <Link key={to} to={to} onClick={() => setShowUserMenu(false)} style={styles.dropdownItem}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f7fafc"; e.currentTarget.style.color = "#667eea"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent";  e.currentTarget.style.color = "#4a5568"; }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  {isAdmin && (
                      <Link to="/admin" onClick={() => setShowUserMenu(false)} style={{...styles.dropdownItem}}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f7fafc"; e.currentTarget.style.color = "#667eea"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent";  e.currentTarget.style.color = "#4a5568"; }}
                      >
                        Quản trị
                      </Link>
                  )}
                  {/* Logout */}
                  <div style={{ borderTop: "1px solid #e2e8f0", padding: "0.4rem" }}>
                    <button onClick={handleLogout} style={styles.logoutBtn}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fff5f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={styles.loginBtn}
              onMouseEnter={(e) => { e.target.style.backgroundColor = "white"; e.target.style.color = "#667eea"; e.target.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = "rgba(255,255,255,0.2)"; e.target.style.color = "white"; e.target.style.transform = "translateY(0)"; }}
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>

      <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </header>
  );
}

const styles = {
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "0.85rem 2rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    position: "sticky", top: 0, zIndex: 1000,
  },
  inner: {
    maxWidth: 1200, margin: "0 auto",
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "1.5rem",
  },
  logo: {
    fontSize: "1.4rem", fontWeight: 700, color: "white",
    textDecoration: "none", display: "flex", alignItems: "center",
    gap: "0.4rem", whiteSpace: "nowrap",
  },
  searchWrap: {
    flex: 1, maxWidth: 420, position: "relative",
  },
  searchInput: {
    width: "100%", padding: "0.65rem 2.6rem 0.65rem 1rem",
    borderRadius: 25, border: "none", outline: "none",
    fontSize: "0.9rem", backgroundColor: "rgba(255,255,255,0.9)",
    transition: "background-color 0.2s", boxSizing: "border-box",
    fontFamily: "inherit",
  },
  searchBtn: {
    position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", padding: 0,
  },
  nav: {
    display: "flex", alignItems: "center", gap: "1.5rem",
  },
  navLink: {
    color: "white", textDecoration: "none",
    fontSize: "0.95rem", fontWeight: 500,
    transition: "all 0.2s", whiteSpace: "nowrap",
  },
  userBtn: {
    display: "flex", alignItems: "center", gap: "0.4rem",
    padding: "0.55rem 1.1rem",
    backgroundColor: "rgba(255,255,255,0.2)",
    border: "2px solid white", borderRadius: 25,
    color: "white", fontSize: "0.9rem", fontWeight: 600,
    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
    fontFamily: "inherit",
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 0.5rem)", right: 0,
    backgroundColor: "white", borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    minWidth: 180, overflow: "hidden",
    animation: "slideDown 0.2s ease-out",
  },
  dropdownHeader: {
    padding: "0.9rem 1rem", borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc", display: "flex", alignItems: "center", gap: "0.75rem",
  },
  avatar: {
    width: 38, height: 38, borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.3rem",
  },
  dropdownItem: {
    display: "flex", alignItems: "center",
    padding: "0.65rem 1rem",
    color: "#4a5568", textDecoration: "none",
    fontSize: "0.9rem", transition: "all 0.15s",
  },
  logoutBtn: {
    width: "100%", textAlign: "left",
    padding: "0.65rem 1rem",
    backgroundColor: "transparent", border: "none",
    color: "#e53e3e", fontSize: "0.9rem", fontWeight: 500,
    cursor: "pointer", transition: "background 0.15s",
    borderRadius: 6, fontFamily: "inherit",
  },
  loginBtn: {
    color: "white", textDecoration: "none",
    fontSize: "0.9rem", fontWeight: 600,
    padding: "0.55rem 1.3rem",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20, border: "2px solid white",
    transition: "all 0.2s", whiteSpace: "nowrap",
  },
};