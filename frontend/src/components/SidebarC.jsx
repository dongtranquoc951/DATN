import { Link, useLocation } from "react-router-dom";

export default function SidebarCommunity() {
  const location = useLocation();

  const menuItems = [
    { path: "/community",         icon: "🗺️", label: "Danh sách Map" },
    { path: "/community/history", icon: "📜", label: "Lịch sử" },
  ];

  const isActive = (path) => {
    if (path === "/community") return location.pathname === "/community";
    return location.pathname === path;
  };

  return (
    <aside className="w-[250px] border-r border-gray-200 py-6 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto shrink-0"
      style={{ background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)" }}>

      {/* Header */}
      <div className="px-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Cộng đồng</h3>
        <p className="text-sm text-gray-400">Khám phá và chia sẻ</p>
      </div>

      {/* Menu */}
      <nav>
        <ul className="list-none p-0 m-0">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path} className="mb-1">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3.5 no-underline text-sm font-medium transition-all
                    border-l-4
                    ${active
                      ? "text-indigo-500 bg-indigo-50 border-indigo-500"
                      : "text-gray-600 bg-transparent border-transparent hover:bg-gray-50 hover:pl-7"
                    }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="h-px bg-gray-200 mx-4 my-6"></div>

      {/* Stats Card */}
      <div className="mx-6 p-4 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <p className="text-xs opacity-90 mb-1">Tổng Map đã chơi</p>
        <p className="text-4xl font-bold">42</p>
        <p className="text-xs opacity-80 mt-1.5">Tiếp tục phát huy!</p>
      </div>
    </aside>
  );
}