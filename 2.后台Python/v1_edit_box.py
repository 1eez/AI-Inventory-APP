#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
储物箱编辑模块 - v1版本

@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

class EditBoxRequest(BaseModel):
    """编辑储物箱请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    box_id: int = Field(..., description="储物箱ID")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="箱子名称")
    description: Optional[str] = Field(None, max_length=500, description="箱子描述")
    color: Optional[str] = Field(None, max_length=20, description="箱子颜色")
    location: Optional[str] = Field(None, max_length=200, description="箱子位置")

def verify_box_ownership(box_id: int, user_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证储物箱是否属于指定用户
    
    Args:
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 是否属于该用户
    """
    query = "SELECT COUNT(*) as count FROM boxes_summary WHERE box_id = ? AND user_id = ?"
    result = db_manager.execute_query(query, (box_id, user_id), fetch_one=True)
    return result['count'] > 0

def update_box(box_id: int, box_data: EditBoxRequest, db_manager: DatabaseManager) -> None:
    """
    更新储物箱信息
    
    Args:
        box_id: 储物箱ID
        box_data: 储物箱更新数据
        db_manager: 数据库管理器实例
    """
    # 构建动态更新SQL
    update_fields = []
    update_values = []
    
    if box_data.name is not None:
        update_fields.append("name = ?")
        update_values.append(box_data.name)
    
    if box_data.description is not None:
        update_fields.append("description = ?")
        update_values.append(box_data.description)
    
    if box_data.color is not None:
        update_fields.append("color = ?")
        update_values.append(box_data.color)
    
    if box_data.location is not None:
        update_fields.append("location = ?")
        update_values.append(box_data.location)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="没有提供需要更新的字段")
    
    # 添加box_id到参数列表末尾
    update_values.append(box_id)
    
    # 构建完整的UPDATE SQL语句
    query = f"UPDATE boxes_summary SET {', '.join(update_fields)} WHERE box_id = ?"
    
    db_manager.execute_query(query, tuple(update_values))

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

@router.post("/v1/box/edit")
async def edit_box(box_data: EditBoxRequest = Body(...)):
    """
    编辑储物箱接口
    
    Args:
        box_data: 储物箱编辑数据
        
    Returns:
        Dict: 编辑结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(box_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证储物箱是否属于该用户
        if not verify_box_ownership(box_data.box_id, user_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限编辑该储物箱")
        
        # 更新储物箱信息
        update_box(box_data.box_id, box_data, db_manager)
        
        # 获取更新后的储物箱信息
        box_info = get_box_info(box_data.box_id, db_manager)
        
        return {
            "status": "success",
            "message": "储物箱编辑成功",
            "data": {
                "box_info": box_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")