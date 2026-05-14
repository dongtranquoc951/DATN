import { Link, useLocation } from "react-router-dom";

export default function SidebarLearning() {
  const location = useLocation();

  const menuItems = [
    { path: "/learning", label: "Danh sách Level" },
    { path: "",          label: "Tiến độ" },
    { path: "",          label: "Thành tích" },
  ];

  const isActive = (path) => {
    if (path === "/learning") return location.pathname === "/learning";
    return location.pathname === path;
  };

  return (
    <aside className="w-[250px] border-r border-gray-200 py-6 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto shrink-0"
      style={{ background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)" }}>

      {/* Header */}
      <div className="px-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Học tập</h3>
        <p className="text-sm text-gray-400">Bắt đầu hành trình</p>
      </div>

      {/* Menu */}
      <nav>
        <ul className="list-none p-0 m-0">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <li key={`menu-${index}`} className="mb-1">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-3.5 no-underline text-sm font-medium transition-all
                    border-l-4
                    ${active
                      ? "text-indigo-500 bg-indigo-50 border-indigo-500"
                      : "text-gray-600 bg-transparent border-transparent hover:bg-gray-50 hover:pl-7"
                    }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="h-px bg-gray-200 mx-4 my-6"></div>

      {/* Progress Card */}
      <div className="mx-6 p-4 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <p className="text-xs opacity-90 mb-1">Level hiện tại</p>
        <p className="text-4xl font-bold">5</p>
        <div className="mt-3 bg-white/30 rounded-full h-2 overflow-hidden">
          <div className="bg-white h-full rounded-full w-[65%] transition-all"></div>
        </div>
        <p className="text-xs opacity-90 mt-1.5">65% hoàn thành</p>
      </div>
    </aside>
  );
}