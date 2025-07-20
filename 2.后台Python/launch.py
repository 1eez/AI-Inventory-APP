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
from fastapi.staticfiles import StaticFiles
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

# 配置静态文件服务 - 用于访问photos目录中的图片
app.mount("/Photos", StaticFiles(directory="Photos"), name="Photos")

# -----------------------------------------------------------
# 【 -- v1版本 -- 第一代后台版本 -- 】
# -----------------------------------------------------------
# -----------------------------------------------------------
# 【 -- 系统模块 -- 】
# -----------------------------------------------------------
# 接口：/auth/login  -- 请求方式POST
# 【系统】获取微信小程序openid
from v0_auth import router as AuthRouter
app.include_router(AuthRouter)
# -----------------------------------------------------------
# 【 -- 首页 -- 】
# -----------------------------------------------------------
# 接口：/v0/home/info  -- 请求方式GET
# 【首页】获取用户首页信息
from v0_get_home_info import router as HomeInfoRouter
app.include_router(HomeInfoRouter)
# -----------------------------------------------------------
# 【 -- 箱子管理 -- 】
# -----------------------------------------------------------
# 接口：/v1/box/add  -- 请求方式POST
# 【储物箱】添加储物箱
from v1_add_box import router as AddBoxRouter
app.include_router(AddBoxRouter)

# 接口：/v1/box/delete  -- 请求方式POST
# 【储物箱】删除储物箱
from v1_delete_box import router as DeleteBoxRouter
app.include_router(DeleteBoxRouter)

# 接口：/v1/box/edit  -- 请求方式POST
# 【储物箱】编辑储物箱
from v1_edit_box import router as EditBoxRouter
app.include_router(EditBoxRouter)

# 接口：/v1/box/get  -- 请求方式GET
# 【储物箱】获取储物箱详细信息
from v1_get_box import router as GetBoxRouter
app.include_router(GetBoxRouter)

# -----------------------------------------------------------
# 【 -- 袋子管理 -- 】
# -----------------------------------------------------------
# 接口：/v2/bag/add  -- 请求方式POST
# 【袋子】添加袋子
from v2_add_bag import router as AddBagRouter
app.include_router(AddBagRouter)

# 接口：/v2/bag/delete  -- 请求方式POST
# 【袋子】删除袋子
from v2_delete_bag import router as DeleteBagRouter
app.include_router(DeleteBagRouter)

# 接口：/v2/bag/get  -- 请求方式GET
# 【袋子】获取袋子信息
from v2_get_bag import router as GetBagRouter
app.include_router(GetBagRouter)

# 接口：/v2/bag/edit  -- 请求方式POST
# 【袋子】编辑袋子
from v2_edit_bag import router as EditBagRouter
app.include_router(EditBagRouter)

# -----------------------------------------------------------
# 【 -- 物品管理 -- 】
# -----------------------------------------------------------
# 接口：/v3/image/upload  -- 请求方式POST
# 【物品】图片上传与AI分析
from v3_upload_image import router as UploadImageRouter
app.include_router(UploadImageRouter)

# 接口：/v3/item/add  -- 请求方式POST
# 【物品】添加物品
from v3_add_item import router as AddItemRouter
app.include_router(AddItemRouter)

# 接口：/v3/item/delete  -- 请求方式POST
# 【物品】删除物品
from v3_delete_item import router as DeleteItemRouter
app.include_router(DeleteItemRouter)

# 接口：/v3/item/get  -- 请求方式GET
# 【物品】获取物品信息
from v3_get_item import router as GetItemRouter
app.include_router(GetItemRouter)

# 接口：/v3/item/edit  -- 请求方式POST
# 【物品】编辑物品
from v3_edit_item import router as EditItemRouter
app.include_router(EditItemRouter)

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

