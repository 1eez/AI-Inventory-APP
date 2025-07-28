#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
袋子管理模块 - v2版本

@Author: lordli
@Date: 2025-07-15
@Version: 2.0
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

class AddBagRequest(BaseModel):
    """添加袋子请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    box_id: int = Field(..., description="储物箱ID")
    name: str = Field(..., min_length=1, max_length=100, description="袋子名称")
    color: Optional[str] = Field(default="#1296db", max_length=20, description="袋子颜色")

def verify_box_ownership(user_id: int, box_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证储物箱是否属于指定用户
    
    Args:
        user_id: 用户ID
        box_id: 储物箱ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 储物箱是否属于该用户
    """
    query = "SELECT COUNT(*) as count FROM boxes_summary WHERE box_id = ? AND user_id = ?"
    result = db_manager.execute_query(query, (box_id, user_id), fetch_one=True)
    return result['count'] > 0

def get_next_sort_id(box_id: int, db_manager: DatabaseManager) -> int:
    """
    获取储物箱下一个袋子排序ID
    
    Args:
        box_id: 储物箱ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 下一个排序ID
    """
    query = "SELECT COALESCE(MAX(sort_id), 0) + 1 as next_sort_id FROM bags_summary WHERE box_id = ?"
    result = db_manager.execute_query(query, (box_id,), fetch_one=True)
    return result['next_sort_id']

def create_bag(user_id: int, box_id: int, bag_data: AddBagRequest, db_manager: DatabaseManager) -> int:
    """
    创建新袋子
    
    Args:
        user_id: 用户ID
        box_id: 储物箱ID
        bag_data: 袋子数据
        db_manager: 数据库管理器实例
        
    Returns:
        int: 新创建的袋子ID
    """
    # 获取下一个排序ID
    sort_id = get_next_sort_id(box_id, db_manager)
    
    # 插入袋子数据
    query = """
    INSERT INTO bags_summary (user_id, box_id, sort_id, name, color, created_at) 
    VALUES (?, ?, ?, ?, ?, ?)
    """
    
    return db_manager.execute_insert(
        query, 
        (
            user_id,
            box_id,
            sort_id,
            bag_data.name,
            bag_data.color,
            datetime.now().isoformat()
        )
    )

def get_bag_info(bag_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取袋子信息
    
    Args:
        bag_id: 袋子ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 袋子信息
    """
    query = """
    SELECT bag_id, box_id, sort_id, name, color, created_at 
    FROM bags_summary 
    WHERE bag_id = ?
    """
    
    result = db_manager.execute_query(query, (bag_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="袋子不存在")
    
    return dict(result)

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v2/bag/add")
async def add_bag(bag_data: AddBagRequest = Body(...)):
    """
    添加袋子接口
    
    Args:
        bag_data: 袋子数据
        
    Returns:
        Dict: 创建结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(bag_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证储物箱是否属于该用户
        if not verify_box_ownership(user_id, bag_data.box_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限在此储物箱中添加袋子")
        
        # 创建袋子
        bag_id = create_bag(user_id, bag_data.box_id, bag_data, db_manager)
        
        # 获取创建的袋子信息
        bag_info = get_bag_info(bag_id, db_manager)
        
        return {
            "status": "success",
            "message": "袋子创建成功",
            "data": {
                "bag_info": bag_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")