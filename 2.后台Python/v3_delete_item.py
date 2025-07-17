#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物品删除模块 - v3版本

@Author: lordli
@Date: 2025-07-15
@Version: 3.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

class DeleteItemRequest(BaseModel):
    """删除物品请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    box_id: int = Field(..., description="储物箱ID")
    bag_id: int = Field(..., description="袋子ID")
    item_id: int = Field(..., description="物品ID")

def verify_item_ownership(user_id: int, box_id: int, bag_id: int, item_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证物品是否属于指定用户的指定储物箱的指定袋子
    
    Args:
        user_id: 用户ID
        box_id: 储物箱ID
        bag_id: 袋子ID
        item_id: 物品ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 物品是否属于该用户的该储物箱的该袋子
    """
    query = """
    SELECT COUNT(*) as count 
    FROM items_detail i 
    JOIN bags_summary b ON i.bag_id = b.bag_id 
    JOIN boxes_summary box ON b.box_id = box.box_id 
    WHERE i.item_id = ? AND i.bag_id = ? AND b.box_id = ? AND box.user_id = ?
    """
    result = db_manager.execute_query(query, (item_id, bag_id, box_id, user_id), fetch_one=True)
    return result['count'] > 0

def get_item_info_before_delete(item_id: int, bag_id: int, box_id: int, user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    删除前获取物品信息
    
    Args:
        item_id: 物品ID
        bag_id: 袋子ID
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 物品信息
    """
    query = """
    SELECT i.item_id, i.box_id, i.bag_id, i.sort_id, i.title, i.description, i.category, i.image_filename, i.created_at 
    FROM items_detail i 
    JOIN bags_summary b ON i.bag_id = b.bag_id 
    JOIN boxes_summary box ON b.box_id = box.box_id 
    WHERE i.item_id = ? AND i.bag_id = ? AND b.box_id = ? AND box.user_id = ?
    """
    
    result = db_manager.execute_query(query, (item_id, bag_id, box_id, user_id), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="物品不存在或无权限删除")
    
    return dict(result)

def delete_item(item_id: int, bag_id: int, box_id: int, user_id: int, db_manager: DatabaseManager) -> int:
    """
    删除物品
    
    Args:
        item_id: 物品ID
        bag_id: 袋子ID
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 受影响的行数
    """
    # 先验证权限，然后删除
    query = """
    DELETE FROM items_detail 
    WHERE item_id = ? AND bag_id = ? AND bag_id IN (
        SELECT b.bag_id FROM bags_summary b 
        JOIN boxes_summary box ON b.box_id = box.box_id 
        WHERE b.bag_id = ? AND b.box_id = ? AND box.user_id = ?
    )
    """
    affected_rows = db_manager.execute_update(query, (item_id, bag_id, bag_id, box_id, user_id))
    
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="物品不存在或无权限删除")
    
    return affected_rows

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v3/item/delete")
async def delete_item_endpoint(delete_data: DeleteItemRequest = Body(...)):
    """
    删除物品接口
    
    Args:
        delete_data: 删除请求数据
        
    Returns:
        Dict: 删除结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(delete_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 获取物品信息（删除前）
        item_info = get_item_info_before_delete(delete_data.item_id, delete_data.bag_id, delete_data.box_id, user_id, db_manager)
        
        # 删除物品
        affected_rows = delete_item(delete_data.item_id, delete_data.bag_id, delete_data.box_id, user_id, db_manager)
        
        return {
            "status": "success",
            "message": "物品删除成功",
            "data": {
                "deleted_item_info": item_info,
                "affected_rows": affected_rows
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")