// src/controllers/admin.map.controller.js
const db = require("../config/database");

// ─────────────────────────────────────────────────────────────
// GET /api/admin/maps
// Query: search, filter (all|published|draft), page, limit
// ─────────────────────────────────────────────────────────────
const getAllMaps = async (req, res) => {
  try {
    const { search = "", filter = "all", page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(cm.title LIKE ? OR cm.map_code LIKE ? OR u.username LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    if (filter === "published") conditions.push(`cm.is_published = TRUE AND (cm.status IS NULL OR cm.status = 'active')`);
    if (filter === "draft")     conditions.push(`cm.is_published = FALSE AND (cm.status IS NULL OR cm.status = 'pending')`);
    if (filter === "inactive")  conditions.push(`cm.status = 'inactive'`);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Đếm tổng
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM community_maps cm
       JOIN users u ON u.id = cm.created_by
       ${where}`,
      params
    );

    // Danh sách maps + thông tin tác giả
    const [maps] = await db.query(
      `SELECT
         cm.id,
         cm.map_code,
         cm.title,
         cm.description,
         cm.is_published,
         cm.status,
         cm.inactive_at,
         cm.play_count,
         cm.average_rating,
         cm.total_ratings,
         cm.created_at,
         cm.updated_at,
         u.id          AS author_id,
         u.username    AS author_username,
         u.full_name   AS author_name,
         u.avatar_url  AS author_avatar
       FROM community_maps cm
       JOIN users u ON u.id = cm.created_by
       ${where}
       ORDER BY cm.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: maps,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("getAllMaps:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/maps/stats
// Thống kê tổng quan màn chơi
// ─────────────────────────────────────────────────────────────
const getMapStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
         SUM(status IS NULL OR status != 'inactive') AS total_maps,
         SUM(is_published = TRUE AND (status IS NULL OR status = 'active')) AS published_maps,
         SUM(is_published = FALSE AND (status IS NULL OR status = 'pending')) AS draft_maps,
         SUM(status = 'inactive')          AS inactive_maps,
         SUM(play_count)                   AS total_plays,
         ROUND(AVG(average_rating), 2)     AS avg_rating,
         SUM(total_ratings)                AS total_ratings,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))  AS new_this_week,
         SUM(created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS new_this_month
       FROM community_maps`
    );

    // Top 5 map được chơi nhiều nhất
    const [topPlayed] = await db.query(
      `SELECT cm.id, cm.map_code, cm.title, cm.play_count, u.username AS author
       FROM community_maps cm
       JOIN users u ON u.id = cm.created_by
       WHERE cm.is_published = TRUE AND (cm.status IS NULL OR cm.status = 'active')
       ORDER BY cm.play_count DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: { ...stats, top_played: topPlayed },
    });
  } catch (error) {
    console.error("getMapStats:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/maps/:id
// Chi tiết map + danh sách ratings + categories
// ─────────────────────────────────────────────────────────────
const getMapById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[map]] = await db.query(
      `SELECT
         cm.*,
         u.id         AS author_id,
         u.username   AS author_username,
         u.full_name  AS author_name,
         u.avatar_url AS author_avatar
       FROM community_maps cm
       JOIN users u ON u.id = cm.created_by
       WHERE cm.id = ?`,
      [id]
    );

    if (!map) {
      return res.status(404).json({ success: false, message: "Không tìm thấy màn chơi" });
    }

    // Categories
    const [categories] = await db.query(
      `SELECT c.id, c.name
       FROM categories c
       JOIN community_map_categories cmc ON cmc.category_id = c.id
       WHERE cmc.map_id = ?
         AND (c.status IS NULL OR c.status = 'active')`,
      [id]
    );

    // Ratings gần nhất
    const [ratings] = await db.query(
      `SELECT
         r.id, r.rating, r.review, r.created_at,
         u.username, u.full_name, u.avatar_url
       FROM community_map_ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.map_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: { ...map, categories, ratings },
    });
  } catch (error) {
    console.error("getMapById:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/maps/:id/publish
// Toggle xuất bản / ẩn màn chơi
// Body: { is_published: true | false }
// ─────────────────────────────────────────────────────────────
const togglePublishMap = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    if (typeof is_published !== "boolean") {
      return res.status(400).json({ success: false, message: "is_published phải là boolean" });
    }

    const [[map]] = await db.query(
      `SELECT id, title, status FROM community_maps WHERE id = ?`,
      [id]
    );

    if (!map) {
      return res.status(404).json({ success: false, message: "Không tìm thấy màn chơi" });
    }

    await db.query(
      `UPDATE community_maps
       SET is_published = ?, status = ?, inactive_at = NULL
       WHERE id = ?`,
      [is_published, is_published ? 'active' : 'pending', id]
    );

    res.json({
      success: true,
      message: `Đã ${is_published ? "xuất bản" : "ẩn"} màn chơi "${map.title}"`,
    });
  } catch (error) {
    console.error("togglePublishMap:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/maps/:id
// Xóa màn chơi (cascade xóa ratings, history, categories)
// ─────────────────────────────────────────────────────────────
const deleteMap = async (req, res) => {
  try {
    const { id } = req.params;

    const [[map]] = await db.query(
      `SELECT id, title, play_count, status FROM community_maps WHERE id = ?`,
      [id]
    );

    if (!map) {
      return res.status(404).json({ success: false, message: "Không tìm thấy màn chơi" });
    }

    // Soft-delete: giu history, ratings va lien ket category.
    await db.query(
      `UPDATE community_maps
       SET status = 'inactive', is_published = FALSE, inactive_at = NOW()
       WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: `Đã chuyển màn chơi "${map.title}" sang trạng thái không còn hoạt động`,
    });
  } catch (error) {
    console.error("deleteMap:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/maps/:id/ratings/:ratingId
// Xóa một đánh giá vi phạm
// ─────────────────────────────────────────────────────────────
const deleteRating = async (req, res) => {
  try {
    const { id, ratingId } = req.params;

    const [[rating]] = await db.query(
      `SELECT id FROM community_map_ratings WHERE id = ? AND map_id = ?`,
      [ratingId, id]
    );

    if (!rating) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    }

    await db.query(`DELETE FROM community_map_ratings WHERE id = ?`, [ratingId]);

    res.json({
      success: true,
      message: "Đã xóa đánh giá",
    });
  } catch (error) {
    console.error("deleteRating:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

module.exports = {
  getAllMaps,
  getMapStats,
  getMapById,
  togglePublishMap,
  deleteMap,
  deleteRating,
};
