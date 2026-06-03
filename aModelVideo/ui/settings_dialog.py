from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, 
    QPushButton, QTabWidget, QWidget, QFormLayout, QMessageBox
)
from PyQt5.QtCore import Qt
from database import get_db
from config import set_model_config

class SettingsDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = get_db()
        self.init_ui()
        self.load_configs()
    
    def init_ui(self):
        self.setWindowTitle("模型配置")
        self.setFixedSize(600, 500)
        
        layout = QVBoxLayout(self)
        
        self.tab_widget = QTabWidget()
        
        self.text_to_image_tab = self.create_model_tab("text_to_image", "文生图模型")
        self.image_to_image_tab = self.create_model_tab("image_to_image", "图生图模型")
        self.image_to_video_tab = self.create_model_tab("image_to_video", "图生视频模型")
        self.text_to_video_tab = self.create_model_tab("text_to_video", "文生视频模型")
        self.sequence_to_video_tab = self.create_model_tab("sequence_to_video", "序列图生视频模型")
        
        self.tab_widget.addTab(self.text_to_image_tab["widget"], "文生图")
        self.tab_widget.addTab(self.image_to_image_tab["widget"], "图生图")
        self.tab_widget.addTab(self.image_to_video_tab["widget"], "图生视频")
        self.tab_widget.addTab(self.text_to_video_tab["widget"], "文生视频")
        self.tab_widget.addTab(self.sequence_to_video_tab["widget"], "序列图生视频")
        
        layout.addWidget(self.tab_widget)
        
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        
        save_btn = QPushButton("保存")
        save_btn.clicked.connect(self.save_configs)
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 8px 20px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        
        cancel_btn = QPushButton("取消")
        cancel_btn.clicked.connect(self.reject)
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                padding: 8px 20px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #da190b;
            }
        """)
        
        button_layout.addWidget(save_btn)
        button_layout.addWidget(cancel_btn)
        
        layout.addLayout(button_layout)
    
    def create_model_tab(self, model_type, title):
        widget = QWidget()
        layout = QFormLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(15)
        
        api_url_input = QLineEdit()
        api_url_input.setPlaceholderText(f"请输入{title}API地址")
        api_url_input.setMinimumHeight(30)
        
        api_key_input = QLineEdit()
        api_key_input.setPlaceholderText(f"请输入{title}API密钥")
        api_key_input.setEchoMode(QLineEdit.Password)
        api_key_input.setMinimumHeight(30)
        
        layout.addRow(QLabel("API地址:"), api_url_input)
        layout.addRow(QLabel("API密钥:"), api_key_input)
        
        hint_label = QLabel("提示: 配置将同时保存到数据库和配置文件")
        hint_label.setStyleSheet("color: #666; font-size: 12px;")
        layout.addRow(hint_label)
        
        return {
            "widget": widget,
            "api_url": api_url_input,
            "api_key": api_key_input
        }
    
    def load_configs(self):
        tabs = {
            "text_to_image": self.text_to_image_tab,
            "image_to_image": self.image_to_image_tab,
            "image_to_video": self.image_to_video_tab,
            "text_to_video": self.text_to_video_tab,
            "sequence_to_video": self.sequence_to_video_tab
        }
        
        for model_type, tab in tabs.items():
            config = self.db.get_model_config(model_type)
            if config:
                tab["api_url"].setText(config.get("api_url", ""))
                tab["api_key"].setText(config.get("api_key", ""))
    
    def save_configs(self):
        tabs = {
            "text_to_image": self.text_to_image_tab,
            "image_to_image": self.image_to_image_tab,
            "image_to_video": self.image_to_video_tab,
            "text_to_video": self.text_to_video_tab,
            "sequence_to_video": self.sequence_to_video_tab
        }
        
        try:
            for model_type, tab in tabs.items():
                api_url = tab["api_url"].text().strip()
                api_key = tab["api_key"].text().strip()
                
                self.db.update_model_config(model_type, api_url, api_key)
                set_model_config(model_type, api_url, api_key)
            
            QMessageBox.information(self, "成功", "模型配置保存成功！")
            self.accept()
        except Exception as e:
            QMessageBox.critical(self, "错误", f"保存配置失败: {str(e)}")
