import { useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Tên người dùng không được để trống";
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên người dùng phải có ít nhất 3 ký tự";
    } else if (formData.username.length > 20) {
      newErrors.username = "Tên người dùng không được quá 20 ký tự";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Tên người dùng chỉ được chứa chữ, số và dấu gạch dưới";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = "Mật khẩu phải có cả chữ hoa và chữ thường";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Mật khẩu phải có ít nhất 1 số";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng ký thất bại");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/learning";
    } catch (err) {
      setErrors({ submit: err.message || "Đăng ký thất bại. Vui lòng thử lại!" });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none transition-colors ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-gray-200 focus:border-indigo-500"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Đăng ký tài khoản</h2>
          <p className="text-gray-500">Tạo tài khoản để bắt đầu học lập trình!</p>
        </div>

        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Tên người dùng
            </label>
            <input
              type="text"
              name="username"
              placeholder="username"
              value={formData.username}
              onChange={handleChange}
              className={inputClass("username")}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={inputClass("password")}
            />
            {errors.password ? (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            ) : (
              <p className="text-gray-400 text-xs mt-1">
                Ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={inputClass("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              ⚠️ {errors.submit}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-base font-semibold text-white transition-all
              ${isLoading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 shadow-md hover:shadow-lg shadow-indigo-200"
              }`}
          >
            {isLoading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </div>

        {/* Login link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <span
            onClick={() => (window.location.href = "/login")}
            className="text-indigo-500 font-semibold cursor-pointer hover:underline"
          >
            Đăng nhập ngay
          </span>
        </p>
      </div>
    </div>
  );
}