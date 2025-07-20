#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
物品查看模块 - v3版本

@Author: lordli
@Date: 2025-07-15
@Version: 3.0
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

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

def get_item_tags(item_id: int, db_manager: DatabaseManager) -> List[Dict[str, Any]]:
    """
    获取物品的标签列表
    
    Args:
        item_id: 物品ID
        db_manager: 数据库管理器实例
        
    Returns:
        List[Dict]: 标签列表
    """
    query = """
    SELECT t.tag_id, t.name 
    FROM tags t 
    JOIN items_tags it ON t.tag_id = it.tag_id 
    WHERE it.item_id = ?
    """
    
    results = db_manager.execute_query(query, (item_id,))
    return [dict(row) for row in results]

def get_items_by_bag(bag_id: int, db_manager: DatabaseManager) -> List[Dict[str, Any]]:
    """
    根据袋子ID获取物品列表
    
    Args:
        bag_id: 袋子ID
        db_manager: 数据库管理器实例
        
    Returns:
        List[Dict]: 物品列表（包含标签信息）
    """
    query = """
    SELECT item_id, box_id, bag_id, sort_id, title, description, category, image_filename, created_at 
    FROM items_detail 
    WHERE bag_id = ? 
    ORDER BY sort_id ASC
    """
    
    results = db_manager.execute_query(query, (bag_id,))
    items_list = []
    
    for row in results:
        item_dict = dict(row)
        # 获取物品的标签信息
        item_dict['tags'] = get_item_tags(item_dict['item_id'], db_manager)
        items_list.append(item_dict)
    
    return items_list

def get_item_by_id(item_id: int, bag_id: int, box_id: int, user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    根据物品ID获取单个物品信息
    
    Args:
        item_id: 物品ID
        bag_id: 袋子ID
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 物品信息（包含标签信息）
    """
    query = """
    SELECT i.item_id, i.box_id, i.bag_id, i.sort_id, i.title, i.description, i.category, i.image_filename, i.created_at 
    FROM items_detail i 
    JOIN bags_summary b ON i.bag_id = b.bag_id 
    JOIN boxes_summary box ON b.box_id = box.box_id 
    WHERE i.item_id = ? AND i.bag_id = ? AND b.box_id = ? AND box.user_id = ?
    """
    
    result = db_manager.execute_query(query, (item_id, bag_id, box_id, user_id), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="物品不存在或无权限查看")
    
    item_dict = dict(result)
    # 获取物品的标签信息
    item_dict['tags'] = get_item_tags(item_id, db_manager)
    
    return item_dict

def get_bag_info(bag_id: int, box_id: int, user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取袋子基本信息
    
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
        raise HTTPException(status_code=404, detail="袋子不存在或无权限查看")
    
    return dict(result)

def get_box_info(box_id: int, user_id: int, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    获取储物箱基本信息
    
    Args:
        box_id: 储物箱ID
        user_id: 用户ID
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 储物箱信息
    """
    query = "SELECT * FROM boxes_summary WHERE box_id = ? AND user_id = ?"
    
    result = db_manager.execute_query(query, (box_id, user_id), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="储物箱不存在或无权限查看")
    
    return dict(result)

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.get("/v3/item/get")
async def get_items(
    openid: str = Query(..., description="微信小程序openid"),
    box_id: int = Query(..., description="储物箱ID"),
    bag_id: int = Query(..., description="袋子ID"),
    item_id: Optional[int] = Query(None, description="物品ID，如果提供则返回单个物品信息")
):
    """
    获取物品信息接口
    
    Args:
        openid: 微信小程序openid
        box_id: 储物箱ID
        bag_id: 袋子ID
        item_id: 物品ID（可选，如果提供则返回单个物品信息）
        
    Returns:
        Dict: 物品信息或物品列表
    """
    try:
        # 根据openid获取用户ID
        try:
            user_id = db_manager.get_user_id_by_openid(openid)
        except ValueError:
            raise HTTPException(status_code=500, detail="用户不存在，请先登录")
        
        # 验证袋子是否属于该用户的该储物箱
        if not verify_bag_ownership(user_id, box_id, bag_id, db_manager):
            raise HTTPException(status_code=403, detail="无权限查看此袋子中的物品")
        
        # 获取袋子基本信息
        bag_info = get_bag_info(bag_id, box_id, user_id, db_manager)
        
        # 获取储物箱基本信息
        box_info = get_box_info(box_id, user_id, db_manager)
        
        if item_id is not None:
            # 获取单个物品信息
            item_info = get_item_by_id(item_id, bag_id, box_id, user_id, db_manager)
            return {
                "status": "success",
                "message": "物品信息获取成功",
                "data": {
                    "bag_info": bag_info,
                    "box_info": box_info,
                    "item_info": item_info
                }
            }
        else:
            # 获取袋子中的所有物品
            items_list = get_items_by_bag(bag_id, db_manager)
            return {
                "status": "success",
                "message": "物品列表获取成功",
                "data": {
                    "bag_info": bag_info,
                    "box_info": box_info,
                    "items_list": items_list,
                    "total_count": len(items_list)
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")