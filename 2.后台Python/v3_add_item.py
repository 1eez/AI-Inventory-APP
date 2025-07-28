#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物品管理模块 - v3版本 - 添加物品

@Author: lordli
@Date: 2025-07-15
@Version: 3.0
"""

import os
import shutil
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

class AddItemRequest(BaseModel):
    """添加物品请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    box_id: int = Field(..., description="储物箱ID")
    bag_id: int = Field(..., description="袋子ID")
    title: str = Field(..., min_length=1, max_length=200, description="物品标题")
    description: Optional[str] = Field(default="", max_length=1000, description="物品描述")
    category: Optional[str] = Field(default="", max_length=100, description="物品分类")
    image_filename: Optional[str] = Field(default="", max_length=255, description="图片文件名")
    tags: Optional[List[str]] = Field(default=[], description="物品标签列表")

def verify_bag_ownership(user_id: int, box_id: int, bag_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证袋子是否属于指定用户的指定储物箱
    
    Args:
        user_id: 用户ID
        box_id: 储物箱ID
        bag_id: 袋子ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 袋子是否属于该用户的该储物箱
    """
    query = """
    SELECT COUNT(*) as count 
    FROM bags_summary b 
    JOIN boxes_summary box ON b.box_id = box.box_id 
    WHERE b.bag_id = ? AND b.box_id = ? AND box.user_id = ?
    """
    result = db_manager.execute_query(query, (bag_id, box_id, user_id), fetch_one=True)
    return result['count'] > 0

def get_next_sort_id(box_id: int, bag_id: int, db_manager: DatabaseManager) -> int:
    """
    获取袋子下一个物品排序ID
    
    Args:
        box_id: 储物箱ID
        bag_id: 袋子ID（可为空）
        db_manager: 数据库管理器实例
        
    Returns:
        int: 下一个排序ID
    """
    if bag_id:
        query = "SELECT COALESCE(MAX(sort_id), 0) + 1 as next_sort_id FROM items_detail WHERE box_id = ? AND bag_id = ?"
        result = db_manager.execute_query(query, (box_id, bag_id), fetch_one=True)
    else:
        query = "SELECT COALESCE(MAX(sort_id), 0) + 1 as next_sort_id FROM items_detail WHERE box_id = ? AND bag_id IS NULL"
        result = db_manager.execute_query(query, (box_id,), fetch_one=True)
    return result['next_sort_id']

def get_or_create_tag(tag_name: str, db_manager: DatabaseManager) -> int:
    """
    获取或创建标签
    
    Args:
        tag_name: 标签名称
        db_manager: 数据库管理器实例
        
    Returns:
        int: 标签ID
    """
    # 先尝试获取已存在的标签
    query = "SELECT tag_id FROM tags WHERE name = ?"
    result = db_manager.execute_query(query, (tag_name,), fetch_one=True)
    
    if result:
        return result['tag_id']
    
    # 如果标签不存在，则创建新标签
    insert_query = "INSERT INTO tags (name) VALUES (?)"
    return db_manager.execute_insert(insert_query, (tag_name,))

def create_item_tag_relations(item_id: int, tag_names: List[str], db_manager: DatabaseManager) -> None:
    """
    创建物品与标签的关联关系
    
    Args:
        item_id: 物品ID
        tag_names: 标签名称列表
        db_manager: 数据库管理器实例
    """
    if not tag_names:
        return
    
    for tag_name in tag_names:
        if tag_name.strip():  # 确保标签名不为空
            tag_id = get_or_create_tag(tag_name.strip(), db_manager)
            
            # 创建物品标签关联（使用INSERT OR IGNORE避免重复插入）
            query = "INSERT OR IGNORE INTO items_tags (item_id, tag_id) VALUES (?, ?)"
            db_manager.execute_query(query, (item_id, tag_id))

def process_image_file(user_id: int, image_filename: str) -> Optional[str]:
    """
    处理图片文件：从temp目录移动到用户专属目录
    
    Args:
        user_id: 用户ID
        image_filename: 图片文件名
        
    Returns:
        Optional[str]: 图片相对路径，如果处理失败则返回None
    """
    if not image_filename:
        return None
    
    # 获取当前程序目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 构建temp目录路径
    temp_dir = os.path.join(current_dir, "Photos", "temp")
    temp_file_path = os.path.join(temp_dir, image_filename)
    
    # 检查temp目录下的图片文件是否存在
    if not os.path.exists(temp_file_path):
        return None
    
    # 构建用户目录路径
    user_dir = os.path.join(current_dir, "Photos", str(user_id))
    
    # 如果用户目录不存在，则创建
    if not os.path.exists(user_dir):
        os.makedirs(user_dir, exist_ok=True)
    
    # 构建目标文件路径
    target_file_path = os.path.join(user_dir, image_filename)
    
    try:
        # 如果目标文件已存在，先删除
        if os.path.exists(target_file_path):
            os.remove(target_file_path)
        
        # 移动文件（相当于剪切）
        shutil.move(temp_file_path, target_file_path)
        
        # 返回相对路径
        return f"{user_id}/{image_filename}"
    except Exception:
        # 如果移动失败，返回None
        return None

def create_item(user_id: int, box_id: int, bag_id: int, item_data: AddItemRequest, db_manager: DatabaseManager) -> int:
    """
    创建新物品
    
    Args:
        user_id: 用户ID
        box_id: 储物箱ID
        bag_id: 袋子ID
        item_data: 物品数据
        db_manager: 数据库管理器实例
        
    Returns:
        int: 新创建的物品ID
    """
    # 获取下一个排序ID
    sort_id = get_next_sort_id(box_id, bag_id, db_manager)
    
    # 插入物品数据
    query = """
    INSERT INTO items_detail (user_id, box_id, bag_id, sort_id, title, description, category, image_filename, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    item_id = db_manager.execute_insert(
        query, 
        (
            user_id,
            box_id,
            bag_id,
            sort_id,
            item_data.title,
            item_data.description,
            item_data.category,
            item_data.image_filename,
            datetime.now().isoformat()
        )
    )
    
    # 处理标签关联
    if item_data.tags:
        create_item_tag_relations(item_id, item_data.tags, db_manager)
    
    return item_id

def get_item_info(item_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取物品信息
    
    Args:
        item_id: 物品ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 物品信息（包含标签）
    """
    # 获取物品基本信息
    query = """
    SELECT item_id, box_id, bag_id, sort_id, title, description, category, image_filename, created_at 
    FROM items_detail 
    WHERE item_id = ?
    """
    
    result = db_manager.execute_query(query, (item_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="物品不存在")
    
    item_info = dict(result)
    
    # 获取物品标签
    tags_query = """
    SELECT t.name 
    FROM tags t 
    JOIN items_tags it ON t.tag_id = it.tag_id 
    WHERE it.item_id = ?
    """
    
    tags_result = db_manager.execute_query(tags_query, (item_id,))
    item_info['tags'] = [tag['name'] for tag in tags_result] if tags_result else []
    
    return item_info

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v3/item/add")
async def add_item(item_data: AddItemRequest = Body(...)):
    """
    添加物品接口
    
    Args:
        item_data: 物品数据
        
    Returns:
        Dict: 创建结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(item_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证袋子是否属于该用户的该储物箱
        if not verify_bag_ownership(user_id, item_data.box_id, item_data.bag_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限在此袋子中添加物品")
        
        # 处理图片文件
        image_relative_path = None
        if item_data.image_filename:
            image_relative_path = process_image_file(user_id, item_data.image_filename)
            if image_relative_path is None:
                raise HTTPException(status_code=400, detail="图片文件不存在或处理失败")
        
        # 更新item_data中的image_filename为处理后的相对路径
        if image_relative_path:
            item_data.image_filename = image_relative_path
        
        # 创建物品
        item_id = create_item(user_id, item_data.box_id, item_data.bag_id, item_data, db_manager)
        
        # 获取创建的物品信息
        item_info = get_item_info(item_id, db_manager)
        
        return {
            "status": "success",
            "message": "物品创建成功",
            "data": {
                "item_info": item_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")