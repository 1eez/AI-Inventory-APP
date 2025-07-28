#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
储物箱管理模块 - v1版本

@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

class AddBoxRequest(BaseModel):
    """添加储物箱请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    name: str = Field(..., min_length=1, max_length=100, description="箱子名称")
    description: Optional[str] = Field(default="", max_length=500, description="箱子描述")
    color: Optional[str] = Field(default="#1296db", max_length=20, description="箱子颜色")
    location: Optional[str] = Field(default="", max_length=200, description="箱子位置")

def get_next_sort_id(user_id: int, db_manager: DatabaseManager) -> int:
    """
    获取用户下一个排序ID
    
    Args:
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 下一个排序ID
    """
    query = "SELECT COALESCE(MAX(sort_id), 0) + 1 as next_sort_id FROM boxes_summary WHERE user_id = ?"
    result = db_manager.execute_query(query, (user_id,), fetch_one=True)
    return result['next_sort_id']

def create_box(user_id: int, box_data: AddBoxRequest, db_manager: DatabaseManager) -> int:
    """
    创建新储物箱
    
    Args:
        user_id: 用户ID
        box_data: 储物箱数据
        db_manager: 数据库管理器实例
        
    Returns:
        int: 新创建的储物箱ID
    """
    # 获取下一个排序ID
    sort_id = get_next_sort_id(user_id, db_manager)
    
    # 插入储物箱数据
    query = """
    INSERT INTO boxes_summary (user_id, sort_id, name, description, color, location, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    
    return db_manager.execute_insert(
        query, 
        (
            user_id,
            sort_id,
            box_data.name,
            box_data.description,
            box_data.color,
            box_data.location,
            datetime.now().isoformat()
        )
    )

def get_box_info(box_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取储物箱信息
    
    Args:
        box_id: 储物箱ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 储物箱信息
    """
    query = """
    SELECT box_id, user_id, sort_id, name, description, color, location, created_at 
    FROM boxes_summary 
    WHERE box_id = ?
    """
    
    result = db_manager.execute_query(query, (box_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="储物箱不存在")
    
    return dict(result)

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v1/box/add")
async def add_box(box_data: AddBoxRequest = Body(...)):
    """
    添加储物箱接口
    
    Args:
        box_data: 储物箱数据
        
    Returns:
        Dict: 创建结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(box_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 创建储物箱
        box_id = create_box(user_id, box_data, db_manager)
        
        # 获取创建的储物箱信息
        box_info = get_box_info(box_id, db_manager)
        
        return {
            "status": "success",
            "message": "储物箱创建成功",
            "data": {
                "box_info": box_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")