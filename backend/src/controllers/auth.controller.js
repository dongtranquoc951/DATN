const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh'));
  },
});

exports.uploadMiddleware = upload.single('avatar');

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    const [existingUsernames] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsernames.length > 0) {
      return res.status(400).json({ error: 'Username đã được sử dụng' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, full_name || null]
    );
    
    const userId = result.insertId;
    
// authController.js
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role }, // ← role phải có ở đây
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: userId, username, email, role: 'user' }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    const [users] = await db.query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    const user = users[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Tài khoản đã bị khóa' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy thông tin user hiện tại
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await db.query(
      'SELECT id, username, email, full_name, avatar_url, role, created_at, is_active FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }
    
    res.json({ user: users[0] });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Cập nhật thông tin profile (chỉ full_name)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name } = req.body;

    await db.query(
      'UPDATE users SET full_name = ? WHERE id = ?',
      [full_name || null, userId]
    );

    const [users] = await db.query(
      'SELECT id, username, email, full_name, avatar_url, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Cập nhật thành công', user: users[0] });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được upload' });
    }

    const userId = req.user.userId;
    
    // Xóa avatar cũ nếu có
    const [users] = await db.query('SELECT avatar_url FROM users WHERE id = ?', [userId]);
    const oldAvatar = users[0]?.avatar_url;
    if (oldAvatar && oldAvatar.startsWith('/uploads/') && fs.existsSync(`.${oldAvatar}`)) {
      fs.unlinkSync(`.${oldAvatar}`);
    }

    const avatar_url = `/uploads/avatars/${req.file.filename}`;

    await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, userId]);

    res.json({ message: 'Upload avatar thành công', avatar_url });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }

    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User không tồn tại' });
    }

    const isValid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    res.json({ message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};