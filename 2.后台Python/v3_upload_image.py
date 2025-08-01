#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物品管理模块 - v3版本 - 图片上传与AI分析

@Author: lordli
@Date: 2025-01-27
@Version: 3.0
"""

import os
import json
import base64
import time
from datetime import datetime
from typing import Dict, Any
from configparser import ConfigParser
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from PIL import Image
from zhipuai import ZhipuAI
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

# 读取配置文件
config = ConfigParser()
config.read('config.ini', encoding='utf-8')

def ensure_photos_directory():
    """
    确保Photos/temp目录存在
    """
    photos_dir = "Photos"
    temp_dir = os.path.join(photos_dir, "temp")
    
    if not os.path.exists(photos_dir):
        os.makedirs(photos_dir)
    
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    return temp_dir

def compress_image(image_file: UploadFile, quality: int = 85) -> bytes:
    """
    压缩图片，保持原始分辨率
    
    Args:
        image_file: 上传的图片文件
        quality: 压缩质量 (1-100)
        
    Returns:
        bytes: 压缩后的图片数据
    """
    try:
        # 打开图片
        image = Image.open(image_file.file)
        
        # 如果是RGBA模式，转换为RGB
        if image.mode == 'RGBA':
            # 创建白色背景
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1])  # 使用alpha通道作为mask
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 保存到内存中
        from io import BytesIO
        output = BytesIO()
        image.save(output, format='JPEG', quality=quality, optimize=True)
        compressed_data = output.getvalue()
        output.close()
        
        return compressed_data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"图片压缩失败: {str(e)}")

def analyze_image_with_ai(image_data: bytes) -> tuple[str, Dict[str, Any]]:
    """
    使用AI分析图片内容
    
    Args:
        image_data: 图片数据
        
    Returns:
        tuple: (AI原始响应内容, 解析后的结果字典)
    """
    try:
        # 将图片转换为base64
        img_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # 获取配置
        api_key = config.get('zhipu', 'zhipu_api_key')
        model = config.get('zhipu', 'model')
        temperature = config.getfloat('zhipu', 'temperature')
        max_tokens = config.getint('zhipu', 'max_completion_tokens')
        
        # 创建AI客户端
        client = ZhipuAI(api_key=api_key)
        
        # 构建提示词
        prompt = """
请仔细分析这张图片中的物品，并按照以下JSON格式返回分析结果：

