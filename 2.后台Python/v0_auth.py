#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信小程序认证模块

@Author: lordli
@Date: 2025-07-15
@Version: 1.0
"""

import httpx
from configparser import ConfigParser
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# 读取配置文件
config = ConfigParser()
config.read('config.ini', encoding='utf-8')

# 获取微信小程序配置
WX_APPID = config.get('weixin', 'AppID')
WX_APP_SECRET = config.get('weixin', 'AppSecret')

# 创建路由器
router = APIRouter()

class LoginRequest(BaseModel):
    """登录请求模型"""
    code: str

@router.post("/auth/login")
async def wechat_login(request: LoginRequest):
    """
    微信小程序登录接口
    """
    # 调用微信API获取openid
    params = {
        "appid": WX_APPID,
        "secret": WX_APP_SECRET,
        "js_code": request.code,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.weixin.qq.com/sns/jscode2session", params=params)
        result = response.json()
    
    # 检查错误
    if "errcode" in result:
        raise HTTPException(status_code=400, detail="获取openid失败")
    
    if "openid" not in result:
        raise HTTPException(status_code=400, detail="获取openid失败")
    
    return {"openid": result["openid"]}

