#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
储物箱删除模块 - v1版本

@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

class DeleteBoxRequest(BaseModel):
    """删除储物箱请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    box_id: int = Field(..., description="箱子ID")

def verify_box_ownership(user_id: int, box_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证箱子是否属于指定用户
    
    Args:
        user_id: 用户ID
        box_id: 箱子ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 箱子是否属于该用户
    """
    query = "SELECT COUNT(*) as count FROM boxes_summary WHERE box_id = ? AND user_id = ?"
    result = db_manager.execute_query(query, (box_id, user_id), fetch_one=True)
    return result['count'] > 0

def get_box_info_before_delete(box_id: int, user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    删除前获取箱子信息
    
    Args:
        box_id: 箱子ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 箱子信息
    """
    query = """
    SELECT box_id, user_id, sort_id, name, description, color, location, created_at 
    FROM boxes_summary 
    WHERE box_id = ? AND user_id = ?
    """
    
    result = db_manager.execute_query(query, (box_id, user_id), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="储物箱不存在或无权限删除")
    
    return dict(result)

def delete_box(box_id: int, user_id: int, db_manager: DatabaseManager) -> int:
    """
    删除储物箱
    
    Args:
        box_id: 箱子ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 受影响的行数
    """
    query = "DELETE FROM boxes_summary WHERE box_id = ? AND user_id = ?"
    affected_rows = db_manager.execute_update(query, (box_id, user_id))
    
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="储物箱不存在或无权限删除")
    
    return affected_rows

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v1/box/delete")
async def delete_box_endpoint(delete_data: DeleteBoxRequest = Body(...)):
    """
    删除储物箱接口
    
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
        
        # 获取箱子信息（删除前）
        box_info = get_box_info_before_delete(delete_data.box_id, user_id, db_manager)
        
        # 删除储物箱
        affected_rows = delete_box(delete_data.box_id, user_id, db_manager)
        
        return {
            "status": "success",
            "message": "储物箱删除成功",
            "data": {
                "deleted_box_info": box_info,
                "affected_rows": affected_rows
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")