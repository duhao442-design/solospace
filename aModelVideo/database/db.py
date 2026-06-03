import pymysql
from pymysql.cursors import DictCursor
from datetime import datetime
from config import get_config

class DatabaseManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_connection()
        return cls._instance
    
    def _init_connection(self):
        config = get_config()
        self.host = config.get('database', 'host')
        self.port = config.getint('database', 'port')
        self.user = config.get('database', 'user')
        self.password = config.get('database', 'password')
        self.database = config.get('database', 'database')
        self.connection = None
        self._connect()
    
    def _connect(self):
        try:
            self.connection = pymysql.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                charset='utf8mb4',
                cursorclass=DictCursor
            )
        except pymysql.MySQLError as e:
            print(f"数据库连接失败: {e}")
            self.connection = None
    
    def _ensure_connection(self):
        if self.connection is None or not self.connection.open is False:
            self._connect()
        return self.connection is not None
    
    def execute_query(self, query, params=None):
        if not self._ensure_connection():
            return None
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params or ())
                self.connection.commit()
                return cursor.lastrowid
        except pymysql.MySQLError as e:
            print(f"查询执行失败: {e}")
            self.connection.rollback()
            return None
    
    def fetch_all(self, query, params=None):
        if not self._ensure_connection():
            return []
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()
        except pymysql.MySQLError as e:
            print(f"查询失败: {e}")
            return []
    
    def fetch_one(self, query, params=None):
        if not self._ensure_connection():
            return None
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()
        except pymysql.MySQLError as e:
            print(f"查询失败: {e}")
            return None
    
    def get_model_config(self, model_type):
        query = "SELECT * FROM model_configs WHERE model_type = %s"
        return self.fetch_one(query, (model_type,))
    
    def update_model_config(self, model_type, api_url, api_key):
        query = """
            INSERT INTO model_configs (model_type, api_url, api_key)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE api_url = VALUES(api_url), api_key = VALUES(api_key)
        """
        return self.execute_query(query, (model_type, api_url, api_key))
    
    def create_image_task(self, task_type, prompt, negative_prompt, reference_image, resolution, image_count):
        query = """
            INSERT INTO image_tasks (task_type, prompt, negative_prompt, reference_image, resolution, image_count, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
        """
        return self.execute_query(query, (task_type, prompt, negative_prompt, reference_image, resolution, image_count))
    
    def update_image_task_status(self, task_id, status):
        query = "UPDATE image_tasks SET status = %s WHERE id = %s"
        return self.execute_query(query, (status, task_id))
    
    def complete_image_task(self, task_id):
        query = "UPDATE image_tasks SET status = 'completed', completed_at = %s WHERE id = %s"
        return self.execute_query(query, (datetime.now(), task_id))
    
    def add_generated_image(self, task_id, image_path, seed=None):
        query = "INSERT INTO generated_images (task_id, image_path, seed) VALUES (%s, %s, %s)"
        return self.execute_query(query, (task_id, image_path, seed))
    
    def get_image_task(self, task_id):
        query = "SELECT * FROM image_tasks WHERE id = %s"
        return self.fetch_one(query, (task_id,))
    
    def get_generated_images(self, task_id):
        query = "SELECT * FROM generated_images WHERE task_id = %s ORDER BY id DESC"
        return self.fetch_all(query, (task_id,))
    
    def get_recent_image_tasks(self, limit=20):
        query = """
            SELECT it.*, GROUP_CONCAT(gi.image_path) as image_paths
            FROM image_tasks it
            LEFT JOIN generated_images gi ON it.id = gi.task_id
            GROUP BY it.id
            ORDER BY it.created_at DESC
            LIMIT %s
        """
        return self.fetch_all(query, (limit,))
    
    def create_video_task(self, task_type, prompt, reference_images, duration, resolution):
        query = """
            INSERT INTO video_tasks (task_type, prompt, reference_images, duration, resolution, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
        """
        return self.execute_query(query, (task_type, prompt, reference_images, duration, resolution))
    
    def update_video_task_status(self, task_id, status):
        query = "UPDATE video_tasks SET status = %s WHERE id = %s"
        return self.execute_query(query, (status, task_id))
    
    def complete_video_task(self, task_id):
        query = "UPDATE video_tasks SET status = 'completed', completed_at = %s WHERE id = %s"
        return self.execute_query(query, (datetime.now(), task_id))
    
    def add_generated_video(self, task_id, video_path):
        query = "INSERT INTO generated_videos (task_id, video_path) VALUES (%s, %s)"
        return self.execute_query(query, (task_id, video_path))
    
    def get_video_task(self, task_id):
        query = "SELECT * FROM video_tasks WHERE id = %s"
        return self.fetch_one(query, (task_id,))
    
    def get_generated_video(self, task_id):
        query = "SELECT * FROM generated_videos WHERE task_id = %s ORDER BY id DESC LIMIT 1"
        return self.fetch_one(query, (task_id,))
    
    def get_recent_video_tasks(self, limit=20):
        query = """
            SELECT vt.*, gv.video_path
            FROM video_tasks vt
            LEFT JOIN generated_videos gv ON vt.id = gv.task_id
            GROUP BY vt.id
            ORDER BY vt.created_at DESC
            LIMIT %s
        """
        return self.fetch_all(query, (limit,))
    
    def close(self):
        if self.connection and self.connection.open:
            self.connection.close()

def get_db():
    return DatabaseManager()
