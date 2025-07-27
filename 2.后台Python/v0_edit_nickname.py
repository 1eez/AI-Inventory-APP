#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用户昵称编辑模块 - v0版本

@Author: lordli
@Date: 2025-07-27
@Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

class EditNicknameRequest(BaseModel):
    """编辑用户昵称请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    nickname: str = Field(..., min_length=1, max_length=100, description="用户昵称")

def update_user_nickname(openid: str, nickname: str, db_manager: DatabaseManager) -> None:
    """
    更新用户昵称
    
    Args:
        openid: 微信openid
        nickname: 新昵称
        db_manager: 数据库管理器实例
    """
    query = "UPDATE users_summary SET nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE openid = ?"
    affected_rows = db_manager.execute_update(query, (nickname, openid))
    
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="用户不存在")

def get_user_info(openid: str, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取用户信息
    
    Args:
        openid: 微信openid
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 用户信息
    """
    query = """
    SELECT user_id, openid, nickname, status, created_at, updated_at
    FROM users_summary 
    WHERE openid = ?
    """
    
    result = db_manager.execute_query(query, (openid,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return dict(result)

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v0/user/edit_nickname")
async def edit_nickname(nickname_data: EditNicknameRequest = Body(...)):
    """
    编辑用户昵称接口
    
    Args:
        nickname_data: 用户昵称编辑数据
        
    Returns:
        Dict: 编辑结果
    """
    try:
        # 更新用户昵称
        update_user_nickname(nickname_data.openid, nickname_data.nickname, db_manager)
        
        # 获取更新后的用户信息
        user_info = get_user_info(nickname_data.openid, db_manager)
        
        return {
            "status": "success",
            "message": "用户昵称修改成功",
            "data": {
                "user_info": user_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")