import os
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, 
    QComboBox, QSpinBox, QPushButton, QFileDialog, QScrollArea,
    QGridLayout, QFrame, QProgressBar, QMessageBox, QGroupBox
)
from PyQt5.QtGui import QPixmap, QImage
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PIL import Image
from core import get_model_api
from database import get_db
from utils import save_base64_image, validate_image_file

class ImageGenerationWorker(QThread):
    finished = pyqtSignal(list)
    error = pyqtSignal(str)
    progress = pyqtSignal(int)
    
    def __init__(self, task_type, prompt, negative_prompt, reference_image, resolution, image_count):
        super().__init__()
        self.task_type = task_type
        self.prompt = prompt
        self.negative_prompt = negative_prompt
        self.reference_image = reference_image
        self.resolution = resolution
        self.image_count = image_count
        self.model_api = get_model_api()
        self.db = get_db()
    
    def run(self):
        try:
            self.progress.emit(20)
            
            task_id = self.db.create_image_task(
                self.task_type,
                self.prompt,
                self.negative_prompt,
                self.reference_image,
                self.resolution,
                self.image_count
            )
            
            self.progress.emit(40)
            
            if self.task_type == "text_to_image":
                images = self.model_api.text_to_image(
                    self.prompt,
                    self.negative_prompt,
                    self.resolution,
                    self.image_count
                )
            else:
                images = self.model_api.image_to_image(
                    self.reference_image,
                    self.prompt,
                    self.negative_prompt,
                    self.resolution,
                    self.image_count
                )
            
            self.progress.emit(80)
            
            saved_paths = []
            for img in images:
                filepath = save_base64_image(img['data'])
                saved_paths.append(filepath)
                self.db.add_generated_image(task_id, filepath, img.get('seed', ''))
            
            self.db.complete_image_task(task_id)
            self.progress.emit(100)
            
            self.finished.emit(saved_paths)
        except Exception as e:
            self.error.emit(str(e))

class ImageGenerationWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.generated_images = []
        self.reference_image_path = None
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
        self.mode_combo.addItems(["文生图", "图生图"])
        self.mode_combo.currentTextChanged.connect(self.on_mode_changed)
        mode_layout.addWidget(self.mode_combo)
        layout.addLayout(mode_layout)
        
        self.reference_btn = QPushButton("上传参考图片")
        self.reference_btn.clicked.connect(self.upload_reference_image)
        self.reference_btn.hide()
        self.reference_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                padding: 10px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #0b7dda;
            }
        """)
        layout.addWidget(self.reference_btn)
        
        self.reference_label = QLabel()
        self.reference_label.setAlignment(Qt.AlignCenter)
        self.reference_label.setFixedHeight(150)
        self.reference_label.setStyleSheet("border: 1px dashed #ccc; background: #fafafa;")
        self.reference_label.hide()
        layout.addWidget(self.reference_label)
        
        layout.addWidget(QLabel("正面提示词:"))
        self.prompt_edit = QTextEdit()
        self.prompt_edit.setPlaceholderText("请输入图片描述...")
        self.prompt_edit.setMinimumHeight(100)
        layout.addWidget(self.prompt_edit)
        
        layout.addWidget(QLabel("负面提示词:"))
        self.negative_prompt_edit = QTextEdit()
        self.negative_prompt_edit.setPlaceholderText("请输入不想出现的内容...")
        self.negative_prompt_edit.setMaximumHeight(80)
        layout.addWidget(self.negative_prompt_edit)
        
        resolution_layout = QHBoxLayout()
        resolution_layout.addWidget(QLabel("分辨率:"))
        self.resolution_combo = QComboBox()
        self.resolution_combo.addItems(["512x512", "768x768", "1024x1024", "1024x768", "768x1024"])
        self.resolution_combo.setCurrentText("1024x1024")
        resolution_layout.addWidget(self.resolution_combo)
        layout.addLayout(resolution_layout)
        
        count_layout = QHBoxLayout()
        count_layout.addWidget(QLabel("生成数量:"))
        self.count_spin = QSpinBox()
        self.count_spin.setRange(2, 8)
        self.count_spin.setValue(4)
        count_layout.addWidget(self.count_spin)
        layout.addLayout(count_layout)
        
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
        
        return panel
    
    def create_right_panel(self):
        panel = QGroupBox("生成结果")
        layout = QVBoxLayout(panel)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("QScrollArea { border: none; }")
        
        self.images_container = QWidget()
        self.images_layout = QGridLayout(self.images_container)
        self.images_layout.setSpacing(10)
        
        scroll.setWidget(self.images_container)
        layout.addWidget(scroll)
        
        return panel
    
    def on_mode_changed(self, mode):
        if mode == "图生图":
            self.reference_btn.show()
            if self.reference_image_path:
                self.reference_label.show()
        else:
            self.reference_btn.hide()
            self.reference_label.hide()
    
    def upload_reference_image(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self, "选择参考图片", "", "图片文件 (*.png *.jpg *.jpeg *.bmp *.webp)"
        )
        if filepath and validate_image_file(filepath):
            self.reference_image_path = filepath
            pixmap = QPixmap(filepath)
            self.reference_label.setPixmap(pixmap.scaled(
                self.reference_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation
            ))
            self.reference_label.show()
    
    def start_generation(self):
        prompt = self.prompt_edit.toPlainText().strip()
        if not prompt:
            QMessageBox.warning(self, "提示", "请输入提示词")
            return
        
        mode = self.mode_combo.currentText()
        task_type = "text_to_image" if mode == "文生图" else "image_to_image"
        
        if task_type == "image_to_image" and not self.reference_image_path:
            QMessageBox.warning(self, "提示", "请上传参考图片")
            return
        
        self.generate_btn.setEnabled(False)
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        
        self.worker = ImageGenerationWorker(
            task_type,
            prompt,
            self.negative_prompt_edit.toPlainText().strip(),
            self.reference_image_path,
            self.resolution_combo.currentText(),
            self.count_spin.value()
        )
        self.worker.finished.connect(self.on_generation_finished)
        self.worker.error.connect(self.on_generation_error)
        self.worker.progress.connect(self.progress_bar.setValue)
        self.worker.start()
    
    def on_generation_finished(self, image_paths):
        self.generated_images = image_paths
        self.display_images()
        self.generate_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        QMessageBox.information(self, "成功", f"成功生成 {len(image_paths)} 张图片！")
    
    def on_generation_error(self, error_msg):
        self.generate_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        QMessageBox.critical(self, "错误", f"生成失败: {error_msg}")
    
    def display_images(self):
        for i in reversed(range(self.images_layout.count())):
            self.images_layout.itemAt(i).widget().setParent(None)
        
        for idx, img_path in enumerate(self.generated_images):
            img_frame = QFrame()
            img_frame.setFrameShape(QFrame.StyledPanel)
            img_frame.setStyleSheet("QFrame { border: 1px solid #ddd; padding: 5px; }")
            
            frame_layout = QVBoxLayout(img_frame)
            
            img_label = QLabel()
            pixmap = QPixmap(img_path)
            img_label.setPixmap(pixmap.scaled(250, 250, Qt.KeepAspectRatio, Qt.SmoothTransformation))
            img_label.setAlignment(Qt.AlignCenter)
            frame_layout.addWidget(img_label)
            
            btn_layout = QHBoxLayout()
            
            save_btn = QPushButton("保存")
            save_btn.clicked.connect(lambda checked, path=img_path: self.save_image(path))
            save_btn.setStyleSheet("""
                QPushButton {
                    background-color: #2196F3;
                    color: white;
                    padding: 5px 10px;
                    border: none;
                    border-radius: 3px;
                }
                QPushButton:hover {
                    background-color: #0b7dda;
                }
            """)
            btn_layout.addWidget(save_btn)
            
            frame_layout.addLayout(btn_layout)
            
            row = idx // 3
            col = idx % 3
            self.images_layout.addWidget(img_frame, row, col)
    
    def save_image(self, img_path):
        save_path, _ = QFileDialog.getSaveFileName(
            self, "保存图片", os.path.basename(img_path), "PNG文件 (*.png);;JPEG文件 (*.jpg)"
        )
        if save_path:
            with Image.open(img_path) as img:
                img.save(save_path)
            QMessageBox.information(self, "成功", "图片保存成功！")
