import pymysql
from config import get_config

def init_database():
    config = get_config()
    
    host = config.get('database', 'host')
    port = config.getint('database', 'port')
    user = config.get('database', 'user')
    password = config.get('database', 'password')
    database = config.get('database', 'database')
    
    print(f"正在连接MySQL服务器 {host}:{port}...")
    
    try:
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            charset='utf8mb4'
        )
        
        print("连接成功！")
        print(f"正在创建数据库 {database}...")
        
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
        connection.select_db(database)
        print("数据库创建成功！")
        
        print("正在创建数据表...")
        
        with connection.cursor() as cursor:
            create_model_configs = """
            CREATE TABLE IF NOT EXISTS model_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                model_type VARCHAR(50) NOT NULL UNIQUE,
                api_url VARCHAR(500) NOT NULL,
                api_key VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
            cursor.execute(create_model_configs)
            
            create_image_tasks = """
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
            """
            cursor.execute(create_image_tasks)
            
            create_generated_images = """
            CREATE TABLE IF NOT EXISTS generated_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                image_path VARCHAR(500) NOT NULL,
                seed VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES image_tasks(id) ON DELETE CASCADE,
                INDEX idx_task_id (task_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
            cursor.execute(create_generated_images)
            
            create_video_tasks = """
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
            """
            cursor.execute(create_video_tasks)
            
            create_generated_videos = """
            CREATE TABLE IF NOT EXISTS generated_videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                video_path VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES video_tasks(id) ON DELETE CASCADE,
                INDEX idx_task_id (task_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
            cursor.execute(create_generated_videos)
            
            cursor.execute("SELECT COUNT(*) as count FROM model_configs")
            result = cursor.fetchone()
            if result[0] == 0:
                insert_default_configs = """
                INSERT INTO model_configs (model_type, api_url, api_key) VALUES
                ('text_to_image', '', ''),
                ('image_to_image', '', ''),
                ('image_to_video', '', ''),
                ('text_to_video', '', ''),
                ('sequence_to_video', '', '')
                """
                cursor.execute(insert_default_configs)
        
        connection.commit()
        print("数据表创建成功！")
        print("数据库初始化完成！")
        
        connection.close()
        
    except pymysql.MySQLError as e:
        print(f"数据库初始化失败: {e}")
        return False
    
    return True

if __name__ == "__main__":
    init_database()
