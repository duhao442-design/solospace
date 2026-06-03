import os
import base64
import uuid
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from config import get_config

def generate_unique_filename(prefix: str = "image", extension: str = "png") -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{prefix}_{timestamp}_{unique_id}.{extension}"

def save_base64_image(base64_data: str, output_dir: str = None) -> str:
    config = get_config()
    if output_dir is None:
        output_dir = config.get('settings', 'output_image_dir')
    
    os.makedirs(output_dir, exist_ok=True)
    filename = generate_unique_filename("generated_image", "png")
    filepath = os.path.join(output_dir, filename)
    
    if base64_data.startswith('http'):
        import requests
        response = requests.get(base64_data)
        with open(filepath, 'wb') as f:
            f.write(response.content)
    else:
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        img_data = base64.b64decode(base64_data)
        with open(filepath, 'wb') as f:
            f.write(img_data)
    
    return filepath

def save_base64_video(base64_data: str, output_dir: str = None) -> str:
    config = get_config()
    if output_dir is None:
        output_dir = config.get('settings', 'output_video_dir')
    
    os.makedirs(output_dir, exist_ok=True)
    filename = generate_unique_filename("generated_video", "mp4")
    filepath = os.path.join(output_dir, filename)
    
    if base64_data.startswith('http'):
        import requests
        response = requests.get(base64_data, stream=True)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    else:
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        video_data = base64.b64decode(base64_data)
        with open(filepath, 'wb') as f:
            f.write(video_data)
    
    return filepath

def crop_image(image_path: str, output_path: str, left: int, top: int, right: int, bottom: int) -> str:
    with Image.open(image_path) as img:
        cropped = img.crop((left, top, right, bottom))
        cropped.save(output_path)
    return output_path

def apply_filter(image_path: str, output_path: str, filter_type: str) -> str:
    with Image.open(image_path) as img:
        if filter_type == 'grayscale':
            img = img.convert('L')
        elif filter_type == 'sepia':
            img = img.convert('RGB')
            pixels = img.load()
            for i in range(img.width):
                for j in range(img.height):
                    r, g, b = pixels[i, j]
                    tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                    tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                    tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                    pixels[i, j] = (min(tr, 255), min(tg, 255), min(tb, 255))
        elif filter_type == 'brightness':
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.5)
        elif filter_type == 'contrast':
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.5)
        elif filter_type == 'blur':
            from PIL import ImageFilter
            img = img.filter(ImageFilter.GaussianBlur(radius=2))
        elif filter_type == 'sharpen':
            from PIL import ImageFilter
            img = img.filter(ImageFilter.SHARPEN)
        
        img.save(output_path)
    return output_path

def add_text_overlay(image_path: str, output_path: str, text: str, 
                     position: tuple = (10, 10), 
                     font_size: int = 24, 
                     color: tuple = (255, 255, 255)) -> str:
    with Image.open(image_path) as img:
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        draw.text(position, text, font=font, fill=color)
        img.save(output_path)
    return output_path

def resize_image(image_path: str, output_path: str, size: tuple) -> str:
    with Image.open(image_path) as img:
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path)
    return output_path

def get_image_dimensions(image_path: str) -> tuple:
    with Image.open(image_path) as img:
        return img.size

def get_video_duration(video_path: str) -> float:
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps
        cap.release()
        return duration
    except:
        return 0.0

def validate_image_file(filepath: str) -> bool:
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    ext = os.path.splitext(filepath)[1].lower()
    return ext in valid_extensions

def validate_video_file(filepath: str) -> bool:
    valid_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
    ext = os.path.splitext(filepath)[1].lower()
    return ext in valid_extensions
