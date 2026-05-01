const db = require('../config/database');

// Lấy danh sách tất cả levels
exports.getAllLevels = async (req, res) => {
  try {
    const [levels] = await db.query(
      'SELECT id, level_number, title, description, is_published, created_at FROM learning_levels WHERE is_published = TRUE ORDER BY level_number ASC'
    );
    
    res.json({ levels });
    
  } catch (error) {
    console.error('Get all levels error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy chi tiết 1 level (bao gồm grid_data)
exports.getLevelById = async (req, res) => {
  try {
    const levelNumber = req.params.id;
    
    const [levels] = await db.query(
      'SELECT * FROM learning_levels WHERE level_number = ? AND is_published = TRUE',
      [parseInt(levelNumber)]
    );
    
    if (levels.length === 0) {
      return res.status(404).json({ error: 'Level không tồn tại' });
    }
    
    res.json({ level: levels[0] });
    
  } catch (error) {
    console.error('Get level by id error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy tiến độ học tập của user
exports.getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [progress] = await db.query(`
      SELECT 
        lp.*,
        ll.level_number,
        ll.title,
        ll.description
      FROM learning_progress lp
      JOIN learning_levels ll ON lp.level_id = ll.id
      WHERE lp.user_id = ?
      ORDER BY ll.level_number ASC
    `, [userId]);
    
    res.json({ progress });
    
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Submit code và lưu kết quả
exports.submitLevel = async (req, res) => {
  try {
    const userId = req.user.userId;
    const levelId = req.params.id;
    const { user_code, is_completed, steps_count, time_spent, stars } = req.body;
    
    // Kiểm tra level có tồn tại không
    const [levels] = await db.query(
      'SELECT id FROM learning_levels WHERE id = ?',
      [levelId]
    );
    
    if (levels.length === 0) {
      return res.status(404).json({ error: 'Level không tồn tại' });
    }
    
    // Kiểm tra đã có progress chưa
    const [existingProgress] = await db.query(
      'SELECT * FROM learning_progress WHERE user_id = ? AND level_id = ?',
      [userId, levelId]
    );
    
    if (existingProgress.length > 0) {
      // Update progress
      const current = existingProgress[0];
      const newBestSteps = steps_count && (!current.best_steps || steps_count < current.best_steps) ? steps_count : current.best_steps;
      const newBestTime = time_spent && (!current.best_time || time_spent < current.best_time) ? time_spent : current.best_time;
      const newStars = stars && stars > current.stars ? stars : current.stars;
      
      await db.query(`
        UPDATE learning_progress 
        SET 
          user_code = ?,
          is_completed = ?,
          steps_count = ?,
          time_spent = ?,
          stars = ?,
          attempts = attempts + 1,
          best_steps = ?,
          best_time = ?,
          completed_at = IF(? = TRUE AND completed_at IS NULL, NOW(), completed_at),
          updated_at = NOW()
        WHERE user_id = ? AND level_id = ?
      `, [user_code, is_completed, steps_count, time_spent, newStars, newBestSteps, newBestTime, is_completed, userId, levelId]);
      
    } else {
      // Insert new progress
      await db.query(`
        INSERT INTO learning_progress 
        (user_id, level_id, user_code, is_completed, steps_count, time_spent, stars, best_steps, best_time, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = TRUE, NOW(), NULL))
      `, [userId, levelId, user_code, is_completed, steps_count, time_spent, stars || 0, steps_count, time_spent, is_completed]);
    }
    
    res.json({ 
      message: 'Lưu kết quả thành công',
      is_completed: is_completed
    });
    
  } catch (error) {
    console.error('Submit level error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Admin: Tạo level mới
exports.createLevel = async (req, res) => {
  try {
    const { level_number, title, description, grid_data, initial_code } = req.body;
    
    // Validate
    if (!level_number || !title || !grid_data) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Kiểm tra level_number đã tồn tại chưa
    const [existing] = await db.query(
      'SELECT id FROM learning_levels WHERE level_number = ?',
      [level_number]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Level number đã tồn tại' });
    }
    
    const [result] = await db.query(
      'INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code) VALUES (?, ?, ?, ?, ?)',
      [level_number, title, description, JSON.stringify(grid_data), initial_code]
    );
    
    res.status(201).json({ 
      message: 'Tạo level thành công',
      levelId: result.insertId
    });
    
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Admin: Cập nhật level
exports.updateLevel = async (req, res) => {
  try {
    const levelId = req.params.id;
    const { title, description, grid_data, initial_code, is_published } = req.body;
    
    const [result] = await db.query(
      'UPDATE learning_levels SET title = ?, description = ?, grid_data = ?, initial_code = ?, is_published = ? WHERE id = ?',
      [title, description, JSON.stringify(grid_data), initial_code, is_published, levelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Level không tồn tại' });
    }
    
    res.json({ message: 'Cập nhật level thành công' });
    
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Admin: Xóa level
exports.deleteLevel = async (req, res) => {
  try {
    const levelId = req.params.id;
    
    const [result] = await db.query(
      'DELETE FROM learning_levels WHERE id = ?',
      [levelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Level không tồn tại' });
    }
    
    res.json({ message: 'Xóa level thành công' });
    
  } catch (error) {
    console.error('Delete level error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};