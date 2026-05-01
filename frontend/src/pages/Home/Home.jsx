import { Link } from "react-router-dom";
import {
  PlayerSprite,
  TargetSprite,
  ObstacleSprite,
} from "@shared/engine/GridHelper";

const features = [
  {
    icon: "🚀",
    title: "Học từ cơ bản",
    desc: "Lộ trình từ biến, vòng lặp đến thuật toán tìm đường — mỗi khái niệm là một màn chơi.",
    bg: "bg-teal-50",
  },
  {
    icon: "⚡",
    title: "Phản hồi tức thì",
    desc: "Viết code, chạy thử, thấy nhân vật di chuyển ngay. Lỗi hiện ra rõ ràng, không cần đoán mò.",
    bg: "bg-purple-50",
  },
  {
    icon: "🏆",
    title: "Hệ thống thành tích",
    desc: "Hoàn thành màn chơi, phá kỷ lục, leo hạng. Động lực học tập không bao giờ cạn.",
    bg: "bg-amber-50",
  },
  {
    icon: "🌍",
    title: "Cộng đồng sáng tạo",
    desc: "Tự thiết kế màn chơi, chia sẻ với cộng đồng và thử thách bạn bè.",
    bg: "bg-red-50",
  },
];

const levels = [
  { label: "Nhập môn", name: "Biến & điều kiện", count: 24, progress: 80, color: "text-teal-700 bg-teal-100", bar: "bg-teal-500" },
  { label: "Cơ bản", name: "Vòng lặp & mảng", count: 36, progress: 35, color: "text-purple-700 bg-purple-100", bar: "bg-purple-500" },
  { label: "Trung cấp", name: "Đệ quy & ngăn xếp", count: 28, progress: 10, color: "text-amber-700 bg-amber-100", bar: "bg-amber-500" },
  { label: "Nâng cao", name: "Đồ thị & BFS/DFS", count: 42, progress: 0, color: "text-red-700 bg-red-100", bar: "bg-red-500" },
];


const MAZE = [
  ["start","path","path","wall","wall","path","path","wall"],
  ["wall","wall","path","wall","wall","path","wall","wall"],
  ["wall","path","path","path","path","path","wall","wall"],
  ["wall","path","wall","path","wall","path","wall","wall"],
  ["path","path","path","wall","path","path","end","wall"],
];

const CELL_SIZE = 28; // px — sprite sẽ scale theo

const MazeCell = ({ type }) => {
  const base = "h-7 rounded flex items-center justify-center overflow-hidden";
  if (type === "start")
    return (
      <div className={`${base} bg-violet-400/60`}>
        <PlayerSprite size={CELL_SIZE} animated={false} />
      </div>
    );
  if (type === "end")
    return (
      <div className={`${base} bg-fuchsia-400/60`}>
        <TargetSprite size={CELL_SIZE} animated={false} />
      </div>
    );
  if (type === "wall")
    return (
      <div className={`${base} bg-white/20`}>
        <ObstacleSprite size={CELL_SIZE} />
      </div>
    );
  return <div className={`${base} bg-white/6`} />;
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3b2a6e] to-[#5b3fa0] px-6 py-16 text-center relative overflow-hidden">
        {/* subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-medium text-white leading-tight mb-4">
            Học lập trình<br />
            <span className="text-violet-300">qua trò chơi</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
            Viết code để điều khiển nhân vật vượt qua các màn chơi. Học thuật toán, tư duy lập trình một cách tự nhiên và thú vị.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/learning">
              <button className="bg-violet-300 text-violet-900 font-medium px-7 py-3 rounded-lg text-sm hover:bg-violet-200 transition-colors flex items-center gap-2">
                ▶ Chơi ngay — miễn phí
              </button>
            </Link>
            <button className="bg-white/10 text-white border border-white/25 font-medium px-7 py-3 rounded-lg text-sm hover:bg-white/18 transition-colors">
              Xem demo
            </button>
          </div>

          {/* Game preview */}
          <div className="mt-12 bg-black/35 border border-white/15 rounded-xl p-4 text-left max-w-lg mx-auto">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-white/40 text-xs ml-2 font-mono">level_03.js — Mê cung</span>
            </div>
            <div className="grid gap-0.5 mb-3"
                style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
              {MAZE.flat().map((type, i) => (
                <MazeCell key={i} type={type} />
              ))}
            </div>
            <div className="font-mono text-xs text-white/65 leading-relaxed">
              <span className="text-purple-300">function</span>{" "}
              <span className="text-teal-300">solve</span>(maze) {"{"}
              <br />
              &nbsp;&nbsp;<span className="text-purple-300">return</span> bfs(maze.start, maze.end);
              <br />
              {"}"}{" "}
              <span className="text-white/30">// ✓ Tìm được đường ngắn nhất!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium text-gray-900 text-center mb-2">Tại sao CodeQuest?</h2>
          <p className="text-gray-500 text-center text-sm mb-10 leading-relaxed">
            Không phải video dài dòng, không phải bài tập buồn chán — chỉ là code và kết quả ngay tức thì.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map(({ icon, title, desc, bg }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center text-base mb-3`}>{icon}</div>
                <h3 className="font-medium text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium text-gray-900 text-center mb-2">Lộ trình học tập</h2>
          <p className="text-gray-500 text-center text-sm mb-10 leading-relaxed">
            Từ "Hello World" đến thuật toán nâng cao — theo đúng tốc độ của bạn.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {levels.map(({ label, name, count, progress, color, bar }) => (
              <div key={name} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color} inline-block mb-2`}>{label}</span>
                <p className="font-medium text-gray-900 text-sm mb-0.5">{name}</p>
                <p className="text-xs text-gray-400 mb-2">{count} màn chơi</p>
                <div className="h-1 bg-gray-200 rounded-full">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}