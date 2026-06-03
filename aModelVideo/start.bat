@echo off
echo ========================================
echo AI视频生成工作流 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查Python环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)
echo Python环境检查通过
echo.

echo [2/3] 检查依赖包...
pip show PyQt5 >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在安装依赖包...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
)
echo 依赖包检查通过
echo.

echo [3/3] 检查数据库...
python -c "import pymysql" >nul 2>&1
if %errorlevel% equ 0 (
    echo 数据库模块已安装
)
echo.

echo 正在启动应用程序...
python main.py

if %errorlevel% neq 0 (
    echo.
    echo 程序异常退出，错误代码: %errorlevel%
    pause
)
