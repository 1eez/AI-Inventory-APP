#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
袋子编辑模块 - v2版本

@Author: lordli
@Date: 2025-07-15
@Version: 2.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

class EditBagRequest(BaseModel):
    """编辑袋子请求模型"""
    openid: str = Field(..., description="微信小程序openid")
    bag_id: int = Field(..., description="袋子ID")
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="袋子名称")
    color: Optional[str] = Field(None, max_length=20, description="袋子颜色")

def verify_bag_ownership(bag_id: int, user_id: int, db_manager: DatabaseManager) -> bool:
    """
    验证袋子是否属于指定用户
    
    Args:
        bag_id: 袋子ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        bool: 是否属于该用户
    """
    query = "SELECT COUNT(*) as count FROM bags_summary WHERE bag_id = ? AND user_id = ?"
    result = db_manager.execute_query(query, (bag_id, user_id), fetch_one=True)
    return result['count'] > 0

def update_bag(bag_id: int, bag_data: EditBagRequest, db_manager: DatabaseManager) -> None:
    """
    更新袋子信息
    
    Args:
        bag_id: 袋子ID
        bag_data: 袋子更新数据
        db_manager: 数据库管理器实例
    """
    # 构建动态更新SQL
    update_fields = []
    update_values = []
    
    if bag_data.name is not None:
        update_fields.append("name = ?")
        update_values.append(bag_data.name)
    
    if bag_data.color is not None:
        update_fields.append("color = ?")
        update_values.append(bag_data.color)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="没有提供需要更新的字段")
    
    # 添加bag_id到参数列表末尾
    update_values.append(bag_id)
    
    # 构建完整的UPDATE SQL语句
    query = f"UPDATE bags_summary SET {', '.join(update_fields)} WHERE bag_id = ?"
    
    db_manager.execute_query(query, tuple(update_values))

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
    SELECT bag_id, user_id, box_id, sort_id, name, color, created_at 
    FROM bags_summary 
    WHERE bag_id = ?
    """
    
    result = db_manager.execute_query(query, (bag_id,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="袋子不存在")
    
    return dict(result)

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v2/bag/edit")
async def edit_bag(bag_data: EditBagRequest = Body(...)):
    """
    编辑袋子接口
    
    Args:
        bag_data: 袋子编辑数据
        
    Returns:
        Dict: 编辑结果
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(bag_data.openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证袋子是否属于该用户
        if not verify_bag_ownership(bag_data.bag_id, user_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限编辑该袋子")
        
        # 更新袋子信息
        update_bag(bag_data.bag_id, bag_data, db_manager)
        
        # 获取更新后的袋子信息
        bag_info = get_bag_info(bag_data.bag_id, db_manager)
        
        return {
            "status": "success",
            "message": "袋子编辑成功",
            "data": {
                "bag_info": bag_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")