export default function Footer() {
  return (
    <footer className="mt-auto" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center gap-3">

        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-bold text-2xl">
          <span>🎮</span>
          CodeQuest
        </div>

        {/* Copyright */}
        <p className="text-white/90 text-sm">
          © 2026 CodeQuest. Made with ❤️ for learners
        </p>
      </div>
    </footer>
  );
}