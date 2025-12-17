-- Create database
CREATE DATABASE IF NOT EXISTS bonus4you_db;
USE bonus4you_db;

-- Casinos table
CREATE TABLE IF NOT EXISTS casinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo VARCHAR(500),
  tag_type ENUM('free', 'deposit') DEFAULT 'free',
  tag_text VARCHAR(50) DEFAULT '',
  rating DECIMAL(2,1) DEFAULT 0.0,
  bonus_text VARCHAR(100) DEFAULT '',
  rewards_count INT DEFAULT 0,
  category ENUM('cs2', 'general') DEFAULT 'cs2',
  country ENUM('latvia', 'usa'),
  min_deposit VARCHAR(50),
  license VARCHAR(100),
  promo_code VARCHAR(100),
  description TEXT,
  founded VARCHAR(50),
  payment_method_ids JSON,
  tag_ids JSON,
  game_mode_ids JSON,
  is_featured BOOLEAN DEFAULT FALSE,
  has_review BOOLEAN DEFAULT FALSE,
  review_content JSON,
  status ENUM('draft', 'published') DEFAULT 'draft',
  landing_page_views INT DEFAULT 0,
  claim_bonus_clicks INT DEFAULT 0,
  review_reads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  excerpt VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100),
  category VARCHAR(100),
  featured_image VARCHAR(500),
  status ENUM('draft', 'published') DEFAULT 'draft',
  read_time INT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('moderator', 'admin', 'owner') DEFAULT 'moderator',
  permissions JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
