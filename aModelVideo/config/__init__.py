import configparser
import os

config = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(__file__), 'config.ini')
config.read(config_path, encoding='utf-8')

def get_config():
    return config

def save_config():
    with open(config_path, 'w', encoding='utf-8') as f:
        config.write(f)

def get_model_config(model_type):
    api_key = config.get('models', f'{model_type}_api', fallback='')
    secret_key = config.get('models', f'{model_type}_key', fallback='')
    return api_key, secret_key

def set_model_config(model_type, api_url, api_key):
    config.set('models', f'{model_type}_api', api_url)
    config.set('models', f'{model_type}_key', api_key)
    save_config()
