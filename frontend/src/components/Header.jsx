import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTokenPayload } from "../utils/auth";

const NAV_LINKS = [
  { to: "/learning",  label: "Học tập" },
  { to: "/community", label: "Cộng đồng" },
];

const USER_MENU_ITEMS = [
  { to: "/profile",  label: "Thông tin tài khoản" },
  { to: "/mymap",    label: "Màn chơi của tôi" },
  { to: "/settings", label: "Cài đặt" },
];

export default function Header() {
  const [isAdmin, setIsAdmin]           = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [username, setUsername]         = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("username");
    if (token && user) {
      setIsLoggedIn(true);
      setUsername(user);
      const payload = getTokenPayload();
      if (payload?.role === "admin") setIsAdmin(true);
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

  const handleLogout = () => {
    ["token", "username", "userId"].forEach((k) => localStorage.removeItem(k));
    setIsLoggedIn(false);
    setUsername("");
    setIsAdmin(false);
    setShowUserMenu(false);
    navigate("/");
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim())
      navigate(`/community?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} } .dropdown-anim{animation:slideDown 0.2s ease-out}`}</style>

      <header className="sticky top-0 z-50 shadow-md" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">

          {/* Logo — bên trái */}
          <Link to="/" className="flex items-center gap-1.5 text-white font-bold text-xl whitespace-nowrap no-underline shrink-0">
            <span className="text-3xl">🎮</span>
            CodeQuest
          </Link>

          {/* Search — giữa */}
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm màn chơi, map..."
              className="w-full py-2 pl-4 pr-10 rounded-full border-none outline-none text-sm bg-white/90 focus:bg-white transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center" aria-label="Tìm kiếm">
              <svg width="15" height="15" fill="none" stroke="#667eea" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          {/* Nav — bên phải */}
          <nav className="flex items-center gap-5 shrink-0">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to} to={to}
                className="text-white no-underline text-sm font-medium hover:-translate-y-0.5 hover:opacity-85 transition-all"
              >
                {label}
              </Link>
            ))}

            {isLoggedIn ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/20 border-2 border-white rounded-full text-white text-sm font-semibold cursor-pointer whitespace-nowrap hover:bg-white/30 hover:-translate-y-0.5 transition-all"
                >
                  <span>{username}</span>
                  <span className={`text-xs transition-transform duration-200 ${showUserMenu ? "rotate-180" : "rotate-0"}`}>▼</span>
                </button>

                {showUserMenu && (
                  <div className="dropdown-anim absolute top-[calc(100%+0.5rem)] right-0 bg-white rounded-xl shadow-xl min-w-[180px] overflow-hidden">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{username}</div>
                        <div className="text-xs text-gray-400">Thành viên</div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {USER_MENU_ITEMS.map(({ to, label }) => (
                        <Link
                          key={to} to={to}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-600 no-underline hover:bg-gray-50 hover:text-indigo-500 transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-600 no-underline hover:bg-gray-50 hover:text-indigo-500 transition-colors"
                        >
                          Quản trị
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium bg-transparent border-none cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-white no-underline text-sm font-semibold px-5 py-2 bg-white/20 border-2 border-white rounded-full whitespace-nowrap hover:bg-white hover:text-indigo-500 hover:-translate-y-0.5 transition-all"
              >
                Đăng nhập
              </Link>
            )}
          </nav>

        </div>
      </header>
    </>
  );
}