# AI视频生成工作流

一款基于Python + PyQt + MySQL的AI视频生成桌面应用软件，支持文生图、图生图、文生视频、图生视频、多图序列视频等多种生成模式。

## 功能特性

### 图片生成功能
- **文生图**：输入文本描述，生成对应图片；支持负面提示词
- **图生图**：上传参考图，结合文本描述生成变体
- **分辨率选择**：支持512×512、768×768、1024×1024等多种预设
- **批量生成**：一次生成2-8张图，用户可从中选择满意的

### 图片编辑功能
- **裁剪**：自由选择区域进行裁剪
- **滤镜**：灰度、复古、亮度增强、对比度增强、模糊、锐化等
- **文字叠加**：自定义文字内容、位置、大小、颜色

### 视频生成功能
- **图生视频**：上传参考图片，生成动态视频片段
- **文生视频**：纯文本描述直接生成视频
- **多图序列视频**：上传多张图片，生成过渡动画视频
- **视频时长**：支持3秒、5秒、10秒、15秒、20秒可选

### 模型配置
- 前台配置模型API地址和密钥
- 后台配置文件作为默认值
- 支持独立配置5种生成模式的模型

## 环境要求

- Python 3.8+
- MySQL 5.7+ 或 MySQL 8.0+
- Windows 10/11

## 安装步骤

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 配置MySQL数据库

确保MySQL服务已启动，然后执行数据库初始化脚本：

```bash
python init_db.py
```

数据库配置位于 `config/config.ini`：
- host: localhost
- port: 3306
- user: root
- password: 871502794
- database: ai_video_workflow

### 3. 配置模型API

在 `config/config.ini` 中配置各模型的API地址和密钥（留空可后续在软件中配置）：

```ini
[models]
text_to_image_api = 文生图API地址
text_to_image_key = 文生图API密钥
image_to_image_api = 图生图API地址
image_to_image_key = 图生图API密钥
image_to_video_api = 图生视频API地址
image_to_video_key = 图生视频API密钥
text_to_video_api = 文生视频API地址
text_to_video_key = 文生视频API密钥
sequence_to_video_api = 序列图生视频API地址
sequence_to_video_key = 序列图生视频API密钥
```

也可以在软件启动后，通过菜单栏的「设置」->「模型配置」进行配置。

## 运行方式

### Windows
直接双击 `start.bat` 启动应用程序。

或使用命令行：
```bash
python main.py
```

## 项目结构

```
aModelVideo/
├── config/                 # 配置文件目录
│   ├── __init__.py        # 配置读取模块
│   └── config.ini         # 主配置文件
├── core/                   # 核心功能模块
│   ├── __init__.py
│   └── model_api.py       # 模型API调用模块
├── database/               # 数据库模块
│   ├── __init__.py
│   ├── db.py              # 数据库操作类
│   └── init.sql           # 数据库初始化SQL
├── ui/                     # 界面模块
│   ├── __init__.py
│   ├── main_window.py     # 主窗口
│   ├── image_generation.py # 图片生成界面
│   ├── image_editor.py    # 图片编辑界面
│   ├── video_generation.py # 视频生成界面
│   └── settings_dialog.py # 设置对话框
├── utils/                  # 工具函数
│   ├── __init__.py
│   └── helpers.py         # 辅助函数
├── outputs/                # 输出目录
│   ├── images/            # 生成的图片
│   └── videos/            # 生成的视频
├── assets/                 # 资源文件
├── main.py                # 程序入口
├── init_db.py             # 数据库初始化脚本
├── requirements.txt       # Python依赖
├── start.bat              # Windows启动脚本
└── README.md              # 说明文档
```

## 数据库表结构

### model_configs - 模型配置表
- id: 主键
- model_type: 模型类型
- api_url: API地址
- api_key: API密钥
- created_at: 创建时间
- updated_at: 更新时间

### image_tasks - 图片任务表
- id: 主键
- task_type: 任务类型
- prompt: 正面提示词
- negative_prompt: 负面提示词
- reference_image: 参考图片路径
- resolution: 分辨率
- image_count: 生成数量
- status: 任务状态
- created_at: 创建时间
- completed_at: 完成时间

### generated_images - 生成图片表
- id: 主键
- task_id: 关联任务ID
- image_path: 图片路径
- seed: 随机种子
- created_at: 创建时间

### video_tasks - 视频任务表
- id: 主键
- task_type: 任务类型
- prompt: 视频描述
- reference_images: 参考图片路径列表
- duration: 视频时长
- resolution: 分辨率
- status: 任务状态
- created_at: 创建时间
- completed_at: 完成时间

### generated_videos - 生成视频表
- id: 主键
- task_id: 关联任务ID
- video_path: 视频路径
- created_at: 创建时间

## 使用说明

### 图片生成
1. 选择「图片生成」标签页
2. 选择生成模式：文生图或图生图
3. 输入提示词和负面提示词
4. 选择分辨率和生成数量
5. 点击「开始生成」按钮

### 图片编辑
1. 选择「图片编辑」标签页
2. 点击「打开图片」选择要编辑的图片
3. 使用左侧工具栏进行滤镜、文字叠加、裁剪等操作
4. 点击「保存编辑结果」保存

### 视频生成
1. 选择「视频生成」标签页
2. 选择生成模式：文生视频、图生视频或多图序列视频
3. 添加参考图片（如需要）
4. 输入视频描述
5. 选择视频时长和分辨率
6. 点击「开始生成」按钮

## 注意事项

1. 所有生成内容保存在本地 `outputs` 目录下，保护用户数据隐私
2. 模型API需要用户自行配置，支持各种兼容的AI生成服务
3. 首次使用请确保MySQL服务已启动并执行了数据库初始化
4. 网络请求超时时间较长，请耐心等待生成结果

## License

MIT License
