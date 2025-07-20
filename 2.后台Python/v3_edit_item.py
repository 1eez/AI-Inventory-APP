#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物品编辑模块 - v3版本

@Author: lordli
@Date: 2025-07-15
@Version: 3.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

class EditItemRequest(BaseModel):
    """编辑物品请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    item_id: int = Field(..., description="物品ID")
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="物品标题")
    description: Optional[str] = Field(None, max_length=1000, description="物品描述")
    category: Optional[str] = Field(None, max_length=100, description="物品分类")
    tags: Optional[List[str]] = Field(None, description="物品标签列表")

def verify_item_ownership(item_id: int, user_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证物品是否属于指定用户
    
    Args:
        item_id: 物品ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 是否属于该用户
    """
    query = "SELECT COUNT(*) as count FROM items_detail WHERE item_id = ? AND user_id = ?"
    result = db_manager.execute_query(query, (item_id, user_id), fetch_one=True)
    return result['count'] > 0

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

def update_item_tag_relations(item_id: int, new_tag_names: List[str], db_manager: DatabaseManager) -> None:
    """
    更新物品与标签的关联关系
    
    Args:
        item_id: 物品ID
        new_tag_names: 新的标签名称列表
        db_manager: 数据库管理器实例
    """
    # 删除该物品的所有现有标签关联
    delete_query = "DELETE FROM items_tags WHERE item_id = ?"
    db_manager.execute_query(delete_query, (item_id,))
    
    # 如果有新标签，则创建新的关联
    if new_tag_names:
        for tag_name in new_tag_names:
            if tag_name.strip():  # 确保标签名不为空
                tag_id = get_or_create_tag(tag_name.strip(), db_manager)
                
                # 创建物品标签关联
                insert_query = "INSERT INTO items_tags (item_id, tag_id) VALUES (?, ?)"
                db_manager.execute_query(insert_query, (item_id, tag_id))

def update_item(item_id: int, item_data: EditItemRequest, db_manager: DatabaseManager) -> None:
    """
    更新物品信息
    
    Args:
        item_id: 物品ID
        item_data: 物品更新数据
        db_manager: 数据库管理器实例
    """
    # 构建动态更新SQL
    update_fields = []
    update_values = []
    
    if item_data.title is not None:
        update_fields.append("title = ?")
        update_values.append(item_data.title)
    
    if item_data.description is not None:
        update_fields.append("description = ?")
        update_values.append(item_data.description)
    
    if item_data.category is not None:
        update_fields.append("category = ?")
        update_values.append(item_data.category)
    
    # 检查是否有字段需要更新或者有标签需要更新
    if not update_fields and item_data.tags is None:
        raise HTTPException(status_code=400, detail="没有提供需要更新的字段")
    
    # 如果有基本字段需要更新
    if update_fields:
        # 添加item_id到参数列表末尾
        update_values.append(item_id)
        
        # 构建完整的UPDATE SQL语句
        query = f"UPDATE items_detail SET {', '.join(update_fields)} WHERE item_id = ?"
        
        db_manager.execute_query(query, tuple(update_values))
    
    # 如果有标签需要更新
    if item_data.tags is not None:
        update_item_tag_relations(item_id, item_data.tags, db_manager)

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
    SELECT item_id, user_id, box_id, bag_id, sort_id, title, description, category, image_filename, created_at 
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

@router.post("/v3/item/edit")
async def edit_item(item_data: EditItemRequest = Body(...)):
    """
    编辑物品接口
    
    Args:
        item_data: 物品编辑数据
        
    Returns:
        Dict: 编辑结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(item_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证物品是否属于该用户
        if not verify_item_ownership(item_data.item_id, user_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限编辑该物品")
        
        # 更新物品信息
        update_item(item_data.item_id, item_data, db_manager)
        
        # 获取更新后的物品信息
        item_info = get_item_info(item_data.item_id, db_manager)
        
        return {
            "status": "success",
            "message": "物品编辑成功",
            "data": {
                "item_info": item_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")