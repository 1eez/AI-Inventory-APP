# !/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
  使用FastAPI构建后台服务 —— 部署在广州轻量二代
  @Version: 1.0
  @Author: lordli
  @Date: 2025-7-14
  @Python version:3.12.9
  @Libary:
      pip install configparser fastapi uvicorn

  生成requirements.txt， 在python工程目录中运行(xx个库)：
  pip freeze > requirements.txt

  @Update:
        1.0 2025-7-14 初始版本
        2.0

  @Launch: python launch.py    # 或者用下面的方式也可以
           uvicorn launch:app --reload --host 0.0.0.0 --port 8000
"""
import uvicorn
from configparser import ConfigParser
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

LOG_FMT = "%(asctime)s - %(levelname)s - %(message)s"

# 将access日志写入uvicorn的日志文件（带时间戳的日志）
def config_access_log_to_show_time():
    # 参考：https://blog.csdn.net/jaket5219999/article/details/135911281
    logger = logging.getLogger("uvicorn.access")
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(LOG_FMT))
    logger.addHandler(handler)

@asynccontextmanager
async def lifespan(app: FastAPI):
    config_access_log_to_show_time()
    yield

config = ConfigParser()
config.read(r'config.ini', encoding='utf-8')

app = FastAPI(
    title=config.get('fastapi', 'title'),  # 从同路径的config.ini中，读取配置信息，以下雷同
    description=config.get('fastapi', 'description'),
    version=config.get('fastapi', 'version'),
    docs_url=config.get('fastapi', 'docs_url', fallback=None),
    redoc_url=config.get('fastapi', 'redoc_url', fallback=None),
    debug=config.getboolean('fastapi', 'debug'),
    timeout=config.getint('fastapi', 'timeout'),
    lifespan=lifespan
)

# 添加 CORS 中间件，用于在生产环境中，更严苛的控制风险
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许的来源，这里设置为允许任意来源，实际生产环境中应更严格配置
    allow_methods=["*"],  # 允许的方法，包括 "OPTIONS"
    allow_headers=["*"],  # 允许的请求头
)

# -----------------------------------------------------------
# 【 -- v1版本 -- 第一代后台版本 -- 】
# -----------------------------------------------------------
# -----------------------------------------------------------
# 【 -- 系统模块 -- 】
# -----------------------------------------------------------
# 接口：/v0/auth/getopenid/  -- 请求方式GET
# 【系统】获取微信小程序openid
from v0_auth import router as AuthRouter
app.include_router(AuthRouter)

# -----------------------------------------------------------
# 【 -- 测试模块 -- 】
# -----------------------------------------------------------
# 接口：/v0/testAI/  -- 请求方式POST
# 接口：/v0/testAI2/  -- 请求方式POST
# 【测试】测试AI返回内容
# -----------------------------------------------------------

@app.get("/")
async def read_root():
    return {'Method': 'API Version: '+ app.version +'. Access Denied, Pls contact Lord. ：）'}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

