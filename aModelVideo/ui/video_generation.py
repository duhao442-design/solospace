import os
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, 
    QComboBox, QPushButton, QFileDialog, QGroupBox, QProgressBar,
    QMessageBox, QListWidget, QListWidgetItem, QSpinBox, QAbstractItemView
)
from PyQt5.QtGui import QPixmap, QIcon
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QSize
from core import get_model_api
from database import get_db
from utils import save_base64_video, validate_image_file, validate_video_file

class VideoGenerationWorker(QThread):
    finished = pyqtSignal(str)
    error = pyqtSignal(str)
    progress = pyqtSignal(int)
    
    def __init__(self, task_type, prompt, reference_images, duration, resolution):
        super().__init__()
        self.task_type = task_type
        self.prompt = prompt
        self.reference_images = reference_images
        self.duration = duration
        self.resolution = resolution
        self.model_api = get_model_api()
        self.db = get_db()
    
    def run(self):
        try:
            self.progress.emit(20)
            
            ref_images_str = ",".join(self.reference_images) if self.reference_images else None
            task_id = self.db.create_video_task(
                self.task_type,
                self.prompt,
                ref_images_str,
                self.duration,
                self.resolution
            )
            
            self.progress.emit(40)
            
            if self.task_type == "text_to_video":
                result = self.model_api.text_to_video(
                    self.prompt,
                    self.duration,
                    self.resolution
                )
            elif self.task_type == "image_to_video":
                result = self.model_api.image_to_video(
                    self.reference_images[0] if self.reference_images else "",
                    self.duration,
                    self.resolution
                )
            else:
                result = self.model_api.sequence_to_video(
                    self.reference_images,
                    self.duration,
                    self.resolution
                )
            
            self.progress.emit(80)
            
            video_path = save_base64_video(result['video_data'])
            self.db.add_generated_video(task_id, video_path)
            self.db.complete_video_task(task_id)
            
            self.progress.emit(100)
            self.finished.emit(video_path)
        except Exception as e:
            self.error.emit(str(e))

class VideoGenerationWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.reference_images = []
        self.generated_video_path = None
        self.init_ui()
    
    def init_ui(self):
        main_layout = QHBoxLayout(self)
        main_layout.setSpacing(20)
        main_layout.setContentsMargins(10, 10, 10, 10)
        
        left_panel = self.create_left_panel()
        right_panel = self.create_right_panel()
        
        main_layout.addWidget(left_panel, 1)
        main_layout.addWidget(right_panel, 2)
    
    def create_left_panel(self):
        panel = QGroupBox("生成参数")
        layout = QVBoxLayout(panel)
        layout.setSpacing(15)
        
        mode_layout = QHBoxLayout()
        mode_layout.addWidget(QLabel("生成模式:"))
        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["文生视频", "图生视频", "多图序列视频"])
        self.mode_combo.currentTextChanged.connect(self.on_mode_changed)
        mode_layout.addWidget(self.mode_combo)
        layout.addLayout(mode_layout)
        
        self.images_group = QGroupBox("参考图片")
        images_layout = QVBoxLayout(self.images_group)
        
        self.images_list = QListWidget()
        self.images_list.setIconSize(QSize(100, 100))
        self.images_list.setResizeMode(QListWidget.Adjust)
        self.images_list.setSelectionMode(QAbstractItemView.ExtendedSelection)
        self.images_list.setMaximumHeight(200)
        images_layout.addWidget(self.images_list)
        
        btn_layout = QHBoxLayout()
        add_img_btn = QPushButton("添加图片")
        add_img_btn.clicked.connect(self.add_reference_images)
        btn_layout.addWidget(add_img_btn)
        
        remove_img_btn = QPushButton("移除选中")
        remove_img_btn.clicked.connect(self.remove_selected_images)
        btn_layout.addWidget(remove_img_btn)
        images_layout.addLayout(btn_layout)
        
        layout.addWidget(self.images_group)
        
        layout.addWidget(QLabel("视频描述:"))
        self.prompt_edit = QTextEdit()
        self.prompt_edit.setPlaceholderText("请输入视频描述...")
        self.prompt_edit.setMinimumHeight(80)
        layout.addWidget(self.prompt_edit)
        
        duration_layout = QHBoxLayout()
        duration_layout.addWidget(QLabel("视频时长:"))
        self.duration_combo = QComboBox()
        self.duration_combo.addItems(["3秒", "5秒", "10秒", "15秒", "20秒"])
        self.duration_combo.setCurrentText("5秒")
        duration_layout.addWidget(self.duration_combo)
        layout.addLayout(duration_layout)
        
        resolution_layout = QHBoxLayout()
        resolution_layout.addWidget(QLabel("分辨率:"))
        self.resolution_combo = QComboBox()
        self.resolution_combo.addItems(["512x512", "768x768", "1024x768", "768x1024"])
        self.resolution_combo.setCurrentText("768x768")
        resolution_layout.addWidget(self.resolution_combo)
        layout.addLayout(resolution_layout)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        self.generate_btn = QPushButton("开始生成")
        self.generate_btn.clicked.connect(self.start_generation)
        self.generate_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 15px;
                font-size: 16px;
                font-weight: bold;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        layout.addWidget(self.generate_btn)
        
        layout.addStretch()
        
        self.on_mode_changed("文生视频")
        
        return panel
    
    def create_right_panel(self):
        panel = QGroupBox("生成结果")
        layout = QVBoxLayout(panel)
        
        self.video_label = QLabel()
        self.video_label.setAlignment(Qt.AlignCenter)
        self.video_label.setMinimumSize(600, 400)
        self.video_label.setStyleSheet("border: 2px dashed #ccc; background: #fafafa;")
        self.video_label.setText("视频生成后将显示在这里\n\n支持图生视频、文生视频、多图序列视频")
        layout.addWidget(self.video_label)
        
        info_label = QLabel("注意：视频生成完成后会自动保存到输出目录")
        info_label.setStyleSheet("color: #666; font-size: 12px;")
        layout.addWidget(info_label)
        
        save_btn_layout = QHBoxLayout()
        save_btn_layout.addStretch()
        
        self.save_video_btn = QPushButton("另存为...")
        self.save_video_btn.clicked.connect(self.save_video)
        self.save_video_btn.setEnabled(False)
        self.save_video_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                padding: 10px 30px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #0b7dda;
            }
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        save_btn_layout.addWidget(self.save_video_btn)
        
        layout.addLayout(save_btn_layout)
        
        return panel
    
    def on_mode_changed(self, mode):
        if mode == "文生视频":
            self.images_group.hide()
        else:
            self.images_group.show()
    
    def add_reference_images(self):
        filepaths, _ = QFileDialog.getOpenFileNames(
            self, "选择参考图片", "", "图片文件 (*.png *.jpg *.jpeg *.bmp *.webp)"
        )
        for filepath in filepaths:
            if validate_image_file(filepath) and filepath not in self.reference_images:
                self.reference_images.append(filepath)
                item = QListWidgetItem(os.path.basename(filepath))
                pixmap = QPixmap(filepath)
                item.setIcon(QIcon(pixmap.scaled(100, 100, Qt.KeepAspectRatio, Qt.SmoothTransformation)))
                item.setData(Qt.UserRole, filepath)
                self.images_list.addItem(item)
    
    def remove_selected_images(self):
        for item in self.images_list.selectedItems():
            filepath = item.data(Qt.UserRole)
            if filepath in self.reference_images:
                self.reference_images.remove(filepath)
            self.images_list.takeItem(self.images_list.row(item))
    
    def start_generation(self):
        mode = self.mode_combo.currentText()
        
        if mode == "文生视频":
            prompt = self.prompt_edit.toPlainText().strip()
            if not prompt:
                QMessageBox.warning(self, "提示", "请输入视频描述")
                return
            task_type = "text_to_video"
        else:
            if not self.reference_images:
                QMessageBox.warning(self, "提示", "请添加参考图片")
                return
            
            if mode == "图生视频":
                task_type = "image_to_video"
            else:
                if len(self.reference_images) < 2:
                    QMessageBox.warning(self, "提示", "多图序列视频需要至少2张图片")
                    return
                task_type = "sequence_to_video"
        
        duration = int(self.duration_combo.currentText().replace("秒", ""))
        resolution = self.resolution_combo.currentText()
        
        self.generate_btn.setEnabled(False)
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        
        self.worker = VideoGenerationWorker(
            task_type,
            self.prompt_edit.toPlainText().strip(),
            self.reference_images,
            duration,
            resolution
        )
        self.worker.finished.connect(self.on_generation_finished)
        self.worker.error.connect(self.on_generation_error)
        self.worker.progress.connect(self.progress_bar.setValue)
        self.worker.start()
    
    def on_generation_finished(self, video_path):
        self.generated_video_path = video_path
        self.video_label.setText(f"视频生成成功！\n\n保存路径: {video_path}")
        self.video_label.setStyleSheet("border: 2px solid #4CAF50; background: #f0fff4; padding: 20px;")
        self.save_video_btn.setEnabled(True)
        self.generate_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        QMessageBox.information(self, "成功", "视频生成成功！")
    
    def on_generation_error(self, error_msg):
        self.generate_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        QMessageBox.critical(self, "错误", f"生成失败: {error_msg}")
    
    def save_video(self):
        if not self.generated_video_path:
            return
        
        save_path, _ = QFileDialog.getSaveFileName(
            self, "保存视频", "generated_video.mp4", "MP4文件 (*.mp4)"
        )
        if save_path:
            import shutil
            shutil.copy2(self.generated_video_path, save_path)
            QMessageBox.information(self, "成功", "视频保存成功！")
