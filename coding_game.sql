-- Xóa toàn bộ database
DROP DATABASE IF EXISTS coding_game;

-- Tạo lại database mới (nếu cần)
CREATE DATABASE coding_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ============================================
-- DATABASE: CODING GAME
-- ============================================

USE coding_game;

-- ============================================
-- 1. BẢNG USERS
-- ============================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(100),
  avatar_url VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  auth_provider ENUM('local', 'google', 'github') DEFAULT 'local',
  auth_provider_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2. BẢNG LEARNING LEVELS (Admin tạo - theo lộ trình)
-- ============================================
CREATE TABLE learning_levels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  level_number INT UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  grid_data JSON NOT NULL,
  initial_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 3. BẢNG LEARNING PROGRESS (Tiến độ học tập)
-- ============================================
CREATE TABLE learning_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  level_id INT NOT NULL,
  user_code TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  steps_count INT,
  time_spent INT,
  stars INT DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  attempts INT DEFAULT 1,
  best_steps INT,
  best_time INT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (level_id) REFERENCES learning_levels(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_level (user_id, level_id),
  INDEX idx_user_progress (user_id, is_completed),
  INDEX idx_level_progress (level_id, is_completed)
);

-- ============================================
-- 4. BẢNG CATEGORIES (Danh mục cho Community)
-- ============================================
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE categories
DROP COLUMN icon;
-- ============================================
-- 5. BẢNG COMMUNITY MAPS (User tạo)
-- ============================================
CREATE TABLE community_maps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  map_code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  grid_data JSON NOT NULL,
  initial_code TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT TRUE,
  play_count INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INT DEFAULT 0,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rating (average_rating, total_ratings),
  INDEX idx_created_by (created_by)
);

-- ============================================
-- 6. BẢNG COMMUNITY_MAP_CATEGORIES (Nhiều-Nhiều)
-- ============================================
CREATE TABLE community_map_categories (
  map_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (map_id, category_id),
  FOREIGN KEY (map_id) REFERENCES community_maps(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- ============================================
-- 7. BẢNG COMMUNITY_HISTORY (Lịch sử chơi Community)
-- ============================================
CREATE TABLE community_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  map_id INT NOT NULL,
  user_code TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  steps_count INT,
  time_spent INT,
  attempts INT DEFAULT 1,
  best_steps INT,
  best_time INT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (map_id) REFERENCES community_maps(id) ON DELETE CASCADE,
  INDEX idx_user_map (user_id, map_id)
);

-- ============================================
-- 8. BẢNG COMMUNITY_MAP_RATINGS (Đánh giá & Review)
-- ============================================
CREATE TABLE community_map_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  map_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (map_id) REFERENCES community_maps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_rating (map_id, user_id),
  INDEX idx_map_rating (map_id, rating)
);

-- ============================================
-- TRIGGERS: Tự động cập nhật rating
-- ============================================
DELIMITER $$

CREATE TRIGGER after_rating_insert
AFTER INSERT ON community_map_ratings
FOR EACH ROW
BEGIN
  UPDATE community_maps 
  SET 
    total_ratings = (SELECT COUNT(*) FROM community_map_ratings WHERE map_id = NEW.map_id),
    average_rating = (SELECT AVG(rating) FROM community_map_ratings WHERE map_id = NEW.map_id)
  WHERE id = NEW.map_id;
END$$

CREATE TRIGGER after_rating_update
AFTER UPDATE ON community_map_ratings
FOR EACH ROW
BEGIN
  UPDATE community_maps 
  SET 
    average_rating = (SELECT AVG(rating) FROM community_map_ratings WHERE map_id = NEW.map_id)
  WHERE id = NEW.map_id;
END$$

CREATE TRIGGER after_rating_delete
AFTER DELETE ON community_map_ratings
FOR EACH ROW
BEGIN
  UPDATE community_maps 
  SET 
    total_ratings = (SELECT COUNT(*) FROM community_map_ratings WHERE map_id = OLD.map_id),
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM community_map_ratings WHERE map_id = OLD.map_id)
  WHERE id = OLD.map_id;
END$$
DELIMITER ;
SELECT * FROM users;
SELECT * FROM learning_levels;
SELECT * FROM community_maps ;
SELECT * FROM community_history;
SELECT * FROM learning_progress;
DELETE FROM learning_levels
WHERE id > 0;
ALTER TABLE learning_levels AUTO_INCREMENT = 1;

DELETE FROM learning_levels 
WHERE id > 0;
ALTER TABLE learning_levels AUTO_INCREMENT = 1;

INSERT INTO learning_levels (
  level_number, 
  title, 
  description, 
  grid_data, 
  initial_code, 
  is_published
) VALUES (
  30,
  'Bước đầu tiên',
  'Học cách di chuyển nhân vật đến đích. Sử dụng lệnh moveRight() để di chuyển đến đích.',
  '{
    "rows": 5,
    "cols": 5,
    "player": {"x": 0, "y": 2},
    "target": {"x": 4, "y": 2},
    "obstacles": [],
    "collectibles": [{"x":1, "y":1}]
  }',
  '// Viết code của bạn ở đây
// Sử dụng: moveUp(), moveDown(), moveLeft(), moveRight()

',
  TRUE
);
UPDATE users 
SET is_active = 1
WHERE id = 1;
SELECT * FROM community_history;

