#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用户观看广告奖励模块 - v0版本

@Author: lordli
@Date: 2025-01-27
@Version: 1.0
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime
from common_db import DatabaseManager

# 创建路由器
router = APIRouter()

class WatchAdRequest(BaseModel):
    """观看广告请求模型"""
    openid: str = Field(..., description="微信小程序openid")

def update_user_ad_reward(openid: str, db_manager: DatabaseManager) -> Dict[str, Any]:
    """
    更新用户观看广告奖励
    
    Args:
        openid: 微信openid
        db_manager: 数据库管理器实例
        
    Returns:
        Dict: 更新后的用户信息
    """
    # 首先检查用户是否存在
    if not db_manager.user_exists(openid):
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 更新用户的item_limit、ads_watched_count和last_ad_watched_at
    update_query = """
    UPDATE users_summary 
    SET item_limit = item_limit + 20,
        ads_watched_count = ads_watched_count + 1,
        last_ad_watched_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE openid = ?
    """
    
    affected_rows = db_manager.execute_update(update_query, (openid,))
    
    if affected_rows == 0:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 获取更新后的用户信息
    query = """
    SELECT user_id, openid, nickname, status, item_limit, 
           ads_watched_count, last_ad_watched_at, created_at, updated_at
    FROM users_summary 
    WHERE openid = ?
    """
    
    result = db_manager.execute_query(query, (openid,), fetch_one=True)
    if not result:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return dict(result)

# 创建数据库管理器实例
db_manager = DatabaseManager()

@router.post("/v0/user/watch_ad")
async def watch_ad(ad_data: WatchAdRequest = Body(...)):
    """
    用户观看广告奖励接口
    
    Args:
        ad_data: 观看广告请求数据
        
    Returns:
        Dict: 奖励结果和用户信息
    """
    try:
        # 更新用户观看广告奖励
        user_info = update_user_ad_reward(ad_data.openid, db_manager)
        
        return {
            "status": "success",
            "message": "观看广告奖励发放成功",
            "data": {
                "reward": {
                    "item_limit_increase": 20,
                    "description": "恭喜您获得20个物品存储额度！"
                },
                "user_info": user_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")