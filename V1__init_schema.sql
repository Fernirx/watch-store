-- Sat Nov 01 00:00:00 2025
-- Model: TAWatch E-commerce Database    Version: 1.0
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- NOTE: Flyway expects database to already exist and connects via JDBC URL
-- These commands are commented out to prevent errors:
-- - DROP SCHEMA: Would delete entire database (dangerous in migrations)
-- - CREATE SCHEMA: Flyway requires database to exist before migration
-- - USE: Already specified in spring.datasource.url
--
-- To create database manually before running Flyway:
-- CREATE DATABASE IF NOT EXISTS tawatch_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;
-- -----------------------------------------------------
-- DROP SCHEMA IF EXISTS `tawatch_db` ;
-- CREATE SCHEMA IF NOT EXISTS `tawatch_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci ;

-- =====================================================
-- CORE & AUTHENTICATION TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table `tawatch_db`.`users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`users` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của người dùng',
  -- Thông tin xác thực
  `email` VARCHAR(100) NOT NULL COMMENT 'Email đăng nhập, duy nhất trong hệ thống',
  `password_hash` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Mật khẩu đã hash (NULL nếu đăng nhập qua Google OAuth2)',
  `provider` ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL' COMMENT 'Phương thức đăng nhập của tài khoản:
    - "LOCAL" = Đăng nhập bằng tài khoản và mật khẩu truyền thống (nội bộ hệ thống)
    - "GOOGLE" = Đăng nhập qua Google bằng giao thức OAuth2',
  `provider_id` VARCHAR(255) NULL DEFAULT NULL COMMENT 'ID từ nhà cung cấp OAuth (Google sub claim), NULL nếu LOCAL',
  -- Phân quyền và trạng thái
  `role` ENUM('USER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'USER' COMMENT 'Phân quyền của tài khoản trong hệ thống:
    - "USER" = Khách hàng, có thể xem sản phẩm, mua hàng và quản lý đơn hàng của mình
    - "STAFF" = Nhân viên cửa hàng, có quyền xử lý đơn hàng, quản lý kho và hỗ trợ khách hàng
    - "ADMIN" = Quản trị viên hệ thống, có toàn quyền quản lý người dùng, dữ liệu và cấu hình hệ thống',
  `is_verified` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Trạng thái xác thực email: 0=chưa xác thực, 1=đã xác thực',
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'Trạng thái tài khoản: 1=hoạt động, 0=bị khóa',
  -- Bảo mật đăng nhập
  `login_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lần đăng nhập sai liên tiếp (reset về 0 khi thành công)',
  `locked_until` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm mở khóa sau khi đăng nhập sai quá nhiều (NULL=không bị khóa)',
  `last_login` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm đăng nhập gần nhất',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tài khoản',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_users_provider` (`provider` ASC, `provider_id` ASC) VISIBLE,
  INDEX `idx_users_role_active` (`role` ASC, `is_active` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Bảng quản lý tài khoản người dùng - chứa thông tin xác thực và phân quyền';


-- -----------------------------------------------------
-- Table `tawatch_db`.`user_profiles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`user_profiles` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`user_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của profile',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với bảng users (1-1 relationship)',
  -- Thông tin cá nhân
  `first_name` VARCHAR(100) NOT NULL COMMENT 'Tên người dùng (VD: An)',
  `last_name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Họ và tên đệm (VD: Nguyễn Văn)',
  `phone` VARCHAR(15) NULL DEFAULT NULL COMMENT 'Số điện thoại Việt Nam (VD: 0901234567)',
  `avatar_url` VARCHAR(500) NULL DEFAULT NULL COMMENT 'URL ảnh đại diện',
  `date_of_birth` DATE NULL DEFAULT NULL COMMENT 'Ngày sinh',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo profile',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_profiles_name` (`last_name` ASC, `first_name` ASC) VISIBLE,
  INDEX `idx_profiles_phone` (`phone` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_user_profiles_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Thông tin chi tiết cá nhân của người dùng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`addresses`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`addresses` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của địa chỉ',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng sở hữu địa chỉ (1 user có nhiều địa chỉ)',
  -- Thông tin người nhận
  `recipient_name` VARCHAR(200) NOT NULL COMMENT 'Tên người nhận hàng (có thể khác với tên user)',
  `phone` VARCHAR(15) NOT NULL COMMENT 'Số điện thoại người nhận tại Việt Nam (format: 10-11 số)',
  -- Địa chỉ giao hàng
  `street` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ chi tiết: số nhà, tên đường, tên tòa nhà (VD: 123 Lê Lợi, Toà nhà Bitexco)',
  `ward` VARCHAR(100) NOT NULL COMMENT 'Phường/Xã/Thị trấn (VD: Phường Bến Nghé)',
  `city` VARCHAR(100) NOT NULL COMMENT 'Tỉnh/Thành phố (VD: TP. Hồ Chí Minh)',
  `postal_code` VARCHAR(6) NULL DEFAULT NULL COMMENT 'Mã bưu điện Việt Nam (6 chữ số, VD: 700000)',
  `country` VARCHAR(100) NOT NULL DEFAULT 'Việt Nam' COMMENT 'Quốc gia (Chỉ ship trong Việt Nam)',
  -- Cấu hình
  `is_default` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Địa chỉ mặc định: 1=địa chỉ chính, 0=địa chỉ phụ',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm địa chỉ',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_addresses_user_default` (`user_id` ASC, `is_default` ASC) VISIBLE,
  INDEX `idx_addresses_recipient_name` (`recipient_name` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_addresses_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Địa chỉ giao hàng của người dùng - hỗ trợ đa địa chỉ';


-- -----------------------------------------------------
-- Table `tawatch_db`.`guest_sessions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`guest_sessions` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`guest_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của phiên khách',
  -- Thông tin session
  `guest_token` VARCHAR(64) NOT NULL COMMENT 'Token duy nhất để nhận diện khách chưa đăng nhập, liên kết với giỏ hàng',
  -- Thời gian
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo phiên guest',
  `last_active` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm hoạt động cuối',
  `expires_at` DATETIME NOT NULL COMMENT 'Thời điểm hết hạn (thường sau 30 ngày không hoạt động, sau đó xóa session và giỏ hàng)',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `guest_token_UNIQUE` (`guest_token` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_guest_sessions_expires` (`expires_at` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Phiên làm việc của khách chưa đăng ký - cho phép mua hàng không cần tài khoản';


-- -----------------------------------------------------
-- Table `tawatch_db`.`token_blacklist`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`token_blacklist` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`token_blacklist` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của bản ghi blacklist',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID người dùng sở hữu token (NULL nếu không xác định được)',
  -- Thông tin token
  `token` VARCHAR(512) NOT NULL COMMENT 'JWT token bị vô hiệu hóa',
  `reason` ENUM('LOGOUT', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'LOGOUT' COMMENT 'Lý do token bị đưa vào danh sách blacklist:
    - "LOGOUT" = Người dùng chủ động đăng xuất khỏi hệ thống
    - "REVOKED" = Quản trị viên hoặc hệ thống thu hồi quyền truy cập (token bị vô hiệu)
    - "EXPIRED" = Token hết hạn tự nhiên sau thời gian hiệu lực',
  `expires_at` DATETIME NOT NULL COMMENT 'Thời điểm token hết hạn (để tự động dọn dẹp)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm vào blacklist',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_blacklist_user` (`user_id` ASC) VISIBLE,
  INDEX `idx_blacklist_token` (`token`(255) ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_token_blacklist_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Danh sách JWT token bị vô hiệu hóa - ngăn sử dụng lại token sau logout';


-- =====================================================
-- PRODUCT CATALOG TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table `tawatch_db`.`categories`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`categories` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của danh mục',
  -- Foreign Keys (self-reference)
  `parent_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID danh mục cha (NULL=danh mục gốc, có giá trị=danh mục con)',
  -- Thông tin danh mục
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên danh mục (VD: Đồng hồ thể thao, Đồng hồ sang trọng)',
  `slug` VARCHAR(100) NOT NULL COMMENT 'URL-friendly name (VD: dong-ho-the-thao)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết về danh mục',
  -- Cấu hình hiển thị
  `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị (số nhỏ hơn hiển thị trước)',
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'Trạng thái: 1=hiển thị, 0=ẩn',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo danh mục',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE,
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_categories_parent_active` (`parent_id` ASC, `is_active` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_categories_parent`
    FOREIGN KEY (`parent_id`)
    REFERENCES `tawatch_db`.`categories` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Danh mục sản phẩm đồng hồ - hỗ trợ phân cấp đa tầng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`brands`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`brands` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`brands` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của thương hiệu',
  -- Thông tin thương hiệu
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên thương hiệu (VD: Rolex, Omega, Seiko, Casio)',
  `slug` VARCHAR(100) NOT NULL COMMENT 'URL-friendly name (VD: rolex, omega)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả về thương hiệu: lịch sử, xuất xứ, đặc điểm',
  `logo_url` VARCHAR(500) NULL DEFAULT NULL COMMENT 'URL logo thương hiệu',
  -- Cấu hình
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'Trạng thái: 1=đang kinh doanh, 0=tạm ngừng',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm thương hiệu',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE,
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_brands_active` (`is_active` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Thương hiệu đồng hồ';


-- -----------------------------------------------------
-- Table `tawatch_db`.`movements`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`movements` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`movements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của bộ máy',
  -- Thông tin bộ máy
  `type` ENUM('Quartz', 'Automatic', 'Manual', 'Solar') NOT NULL COMMENT 'Loại bộ máy (movement) của đồng hồ:
    - "Quartz" = Bộ máy chạy bằng pin, độ chính xác cao, ít sai số
    - "Automatic" = Bộ máy cơ tự động, lên dây cót nhờ chuyển động cổ tay
    - "Manual" = Bộ máy cơ lên dây cót thủ công bằng tay
    - "Solar" = Bộ máy dùng năng lượng mặt trời, sạc pin qua ánh sáng',
  `name` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Tên cụ thể (VD: Miyota 2035, ETA 2824-2)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết: độ chính xác, trữ cót, tần số dao động',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm bộ máy',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_movements_type` (`type` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Bộ máy đồng hồ - trái tim của đồng hồ';


-- -----------------------------------------------------
-- Table `tawatch_db`.`materials`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`materials` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`materials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của chất liệu',
  -- Thông tin chất liệu
  `type` ENUM('STRAP', 'GLASS', 'CASE') NOT NULL COMMENT 'Loại chất liệu được áp dụng cho bộ phận của đồng hồ:
    - "STRAP" = Dây đeo đồng hồ (ví dụ: da, thép, cao su, vải, v.v.)
    - "GLASS" = Mặt kính đồng hồ (ví dụ: sapphire, mineral, acrylic, v.v.)
    - "CASE" = Vỏ đồng hồ (ví dụ: thép không gỉ, titan, nhôm, nhựa, v.v.)',
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên chất liệu (VD: Da thật, Sapphire, Thép không gỉ 316L)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Đặc tính: độ bền, chống trầy, cảm giác đeo',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm chất liệu',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_materials_type` (`type` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Chất liệu sản phẩm đồng hồ';


-- -----------------------------------------------------
-- Table `tawatch_db`.`colors`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`colors` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`colors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của màu sắc',
  -- Thông tin màu sắc
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên màu (VD: Đen, Bạc, Vàng, Xanh Navy)',
  `hex_code` VARCHAR(7) NULL DEFAULT NULL COMMENT 'Mã màu hex (VD: #000000 cho đen)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm màu',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Danh sách màu sắc sản phẩm';


-- -----------------------------------------------------
-- Table `tawatch_db`.`water_resistances`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`water_resistances` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`water_resistances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của mức chống nước',
  -- Thông tin chống nước
  `level` VARCHAR(50) NOT NULL COMMENT 'Mức chống nước (VD: 3 ATM=rửa tay, 5 ATM=bơi, 10 ATM=lặn)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm mức chống nước',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `level_UNIQUE` (`level` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Danh sách mức độ chống nước';


-- -----------------------------------------------------
-- Table `tawatch_db`.`battery_types`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`battery_types` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`battery_types` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của loại pin',
  -- Thông tin pin
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên loại pin (VD: SR626SW, CR2016) - dùng cho Quartz',
  `voltage` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Điện áp pin (VD: 1.5V, 3V)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm loại pin',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Danh sách loại pin cho đồng hồ Quartz';


-- -----------------------------------------------------
-- Table `tawatch_db`.`features`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`features` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`features` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của tính năng',
  -- Thông tin tính năng
  `name` VARCHAR(100) NOT NULL COMMENT 'Tên tính năng (VD: Chronograph, Date Display, GMT)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết cách sử dụng và lợi ích',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm tính năng',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Danh sách tính năng đặc biệt của đồng hồ';


-- -----------------------------------------------------
-- Table `tawatch_db`.`products`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`products` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`products` (
  -- Primary Key
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của sản phẩm',
  -- Foreign Keys
  `brand_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với thương hiệu',
  `movement_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Loại bộ máy (Quartz, Automatic, Manual, Solar)',
  `case_material_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Chất liệu vỏ đồng hồ',
  `strap_material_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Chất liệu dây đeo',
  `glass_material_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Chất liệu mặt kính',
  `water_resistance_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Mức độ chống nước',
  `battery_type_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Loại pin (chỉ áp dụng cho đồng hồ Quartz)',
  `color_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Màu sắc chủ đạo',
  -- Thông tin cơ bản
  `code` VARCHAR(50) NOT NULL COMMENT 'Mã sản phẩm duy nhất (VD: AT007, ROLEX-001)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm (VD: Đồng hồ Casio MTP-1374D-1AVDF Nam)',
  `slug` VARCHAR(255) NOT NULL COMMENT 'URL-friendly name (VD: dong-ho-casio-mtp-1374d-1avdf-nam)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết sản phẩm (HTML content)',
  -- Giá cả
  `price` DECIMAL(15,2) NOT NULL COMMENT 'Giá bán hiện tại (VNĐ) - giá khách phải trả',
  `original_price` DECIMAL(15,2) NULL DEFAULT NULL COMMENT 'Giá gốc trước giảm giá (VNĐ) - để tính % giảm và hiển thị giá gạch ngang',
  `cost_price` DECIMAL(15,2) NULL DEFAULT NULL COMMENT 'Giá vốn nhập hàng (VNĐ) - chỉ admin xem, để tính lợi nhuận',
  -- Quản lý kho
  `stock_quantity` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho hiện tại',
  `min_stock_level` INT NOT NULL DEFAULT 10 COMMENT 'Mức tồn kho tối thiểu - cảnh báo khi xuống dưới mức này',
  `reorder_point` INT NOT NULL DEFAULT 5 COMMENT 'Điểm đặt hàng lại - hệ thống tự động cảnh báo admin',
  -- Thông tin sản phẩm
  `warranty_period` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Thời gian bảo hành (VD: "12 tháng", "24 tháng")',
  `origin_country` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Quốc gia sản xuất (VD: "Nhật Bản", "Thụy Sỹ")',
  -- Thông số kỹ thuật
  `case_size` DECIMAL(6,2) NULL DEFAULT NULL COMMENT 'Đường kính vỏ đồng hồ (mm, VD: 40.00)',
  `thickness` DECIMAL(6,2) NULL DEFAULT NULL COMMENT 'Độ dày đồng hồ (mm, VD: 10.50)',
  `weight` DECIMAL(6,2) NULL DEFAULT NULL COMMENT 'Trọng lượng (gram, VD: 150.00)',
  `power_reserve` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Trữ cót cho đồng hồ Automatic/Manual (VD: "48 hours")',
  -- Trạng thái và badges
  `is_new` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Sản phẩm mới: 1=hiển thị badge "NEW", 0=không',
  `is_on_sale` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Đang giảm giá: 1=hiển thị badge "SALE", 0=không',
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'Trạng thái: 1=hiển thị trên web, 0=ẩn',
  -- Thống kê
  `sold_count` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đã bán (tăng khi đơn hàng DELIVERED)',
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lượt xem trang chi tiết sản phẩm',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm sản phẩm vào hệ thống',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `code_UNIQUE` (`code` ASC) VISIBLE,
  UNIQUE INDEX `slug_UNIQUE` (`slug` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_products_name` (`name` ASC) VISIBLE,
  INDEX `idx_products_brand_active` (`brand_id` ASC, `is_active` ASC) VISIBLE,
  INDEX `idx_products_price_stock` (`price` ASC, `stock_quantity` ASC) VISIBLE,
  INDEX `idx_products_new_sale` (`is_new` ASC, `is_on_sale` ASC) VISIBLE,
  INDEX `idx_products_movement` (`movement_id` ASC) VISIBLE,
  INDEX `idx_products_case_material` (`case_material_id` ASC) VISIBLE,
  INDEX `idx_products_strap_material` (`strap_material_id` ASC) VISIBLE,
  INDEX `idx_products_glass_material` (`glass_material_id` ASC) VISIBLE,
  INDEX `idx_products_water_resistance` (`water_resistance_id` ASC) VISIBLE,
  INDEX `idx_products_battery_type` (`battery_type_id` ASC) VISIBLE,
  INDEX `idx_products_color` (`color_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_products_brand`
    FOREIGN KEY (`brand_id`)
    REFERENCES `tawatch_db`.`brands` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_movement`
    FOREIGN KEY (`movement_id`)
    REFERENCES `tawatch_db`.`movements` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_case_material`
    FOREIGN KEY (`case_material_id`)
    REFERENCES `tawatch_db`.`materials` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_strap_material`
    FOREIGN KEY (`strap_material_id`)
    REFERENCES `tawatch_db`.`materials` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_glass_material`
    FOREIGN KEY (`glass_material_id`)
    REFERENCES `tawatch_db`.`materials` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_water_resistance`
    FOREIGN KEY (`water_resistance_id`)
    REFERENCES `tawatch_db`.`water_resistances` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_battery_type`
    FOREIGN KEY (`battery_type_id`)
    REFERENCES `tawatch_db`.`battery_types` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_color`
    FOREIGN KEY (`color_id`)
    REFERENCES `tawatch_db`.`colors` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Sản phẩm đồng hồ - bảng chính chứa thông tin cơ bản và thông số kỹ thuật';


-- -----------------------------------------------------
-- Table `tawatch_db`.`product_categories`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`product_categories` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`product_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất',
  -- Foreign Keys
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID sản phẩm',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID danh mục',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm liên kết',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `product_category_UNIQUE` (`product_id` ASC, `category_id` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_product_categories_product` (`product_id` ASC) VISIBLE,
  INDEX `idx_product_categories_category` (`category_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_product_categories_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_product_categories_category`
    FOREIGN KEY (`category_id`)
    REFERENCES `tawatch_db`.`categories` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Mối quan hệ nhiều-nhiều giữa sản phẩm và danh mục';


-- -----------------------------------------------------
-- Table `tawatch_db`.`product_features`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`product_features` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`product_features` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất',
  -- Foreign Keys
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID sản phẩm',
  `feature_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID tính năng',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm tính năng',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `product_feature_UNIQUE` (`product_id` ASC, `feature_id` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_product_features_product` (`product_id` ASC) VISIBLE,
  INDEX `idx_product_features_feature` (`feature_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_product_features_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_product_features_feature`
    FOREIGN KEY (`feature_id`)
    REFERENCES `tawatch_db`.`features` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Mối quan hệ nhiều-nhiều giữa sản phẩm và tính năng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`product_images`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`product_images` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`product_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của hình ảnh',
  -- Foreign Keys
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với sản phẩm (1 sản phẩm có nhiều ảnh)',
  -- Thông tin hình ảnh
  `image_url` VARCHAR(500) NOT NULL COMMENT 'URL hình ảnh sản phẩm',
  `is_primary` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Ảnh chính: 1=ảnh đại diện, 0=ảnh phụ',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm ảnh',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_product_images_product_primary` (`product_id` ASC, `is_primary` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_product_images_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Hình ảnh sản phẩm - hỗ trợ nhiều ảnh cho 1 sản phẩm';


-- =====================================================
-- INVENTORY & SUPPLIER MANAGEMENT
-- =====================================================

-- -----------------------------------------------------
-- Table `tawatch_db`.`suppliers`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`suppliers` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`suppliers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID nhà cung cấp',

  -- Thông tin cơ bản
  `name` VARCHAR(200) NOT NULL COMMENT 'Tên nhà cung cấp',
  `code` VARCHAR(50) NULL COMMENT 'Mã nhà cung cấp (VD: SUP-001)',

  -- Liên hệ
  `email` VARCHAR(100) NULL COMMENT 'Email liên hệ',
  `phone` VARCHAR(20) NULL COMMENT 'Số điện thoại',
  `contact_person` VARCHAR(100) NULL COMMENT 'Người liên hệ',

  -- Địa chỉ
  `address` TEXT NULL COMMENT 'Địa chỉ đầy đủ',

  -- Trạng thái
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT '1=hoạt động, 0=ngừng',
  `notes` TEXT NULL COMMENT 'Ghi chú',

  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE,
  UNIQUE INDEX `code_UNIQUE` (`code` ASC) VISIBLE,

  -- Indexes
  INDEX `idx_is_active` (`is_active` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Nhà cung cấp đồng hồ';


-- -----------------------------------------------------
-- Table `tawatch_db`.`purchases`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`purchases` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`purchases` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID phiếu nhập hàng',

  -- Foreign Keys
  `supplier_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID nhà cung cấp',
  `created_by` BIGINT UNSIGNED NULL COMMENT 'ID người tạo phiếu (STAFF/ADMIN)',
  `received_by` BIGINT UNSIGNED NULL COMMENT 'ID người nhận hàng (STAFF/ADMIN)',

  -- Thông tin cơ bản
  `purchase_code` VARCHAR(50) NOT NULL COMMENT 'Mã phiếu nhập (VD: PUR-2025-00001)',
  `supplier_invoice_no` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Số hóa đơn từ nhà cung cấp',
  `order_date` DATE NOT NULL COMMENT 'Ngày đặt hàng / phát hành phiếu',

  -- Tài chính
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Tổng giá sản phẩm',
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Chiết khấu',
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Thuế VAT',
  `shipping_cost` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Phí vận chuyển',
  `total_cost` DECIMAL(15,2) NOT NULL COMMENT 'Tổng chi phí',
  `payment_status` ENUM('PENDING', 'PAID') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái thanh toán:
    - "PENDING" = Chưa thanh toán
    - "PAID" = Đã thanh toán đầy đủ',

  -- Trạng thái phiếu
  `status` ENUM('DRAFT', 'RECEIVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái phiếu:
    - "DRAFT" = Nháp, chưa xác nhận
    - "RECEIVED" = Đã nhận hàng
    - "COMPLETED" = Hoàn tất, đã nhập kho
    - "CANCELLED" = Hủy phiếu',

  -- Ghi chú
  `notes` TEXT NULL DEFAULT NULL COMMENT 'Ghi chú chung về đơn nhập',
  `issues` TEXT NULL DEFAULT NULL COMMENT 'Vấn đề phát hiện (hàng hỏng, thiếu, khác spec)',

  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo phiếu',
  `received_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm nhận hàng',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',

  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `purchase_code_UNIQUE` (`purchase_code` ASC) VISIBLE,

  -- Indexes
  INDEX `idx_purchases_supplier` (`supplier_id` ASC) VISIBLE,
  INDEX `idx_purchases_status` (`status` ASC),
  INDEX `idx_purchases_payment_status` (`payment_status` ASC) VISIBLE,

  -- Foreign Key Constraints
  CONSTRAINT `fk_purchases_supplier`
    FOREIGN KEY (`supplier_id`)
    REFERENCES `tawatch_db`.`suppliers` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_purchases_created_by`
    FOREIGN KEY (`created_by`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_purchases_received_by`
    FOREIGN KEY (`received_by`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)

ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Phiếu nhập hàng - ghi lại đơn nhập từ nhà cung cấp, chi phí, thanh toán';


-- -----------------------------------------------------
-- Table `tawatch_db`.`purchase_items`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`purchase_items` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`purchase_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID chi tiết dòng nhập',

  -- Foreign Keys
  `purchase_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID phiếu nhập hàng',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID sản phẩm nhập',

  -- Số lượng & Giá
  `quantity_ordered` INT UNSIGNED NOT NULL COMMENT 'Số lượng đặt mua',
  `quantity_received` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lượng thực tế nhận được',
  `unit_cost` DECIMAL(15,2) NOT NULL COMMENT 'Giá nhập/1 cái (COGS - Cost of Goods Sold)',
  `line_total` DECIMAL(15,2) NOT NULL COMMENT 'Thành tiền = quantity_ordered * unit_cost',

  -- Chất lượng & Kiểm tra
  `quality_status` ENUM('PENDING', 'CHECKED', 'OK', 'DEFECTIVE', 'PARTIALLY_DEFECTIVE', 'RETURNED') NOT NULL DEFAULT 'PENDING'
    COMMENT 'Trạng thái kiểm chất lượng:
    - PENDING = Chưa kiểm tra
    - CHECKED = Đã kiểm tra
    - OK = Đạt tiêu chuẩn
    - DEFECTIVE = Lỗi toàn bộ
    - PARTIALLY_DEFECTIVE = Lỗi một phần
    - RETURNED = Trả lại supplier',
  `defective_qty` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lượng hỏng / lỗi',
  `defect_reason` TEXT NULL DEFAULT NULL COMMENT 'Lý do lỗi (không chạy, trầy, mất bộ phận...)',

  -- Nhập kho
  `is_received` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Đã nhập vào kho không: 1=yes, 0=no',
  `received_date` DATETIME NULL DEFAULT NULL COMMENT 'Ngày nhập vào kho',

  -- Ghi chú
  `notes` TEXT NULL DEFAULT NULL COMMENT 'Ghi chú chi tiết về dòng này',

  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',

  -- Primary Key
  PRIMARY KEY (`id`),

  -- Indexes
  INDEX `idx_purchase_items_purchase` (`purchase_id` ASC) VISIBLE,
  INDEX `idx_purchase_items_product` (`product_id` ASC) VISIBLE,
  INDEX `idx_purchase_items_quality_status` (`quality_status` ASC) VISIBLE,
  INDEX `idx_purchase_items_is_received` (`is_received` ASC) VISIBLE,

  -- Foreign Key Constraints
  CONSTRAINT `fk_purchase_items_purchase`
    FOREIGN KEY (`purchase_id`)
    REFERENCES `tawatch_db`.`purchases` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_items_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)

ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Chi tiết phiếu nhập - danh sách sản phẩm nhập kèm giá nhập (COGS), số lượng, chất lượng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`inventory_transactions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`inventory_transactions` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`inventory_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID phiếu xuất/nhập kho',
  -- Foreign Keys
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sản phẩm thay đổi tồn kho',
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Admin thực hiện (NULL=hệ thống tự động)',
  -- Loại giao dịch
  `type` ENUM('IN', 'OUT', 'ADJUST') NOT NULL COMMENT 'Loại giao dịch kho:
    - IN = Nhập kho (mua hàng từ nhà cung cấp, nhập hàng mới về)
    - OUT = Xuất kho (bán hàng cho khách, xuất hủy hàng hỏng)
    - ADJUST = Điều chỉnh tồn kho (kiểm kê phát hiện chênh lệch, sửa lỗi nhập liệu)',
  -- Số lượng thay đổi
  `quantity` INT NOT NULL COMMENT 'Số lượng thay đổi (dương=nhập, âm=xuất)',
  `old_stock` INT NOT NULL COMMENT 'Số lượng tồn TRƯỚC giao dịch',
  `new_stock` INT NOT NULL COMMENT 'Số lượng tồn SAU giao dịch',
  -- Tham chiếu
  `reference_type` ENUM('ORDER', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'DAMAGED') NULL DEFAULT NULL COMMENT 'Giao dịch này liên quan đến gì:
    - ORDER = Xuất kho do bán hàng cho khách (liên kết order_id)
    - PURCHASE = Nhập kho từ nhà cung cấp (liên kết purchase_id nếu có bảng purchases)
    - RETURN = Nhập lại kho do khách trả hàng (liên kết return_id)
    - ADJUSTMENT = Điều chỉnh do kiểm kê (không liên kết gì)
    - DAMAGED = Xuất kho do hàng hỏng, bể vỡ (không liên kết gì)',
  `reference_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID tham chiếu đến đối tượng liên quan (nếu có):
    - Nếu reference_type = ORDER → reference_id = order_id (đơn hàng số mấy)
    - Nếu reference_type = RETURN → reference_id = return_id (phiếu trả hàng số mấy)
    - Nếu reference_type = PURCHASE → reference_id = purchase_id (phiếu nhập số mấy)
    - Nếu reference_type = ADJUSTMENT hoặc DAMAGED → reference_id = NULL
    VD: reference_type=ORDER, reference_id=123 nghĩa là xuất kho cho đơn hàng #123',
  `note` TEXT NULL DEFAULT NULL COMMENT 'Ghi chú chi tiết về giao dịch',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm giao dịch (KHÔNG được sửa)',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_inventory_product_date` (`product_id` ASC, `created_at` ASC) VISIBLE,
  INDEX `idx_inventory_type` (`type` ASC) VISIBLE,
  INDEX `idx_inventory_reference` (`reference_type` ASC, `reference_id` ASC) VISIBLE,
  INDEX `idx_inventory_created_by` (`created_by` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_inventory_transactions_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_inventory_transactions_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Lịch sử xuất nhập kho - ghi lại MỌI thay đổi tồn kho, KHÔNG được xóa/sửa, chỉ được thêm mới';


-- =====================================================
-- ORDER & SHOPPING TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table `tawatch_db`.`carts`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`carts` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`carts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của giỏ hàng',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID người dùng (NULL nếu là khách)',
  -- Thông tin giỏ hàng
  `guest_token` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Token nhận diện khách chưa đăng nhập (NULL nếu đã đăng nhập)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo giỏ',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_cart_user_UNIQUE` (`user_id` ASC),
  UNIQUE INDEX `user_cart_guest_UNIQUE` (`guest_token` ASC),
  -- Foreign Key Constraints
  CONSTRAINT `fk_carts_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_carts_guest_token`
    FOREIGN KEY (`guest_token`)
    REFERENCES `tawatch_db`.`guest_sessions` (`guest_token`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Giỏ hàng - hỗ trợ cả user đăng nhập và guest';


-- -----------------------------------------------------
-- Table `tawatch_db`.`cart_items`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`cart_items` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của item',
  -- Foreign Keys
  `cart_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với giỏ hàng',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với sản phẩm',
  -- Thông tin item
  `quantity` INT NOT NULL DEFAULT 1 COMMENT 'Số lượng (tối thiểu 1)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm vào giỏ',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật số lượng',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cart_product_UNIQUE` (`cart_id` ASC, `product_id` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_cart_items_cart` (`cart_id` ASC) VISIBLE,
  INDEX `idx_cart_items_product` (`product_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_cart_items_cart`
    FOREIGN KEY (`cart_id`)
    REFERENCES `tawatch_db`.`carts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_items_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Sản phẩm trong giỏ hàng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`coupons`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`coupons` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của mã giảm giá',
  -- Thông tin mã
  `code` VARCHAR(50) NOT NULL COMMENT 'Mã giảm giá khách nhập (VD: SUMMER2025)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chương trình giảm giá',
  -- Loại giảm giá
  `discount_type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL COMMENT 'Loại hình giảm giá được áp dụng:
    - "PERCENTAGE" = Giảm giá theo phần trăm (%) trên tổng giá trị đơn hàng hoặc sản phẩm
    - "FIXED_AMOUNT" = Giảm giá theo số tiền cố định (ví dụ: giảm 50.000đ)',
  `discount_value` DECIMAL(15,2) NOT NULL COMMENT 'Giá trị giảm (VD: 10=giảm 10%, 50000=giảm 50k)',
  -- Điều kiện áp dụng
  `min_order_amount` DECIMAL(15,2) NULL DEFAULT NULL COMMENT 'Giá trị đơn hàng tối thiểu (NULL=không giới hạn)',
  `max_discount_amount` DECIMAL(15,2) NULL DEFAULT NULL COMMENT 'Số tiền giảm tối đa (chỉ với PERCENTAGE)',
  -- Giới hạn sử dụng
  `usage_limit` INT NULL DEFAULT NULL COMMENT 'Số lần sử dụng tối đa (NULL=không giới hạn, 100=chỉ dùng được 100 lần)',
  `used_count` INT NOT NULL DEFAULT 0 COMMENT 'Số lần đã được sử dụng (tăng khi đơn hàng confirmed)',
  `user_usage_limit` INT NULL DEFAULT NULL COMMENT 'Giới hạn mỗi user (NULL=không giới hạn, 1=mỗi user dùng 1 lần)',
  -- Thời gian hiệu lực
  `start_date` DATETIME NOT NULL COMMENT 'Thời điểm bắt đầu hiệu lực',
  `end_date` DATETIME NOT NULL COMMENT 'Thời điểm hết hiệu lực',
  -- Trạng thái
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'Trạng thái: 1=kích hoạt, 0=tạm ngưng',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo mã',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `code_UNIQUE` (`code` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_coupons_active_dates` (`is_active` ASC, `start_date` ASC, `end_date` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Mã giảm giá - hỗ trợ nhiều loại khuyến mãi';


-- -----------------------------------------------------
-- Table `tawatch_db`.`orders`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`orders` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của đơn hàng',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID người dùng (NULL nếu khách đặt hàng không đăng nhập)',
  -- Thông tin đơn hàng
  `code` VARCHAR(50) NOT NULL COMMENT 'Mã đơn hàng duy nhất (VD: ORD-2025-00001)',
  `guest_token` VARCHAR(64) NULL DEFAULT NULL COMMENT 'Token của khách chưa đăng nhập (NULL nếu user đã đăng nhập)',
  -- Trạng thái
  `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái hiện tại của đơn hàng:
    - "PENDING" = Đơn hàng mới được tạo, đang chờ xác nhận
    - "CONFIRMED" = Đơn hàng đã được xác nhận và chuẩn bị xử lý
    - "PROCESSING" = Đơn hàng đang được chuẩn bị, đóng gói hoặc chờ giao
    - "SHIPPING" = Đơn hàng đang trong quá trình vận chuyển đến khách hàng
    - "DELIVERED" = Đơn hàng đã được giao thành công cho khách hàng
    - "CANCELLED" = Đơn hàng đã bị hủy bởi khách hàng hoặc hệ thống
    - "REFUNDED" = Đơn hàng đã hoàn tiền sau khi bị hủy hoặc trả hàng',
  `payment_status` ENUM('UNPAID', 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'UNPAID' COMMENT 'Trạng thái thanh toán của đơn hàng:
    - "UNPAID" = Chưa thanh toán (áp dụng cho đơn COD - thanh toán khi nhận hàng)
    - "PENDING" = Đang chờ thanh toán online
    - "PROCESSING" = Đang xử lý giao dịch thanh toán (đang verify với cổng thanh toán)
    - "PAID" = Đã thanh toán thành công, hệ thống xác nhận nhận được tiền
    - "FAILED" = Thanh toán thất bại (lỗi giao dịch, bị từ chối, hoặc không đủ số dư)
    - "REFUNDED" = Đơn hàng đã được hoàn tiền sau khi hủy hoặc trả hàng
    - "CANCELLED" = Giao dịch thanh toán đã bị hủy bởi khách hàng hoặc hệ thống
    - "EXPIRED" = Hết hạn thanh toán (quá thời gian cho phép)',
  `payment_method` ENUM('VNPAY', 'ZALOPAY', 'COD') NOT NULL COMMENT 'Phương thức thanh toán mà khách hàng sử dụng:
    - "VNPAY" = Thanh toán trực tuyến qua VNPay
    - "ZALOPAY" = Thanh toán qua ZaloPay
    - "COD" = Thanh toán khi nhận hàng',
  -- Thông tin giao hàng
  `recipient_name` VARCHAR(200) NOT NULL COMMENT 'Tên người nhận',
  `recipient_phone` VARCHAR(15) NOT NULL COMMENT 'SĐT người nhận tại Việt Nam',
  `shipping_street` VARCHAR(255) NOT NULL COMMENT 'Địa chỉ chi tiết: số nhà, tên đường',
  `shipping_ward` VARCHAR(100) NOT NULL COMMENT 'Phường/Xã/Thị trấn',
  `shipping_city` VARCHAR(100) NOT NULL COMMENT 'Tỉnh/Thành phố',
  `shipping_postal_code` VARCHAR(6) NULL DEFAULT NULL COMMENT 'Mã bưu điện (6 chữ số)',
  `shipping_country` VARCHAR(100) NOT NULL DEFAULT 'Việt Nam' COMMENT 'Quốc gia (Chỉ Việt Nam)',
  -- Thông tin tài chính
  `subtotal` DECIMAL(15,2) NOT NULL COMMENT 'Tổng tiền sản phẩm chưa phí và giảm giá',
  `shipping_fee` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Phí vận chuyển (nếu có)',
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Số tiền giảm giá áp dụng',
  `total_amount` DECIMAL(15,2) NOT NULL COMMENT 'Tổng tiền thanh toán cuối cùng (VNĐ) = subtotal + shipping_fee - discount_amount',
  -- Thông tin khác
  `coupon_code` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Mã giảm giá đã sử dụng (VD: NEWYEAR2025)',
  `note` TEXT NULL DEFAULT NULL COMMENT 'Ghi chú từ khách hàng (VD: yêu cầu gói quà, thời gian giao hàng)',
  `admin_note` TEXT NULL DEFAULT NULL COMMENT 'Ghi chú nội bộ (VD: lưu ý đóng gói cẩn thận)',
  -- Thông tin hủy đơn
  `cancelled_reason` TEXT NULL DEFAULT NULL COMMENT 'Lý do hủy đơn hàng (Khách hoặc Admin điền)',
  `cancelled_by` ENUM('CUSTOMER', 'STAFF', 'ADMIN', 'SYSTEM') NULL DEFAULT NULL COMMENT 'Người hủy đơn:
    - CUSTOMER = Khách hàng tự hủy
    - STAFF = Nhân viên hủy (theo yêu cầu khách hoặc phát hiện lỗi)
    - ADMIN = Admin hủy (vi phạm chính sách)
    - SYSTEM = Hệ thống tự động hủy (quá hạn thanh toán)',
  `cancelled_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm hủy đơn',
  -- Thông tin vận chuyển
  `confirmed_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm admin xác nhận đơn',
  `estimated_delivery_date` DATE NULL DEFAULT NULL COMMENT 'Ngày giao hàng dự kiến',
  `tracking_number` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Mã vận đơn từ đơn vị vận chuyển',
  `delivered_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm giao hàng thành công',
  -- Timestamp
  `expired_at` DATETIME NOT NULL COMMENT 'Thời điểm hết hạn thanh toán (VD: tạo đơn + 24 giờ)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo đơn',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật cuối',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `code_UNIQUE` (`code` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_orders_user_status` (`user_id` ASC, `status` ASC) VISIBLE,
  INDEX `idx_orders_guest` (`guest_token` ASC) VISIBLE,
  INDEX `idx_orders_payment_status` (`payment_status` ASC) VISIBLE,
  INDEX `idx_orders_date_status` (`created_at` ASC, `status` ASC) VISIBLE,
  INDEX `idx_orders_created` (`created_at` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_guest_token`
    FOREIGN KEY (`guest_token`)
    REFERENCES `tawatch_db`.`guest_sessions` (`guest_token`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Đơn hàng - bảng chính quản lý thông tin đặt hàng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`order_items`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`order_items` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của item',
  -- Foreign Keys
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với đơn hàng',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với sản phẩm',
  -- Thông tin snapshot
  `product_code` VARCHAR(50) NOT NULL COMMENT 'Mã sản phẩm tại thời điểm đặt (luu lại để đối chiếu)',
  `product_name` VARCHAR(255) NOT NULL COMMENT 'Tên sản phẩm tại thời điểm đặt (lưu lại để đối chiếu)',
  -- Số lượng và giá
  `quantity` INT NOT NULL COMMENT 'Số lượng đặt mua',
  `price` DECIMAL(15,2) NOT NULL COMMENT 'Giá bán 1 sản phẩm tại thời điểm đặt (có thể khác với giá hiện tại trong products)',
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'Số tiền giảm giá cho item này',
  `subtotal` DECIMAL(15,2) NOT NULL COMMENT 'Thành tiền = price * quantity - discount_amount',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm item',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_order_items_order` (`order_id` ASC) VISIBLE,
  INDEX `idx_order_items_product` (`product_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `tawatch_db`.`orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Sản phẩm trong đơn hàng - chi tiết từng item';


-- -----------------------------------------------------
-- Table `tawatch_db`.`order_status_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`order_status_history` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`order_status_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của lịch sử',
  -- Foreign Keys
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với đơn hàng',
  `changed_by` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID người thực hiện (NULL nếu hệ thống)',
  -- Thông tin thay đổi
  `old_status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED') NULL DEFAULT NULL COMMENT 'Trạng thái cũ của đơn hàng trước khi thay đổi:
    - "PENDING" = Đơn hàng vừa được tạo, chưa xác nhận
    - "CONFIRMED" = Đã xác nhận và chờ xử lý
    - "PROCESSING" = Đang được chuẩn bị, đóng gói
    - "SHIPPING" = Đang giao hàng cho khách
    - "DELIVERED" = Giao hàng thành công
    - "CANCELLED" = Đơn hàng đã bị hủy
    - "REFUNDED" = Đơn hàng đã hoàn tiền
    (NULL khi đơn hàng mới được tạo lần đầu)',
  `new_status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL COMMENT 'Trạng thái mới của đơn hàng sau khi thay đổi:
    - "PENDING" = Đơn hàng vừa được tạo, chưa xác nhận
    - "CONFIRMED" = Đã xác nhận và chờ xử lý
    - "PROCESSING" = Đang được chuẩn bị, đóng gói
    - "SHIPPING" = Đang giao hàng cho khách
    - "DELIVERED" = Giao hàng thành công
    - "CANCELLED" = Đơn hàng đã bị hủy
    - "REFUNDED" = Đơn hàng đã hoàn tiền
    (NULL khi đơn hàng mới được tạo lần đầu)',
  `note` TEXT NULL DEFAULT NULL COMMENT 'Ghi chú về thay đổi (VD: Admin xác nhận, khách hủy đơn)',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thay đổi trạng thái',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_status_history_order_created` (`order_id` ASC, `created_at` ASC) VISIBLE,
  INDEX `idx_status_history_changed_by` (`changed_by` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_status_history_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `tawatch_db`.`orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_status_history_user`
    FOREIGN KEY (`changed_by`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Lịch sử thay đổi trạng thái đơn hàng - audit trail';


-- -----------------------------------------------------
-- Table `tawatch_db`.`payments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`payments` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của giao dịch thanh toán',
  -- Foreign Keys
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với đơn hàng',
  -- Thông tin thanh toán
  `amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thanh toán (VNĐ)',
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái thanh toán:
    - "PENDING" = Đã tạo link thanh toán, đang chờ user thực hiện (chưa có callback từ VNPay/ZaloPay)
    - "SUCCESS" = Thanh toán thành công (đã nhận callback success từ VNPay/ZaloPay)
    - "FAILED" = Thanh toán thất bại (user hủy, hoặc callback lỗi từ VNPay/ZaloPay)
    - "EXPIRED" = Hết hạn thanh toán (quá thời gian cho phép 15-30 phút mà không thanh toán)',
  `transaction_id` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Mã giao dịch từ cổng thanh toán (VNPay/ZaloPay)',
  `payment_method` ENUM('VNPAY', 'ZALOPAY') NOT NULL DEFAULT 'VNPAY' COMMENT 'Phương thức thanh toán:
    - "VNPAY" = Thanh toán qua VNPay
    - "ZALOPAY" = Thanh toán qua ZaloPay',
  `response_code` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Mã phản hồi từ cổng thanh toán',
  `response_message` TEXT NULL DEFAULT NULL COMMENT 'Thông báo phản hồi từ cổng thanh toán, Lưu để hiển thị cho user khi thanh toán thất bại',
  `paid_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm thanh toán thành công',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo giao dịch',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_payments_order` (`order_id` ASC) VISIBLE,
  INDEX `idx_payments_transaction` (`transaction_id` ASC) VISIBLE,
  INDEX `idx_payments_status` (`status` ASC) VISIBLE,
  INDEX `idx_payments_created` (`created_at` ASC) VISIBLE,
  INDEX `idx_payments_method` (`payment_method` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `tawatch_db`.`orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Giao dịch thanh toán - lưu thông tin thanh toán từ VNPay, ZaloPay';


-- -----------------------------------------------------
-- Table `tawatch_db`.`coupon_usage`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`coupon_usage` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`coupon_usage` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của lịch sử',
  -- Foreign Keys
  `coupon_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với mã giảm giá',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID người dùng (NULL nếu guest)',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'Liên kết với đơn hàng',
  -- Thông tin sử dụng
  `discount_amount` DECIMAL(15,2) NOT NULL COMMENT 'Số tiền thực tế đã giảm',
  -- Timestamp
  `used_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm sử dụng mã',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_coupon_usage_coupon` (`coupon_id` ASC) VISIBLE,
  INDEX `idx_coupon_usage_user` (`user_id` ASC) VISIBLE,
  INDEX `idx_coupon_usage_order` (`order_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_coupon_usage_coupon`
    FOREIGN KEY (`coupon_id`)
    REFERENCES `tawatch_db`.`coupons` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_coupon_usage_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_coupon_usage_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `tawatch_db`.`orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Lịch sử sử dụng mã giảm giá - tracking và kiểm soát';


-- =====================================================
-- USER ENGAGEMENT & CONTENT TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table `tawatch_db`.`product_reviews`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`product_reviews` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`product_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của đánh giá',
  -- Foreign Keys
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sản phẩm được đánh giá',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người dùng đánh giá',
  `order_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Đơn hàng liên quan (chỉ cho phép nếu đã mua - status DELIVERED)',
  -- Thông tin đánh giá
  `rating` TINYINT NOT NULL COMMENT 'Điểm đánh giá từ 1-5 sao',
  `title` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Tiêu đề đánh giá (VD: "Sản phẩm tốt")',
  `comment` TEXT NULL DEFAULT NULL COMMENT 'Nội dung đánh giá chi tiết',
  -- Trạng thái
  `is_verified_purchase` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Đã mua hàng: 1=có order_id, 0=tự do',
  `is_approved` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Đã duyệt: 1=hiển thị, 0=chờ duyệt',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo đánh giá',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm chỉnh sửa',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_reviews_product_approved` (`product_id` ASC, `is_approved` ASC) VISIBLE,
  INDEX `idx_reviews_user` (`user_id` ASC) VISIBLE,
  INDEX `idx_reviews_order` (`order_id` ASC) VISIBLE,
  INDEX `idx_reviews_rating` (`rating` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_reviews_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `tawatch_db`.`orders` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Đánh giá sản phẩm từ khách hàng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`wishlists`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`wishlists` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`wishlists` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của wishlist item',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sản phẩm được yêu thích',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thêm vào yêu thích',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  UNIQUE INDEX `user_product_UNIQUE` (`user_id` ASC, `product_id` ASC) VISIBLE,
  -- Indexes
  INDEX `idx_wishlists_user` (`user_id` ASC) VISIBLE,
  INDEX `idx_wishlists_product` (`product_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_wishlists_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_wishlists_product`
    FOREIGN KEY (`product_id`)
    REFERENCES `tawatch_db`.`products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Sản phẩm yêu thích của người dùng';


-- -----------------------------------------------------
-- Table `tawatch_db`.`notifications`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`notifications` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của thông báo',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID người dùng nhận thông báo',
  -- Thông tin thông báo
  `type` ENUM('ORDER', 'PAYMENT', 'PROMOTION', 'SYSTEM', 'REVIEW') NOT NULL COMMENT 'Loại thông báo gửi đến người dùng:
    - "ORDER" = Cập nhật liên quan đến đơn hàng (xác nhận, giao hàng, hủy, v.v.)
    - "PAYMENT" = Thông báo về trạng thái thanh toán (thành công, thất bại, hết hạn, v.v.)
    - "PROMOTION" = Thông báo khuyến mãi, ưu đãi hoặc mã giảm giá
    - "SYSTEM" = Thông báo từ hệ thống (bảo trì, cập nhật, thay đổi chính sách, v.v.)
    - "REVIEW" = Nhắc nhở hoặc xác nhận đánh giá sản phẩm sau khi mua hàng',
  `title` VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo (VD: "Đơn hàng ORD-2025-00001 đã được giao")',
  `message` TEXT NOT NULL COMMENT 'Nội dung chi tiết',
  `link` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Link liên quan',
  -- Trạng thái đọc
  `is_read` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Đã đọc: 0=chưa đọc, 1=đã đọc',
  `read_at` DATETIME NULL DEFAULT NULL COMMENT 'Thời điểm đọc',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_notifications_user_read` (`user_id` ASC, `is_read` ASC) VISIBLE,
  INDEX `idx_notifications_created` (`created_at` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Thông báo người dùng - push notification';


-- -----------------------------------------------------
-- Table `tawatch_db`.`faqs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`faqs` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`faqs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của câu hỏi',
  -- Thông tin FAQ
  `question` TEXT NOT NULL COMMENT 'Câu hỏi thường gặp',
  `answer` TEXT NOT NULL COMMENT 'Câu trả lời chi tiết (có thể chứa HTML)',
  `category` VARCHAR(100) NOT NULL COMMENT 'Danh mục (VD: "Thanh toán", "Vận chuyển", "Bảo hành")',
  -- Cấu hình hiển thị
  `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Thứ tự hiển thị (số nhỏ hơn hiển thị trước)',
  `is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'Trạng thái: 1=hiển thị, 0=ẩn',
  -- Thống kê
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lượt xem câu hỏi này',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo câu hỏi',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_faqs_category_active` (`category` ASC, `is_active` ASC) VISIBLE,
  INDEX `idx_faqs_display_order` (`display_order` ASC) VISIBLE,
  INDEX `idx_faqs_view_count` (`view_count` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Câu hỏi thường gặp (FAQ) - hỗ trợ khách hàng tự tìm câu trả lời';


-- =====================================================
-- SYSTEM & AUDIT TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table `tawatch_db`.`activity_logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tawatch_db`.`activity_logs` ;

CREATE TABLE IF NOT EXISTS `tawatch_db`.`activity_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID duy nhất của log',
  -- Foreign Keys
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID người thực hiện (NULL nếu hệ thống/guest)',
  -- Thông tin hành động
  `action` VARCHAR(100) NOT NULL COMMENT 'Tên hành động (VD: CREATE_ORDER, UPDATE_PRODUCT)',
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'Loại đối tượng (VD: ORDER, PRODUCT, USER)',
  `entity_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'ID đối tượng bị tác động (NULL nếu không có đối tượng cụ thể)',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả chi tiết hành động (VD: "Admin đã cập nhật giá sản phẩm XYZ từ 1,000,000đ lên 900,000đ")',
  -- Dữ liệu thay đổi (JSON)
  `old_data` JSON NULL DEFAULT NULL COMMENT 'Dữ liệu cũ (JSON) - để rollback',
  `new_data` JSON NULL DEFAULT NULL COMMENT 'Dữ liệu mới (JSON)',
  -- Thông tin tracking
  `ip_address` VARCHAR(45) NULL DEFAULT NULL COMMENT 'Địa chỉ IP (hỗ trợ IPv4 và IPv6)',
  `user_agent` VARCHAR(500) NULL DEFAULT NULL COMMENT 'User Agent: trình duyệt, thiết bị',
  -- Timestamp
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm thực hiện',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật log',
  -- Primary Key và UNIQUE
  PRIMARY KEY (`id`),
  -- Indexes
  INDEX `idx_activity_logs_entity` (`entity_type` ASC, `entity_id` ASC) VISIBLE,
  INDEX `idx_activity_logs_created` (`created_at` ASC) VISIBLE,
  INDEX `idx_activity_logs_user` (`user_id` ASC) VISIBLE,
  -- Foreign Key Constraints
  CONSTRAINT `fk_activity_logs_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `tawatch_db`.`users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_520_ci
COMMENT = 'Nhật ký hoạt động hệ thống - audit trail cho toàn bộ hệ thống';

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;