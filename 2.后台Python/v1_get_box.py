#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
储物箱获取模块 - v1版本

@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

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

def get_box_detail(box_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取储物箱详细信息
    
    Args:
        box_id: 储物箱ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 储物箱详细信息
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

@router.get("/v1/box/get")
async def get_box(
    openid: str = Query(..., description="微信小程序openid"),
    box_id: int = Query(..., description="储物箱ID")
):
    """
    获取储物箱详细信息接口
    
    Args:
        openid: 微信小程序openid
        box_id: 储物箱ID
        
    Returns:
        Dict: 储物箱详细信息
    """
    try:
        # 验证输入安全性
        validated_openid = SecurityValidator.validate_openid(openid)
        validated_box_id = SecurityValidator.validate_integer_input(box_id, "储物箱ID", 1)
        
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(validated_openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证储物箱是否属于该用户
        if not verify_box_ownership(validated_box_id, user_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限访问该储物箱")
        
        # 获取储物箱详细信息
        box_info = get_box_detail(validated_box_id, db_manager)
        
        return {
            "status": "success",
            "message": "获取储物箱信息成功",
            "data": {
                "box_info": box_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")