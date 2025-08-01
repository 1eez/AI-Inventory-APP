#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
袋子删除模块 - v2版本

@Author: lordli
@Date: 2025-07-15
@Version: 2.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

class DeleteBagRequest(BaseModel):
    """删除袋子请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    box_id: int = Field(..., description="储物箱ID")
    bag_id: int = Field(..., description="袋子ID")

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

def get_bag_info_before_delete(bag_id: int, box_id: int, user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    删除前获取袋子信息
    
    Args:
        bag_id: 袋子ID
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 袋子信息
    """
    query = """
    SELECT b.bag_id, b.box_id, b.sort_id, b.name, b.color, b.created_at 
    FROM bags_summary b 
    JOIN boxes_summary box ON b.box_id = box.box_id 
    WHERE b.bag_id = ? AND b.box_id = ? AND box.user_id = ?
    """
    
    result = db_manager.execute_query(query, (bag_id, box_id, user_id), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="袋子不存在或无权限删除")
    
    return dict(result)

def delete_bag(bag_id: int, box_id: int, user_id: int, db_manager: DatabaseManager) -> int:
    """
    删除袋子
    
    Args:
        bag_id: 袋子ID
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 受影响的行数
    """
    # 先验证权限，然后删除
    query = """
    DELETE FROM bags_summary 
    WHERE bag_id = ? AND box_id = ? AND box_id IN (
        SELECT box_id FROM boxes_summary WHERE user_id = ?
    )
    """
    affected_rows = db_manager.execute_update(query, (bag_id, box_id, user_id))
    
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="袋子不存在或无权限删除")
    
    return affected_rows

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v2/bag/delete")
async def delete_bag_endpoint(delete_data: DeleteBagRequest = Body(...)):
    """
    删除袋子接口
    
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
        
        # 获取袋子信息（删除前）
        bag_info = get_bag_info_before_delete(delete_data.bag_id, delete_data.box_id, user_id, db_manager)
        
        # 删除袋子
        affected_rows = delete_bag(delete_data.bag_id, delete_data.box_id, user_id, db_manager)
        
        return {
            "status": "success",
            "message": "袋子删除成功",
            "data": {
                "deleted_bag_info": bag_info,
                "affected_rows": affected_rows
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")