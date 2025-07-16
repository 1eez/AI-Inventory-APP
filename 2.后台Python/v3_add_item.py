#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物品管理模块 - v3版本 - 添加物品

@Author: lordli
@Date: 2025-07-15
@Version: 3.0
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from common_db import DatabaseManager

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
    image_path: Optional[str] = Field(default="", max_length=500, description="图片路径")

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

def get_next_sort_id(bag_id: int, db_manager: DatabaseManager) -> int:
    """
    获取袋子下一个物品排序ID
    
    Args:
        bag_id: 袋子ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 下一个排序ID
    """
    query = "SELECT COALESCE(MAX(sort_id), 0) + 1 as next_sort_id FROM items_detail WHERE bag_id = ?"
    result = db_manager.execute_query(query, (bag_id,), fetch_one=True)
    return result['next_sort_id']

def create_item(bag_id: int, item_data: AddItemRequest, db_manager: DatabaseManager) -> int:
    """
    创建新物品
    
    Args:
        bag_id: 袋子ID
        item_data: 物品数据
        db_manager: 数据库管理器实例
        
    Returns:
        int: 新创建的物品ID
    """
    # 获取下一个排序ID
    sort_id = get_next_sort_id(bag_id, db_manager)
    
    # 插入物品数据
    query = """
    INSERT INTO items_detail (bag_id, sort_id, title, description, category, image_path, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    
    return db_manager.execute_insert(
        query, 
        (
            bag_id,
            sort_id,
            item_data.title,
            item_data.description,
            item_data.category,
            item_data.image_path,
            datetime.now().isoformat()
        )
    )

def get_item_info(item_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取物品信息
    
    Args:
        item_id: 物品ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 物品信息
    """
    query = """
    SELECT item_id, bag_id, sort_id, title, description, category, image_path, created_at 
    FROM items_detail 
    WHERE item_id = ?
    """
    
    result = db_manager.execute_query(query, (item_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="物品不存在")
    
    return dict(result)

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
        
        # 创建物品
        item_id = create_item(item_data.bag_id, item_data, db_manager)
        
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