#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
袋子信息获取模块 - v2版本

@Author: lordli
@Date: 2025-07-15
@Version: 2.0
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

class BagInfo(BaseModel):
    """袋子信息模型"""
    bag_id: int
    box_id: int
    sort_id: int
    name: str
    color: str
    created_at: str

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

def get_item_count_by_bag_id(bag_id: int, db_manager: DatabaseManager) -> int:
    """
    根据袋子ID获取物品数量
    
    Args:
        bag_id: 袋子ID
        db_manager: 数据库管理器实例
        
    Returns:
        int: 物品数量
    """
    query = "SELECT COUNT(*) as count FROM items_detail WHERE bag_id = ?"
    result = db_manager.execute_query(query, (bag_id,), fetch_one=True)
    return result['count'] if result else 0

def get_bags_by_box_id(box_id: int, db_manager: DatabaseManager) -> List[Dict[str, Any]]:
    """
    根据储物箱ID获取所有袋子信息（包含物品数量）
    
    Args:
        box_id: 储物箱ID
        db_manager: 数据库管理器实例
        
    Returns:
        List[Dict]: 袋子信息列表（包含item_count字段）
    """
    query = """
    SELECT * FROM bags_summary 
    WHERE box_id = ? 
    ORDER BY sort_id ASC
    """
    
    results = db_manager.execute_query(query, (box_id,))
    bags = [dict(row) for row in results]
    
    # 为每个袋子添加物品数量
    for bag in bags:
        bag['item_count'] = get_item_count_by_bag_id(bag['bag_id'], db_manager)
    
    return bags

def get_box_info_by_id(box_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    根据储物箱ID获取储物箱的所有信息
    
    Args:
        box_id: 储物箱ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 储物箱信息
    """
    query = "SELECT * FROM boxes_summary WHERE box_id = ?"
    result = db_manager.execute_query(query, (box_id,), fetch_one=True)
    return dict(result) if result else {}

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.get("/v2/bag/get")
async def get_bag_info(
    openid: str = Query(..., description="微信小程序openid"),
    box_id: int = Query(..., description="储物箱ID")
):
    """
    获取袋子信息接口
    
    Args:
        openid: 微信小程序openid
        box_id: 储物箱ID
        
    Returns:
        Dict: 袋子信息列表
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证储物箱是否属于该用户
        if not verify_box_ownership(user_id, box_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限访问此储物箱")
        
        # 获取袋子信息
        bags = get_bags_by_box_id(box_id, db_manager)
        
        # 获取储物箱信息
        box_info = get_box_info_by_id(box_id, db_manager)
        
        return {
            "status": "success",
            "message": "获取袋子信息成功",
            "data": {
                "bags": bags,
                "total_count": len(bags),
                "box_info": box_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")