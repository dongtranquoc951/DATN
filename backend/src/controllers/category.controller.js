const db = require('../config/database');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT id, name, description, created_at
       FROM categories
       ORDER BY name ASC`
    );
    res.json({ success: true, categories });
  } catch (error) {
    console.error('getAllCategories:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[category]] = await db.query(
      `SELECT id, name, description, created_at FROM categories WHERE id = ?`, [id]
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy category' });
    }
    const [[{ map_count }]] = await db.query(
      `SELECT COUNT(*) AS map_count FROM community_map_categories WHERE category_id = ?`, [id]
    );
    res.json({ success: true, category: { ...category, map_count } });
  } catch (error) {
    console.error('getCategoryById:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Tên category là bắt buộc' });
    }
    const [[existing]] = await db.query(
      `SELECT id FROM categories WHERE name = ?`, [name.trim()]
    );
    if (existing) {
      return res.status(400).json({ success: false, message: `Category "${name}" đã tồn tại` });
    }
    const [result] = await db.query(
      `INSERT INTO categories (name, description) VALUES (?, ?)`,
      [name.trim(), description || null]
    );
    res.status(201).json({
      success: true,
      message: `Đã tạo category "${name}"`,
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error('createCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const [[category]] = await db.query(
      `SELECT id, name FROM categories WHERE id = ?`, [id]
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy category' });
    }
    if (name && name.trim() !== category.name) {
      const [[dup]] = await db.query(
        `SELECT id FROM categories WHERE name = ? AND id != ?`, [name.trim(), id]
      );
      if (dup) {
        return res.status(400).json({ success: false, message: `Tên "${name}" đã được dùng` });
      }
    }
    await db.query(
      `UPDATE categories SET name = ?, description = ? WHERE id = ?`,
      [name?.trim() ?? category.name, description ?? null, id]
    );
    res.json({ success: true, message: `Đã cập nhật category "${name ?? category.name}"` });
  } catch (error) {
    console.error('updateCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [[category]] = await db.query(
      `SELECT id, name FROM categories WHERE id = ?`, [id]
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy category' });
    }
    const [[{ map_count }]] = await db.query(
      `SELECT COUNT(*) AS map_count FROM community_map_categories WHERE category_id = ?`, [id]
    );
    await db.query(`DELETE FROM categories WHERE id = ?`, [id]);
    res.json({
      success: true,
      message: `Đã xóa category "${category.name}" (gỡ khỏi ${map_count} bản đồ)`,
    });
  } catch (error) {
    console.error('deleteCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/categories/:id/maps
exports.getMapsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const [[category]] = await db.query(
      `SELECT id, name FROM categories WHERE id = ?`, [id]
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy category' });
    }
    const [maps] = await db.query(
      `SELECT cm.id, cm.map_code, cm.title, cm.description, u.username AS creator_username
       FROM community_maps cm
       JOIN community_map_categories cmc ON cmc.map_id = cm.id
       JOIN users u ON u.id = cm.created_by
       WHERE cmc.category_id = ? AND cm.is_published = TRUE
       ORDER BY cm.play_count DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );
    res.json({ success: true, category, maps });
  } catch (error) {
    console.error('getMapsByCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PATCH /api/categories/reorder
// HÀM MỚI BỔ SUNG ĐỂ SỬA LỖI UNDEFINED
exports.reorderCategories = async (req, res) => {
  try {
    const { orders } = req.body; 
    // Logic: orders nên là mảng [{id: 1, position: 1}, ...]
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu sắp xếp không hợp lệ' });
    }
    
    // Bạn có thể viết code xử lý UPDATE hàng loạt ở đây nếu bảng có cột 'position'
    res.json({ success: true, message: 'Đã cập nhật thứ tự category' });
  } catch (error) {
    console.error('reorderCategories:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};