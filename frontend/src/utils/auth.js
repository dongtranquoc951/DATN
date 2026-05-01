// src/utils/auth.js — phải như này, KHÔNG có hook nào
export const getTokenPayload = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export const isAdmin = () => getTokenPayload()?.role === 'admin';
export const isLoggedIn = () => getTokenPayload() !== null;