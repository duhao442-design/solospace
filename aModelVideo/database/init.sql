CREATE DATABASE IF NOT EXISTS ai_video_workflow DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_video_workflow;

CREATE TABLE IF NOT EXISTS model_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_type VARCHAR(50) NOT NULL UNIQUE,
    api_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS image_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_type VARCHAR(20) NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    reference_image VARCHAR(500),
    resolution VARCHAR(20) NOT NULL,
    image_count INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS generated_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    seed VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES image_tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS video_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_type VARCHAR(20) NOT NULL,
    prompt TEXT,
    reference_images TEXT,
    duration INT NOT NULL DEFAULT 5,
    resolution VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS generated_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    video_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES video_tasks(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO model_configs (model_type, api_url, api_key) VALUES
('text_to_image', '', ''),
('image_to_image', '', ''),
('image_to_video', '', ''),
('text_to_video', '', ''),
('sequence_to_video', '', '')
ON DUPLICATE KEY UPDATE model_type=model_type;
