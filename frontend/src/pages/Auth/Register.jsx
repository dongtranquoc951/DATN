import { useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";
export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      // Lưu token và user info vào localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      window.location.href = '/learning';
      
    } catch (err) {
      setErrors({
        submit: err.message || "Đăng ký thất bại. Vui lòng thử lại!"
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '2.5rem',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#1a202c', 
            marginBottom: '0.5rem' 
          }}>
            Đăng ký tài khoản
          </h2>
          <p style={{ color: '#718096', fontSize: '1rem' }}>
            Tạo tài khoản để bắt đầu học lập trình!
          </p>
        </div>

        <div>
          {/* Username */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              color: '#4a5568', 
              marginBottom: '0.5rem' 
            }}>
              Tên người dùng
            </label>
            <input
              type="text"
              name="username"
              placeholder="johndoe123"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${errors.username ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {errors.username && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              color: '#4a5568', 
              marginBottom: '0.5rem' 
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              color: '#4a5568', 
              marginBottom: '0.5rem' 
            }}>
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                {errors.password}
              </p>
            )}
            <p style={{ color: '#718096', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
              Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.9375rem', 
              fontWeight: '600', 
              color: '#4a5568', 
              marginBottom: '0.5rem' 
            }}>
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: `2px solid ${errors.confirmPassword ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {errors.confirmPassword && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.375rem' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '0.875rem 1rem',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              marginBottom: '1.25rem',
              border: '1px solid #fecaca'
            }}>
              ⚠️ {errors.submit}
            </div>
          )}

          {/* Register Button */}
          <button
            onClick={handleRegister}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '10px',
              fontSize: '1.0625rem',
              fontWeight: '600',
              color: 'white',
              backgroundColor: isLoading ? '#a5b4fc' : '#6366f1',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {isLoading ? "⏳ Đang đăng ký..." : "Đăng ký"}
          </button>
        </div>

        {/* Login Link */}
        <div style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          fontSize: '0.9375rem' 
        }}>
          <span style={{ color: '#718096' }}>Đã có tài khoản? </span>
          <span
            onClick={() => window.location.href = '/login'}
            style={{ 
              color: '#6366f1', 
              fontWeight: '600', 
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            Đăng nhập ngay
          </span>
        </div>
      </div>
    </div>
  );
}