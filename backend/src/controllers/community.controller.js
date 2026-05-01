const db = require('../config/database');

// Helper function để parse grid_data
const parseGridData = (map) => ({
  ...map,
  grid_data: typeof map.grid_data === 'string' 
    ? JSON.parse(map.grid_data) 
    : map.grid_data
});

// Lấy danh sách tất cả community maps
exports.getAllMaps = async (req, res) => {
  try {
    const { search, sortBy = 'created_at', order = 'DESC', limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        cm.*,
        u.username as creator_username,
        u.avatar_url as creator_avatar
      FROM community_maps cm
      JOIN users u ON cm.created_by = u.id
      WHERE cm.is_published = TRUE
    `;
    
    const params = [];
    
    if (search) {
      query += ' AND (cm.title LIKE ? OR cm.description LIKE ? OR cm.map_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const validSortColumns = ['created_at', 'play_count', 'average_rating', 'title'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY cm.${sortColumn} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [maps] = await db.query(query, params);
    const parsedMaps = maps.map(parseGridData);
    
    let countQuery = 'SELECT COUNT(*) as total FROM community_maps WHERE is_published = TRUE';
    const countParams = [];
    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR map_code LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    const [countResult] = await db.query(countQuery, countParams);
    
    res.json({ 
      maps: parsedMaps,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Get all maps error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy chi tiết 1 map (kèm danh mục)
exports.getMapById = async (req, res) => {
  try {
    const mapId = req.params.id;
    
    const [maps] = await db.query(`
      SELECT 
        cm.*,
        u.username as creator_username,
        u.avatar_url as creator_avatar
      FROM community_maps cm
      JOIN users u ON cm.created_by = u.id
      WHERE cm.id = ?
    `, [mapId]);
    
    if (maps.length === 0) {
      return res.status(404).json({ error: 'Map không tồn tại' });
    }
    
    const map = parseGridData(maps[0]);

    // Lấy danh mục của map
    const [categories] = await db.query(`
      SELECT c.*
      FROM categories c
      JOIN community_map_categories cmc ON cmc.category_id = c.id
      WHERE cmc.map_id = ?
      ORDER BY c.name ASC
    `, [mapId]);

    map.categories = categories;
    
    res.json({ map });
    
  } catch (error) {
    console.error('Get map by id error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Tìm map theo map_code
exports.getMapByCode = async (req, res) => {
  try {
    const { map_code } = req.params;
    
    const [maps] = await db.query(`
      SELECT 
        cm.*,
        u.username as creator_username,
        u.avatar_url as creator_avatar
      FROM community_maps cm
      JOIN users u ON cm.created_by = u.id
      WHERE cm.map_code = ? AND cm.is_published = TRUE
    `, [map_code]);
    
    if (maps.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy map với mã này' });
    }
    
    const map = parseGridData(maps[0]);

    // Lấy danh mục của map
    const [categories] = await db.query(`
      SELECT c.*
      FROM categories c
      JOIN community_map_categories cmc ON cmc.category_id = c.id
      WHERE cmc.map_id = ?
      ORDER BY c.name ASC
    `, [map.id]);

    map.categories = categories;
    
    res.json({ map });
    
  } catch (error) {
    console.error('Get map by code error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// ── Helper: đồng bộ danh mục cho 1 map ───────────────────────────────────────
// categoryIds: number[] — danh sách id danh mục muốn gán (có thể rỗng)
const syncMapCategories = async (mapId, categoryIds = []) => {
  // Xóa toàn bộ liên kết cũ
  await db.query('DELETE FROM community_map_categories WHERE map_id = ?', [mapId]);

  if (categoryIds.length === 0) return;

  // Validate: chỉ giữ các id hợp lệ (tồn tại trong bảng categories)
  const placeholders = categoryIds.map(() => '?').join(',');
  const [validCats] = await db.query(
    `SELECT id FROM categories WHERE id IN (${placeholders})`,
    categoryIds
  );
  const validIds = validCats.map(c => c.id);

  if (validIds.length === 0) return;

  // Bulk insert
  const values = validIds.map(catId => [mapId, catId]);
  await db.query(
    'INSERT INTO community_map_categories (map_id, category_id) VALUES ?',
    [values]
  );
};

// Tạo map mới
exports.createMap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { map_code, title, description, grid_data, initial_code, category_ids = [] } = req.body;
    
    if (!map_code || !title || !grid_data) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Kiểm tra map_code đã tồn tại chưa
    const [existing] = await db.query(
      'SELECT id FROM community_maps WHERE map_code = ?',
      [map_code]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Mã map đã tồn tại' });
    }
    
    const [result] = await db.query(
      'INSERT INTO community_maps (map_code, title, description, grid_data, initial_code, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [map_code, title, description, JSON.stringify(grid_data), initial_code, userId]
    );

    const newMapId = result.insertId;

    // Gán danh mục
    const ids = Array.isArray(category_ids)
      ? category_ids.map(Number).filter(Boolean)
      : [];
    await syncMapCategories(newMapId, ids);
    
    res.status(201).json({ 
      message: 'Tạo map thành công',
      mapId: newMapId,
      map_code: map_code
    });
    
  } catch (error) {
    console.error('Create map error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Cập nhật map (chỉ creator hoặc admin)
exports.updateMap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const mapId = req.params.id;
    const { title, description, grid_data, initial_code, is_published, category_ids } = req.body;
    
    // Kiểm tra quyền
    const [maps] = await db.query(
      'SELECT created_by FROM community_maps WHERE id = ?',
      [mapId]
    );
    
    if (maps.length === 0) {
      return res.status(404).json({ error: 'Map không tồn tại' });
    }
    
    if (maps[0].created_by !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa map này' });
    }
    
    await db.query(
      'UPDATE community_maps SET title = ?, description = ?, grid_data = ?, initial_code = ?, is_published = ? WHERE id = ?',
      [title, description, JSON.stringify(grid_data), initial_code, is_published, mapId]
    );

    // Đồng bộ danh mục nếu được truyền lên
    if (Array.isArray(category_ids)) {
      const ids = category_ids.map(Number).filter(Boolean);
      await syncMapCategories(mapId, ids);
    }
    
    res.json({ message: 'Cập nhật map thành công' });
    
  } catch (error) {
    console.error('Update map error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Xóa map (chỉ creator hoặc admin)
exports.deleteMap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const mapId = req.params.id;
    
    const [maps] = await db.query(
      'SELECT created_by FROM community_maps WHERE id = ?',
      [mapId]
    );
    
    if (maps.length === 0) {
      return res.status(404).json({ error: 'Map không tồn tại' });
    }
    
    if (maps[0].created_by !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền xóa map này' });
    }
    
    // community_map_categories sẽ tự xóa nhờ ON DELETE CASCADE
    await db.query('DELETE FROM community_maps WHERE id = ?', [mapId]);
    
    res.json({ message: 'Xóa map thành công' });
    
  } catch (error) {
    console.error('Delete map error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy lịch sử chơi community maps của user
exports.getUserHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [history] = await db.query(`
      SELECT 
        ch.*,
        cm.title,
        cm.map_code,
        cm.created_by
      FROM community_history ch
      JOIN community_maps cm ON ch.map_id = cm.id
      WHERE ch.user_id = ?
      ORDER BY ch.created_at DESC
    `, [userId]);
    
    res.json({ history });
    
  } catch (error) {
    console.error('Get user history error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Submit code cho community map
exports.submitMap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const mapId = req.params.id;
    const { user_code, is_completed, steps_count, time_spent } = req.body;
    
    const [maps] = await db.query(
      'SELECT id FROM community_maps WHERE id = ?',
      [mapId]
    );
    
    if (maps.length === 0) {
      return res.status(404).json({ error: 'Map không tồn tại' });
    }
    
    await db.query(
      'UPDATE community_maps SET play_count = play_count + 1 WHERE id = ?',
      [mapId]
    );
    
    const [existingHistory] = await db.query(
      'SELECT * FROM community_history WHERE user_id = ? AND map_id = ?',
      [userId, mapId]
    );
    
    if (existingHistory.length > 0) {
      const current = existingHistory[0];
      const newBestSteps = steps_count && (!current.best_steps || steps_count < current.best_steps) ? steps_count : current.best_steps;
      const newBestTime = time_spent && (!current.best_time || time_spent < current.best_time) ? time_spent : current.best_time;
      
      await db.query(`
        UPDATE community_history 
        SET 
          user_code = ?,
          is_completed = ?,
          steps_count = ?,
          time_spent = ?,
          attempts = attempts + 1,
          best_steps = ?,
          best_time = ?,
          completed_at = IF(? = TRUE AND completed_at IS NULL, NOW(), completed_at),
          updated_at = NOW()
        WHERE user_id = ? AND map_id = ?
      `, [user_code, is_completed, steps_count, time_spent, newBestSteps, newBestTime, is_completed, userId, mapId]);
      
    } else {
      await db.query(`
        INSERT INTO community_history 
        (user_id, map_id, user_code, is_completed, steps_count, time_spent, best_steps, best_time, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, IF(? = TRUE, NOW(), NULL))
      `, [userId, mapId, user_code, is_completed, steps_count, time_spent, steps_count, time_spent, is_completed]);
    }
    
    res.json({ 
      message: 'Lưu kết quả thành công',
      is_completed: is_completed
    });
    
  } catch (error) {
    console.error('Submit map error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Đánh giá map
exports.rateMap = async (req, res) => {
  try {
    const userId = req.user.userId;
    const mapId = req.params.id;
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
    }
    
    const [existing] = await db.query(
      'SELECT id FROM community_map_ratings WHERE map_id = ? AND user_id = ?',
      [mapId, userId]
    );
    
    if (existing.length > 0) {
      await db.query(
        'UPDATE community_map_ratings SET rating = ?, review = ? WHERE map_id = ? AND user_id = ?',
        [rating, review, mapId, userId]
      );
    } else {
      await db.query(
        'INSERT INTO community_map_ratings (map_id, user_id, rating, review) VALUES (?, ?, ?, ?)',
        [mapId, userId, rating, review]
      );
    }
    
    res.json({ message: 'Đánh giá thành công' });
    
  } catch (error) {
    console.error('Rate map error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy ratings của 1 map
exports.getMapRatings = async (req, res) => {
  try {
    const mapId = req.params.id;
    
    const [ratings] = await db.query(`
      SELECT 
        r.*,
        u.username,
        u.avatar_url
      FROM community_map_ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.map_id = ?
      ORDER BY r.created_at DESC
    `, [mapId]);
    
    res.json({ ratings });
    
  } catch (error) {
    console.error('Get map ratings error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// GET /api/community/history
const getUserCommunityHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [history] = await db.query(
      `SELECT
         ch.id,
         ch.map_id,
         ch.is_completed,
         ch.steps_count,
         ch.time_spent,
         ch.attempts,
         ch.best_steps,
         ch.best_time,
         ch.completed_at,
         ch.created_at,
         ch.updated_at,
         cm.title        AS map_title,
         cm.map_code,
         cm.average_rating AS map_rating,
         u.username      AS map_author,
         u.full_name     AS map_author_name
       FROM community_history ch
       JOIN community_maps cm ON cm.id = ch.map_id
       JOIN users u ON u.id = cm.created_by
       WHERE ch.user_id = ?
       ORDER BY ch.updated_at DESC`,
      [userId]
    );

    res.json({ success: true, history });
  } catch (error) {
    console.error("getUserCommunityHistory:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/community/my-maps (kèm danh mục)
const getMyMaps = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [maps] = await db.query(
      `SELECT
         id, map_code, title, description,
         is_published, play_count,
         average_rating, total_ratings,
         created_at, updated_at
       FROM community_maps
       WHERE created_by = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    if (maps.length === 0) {
      return res.json({ success: true, maps: [] });
    }

    // Lấy toàn bộ danh mục của tất cả maps một lần (tránh N+1 query)
    const mapIds = maps.map(m => m.id);
    const placeholders = mapIds.map(() => '?').join(',');
    const [catRows] = await db.query(
      `SELECT cmc.map_id, c.id, c.name
       FROM community_map_categories cmc
       JOIN categories c ON c.id = cmc.category_id
       WHERE cmc.map_id IN (${placeholders})
       ORDER BY c.name ASC`,
      mapIds
    );

    // Gắn danh mục vào từng map
    const catsByMap = {};
    catRows.forEach(row => {
      if (!catsByMap[row.map_id]) catsByMap[row.map_id] = [];
      catsByMap[row.map_id].push({ id: row.id, name: row.name, icon: row.icon, color: row.color });
    });

    const mapsWithCats = maps.map(m => ({
      ...m,
      categories: catsByMap[m.id] || [],
    }));

    res.json({ success: true, maps: mapsWithCats });
  } catch (error) {
    console.error("getMyMaps:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.getMyMaps = getMyMaps;
exports.getUserCommunityHistory = getUserCommunityHistory;