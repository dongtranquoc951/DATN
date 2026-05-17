import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getTokenPayload } from "../utils/auth";

const API_BASE_URL = "http://localhost:5000/api";

export default function SidebarCommunity() {
  const location = useLocation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const currentUserId = getTokenPayload()?.userId || getTokenPayload()?.id;

  const menuItems = [
    { path: "/community", icon: "🗺️", label: "Danh sách Map" },
    { path: "/community/history", icon: "📜", label: "Lịch sử" },
  ];

  const isActive = (path) => {
    if (path === "/community") return location.pathname === "/community";
    return location.pathname === path;
  };

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/community/leaderboard?limit=5`);
        if (!res.ok) throw new Error("Không thể tải bảng xếp hạng");

        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error(error);
        setLeaderboard([]);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <aside
      className="w-[250px] border-r border-gray-200 py-6 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto shrink-0"
      style={{ background: "linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)" }}
    >
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
                    ${
                      active
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

      {/* Leaderboard Card */}
      <div className="mx-6 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Bảng xếp hạng</p>
            <p className="text-xs text-gray-400">Map đã hoàn thành</p>
          </div>
          <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
            Top 5
          </span>
        </div>

        {isLoadingLeaderboard ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-8 rounded-lg bg-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-xs text-gray-400 leading-5">
            Chưa có người chơi nào hoàn thành map.
          </p>
        ) : (
          <div className="space-y-2.5">
            {leaderboard.map((player, index) => {
              const isCurrentUser = Number(player.id) === Number(currentUserId);
              const displayName = player.full_name || player.username;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${
                    isCurrentUser ? "bg-indigo-50" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                        index < 3
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[105px]">
                      {isCurrentUser ? "Bạn" : displayName}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 shrink-0">
                    {player.completed_maps} map
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
