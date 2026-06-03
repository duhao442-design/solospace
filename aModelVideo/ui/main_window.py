import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QTabWidget, QWidget, QVBoxLayout, 
    QHBoxLayout, QLabel, QPushButton, QStatusBar, QMenuBar,
    QAction, QMessageBox
)
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import Qt

from .image_generation import ImageGenerationWidget
from .image_editor import ImageEditorWidget
from .video_generation import VideoGenerationWidget
from .settings_dialog import SettingsDialog

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("AI视频生成工作流")
        self.setGeometry(100, 100, 1400, 900)
        
        self.create_menu_bar()
        self.create_central_widget()
        self.create_status_bar()
        
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f5f5f5;
            }
            QTabWidget::pane {
                border: 1px solid #ddd;
                background: white;
            }
            QTabBar::tab {
                background: #e0e0e0;
                padding: 10px 20px;
                border: 1px solid #ccc;
                border-bottom: none;
                margin-right: 2px;
            }
            QTabBar::tab:selected {
                background: white;
                border-bottom: 1px solid white;
            }
        """)
    
    def create_menu_bar(self):
        menubar = self.menuBar()
        
        file_menu = menubar.addMenu("文件")
        
        exit_action = QAction("退出", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        settings_menu = menubar.addMenu("设置")
        
        model_config_action = QAction("模型配置", self)
        model_config_action.triggered.connect(self.open_model_settings)
        settings_menu.addAction(model_config_action)
        
        help_menu = menubar.addMenu("帮助")
        
        about_action = QAction("关于", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def create_central_widget(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(10, 10, 10, 10)
        
        self.tab_widget = QTabWidget()
        
        self.image_gen_widget = ImageGenerationWidget()
        self.video_gen_widget = VideoGenerationWidget()
        self.image_editor_widget = ImageEditorWidget()
        
        self.tab_widget.addTab(self.image_gen_widget, "图片生成")
        self.tab_widget.addTab(self.video_gen_widget, "视频生成")
        self.tab_widget.addTab(self.image_editor_widget, "图片编辑")
        
        layout.addWidget(self.tab_widget)
    
    def create_status_bar(self):
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("就绪")
    
    def open_model_settings(self):
        dialog = SettingsDialog(self)
        dialog.exec_()
    
    def show_about(self):
        QMessageBox.about(self, "关于", 
            "AI视频生成工作流 v1.0\n\n"
            "一款强大的AI图片和视频生成工具\n"
            "支持文生图、图生图、文生视频、图生视频等功能")
    
    def update_status(self, message):
        self.status_bar.showMessage(message)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())
