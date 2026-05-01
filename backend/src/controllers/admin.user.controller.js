// src/controllers/admin.user.controller.js
const db = require("../config/database");

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// Query: search, filter (all|active|banned|admin), page, limit
// ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { search = "", filter = "all", page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    if (filter === "active") conditions.push(`u.is_active = TRUE`);
    if (filter === "banned") conditions.push(`u.is_active = FALSE`);
    if (filter === "admin")  conditions.push(`u.role = 'admin'`);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Đếm tổng để phân trang
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      params
    );

    // Lấy danh sách + số màn chơi đã tạo
    const [users] = await db.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.full_name,
         u.avatar_url,
         u.role,
         u.auth_provider,
         u.is_active,
         u.created_at,
         COUNT(cm.id) AS maps_count
       FROM users u
       LEFT JOIN community_maps cm ON cm.created_by = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAllUsers:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/stats
// Thống kê tổng quan
// ─────────────────────────────────────────────────────────────
const getUserStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
         COUNT(*)                                      AS total_users,
         SUM(is_active = TRUE)                         AS active_users,
         SUM(is_active = FALSE)                        AS banned_users,
         SUM(role = 'admin')                           AS admin_users,
         SUM(auth_provider = 'google')                 AS google_users,
         SUM(auth_provider = 'github')                 AS github_users,
         SUM(auth_provider = 'local')                  AS local_users,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))  AS new_this_week,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS new_this_month
       FROM users`
    );

    const [[{ total_maps }]] = await db.query(
      `SELECT COUNT(*) AS total_maps FROM community_maps`
    );

    res.json({
      success: true,
      data: { ...stats, total_maps },
    });
  } catch (error) {
    console.error("getUserStats:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// Chi tiết user + danh sách màn chơi đã tạo
// ─────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[user]] = await db.query(
      `SELECT
         id, username, email, full_name, avatar_url,
         role, auth_provider, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Màn chơi đã tạo
    const [maps] = await db.query(
      `SELECT
         id, map_code, title, description,
         is_published, play_count, average_rating, total_ratings, created_at
       FROM community_maps
       WHERE created_by = ?
       ORDER BY created_at DESC`,
      [id]
    );

    // Tiến độ học tập
    const [learningProgress] = await db.query(
      `SELECT
         lp.level_id,
         ll.title      AS level_title,
         ll.level_number,
         lp.is_completed,
         lp.stars,
         lp.attempts,
         lp.best_steps,
         lp.best_time,
         lp.completed_at
       FROM learning_progress lp
       JOIN learning_levels ll ON ll.id = lp.level_id
       WHERE lp.user_id = ?
       ORDER BY ll.level_number`,
      [id]
    );

    res.json({
      success: true,
      data: { ...user, maps, learning_progress: learningProgress },
    });
  } catch (error) {
    console.error("getUserById:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/ban
// ─────────────────────────────────────────────────────────────
const banUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [[user]] = await db.query(
      `SELECT id, username, role, is_active FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Không thể ban tài khoản admin" });
    }
    if (!user.is_active) {
      return res.status(400).json({ success: false, message: "Tài khoản đã bị ban rồi" });
    }

    await db.query(`UPDATE users SET is_active = FALSE WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Đã ban tài khoản "${user.username}"`,
    });
  } catch (error) {
    console.error("banUser:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/unban
// ─────────────────────────────────────────────────────────────
const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [[user]] = await db.query(
      `SELECT id, username, is_active FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (user.is_active) {
      return res.status(400).json({ success: false, message: "Tài khoản đang hoạt động bình thường" });
    }

    await db.query(`UPDATE users SET is_active = TRUE WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Đã mở khóa tài khoản "${user.username}"`,
    });
  } catch (error) {
    console.error("unbanUser:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/role
// Body: { role: "user" | "admin" }
// ─────────────────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role không hợp lệ" });
    }

    const [[user]] = await db.query(
      `SELECT id, username FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    await db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

    res.json({
      success: true,
      message: `Đã cập nhật role "${user.username}" thành ${role}`,
    });
  } catch (error) {
    console.error("updateUserRole:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Xóa tài khoản (cascade xóa progress, maps, ratings)
// ─────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [[user]] = await db.query(
      `SELECT id, username, role FROM users WHERE id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Không thể xóa tài khoản admin" });
    }

    // ON DELETE CASCADE trong DB sẽ tự xóa các bảng liên quan
    await db.query(`DELETE FROM users WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Đã xóa tài khoản "${user.username}"`,
    });
  } catch (error) {
    console.error("deleteUser:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  getAllUsers,
  getUserStats,
  getUserById,
  banUser,
  unbanUser,
  updateUserRole,
  deleteUser,
};