-- Collabthon Database Schema
-- Complete MySQL setup with your credentials

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create database
CREATE DATABASE IF NOT EXISTS `collabthon_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `collabthon_db`;

-- Users table
CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `hashed_password` VARCHAR(255) NOT NULL,
    `role` ENUM('student','admin') DEFAULT 'student',
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_verified` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_email` (`email`),
    INDEX `idx_username` (`username`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table
CREATE TABLE `profiles` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `college` VARCHAR(255) NOT NULL,
    `major` VARCHAR(255) NOT NULL,
    `year` INT NOT NULL,
    `bio` TEXT,
    `skills` JSON,
    `experience` VARCHAR(100),
    `github_url` VARCHAR(255),
    `linkedin_url` VARCHAR(255),
    `portfolio_url` VARCHAR(255),
    `avatar_url` VARCHAR(255),
    `is_public` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_college` (`college`),
    INDEX `idx_major` (`major`),
    INDEX `idx_year` (`year`),
    FULLTEXT `idx_profile_search` (`first_name`, `last_name`, `college`, `major`, `bio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE `projects` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `owner_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `required_skills` JSON,
    `budget_min` DECIMAL(10,2),
    `budget_max` DECIMAL(10,2),
    `timeline` VARCHAR(100),
    `status` ENUM('open','in_progress','completed','closed') DEFAULT 'open',
    `is_remote` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_owner` (`owner_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created` (`created_at`),
    FULLTEXT `idx_project_search` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collaboration requests table
CREATE TABLE `collaboration_requests` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sender_id` INT NOT NULL,
    `receiver_id` INT NOT NULL,
    `project_id` INT,
    `message` TEXT,
    `status` ENUM('pending','accepted','rejected','cancelled') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
    INDEX `idx_sender` (`sender_id`),
    INDEX `idx_receiver` (`receiver_id`),
    INDEX `idx_project` (`project_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE `subscriptions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL UNIQUE,
    `plan` ENUM('free','professional','enterprise') DEFAULT 'free',
    `stripe_customer_id` VARCHAR(255),
    `stripe_subscription_id` VARCHAR(255),
    `is_active` BOOLEAN DEFAULT TRUE,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user` (`user_id`),
    INDEX `idx_plan` (`plan`),
    INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample admin user
INSERT INTO `users` (`email`, `username`, `hashed_password`, `role`, `is_verified`) VALUES
('admin@collabthon.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', 'admin', TRUE);

-- Create views
CREATE VIEW `user_profiles_view` AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.is_active,
    u.created_at,
    p.first_name,
    p.last_name,
    p.college,
    p.major,
    p.year,
    p.bio,
    p.skills,
    p.experience,
    p.github_url,
    p.linkedin_url,
    p.portfolio_url,
    s.plan as subscription_plan
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.is_active = TRUE AND p.is_public = TRUE;

CREATE VIEW `project_listings_view` AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.required_skills,
    p.budget_min,
    p.budget_max,
    p.timeline,
    p.status,
    p.is_remote,
    p.created_at,
    u.username as owner_username,
    pr.first_name,
    pr.last_name,
    pr.college
FROM projects p
JOIN users u ON p.owner_id = u.id
LEFT JOIN profiles pr ON u.id = pr.user_id
WHERE p.status = 'open'
ORDER BY p.created_at DESC;

COMMIT;