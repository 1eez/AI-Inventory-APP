#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通用搜索模块 - v4版本

@Author: lordli
@Date: 2025-08-02
@Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from common_db import DatabaseManager
from security_utils import SecurityValidator

# 创建路由器
router = APIRouter()

def search_boxes(user_id: int, keyword: str, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    搜索储物箱
    
    Args:
        user_id: 用户ID
        keyword: 搜索关键字
        db_manager: 数据库管理器实例
        
    Returns:
        Dict[str, Any]: 包含count和results的字典
    """
    # 构建搜索SQL，模糊匹配name、description、location字段
    query = """
    SELECT box_id, user_id, sort_id, name, description, color, location, created_at
    FROM boxes_summary 
    WHERE user_id = ? AND (
        name LIKE ? OR 
        description LIKE ? OR 
        location LIKE ?
    )
    ORDER BY sort_id ASC
    """
    
    # 准备参数，关键字前后加%进行模糊匹配
    like_keyword = f"%{keyword}%"
    params = (user_id, like_keyword, like_keyword, like_keyword)
    
    results = db_manager.execute_query(query, params)
    
    return {
        "count": len(results) if results else 0,
        "results": results if results else []
    }

def search_bags(user_id: int, keyword: str, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    搜索袋子
    
    Args:
        user_id: 用户ID
        keyword: 搜索关键字
        db_manager: 数据库管理器实例
        
    Returns:
        Dict[str, Any]: 包含count和results的字典
    """
    # 构建搜索SQL，模糊匹配name字段
    query = """
    SELECT bag_id, user_id, box_id, sort_id, name, color, created_at
    FROM bags_summary 
    WHERE user_id = ? AND name LIKE ?
    ORDER BY box_id ASC, sort_id ASC
    """
    
    # 准备参数，关键字前后加%进行模糊匹配
    like_keyword = f"%{keyword}%"
    params = (user_id, like_keyword)
    
    results = db_manager.execute_query(query, params)
    
    return {
        "count": len(results) if results else 0,
        "results": results if results else []
    }

def search_items(user_id: int, keyword: str, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    搜索物品（包括标签搜索）
    
    Args:
        user_id: 用户ID
        keyword: 搜索关键字
        db_manager: 数据库管理器实例
        
    Returns:
        Dict[str, Any]: 包含count和results的字典
    """
    # 构建搜索SQL，分两部分：
    # 1. 直接匹配物品的title、description、category字段
    # 2. 通过标签匹配的物品（即使物品本身字段不匹配关键字，但标签匹配也要返回）
    query = """
    SELECT DISTINCT i.item_id, i.user_id, i.box_id, i.bag_id, i.sort_id, 
           i.title, i.description, i.category, i.image_filename, i.created_at
    FROM items_detail i
    WHERE i.user_id = ? AND (
        -- 物品字段匹配
        i.title LIKE ? OR 
        i.description LIKE ? OR 
        i.category LIKE ?
        -- 或者物品的标签匹配
        OR EXISTS (
            SELECT 1 FROM items_tags it 
            JOIN tags t ON it.tag_id = t.tag_id 
            WHERE it.item_id = i.item_id AND t.name LIKE ?
        )
    )
    ORDER BY i.box_id ASC, i.sort_id ASC
    """
    
    # 准备参数，关键字前后加%进行模糊匹配
    like_keyword = f"%{keyword}%"
    params = (user_id, like_keyword, like_keyword, like_keyword, like_keyword)
    
    results = db_manager.execute_query(query, params)
    
    # 为每个物品添加标签信息
    if results:
        # 将Row对象转换为字典，以便可以添加tags字段
        processed_results = []
        for item in results:
            # 将Row对象转换为字典
            item_dict = dict(item)
            # 添加标签信息
            item_tags = get_item_tags(item_dict['item_id'], db_manager)
            item_dict['tags'] = item_tags
            processed_results.append(item_dict)
        
        return {
            "count": len(processed_results),
            "results": processed_results
        }
    
    return {
        "count": 0,
        "results": []
    }

def get_item_tags(item_id: int, db_manager: DatabaseManager) -> List[Dict[str, Any]]:
    """
    获取物品的标签列表
    
    Args:
        item_id: 物品ID
        db_manager: 数据库管理器实例
        
    Returns:
        List[Dict[str, Any]]: 标签列表
    """
    query = """
    SELECT t.tag_id, t.name
    FROM tags t
    JOIN items_tags it ON t.tag_id = it.tag_id
    WHERE it.item_id = ?
    ORDER BY t.name ASC
    """
    
    results = db_manager.execute_query(query, (item_id,))
    return results if results else []

# 数据库管理器实例
db_manager = DatabaseManager()

@router.get("/v4/search")
async def universal_search(
    openid: str = Query(..., description="微信小程序openid"),
    keyword: str = Query(..., description="搜索关键字")
):
    """
    通用搜索接口
    
    Args:
        openid: 微信小程序openid（必填）
        keyword: 搜索关键字（必填）
        
    Returns:
        Dict: 包含box、bag、item三部分搜索结果的JSON数据
    """
    try:
        # 验证openid
        validated_openid = SecurityValidator.validate_openid(openid)
        
        # 验证关键字
        if not keyword:
            raise HTTPException(status_code=400, detail="搜索关键字不能为空")
        
        # 去除关键字两边的空格（保留中间空格）
        keyword = keyword.strip()
        
        if not keyword:
            raise HTTPException(status_code=400, detail="搜索关键字不能为空")
        
        # 验证关键字安全性
        validated_keyword = SecurityValidator.validate_string_input(keyword, "搜索关键字", 200)
        
        # 检查用户是否存在
        if not db_manager.user_exists(validated_openid):
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 获取用户ID
        user_id = db_manager.get_user_id_by_openid(validated_openid)
        
        # 执行三个表的搜索
        box_results = search_boxes(user_id, validated_keyword, db_manager)
        bag_results = search_bags(user_id, validated_keyword, db_manager)
        item_results = search_items(user_id, validated_keyword, db_manager)
        
        # 构建返回结果
        response_data = {
            "code": 200,
            "message": "搜索成功",
            "data": {
                "boxes": box_results,
                "bags": bag_results,
                "items": item_results
            }
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")