{
    "name": "物品的主要名称",
    "description": "物品的一句话描述",
    "category": "物品分类（如：衣服、公仔、床上用品、电子产品、书籍、厨具、装饰品等）",
    "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}

要求：
1. name: 简洁准确的物品名称
2. description: 一句话描述物品的特征、用途或状态
3. category: 选择最合适的家居用品分类，如衣服、公仔、床上用品、电子产品、书籍、厨具、装饰品等
4. tags: 提供10个以上的相关标签，包括颜色（多种）、材质、触感、大小、功能、风格等

请只返回JSON格式的结果，不要包含其他文字。
        """
        
        # 调用AI接口
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": img_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            temperature=temperature
        )
        
        # 获取AI返回的原始内容
        ai_content = response.choices[0].message.content
        
        # 尝试解析JSON
        ai_result = None
        
        # 方法1：直接解析JSON
        try:
            ai_result = json.loads(ai_content)
        except json.JSONDecodeError:
            # 方法2：从markdown代码块中提取JSON
            import re
            # 匹配 ```json 和 ``` 之间的内容
            json_pattern = r'```json\s*\n([\s\S]*?)\n```'
            match = re.search(json_pattern, ai_content, re.IGNORECASE)
            
            if match:
                json_str = match.group(1).strip()
                try:
                    ai_result = json.loads(json_str)
                except json.JSONDecodeError:
                    pass
            
            # 方法3：尝试匹配 ``` 代码块（不带json标识）
            if ai_result is None:
                code_pattern = r'```\s*\n([\s\S]*?)\n```'
                match = re.search(code_pattern, ai_content)
                if match:
                    code_str = match.group(1).strip()
                    try:
                        ai_result = json.loads(code_str)
                    except json.JSONDecodeError:
                        pass
        
        # 如果所有解析方法都失败，返回默认结果
        if ai_result is None:
            ai_result = {
                "name": "未知物品",
                "description": ai_content,
                "category": "其他",
                "tags": []
            }
        
        return ai_content, ai_result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI分析失败: {str(e)}")

def check_user_item_limit(user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    检查用户物品数量是否超过限制
    
    Args:
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 包含用户信息和物品统计的字典
        
    Raises:
        HTTPException: 当物品数量超过限制时抛出异常
    """
    # 获取用户信息（包含item_limit）
    user_query = "SELECT user_id, openid, nickname, item_limit FROM users_summary WHERE user_id = ?"
    user_info = db_manager.execute_query(user_query, (user_id,), fetch_one=True)
    
    if not user_info:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 获取用户当前物品总数
    items_query = """
    SELECT COUNT(*) as item_count 
    FROM items_detail id 
    JOIN bags_summary bs ON id.bag_id = bs.bag_id 
    JOIN boxes_summary bx ON bs.box_id = bx.box_id 
    WHERE bx.user_id = ?
    """
    
    item_count_result = db_manager.execute_query(items_query, (user_id,), fetch_one=True)
    current_item_count = item_count_result['item_count'] if item_count_result else 0
    
    # 检查是否超过限制
    item_limit = user_info['item_limit']
    
    if current_item_count >= item_limit:
        raise HTTPException(
            status_code=200, 
            detail={
                "status": "error",
                "message": f"物品数量已达到上限！当前已有{current_item_count}个物品，限制为{item_limit}个。请观看广告获取更多存储额度。",
                "data": {
                    "current_item_count": current_item_count,
                    "item_limit": item_limit,
                    "remaining_slots": 0,
                    "need_watch_ad": True
                }
            }
        )
    
    return {
        "user_info": dict(user_info),
        "current_item_count": current_item_count,
        "item_limit": item_limit,
        "remaining_slots": item_limit - current_item_count
    }

def save_image_and_log(image_data: bytes, ai_raw_content: str, ai_result: Dict[str, Any]) -> tuple[str, str]:
    """
    保存图片和AI原始响应日志
    
    Args:
        image_data: 图片数据
        ai_raw_content: AI返回的原始内容
        ai_result: 解析后的AI分析结果
        
    Returns:
        tuple: (图片文件名, 日志文件名)
    """
    try:
        # 确保目录存在
        temp_dir = ensure_photos_directory()
        
        # 生成时间戳文件名
        timestamp = str(int(time.time()))
        image_filename = f"{timestamp}.jpg"
        log_filename = f"{timestamp}.log"
        
        # 保存图片
        image_path = os.path.join(temp_dir, image_filename)
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # 保存AI原始响应日志
        log_path = os.path.join(temp_dir, log_filename)
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write(f"=== AI原始响应内容 ===\n")
            f.write(f"时间戳: {timestamp}\n")
            f.write(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"图片文件: {image_filename}\n")
            f.write(f"\n=== AI返回的原始文本 ===\n")
            f.write(ai_raw_content)
            f.write(f"\n\n=== 解析后的结构化数据 ===\n")
            f.write(json.dumps(ai_result, ensure_ascii=False, indent=2))
        
        return image_filename, log_filename
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v3/image/upload")
async def upload_image(
    openid: str = Form(..., description="微信小程序openid"),
    image: UploadFile = File(..., description="上传的图片文件")
):
    """
    图片上传与AI分析接口
    
    Args:
        openid: 微信小程序openid
        image: 上传的图片文件
        
    Returns:
        Dict: 分析结果
    """
    try:
        # 验证用户是否存在
        try:
            user_id = db_manager.get_user_id_by_openid(openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 检查用户物品数量限制
        limit_check_result = check_user_item_limit(user_id, db_manager)
        
        # 验证文件类型
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="请上传有效的图片文件")
        
        # 压缩图片
        compressed_image_data = compress_image(image)
        
        # AI分析图片
        ai_raw_content, ai_result = analyze_image_with_ai(compressed_image_data)
        
        # 保存图片和日志
        image_filename, log_filename = save_image_and_log(compressed_image_data, ai_raw_content, ai_result)
        
        return {
            "status": "success",
            "message": "图片上传和分析成功",
            "data": {
                "image_filename": image_filename,
                "log_filename": log_filename,
                "analysis_result": ai_result,
                "ai_raw_content": ai_raw_content,
                "file_info": {
                    "original_filename": image.filename,
                    "content_type": image.content_type,
                    "compressed_size": len(compressed_image_data)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")