import requests
import json
import base64
from typing import List, Dict, Optional, Tuple
from config import get_model_config
from database import get_db

class ModelAPI:
    def __init__(self):
        self.db = get_db()
        self.session = requests.Session()
    
    def _get_model_config(self, model_type: str) -> Tuple[str, str]:
        db_config = self.db.get_model_config(model_type)
        if db_config and db_config['api_url']:
            return db_config['api_url'], db_config['api_key']
        
        return get_model_config(model_type)
    
    def _encode_image(self, image_path: str) -> str:
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    def text_to_image(self, prompt: str, negative_prompt: str = "", 
                      resolution: str = "1024x1024", 
                      image_count: int = 4) -> List[Dict]:
        api_url, api_key = self._get_model_config('text_to_image')
        if not api_url:
            raise ValueError("文生图模型未配置")
        
        width, height = map(int, resolution.split('x'))
        
        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "num_images": image_count
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}" if api_key else ""
        }
        
        response = self.session.post(api_url, json=payload, headers=headers, timeout=300)
        response.raise_for_status()
        result = response.json()
        
        images = []
        if 'images' in result:
            for idx, img_data in enumerate(result['images']):
                images.append({
                    'index': idx,
                    'data': img_data.get('base64', img_data.get('url', '')),
                    'seed': img_data.get('seed', '')
                })
        
        return images
    
    def image_to_image(self, reference_image: str, prompt: str, 
                        negative_prompt: str = "",
                        resolution: str = "1024x1024",
                        image_count: int = 4) -> List[Dict]:
        api_url, api_key = self._get_model_config('image_to_image')
        if not api_url:
            raise ValueError("图生图模型未配置")
        
        width, height = map(int, resolution.split('x'))
        image_base64 = self._encode_image(reference_image)
        
        payload = {
            "image": image_base64,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "num_images": image_count
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}" if api_key else ""
        }
        
        response = self.session.post(api_url, json=payload, headers=headers, timeout=300)
        response.raise_for_status()
        result = response.json()
        
        images = []
        if 'images' in result:
            for idx, img_data in enumerate(result['images']):
                images.append({
                    'index': idx,
                    'data': img_data.get('base64', img_data.get('url', '')),
                    'seed': img_data.get('seed', '')
                })
        
        return images
    
    def image_to_video(self, reference_image: str, duration: int = 5, 
                       resolution: str = "768x768") -> Dict:
        api_url, api_key = self._get_model_config('image_to_video')
        if not api_url:
            raise ValueError("图生视频模型未配置")
        
        image_base64 = self._encode_image(reference_image)
        
        payload = {
            "image": image_base64,
            "duration": duration,
            "resolution": resolution
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}" if api_key else ""
        }
        
        response = self.session.post(api_url, json=payload, headers=headers, timeout=600)
        response.raise_for_status()
        result = response.json()
        
        return {
            'video_data': result.get('video', result.get('url', ''))
        }
    
    def text_to_video(self, prompt: str, duration: int = 5, 
                       resolution: str = "768x768") -> Dict:
        api_url, api_key = self._get_model_config('text_to_video')
        if not api_url:
            raise ValueError("文生视频模型未配置")
        
        payload = {
            "prompt": prompt,
            "duration": duration,
            "resolution": resolution
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}" if api_key else ""
        }
        
        response = self.session.post(api_url, json=payload, headers=headers, timeout=600)
        response.raise_for_status()
        result = response.json()
        
        return {
            'video_data': result.get('video', result.get('url', ''))
        }
    
    def sequence_to_video(self, reference_images: List[str], duration: int = 10,
                        resolution: str = "768x768") -> Dict:
        api_url, api_key = self._get_model_config('sequence_to_video')
        if not api_url:
            raise ValueError("序列图生视频模型未配置")
        
        images_base64 = [self._encode_image(img) for img in reference_images]
        
        payload = {
            "images": images_base64,
            "duration": duration,
            "resolution": resolution
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}" if api_key else ""
        }
        
        response = self.session.post(api_url, json=payload, headers=headers, timeout=600)
        response.raise_for_status()
        result = response.json()
        
        return {
            'video_data': result.get('video', result.get('url', ''))
        }

_model_api_instance = None

def get_model_api():
    global _model_api_instance
    if _model_api_instance is None:
        _model_api_instance = ModelAPI()
    return _model_api_instance
