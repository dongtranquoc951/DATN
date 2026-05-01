import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

const getInitials = (name = "") =>
  name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const providerLabel = { local: "Email & Mật khẩu", google: "Google", github: "GitHub" };

const getAvatarUrl = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE_URL.replace("/api", "")}${url}`;

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    if (msg) { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }
  }, [msg]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "error" ? "#fff1f1" : "#f0fdf4",
      color: type === "error" ? "#991b1b" : "#166534",
      borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 500,
      boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
      border: `1px solid ${type === "error" ? "#fecaca" : "#bbf7d0"}`,
      animation: "toastIn 0.25s ease",
    }}>
      {type === "error" ? "❌ " : "✅ "}{msg}
      <style>{`@keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 72, uploading, onUpload }) {
  const ref = useRef(null);
  const [hov, setHov] = useState(false);
  const initials = getInitials(user?.full_name || user?.username || user?.email);

  return (
    <div
      style={{ position: "relative", width: size, height: size, cursor: onUpload ? "pointer" : "default", flexShrink: 0 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onUpload && ref.current?.click()}
    >
      {getAvatarUrl(user?.avatar_url)
        ? <img src={getAvatarUrl(user?.avatar_url)} alt="avatar"
            style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", display: "block" }} />
        : <div style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg,#7f77dd,#534ab7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.33, fontWeight: 700, color: "white",
            border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            {initials}
          </div>
      }
      {onUpload && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hov || uploading ? 1 : 0, transition: "opacity 0.15s", fontSize: 18,
        }}>
          {uploading ? "⏳" : "📷"}
        </div>
      )}
      {onUpload && <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />}
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon, value, label, bg, color }) {
  return (
    <span style={{ fontSize: 11, padding: "5px 12px", borderRadius: 99, fontWeight: 500, background: bg, color, display: "flex", alignItems: "center", gap: 5 }}>
      {icon} <b>{value}</b> {label}
    </span>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", readOnly, suffix }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: "#8888aa", marginBottom: 5, fontWeight: 500 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value ?? ""} onChange={e => onChange?.(e.target.value)} readOnly={readOnly}
          style={{
            width: "100%", padding: "9px 12px", paddingRight: suffix ? 40 : 12,
            borderRadius: 10, fontSize: 13,
            border: readOnly ? "0.5px solid #f1f5f9" : "0.5px solid #e2e8f0",
            background: readOnly ? "#f8fafc" : "white",
            color: readOnly ? "#a0a0c0" : "#1a1a2e",
            outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
            fontFamily: "inherit",
          }}
          onFocus={e => !readOnly && (e.target.style.borderColor = "#7f77dd")}
          onBlur={e  => !readOnly && (e.target.style.borderColor = "#e2e8f0")}
        />
        {suffix && (
          <button onClick={suffix.onClick} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#a0a0c0", padding: 0 }}>
            {suffix.icon}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "0.5px solid #e8eaf0", overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "14px 18px", borderBottom: "0.5px solid #f0f0f8" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e" }}>{title}</span>
        </div>
      )}
      <div style={{ padding: "18px 18px" }}>{children}</div>
    </div>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, loading, variant = "primary", disabled }) {
  const styles = {
    primary: { background: "#7f77dd", color: "white", border: "none" },
    danger:  { background: "#ef4444", color: "white", border: "none" },
    ghost:   { background: "white", color: "#534ab7", border: "0.5px solid #cecbf6" },
  };
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{
        ...styles[variant], padding: "7px 18px", borderRadius: 99,
        fontSize: 12, fontWeight: 500, cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: loading || disabled ? 0.6 : 1, transition: "opacity 0.15s", fontFamily: "inherit",
      }}
      onMouseEnter={e => !loading && !disabled && (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={e => !loading && !disabled && (e.currentTarget.style.opacity = "1")}>
      {loading ? "⏳ Đang lưu..." : children}
    </button>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
function PwStrength({ pw }) {
  if (!pw) return null;
  const strong = pw.length >= 10 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
  const medium = pw.length >= 6;
  const label  = strong ? "Mạnh" : medium ? "Trung bình" : "Yếu";
  const color  = strong ? "#1D9E75" : medium ? "#ba7517" : "#e24b4a";
  const width  = strong ? "100%" : medium ? "60%" : "25%";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ height: "100%", width, background: color, borderRadius: 99, transition: "width 0.3s,background 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color }}>{label}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");

  const [user, setUser]           = useState(null);
  const [progress, setProgress]   = useState([]);
  const [allLevels, setAllLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab]             = useState("info");
  const [uploading, setUploading] = useState(false);

  const [infoForm, setInfoForm]   = useState({ full_name: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  const [pwForm, setPwForm]   = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw]   = useState({ current: false, newPw: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const flash = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [userRes, progressRes, levelsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/me`,           { headers }),
        fetch(`${API_BASE_URL}/learning/progress`, { headers }),
        fetch(`${API_BASE_URL}/learning/levels`),
      ]);
      if (!userRes.ok) { localStorage.removeItem("token"); navigate("/login"); return; }
      const userData     = await userRes.json();
      const progressData = progressRes.ok ? await progressRes.json() : { progress: [] };
      const levelsData   = levelsRes.ok  ? await levelsRes.json()   : { levels: [] };
      setUser(userData.user || userData);
      setInfoForm({ full_name: userData.user?.full_name || userData.full_name || "" });
      setProgress(progressData.progress || []);
      setAllLevels(levelsData.levels || []);
    } catch {
      flash("Không thể tải thông tin tài khoản", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const completedList = progress.filter(p => p.is_completed);
  const totalStars    = progress.reduce((s, p) => s + (p.stars || 0), 0);
  const totalAttempts = progress.reduce((s, p) => s + (p.attempts || 0), 0);
  const maxStars      = allLevels.length * 3;

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: infoForm.full_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật");
      setUser(prev => ({ ...prev, full_name: infoForm.full_name }));
      flash("Cập nhật thông tin thành công!");
    } catch (err) {
      flash(err.message, "error");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi upload");
      setUser(prev => ({ ...prev, avatar_url: data.avatar_url }));
      flash("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      flash(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current)                { flash("Nhập mật khẩu hiện tại", "error"); return; }
    if (pwForm.newPw.length < 6)        { flash("Mật khẩu mới tối thiểu 6 ký tự", "error"); return; }
    if (pwForm.newPw !== pwForm.confirm) { flash("Mật khẩu xác nhận không khớp", "error"); return; }
    setSavingPw(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đổi mật khẩu thất bại");
      setPwForm({ current: "", newPw: "", confirm: "" });
      flash("Đổi mật khẩu thành công!");
    } catch (err) {
      flash(err.message, "error");
    } finally {
      setSavingPw(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", animation: "spin 1.5s linear infinite" }}>⚙️</div>
          <p style={{ color: "#8888aa", marginTop: 10, fontSize: 13 }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const isLocalAuth = (user?.auth_provider || "local") === "local";
  const TABS = [
    { key: "info",     label: "Thông tin" },
    { key: "password", label: "Mật khẩu", hidden: !isLocalAuth },
  ].filter(t => !t.hidden);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", paddingBottom: "3rem" }}>
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: "", type: "success" })} />

      {/* Header */}
      <div style={{ background: "white", borderBottom: "0.5px solid #e8eaf0", padding: "18px 24px", marginBottom: 20 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar user={user} size={52} uploading={uploading} onUpload={handleAvatarUpload} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#1a1a2e" }}>
                  {user?.full_name || user?.username || "Người dùng"}
                  {user?.role === "admin" && (
                    <span style={{ marginLeft: 8, fontSize: 10, background: "#eeedfe", color: "#534ab7", borderRadius: 99, padding: "2px 8px", fontWeight: 500 }}>👑 Admin</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#8888aa", marginTop: 2 }}>
                  {user?.email} · Tham gia {formatDate(user?.created_at)}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              style={{ padding: "7px 16px", background: "#f0f0f8", color: "#534ab7", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Quay lại
            </button>
          </div>

          {/* Stat chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatChip icon="🏆" value={completedList.length} label="hoàn thành" bg="#e1f5ee" color="#0f6e56" />
            <StatChip icon="⭐" value={`${totalStars}/${maxStars}`} label="sao" bg="#faeeda" color="#854f0b" />
            <StatChip icon="🔄" value={totalAttempts} label="lần thử" bg="#eeedfe" color="#534ab7" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "6px 16px", borderRadius: 99, border: "none",
                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: tab === t.key ? "#7f77dd" : "#f0f0f8",
                color:      tab === t.key ? "white"   : "#8888aa",
                transition: "background 0.15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Thông tin */}
        {tab === "info" && (
          <SectionCard title="Thông tin tài khoản">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <Field label="Họ và tên" value={infoForm.full_name} onChange={v => setInfoForm(p => ({ ...p, full_name: v }))} />
              <Field label="Username"  value={user?.username}     readOnly />
              <Field label="Email"     value={user?.email}        readOnly />
              <Field label="Đăng nhập qua" value={providerLabel[user?.auth_provider || "local"]} readOnly />
              <Field label="Ngày tham gia" value={formatDate(user?.created_at)} readOnly />
              <Field label="Trạng thái"    value={user?.is_active ? "Đang hoạt động" : "Bị khóa"} readOnly />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <Btn onClick={handleSaveInfo} loading={savingInfo}>💾 Lưu thay đổi</Btn>
            </div>
          </SectionCard>
        )}

        {/* Tab: Mật khẩu */}
        {tab === "password" && (
          <SectionCard title="Đổi mật khẩu">
            {!isLocalAuth ? (
              <p style={{ color: "#a0a0c0", fontSize: 13 }}>
                Tài khoản đăng nhập qua {providerLabel[user?.auth_provider]} không thể đổi mật khẩu tại đây.
              </p>
            ) : (
              <>
                <Field label="Mật khẩu hiện tại" type={showPw.current ? "text" : "password"} value={pwForm.current}
                  onChange={v => setPwForm(p => ({ ...p, current: v }))}
                  suffix={{ icon: showPw.current ? "🙈" : "👁️", onClick: () => setShowPw(p => ({ ...p, current: !p.current })) }} />
                <Field label="Mật khẩu mới" type={showPw.newPw ? "text" : "password"} value={pwForm.newPw}
                  onChange={v => setPwForm(p => ({ ...p, newPw: v }))}
                  suffix={{ icon: showPw.newPw ? "🙈" : "👁️", onClick: () => setShowPw(p => ({ ...p, newPw: !p.newPw })) }} />
                <PwStrength pw={pwForm.newPw} />
                <Field label="Xác nhận mật khẩu mới" type={showPw.confirm ? "text" : "password"} value={pwForm.confirm}
                  onChange={v => setPwForm(p => ({ ...p, confirm: v }))}
                  suffix={{ icon: showPw.confirm ? "🙈" : "👁️", onClick: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) }} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                  <Btn onClick={handleChangePassword} loading={savingPw}>🔒 Đổi mật khẩu</Btn>
                </div>
              </>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}