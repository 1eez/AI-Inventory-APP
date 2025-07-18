#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用户首页信息模块 - v1版本

@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()
def create_user(openid: str, db_manager: DatabaseManager) -> int:
    """
    创建新用户
    
    Args:
        openid: 微信openid
        db_manager: 数据库管理器实例
        
    Returns:
        int: 新创建的用户ID
    """
    query = "INSERT INTO users_summary (openid, nickname, status) VALUES (?, ?, ?)"
    return db_manager.execute_insert(query, (openid, '', 1))


def get_user_data(openid: str, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取用户完整数据
    
    Args:
        openid: 微信openid
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 用户完整数据
    """
    # 获取用户基本信息
    user_query = "SELECT user_id, openid, nickname, status, created_at, updated_at FROM users_summary WHERE openid = ?"
    user_row = db_manager.execute_query(user_query, (openid,), fetch_one=True)
    
    if not user_row:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user_id = user_row['user_id']
    
    # 获取用户的箱子信息
    boxes_query = "SELECT * FROM boxes_summary WHERE user_id = ? ORDER BY sort_id"
    boxes_rows = db_manager.execute_query(boxes_query, (user_id,))
    boxes = [dict(row) for row in boxes_rows]
    
    # 获取袋子总数
    bags_query = "SELECT COUNT(*) as bag_count FROM bags_summary bs JOIN boxes_summary bx ON bs.box_id = bx.box_id WHERE bx.user_id = ?"
    total_bags = db_manager.execute_query(bags_query, (user_id,), fetch_one=True)['bag_count']
    
    # 获取物品总数
    items_query = "SELECT COUNT(*) as item_count FROM items_detail id JOIN bags_summary bs ON id.bag_id = bs.bag_id JOIN boxes_summary bx ON bs.box_id = bx.box_id WHERE bx.user_id = ?"
    total_items = db_manager.execute_query(items_query, (user_id,), fetch_one=True)['item_count']
    
    # 为每个箱子获取袋子数量和物品数量
    for box in boxes:
        # 获取箱子中的袋子数量
        box_bags_query = "SELECT COUNT(*) as bag_count FROM bags_summary WHERE box_id = ?"
        box['bag_count'] = db_manager.execute_query(box_bags_query, (box['box_id'],), fetch_one=True)['bag_count']
        
        # 获取箱子中的物品数量
        box_items_query = "SELECT COUNT(*) as item_count FROM items_detail id JOIN bags_summary bs ON id.bag_id = bs.bag_id WHERE bs.box_id = ?"
        box['item_count'] = db_manager.execute_query(box_items_query, (box['box_id'],), fetch_one=True)['item_count']
    
    # 构建返回数据
    result = {
        "user_info": {
            "user_id": user_row['user_id'],
            "openid": user_row['openid'],
            "nickname": user_row['nickname'],
            "status": user_row['status'],
            "created_at": user_row['created_at'],
            "updated_at": user_row['updated_at']
        },
        "statistics": {
            "total_boxes": len(boxes),
            "total_bags": total_bags,
            "total_items": total_items
        },
        "boxes": boxes
    }
    
    return result

# 创建数据库管理器实例
db_manager = DatabaseManager()


@router.get("/v0/home/info")
async def get_home_info(openid: str = Query(..., description="微信小程序openid")):
    """
    获取用户首页信息接口
    
    Args:
        openid: 微信小程序openid
        
    Returns:
        Dict: 用户数据或创建结果
    """
    try:
        # 检查用户是否存在
        if db_manager.user_exists(openid):
            # 用户存在，返回完整数据
            user_data = get_user_data(openid, db_manager)
            return {
                "status": "existing_user",
                "message": "用户已存在，返回用户数据",
                "data": user_data
            }
        else:
            # 用户不存在，创建新用户
            user_id = create_user(openid, db_manager)
            
            # 返回新创建用户的基本信息
            return {
                "status": "new_user",
                "message": "新用户创建成功",
                "data": {
                    "user_info": {
                        "user_id": user_id,
                        "openid": openid,
                        "nickname": "",
                        "status": 1,
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    },
                    "statistics": {
                        "total_boxes": 0,
                        "total_bags": 0,
                        "total_items": 0
                    },
                    "boxes": []
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")