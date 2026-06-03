import os
from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, 
    QFileDialog, QGroupBox, QComboBox, QLineEdit, QSpinBox,
    QColorDialog, QMessageBox, QSlider
)
from PyQt5.QtGui import QPixmap, QImage, QColor
from PyQt5.QtCore import Qt, QPoint
from PIL import Image
from utils import crop_image, apply_filter, add_text_overlay, validate_image_file, generate_unique_filename
from config import get_config

class ImageEditorWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.current_image_path = None
        self.edited_image_path = None
        self.crop_start = None
        self.crop_end = None
        self.is_cropping = False
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
        panel = QGroupBox("编辑工具")
        layout = QVBoxLayout(panel)
        layout.setSpacing(15)
        
        open_btn = QPushButton("打开图片")
        open_btn.clicked.connect(self.open_image)
        open_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                padding: 12px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #0b7dda;
            }
        """)
        layout.addWidget(open_btn)
        
        filter_group = QGroupBox("滤镜效果")
        filter_layout = QVBoxLayout(filter_group)
        
        self.filter_combo = QComboBox()
        self.filter_combo.addItems([
            "原始", "灰度", "复古", "亮度增强", "对比度增强", "模糊", "锐化"
        ])
        filter_layout.addWidget(self.filter_combo)
        
        apply_filter_btn = QPushButton("应用滤镜")
        apply_filter_btn.clicked.connect(self.apply_filter)
        filter_layout.addWidget(apply_filter_btn)
        
        layout.addWidget(filter_group)
        
        text_group = QGroupBox("文字叠加")
        text_layout = QVBoxLayout(text_group)
        
        text_layout.addWidget(QLabel("文字内容:"))
        self.text_input = QLineEdit()
        self.text_input.setPlaceholderText("输入要叠加的文字")
        text_layout.addWidget(self.text_input)
        
        pos_layout = QHBoxLayout()
        pos_layout.addWidget(QLabel("X:"))
        self.text_x = QSpinBox()
        self.text_x.setRange(0, 2000)
        self.text_x.setValue(10)
        pos_layout.addWidget(self.text_x)
        
        pos_layout.addWidget(QLabel("Y:"))
        self.text_y = QSpinBox()
        self.text_y.setRange(0, 2000)
        self.text_y.setValue(10)
        pos_layout.addWidget(self.text_y)
        text_layout.addLayout(pos_layout)
        
        size_layout = QHBoxLayout()
        size_layout.addWidget(QLabel("字号:"))
        self.text_size = QSpinBox()
        self.text_size.setRange(12, 100)
        self.text_size.setValue(24)
        size_layout.addWidget(self.text_size)
        text_layout.addLayout(size_layout)
        
        color_layout = QHBoxLayout()
        self.text_color = QPushButton("选择颜色")
        self.text_color.clicked.connect(self.choose_color)
        self.current_color = QColor(255, 255, 255)
        self.text_color.setStyleSheet("background-color: white;")
        color_layout.addWidget(self.text_color)
        text_layout.addLayout(color_layout)
        
        add_text_btn = QPushButton("添加文字")
        add_text_btn.clicked.connect(self.add_text)
        text_layout.addWidget(add_text_btn)
        
        layout.addWidget(text_group)
        
        crop_group = QGroupBox("裁剪")
        crop_layout = QVBoxLayout(crop_group)
        
        crop_info = QLabel("在图片上拖拽选择裁剪区域")
        crop_info.setStyleSheet("color: #666;")
        crop_layout.addWidget(crop_info)
        
        crop_btn = QPushButton("执行裁剪")
        crop_btn.clicked.connect(self.perform_crop)
        crop_layout.addWidget(crop_btn)
        
        layout.addWidget(crop_group)
        
        reset_btn = QPushButton("重置图片")
        reset_btn.clicked.connect(self.reset_image)
        reset_btn.setStyleSheet("""
            QPushButton {
                background-color: #FF9800;
                color: white;
                padding: 10px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #e68a00;
            }
        """)
        layout.addWidget(reset_btn)
        
        save_btn = QPushButton("保存编辑结果")
        save_btn.clicked.connect(self.save_edited_image)
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 12px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        layout.addWidget(save_btn)
        
        layout.addStretch()
        
        return panel
    
    def create_right_panel(self):
        panel = QGroupBox("图片预览")
        layout = QVBoxLayout(panel)
        
        self.image_label = QLabel()
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setMinimumSize(600, 500)
        self.image_label.setStyleSheet("border: 2px dashed #ccc; background: #fafafa;")
        self.image_label.setText("请打开一张图片进行编辑")
        self.image_label.setMouseTracking(True)
        self.image_label.mousePressEvent = self.mouse_press
        self.image_label.mouseMoveEvent = self.mouse_move
        self.image_label.mouseReleaseEvent = self.mouse_release
        
        layout.addWidget(self.image_label)
        
        return panel
    
    def open_image(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self, "选择图片", "", "图片文件 (*.png *.jpg *.jpeg *.bmp *.webp)"
        )
        if filepath and validate_image_file(filepath):
            self.current_image_path = filepath
            self.edited_image_path = filepath
            self.display_image(filepath)
    
    def display_image(self, filepath):
        pixmap = QPixmap(filepath)
        scaled_pixmap = pixmap.scaled(
            self.image_label.size(), 
            Qt.KeepAspectRatio, 
            Qt.SmoothTransformation
        )
        self.image_label.setPixmap(scaled_pixmap)
        self.original_pixmap = pixmap
        self.displayed_pixmap = scaled_pixmap
    
    def apply_filter(self):
        if not self.edited_image_path:
            QMessageBox.warning(self, "提示", "请先打开一张图片")
            return
        
        filter_type = self.filter_combo.currentText()
        filter_map = {
            "原始": "original",
            "灰度": "grayscale",
            "复古": "sepia",
            "亮度增强": "brightness",
            "对比度增强": "contrast",
            "模糊": "blur",
            "锐化": "sharpen"
        }
        
        if filter_type == "原始":
            self.edited_image_path = self.current_image_path
            self.display_image(self.current_image_path)
            return
        
        config = get_config()
        output_dir = config.get('settings', 'output_image_dir')
        filename = generate_unique_filename("edited", "png")
        output_path = os.path.join(output_dir, filename)
        
        try:
            apply_filter(self.edited_image_path, output_path, filter_map[filter_type])
            self.edited_image_path = output_path
            self.display_image(output_path)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"应用滤镜失败: {str(e)}")
    
    def choose_color(self):
        color = QColorDialog.getColor(self.current_color, self, "选择文字颜色")
        if color.isValid():
            self.current_color = color
            self.text_color.setStyleSheet(f"background-color: {color.name()}; color: {'black' if color.lightness() > 128 else 'white'};")
    
    def add_text(self):
        if not self.edited_image_path:
            QMessageBox.warning(self, "提示", "请先打开一张图片")
            return
        
        text = self.text_input.text().strip()
        if not text:
            QMessageBox.warning(self, "提示", "请输入文字内容")
            return
        
        config = get_config()
        output_dir = config.get('settings', 'output_image_dir')
        filename = generate_unique_filename("text_overlay", "png")
        output_path = os.path.join(output_dir, filename)
        
        try:
            position = (self.text_x.value(), self.text_y.value())
            color = (self.current_color.red(), self.current_color.green(), self.current_color.blue())
            add_text_overlay(self.edited_image_path, output_path, text, position, self.text_size.value(), color)
            self.edited_image_path = output_path
            self.display_image(output_path)
        except Exception as e:
            QMessageBox.critical(self, "错误", f"添加文字失败: {str(e)}")
    
    def mouse_press(self, event):
        if event.button() == Qt.LeftButton and self.original_pixmap:
            self.is_cropping = True
            self.crop_start = event.pos()
            self.crop_end = None
    
    def mouse_move(self, event):
        if self.is_cropping and self.original_pixmap:
            self.crop_end = event.pos()
            self.update_crop_preview()
    
    def mouse_release(self, event):
        if event.button() == Qt.LeftButton:
            self.is_cropping = False
    
    def update_crop_preview(self):
        if not self.crop_start or not self.crop_end or not self.displayed_pixmap:
            return
        
        self.display_image(self.edited_image_path)
    
    def perform_crop(self):
        if not self.edited_image_path or not self.crop_start or not self.crop_end:
            QMessageBox.warning(self, "提示", "请先在图片上拖拽选择裁剪区域")
            return
        
        label_rect = self.image_label.rect()
        img_rect = self.displayed_pixmap.rect()
        img_rect.moveCenter(label_rect.center())
        
        start_x = max(0, self.crop_start.x() - img_rect.left())
        start_y = max(0, self.crop_start.y() - img_rect.top())
        end_x = max(0, self.crop_end.x() - img_rect.left())
        end_y = max(0, self.crop_end.y() - img_rect.top())
        
        scale_x = self.original_pixmap.width() / img_rect.width()
        scale_y = self.original_pixmap.height() / img_rect.height()
        
        left = int(min(start_x, end_x) * scale_x)
        top = int(min(start_y, end_y) * scale_y)
        right = int(max(start_x, end_x) * scale_x)
        bottom = int(max(start_y, end_y) * scale_y)
        
        config = get_config()
        output_dir = config.get('settings', 'output_image_dir')
        filename = generate_unique_filename("cropped", "png")
        output_path = os.path.join(output_dir, filename)
        
        try:
            crop_image(self.edited_image_path, output_path, left, top, right, bottom)
            self.edited_image_path = output_path
            self.display_image(output_path)
            self.crop_start = None
            self.crop_end = None
        except Exception as e:
            QMessageBox.critical(self, "错误", f"裁剪失败: {str(e)}")
    
    def reset_image(self):
        if self.current_image_path:
            self.edited_image_path = self.current_image_path
            self.display_image(self.current_image_path)
            self.crop_start = None
            self.crop_end = None
    
    def save_edited_image(self):
        if not self.edited_image_path:
            QMessageBox.warning(self, "提示", "没有可保存的图片")
            return
        
        save_path, _ = QFileDialog.getSaveFileName(
            self, "保存图片", "edited_image.png", "PNG文件 (*.png);;JPEG文件 (*.jpg)"
        )
        if save_path:
            with Image.open(self.edited_image_path) as img:
                img.save(save_path)
            QMessageBox.information(self, "成功", "图片保存成功！")
