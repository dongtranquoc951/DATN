// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getTokenPayload } from "../utils/auth";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const payload = getTokenPayload();

  if (!payload) {
    // Chưa đăng nhập → về trang login
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && payload.role !== 'admin') {
    // Đã đăng nhập nhưng không phải admin → về trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
}