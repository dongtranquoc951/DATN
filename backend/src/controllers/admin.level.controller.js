// src/controllers/admin.level.controller.js
const db = require("../config/database");

// ─────────────────────────────────────────────────────────────
// GET /api/admin/levels
// Query: search, filter (all|published|draft), page, limit
// ─────────────────────────────────────────────────────────────
const getAllLevels = async (req, res) => {
  try {
    const { search = "", filter = "all", page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(title LIKE ? OR description LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like);
    }

    if (filter === "published") conditions.push(`is_published = TRUE`);
    if (filter === "draft")     conditions.push(`is_published = FALSE`);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM learning_levels ${where}`,
      params
    );

    const [levels] = await db.query(
      `SELECT
         ll.id,
         ll.level_number,
         ll.title,
         ll.description,
         ll.grid_data,
         ll.initial_code,
         ll.is_published,
         ll.created_at,
         ll.updated_at,
         COUNT(lp.id)                        AS total_attempts,
         SUM(lp.is_completed = TRUE)         AS total_completions,
         ROUND(AVG(lp.stars), 1)             AS avg_stars,
         ROUND(AVG(lp.best_steps), 0)        AS avg_steps
       FROM learning_levels ll
       LEFT JOIN learning_progress lp ON lp.level_id = ll.id
       ${where}
       GROUP BY ll.id
       ORDER BY ll.level_number ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: levels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAllLevels:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/levels/stats
// ─────────────────────────────────────────────────────────────
const getLevelStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
         COUNT(*)                         AS total_levels,
         SUM(is_published = TRUE)         AS published_levels,
         SUM(is_published = FALSE)        AS draft_levels,
         (SELECT COUNT(*) FROM learning_progress)               AS total_attempts,
         (SELECT COUNT(*) FROM learning_progress WHERE is_completed = TRUE) AS total_completions
       FROM learning_levels`
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("getLevelStats:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/levels/:id
// Chi tiết level + top người chơi
// ─────────────────────────────────────────────────────────────
const getLevelById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[level]] = await db.query(
      `SELECT * FROM learning_levels WHERE id = ?`, [id]
    );

    if (!level) {
      return res.status(404).json({ success: false, message: "Không tìm thấy level" });
    }

    // Top 5 người chơi tốt nhất
    const [topPlayers] = await db.query(
      `SELECT
         u.id, u.username, u.full_name, u.avatar_url,
         lp.stars, lp.best_steps, lp.best_time, lp.attempts, lp.completed_at
       FROM learning_progress lp
       JOIN users u ON u.id = lp.user_id
       WHERE lp.level_id = ? AND lp.is_completed = TRUE
       ORDER BY lp.stars DESC, lp.best_steps ASC, lp.best_time ASC
       LIMIT 5`,
      [id]
    );

    // Thống kê level
    const [[levelStats]] = await db.query(
      `SELECT
         COUNT(*)                        AS total_attempts,
         SUM(is_completed = TRUE)        AS completions,
         ROUND(AVG(stars), 1)            AS avg_stars,
         ROUND(AVG(best_steps), 0)       AS avg_steps,
         MIN(best_steps)                 AS min_steps,
         ROUND(AVG(best_time), 0)        AS avg_time
       FROM learning_progress
       WHERE level_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: { ...level, top_players: topPlayers, stats: levelStats },
    });
  } catch (error) {
    console.error("getLevelById:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/admin/levels
// Tạo level mới
// ─────────────────────────────────────────────────────────────
const createLevel = async (req, res) => {
  try {
    const { level_number, title, description, grid_data, initial_code, is_published = true } = req.body;

    if (!level_number || !title || !grid_data) {
      return res.status(400).json({ success: false, message: "level_number, title, grid_data là bắt buộc" });
    }

    const [[existing]] = await db.query(
      `SELECT id FROM learning_levels WHERE level_number = ?`, [level_number]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: `Level ${level_number} đã tồn tại` });
    }

    const [result] = await db.query(
      `INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [level_number, title, description || null, JSON.stringify(grid_data), initial_code || null, is_published]
    );

    res.status(201).json({
      success: true,
      message: `Đã tạo level "${title}"`,
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("createLevel:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/levels/:id
// Cập nhật level
// ─────────────────────────────────────────────────────────────
const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, grid_data, initial_code, is_published, level_number } = req.body;

    const [[level]] = await db.query(
      `SELECT id, title FROM learning_levels WHERE id = ?`, [id]
    );
    if (!level) {
      return res.status(404).json({ success: false, message: "Không tìm thấy level" });
    }

    await db.query(
      `UPDATE learning_levels
       SET title = ?, description = ?, grid_data = ?, initial_code = ?,
           is_published = ?, level_number = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title ?? level.title,
        description ?? null,
        grid_data ? JSON.stringify(grid_data) : undefined,
        initial_code ?? null,
        is_published ?? true,
        level_number,
        id,
      ]
    );

    res.json({ success: true, message: `Đã cập nhật level "${title}"` });
  } catch (error) {
    console.error("updateLevel:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/levels/:id/publish
// Toggle xuất bản
// ─────────────────────────────────────────────────────────────
const togglePublishLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    if (typeof is_published !== "boolean") {
      return res.status(400).json({ success: false, message: "is_published phải là boolean" });
    }

    const [[level]] = await db.query(
      `SELECT id, title FROM learning_levels WHERE id = ?`, [id]
    );
    if (!level) {
      return res.status(404).json({ success: false, message: "Không tìm thấy level" });
    }

    await db.query(
      `UPDATE learning_levels SET is_published = ? WHERE id = ?`, [is_published, id]
    );

    res.json({
      success: true,
      message: `Đã ${is_published ? "xuất bản" : "ẩn"} level "${level.title}"`,
    });
  } catch (error) {
    console.error("togglePublishLevel:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/levels/:id
// Xóa level (cascade xóa learning_progress)
// ─────────────────────────────────────────────────────────────
const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    const [[level]] = await db.query(
      `SELECT id, title FROM learning_levels WHERE id = ?`, [id]
    );
    if (!level) {
      return res.status(404).json({ success: false, message: "Không tìm thấy level" });
    }

    await db.query(`DELETE FROM learning_levels WHERE id = ?`, [id]);

    res.json({ success: true, message: `Đã xóa level "${level.title}"` });
  } catch (error) {
    console.error("deleteLevel:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  getAllLevels,
  getLevelStats,
  getLevelById,
  createLevel,
  updateLevel,
  togglePublishLevel,
  deleteLevel,
};