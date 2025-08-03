# 个人物品整理系统

> 🎉 **欢迎体验我们的智能物品管理小程序！**
> 
> 扫描下方二维码，立即体验AI驱动的个人物品整理系统

<div align="center">
  <img src="./mini-prog-qrcode.jpg" alt="小程序二维码" width="300">
  <p><strong>👆 扫码体验小程序</strong></p>
  <p>支持拍照AI识别、智能分类、快速搜索等功能</p>
</div>

---

一个基于AI的个人物品管理系统，通过拍照自动识别物品并进行分类整理。

## 项目简介

本系统旨在帮助用户通过拍照的方式，自动识别和整理个人物品。用户只需拍摄物品照片，系统会自动生成标题、分类和标签，并存储到数据库中，方便后续查找和管理。

这是一个纯粹的AI辅助编程项目，赶个时髦叫「Vibe Coding」。

我承认这里面有大量的屎山代码，尤其是小程序前端，海量的错误复用，无效代码，以及乱七八糟的样式。

建立这个项目，除了个人需求外，也是想看下，2025年的Claude-4-Sonnet的能力边界在哪里。

再过几年，也许看到这个项目会嘲笑这个时代的AI能力有多么的弱鸡，

但不得不说，在2025年的当下，看到AI完成的这个小玩意，我很兴奋。

一个时代来了。

## 技术栈

### 前端
- **微信小程序** - 基于微信小程序原生框架开发
- **ColorUI v2.1.6** - 主要UI组件库，提供丰富的样式和组件
- **WeUI v2.5.11** - 微信官方UI组件库
- **分包架构** - 按功能模块分包，优化加载性能

### 后端
- **FastAPI** - 高性能的Python Web框架
- **SQLite** - 轻量级数据库，存储物品信息
- **Python 3.12.9** - 主要开发语言
- **Uvicorn** - ASGI服务器，支持高并发

### AI服务
- **智谱AI GLM-4V** - 图像识别和文本生成大模型
- **图像处理** - Pillow库进行图像压缩和处理

### 开发工具
- **微信开发者工具** - 小程序开发和调试
- **Git** - 版本控制
- **配置管理** - ConfigParser进行配置文件管理
- **AI编程** - TRAE 2.0.7 (Claude-4-Sonnet Based)

## 主要功能

### 📦 三层级存储管理
- **储物箱管理** - 创建、编辑、删除储物箱
- **收纳袋管理** - 在收纳盒内管理收纳袋
- **物品管理** - 详细的物品信息记录和管理

### 📸 AI智能识别
- **拍照识别** - 通过拍照自动识别物品
- **智能标注** - AI自动生成物品标题、分类和描述
- **图像处理** - 自动压缩和优化图片存储

### 🔍 智能搜索
- **全局搜索** - 按物品名称、分类、标签搜索
- **筛选功能** - 多维度筛选和排序  -- 未完成

### 👤 用户系统
- **微信登录** - 基于微信小程序的用户认证
- **个人中心** - 用户信息管理和系统设置
- **激励机制** - 观看广告增加物品存储限额

### 📱 优秀体验
- **响应式设计** - 适配不同屏幕尺寸
- **骨架屏加载** - 优化加载体验
- **分包加载** - 按需加载，提升性能
- **离线缓存** - 支持离线数据访问

## 数据存储

- **结构化数据**: SQLite数据库存储物品信息
- **图片文件**: 本地文件系统按时间分目录存储
- **备份策略**: 支持数据库和图片的定期备份

## 快速开始

### 环境要求

#### 后端环境
- Python 3.12.9+
- FastAPI
- SQLite
- 智谱AI API密钥

#### 前端环境
- 微信开发者工具
- 微信小程序基础库 3.8.10+

### 后端部署

1. **安装依赖**
```bash
cd 2.后台Python
pip install -r requirements.txt
```

2. **配置文件**
```bash
# 复制配置文件模板
cp config.ini.example config.ini
# 编辑配置文件，填入智谱AI API密钥等信息
```

3. **初始化数据库**
```bash
python db_init.py
```

4. **启动服务**
```bash
python launch.py
# 或者使用 uvicorn launch:app --reload --host 0.0.0.0 --port 8000
```

### 前端开发

1. **打开项目**
   - 使用微信开发者工具打开 `1.前端小程序` 目录

2. **配置AppID**
   - 在 `project.config.json` 中配置你的小程序AppID

3. **配置后端地址**
   - 在 `app.js` 中修改 `baseUrl` 为你的后端服务地址

4. **预览调试**
   - 使用微信开发者工具进行预览和真机调试

## 项目结构

```
.
├── README.md                    # 项目说明文档
├── mini-prog-qrcode.jpg         # 小程序体验二维码
├── LICENSE                      # 开源许可证
│
├── 1.前端小程序/                 # 微信小程序前端
│   ├── app.js                   # 小程序入口文件
│   ├── app.json                 # 小程序配置文件
│   ├── app.wxss                 # 全局样式文件
│   ├── package.json             # 项目信息文件
│   ├── project.config.json      # 项目配置文件
│   ├── pages/                   # 主包页面
│   │   ├── splash/              # 启动页
│   │   ├── home/                # 首页
│   │   ├── search/              # 搜索页
│   │   └── profile/             # 个人中心
│   ├── packageStorage/          # 存储管理分包
│   ├── packageCamera/           # 相机功能分包
│   ├── packageSearch/           # 搜索功能分包
│   ├── packageProfile/          # 个人中心分包
│   ├── colorui/                 # ColorUI组件库
│   └── assets/                  # 静态资源
│
├── 2.后台Python/                # FastAPI后端服务
│   ├── launch.py                # 服务启动入口
│   ├── requirements.txt         # Python依赖包
│   ├── config.ini.example       # 配置文件模板
│   ├── common_db.py             # 数据库操作模块
│   ├── db_init.py               # 数据库初始化
│   ├── v0_*.py                  # 系统相关接口
│   ├── v1_*.py                  # 收纳盒管理接口
│   ├── v2_*.py                  # 收纳袋管理接口
│   ├── v3_*.py                  # 物品管理接口
│   └── data/                    # 数据存储目录
│       └── database.sqlite      # SQLite数据库
│
├── 3.接口测试脚本/               # API接口测试
│   └── 物品收纳整理小程序/        # Bruno测试集合
│
└── a1.Prompt历史记录/            # 开发过程记录
    ├── 1.前端小程序的Prompt/
    └── 2.后台接口的Prompt/
```

## 开发状态

### ✅ 已完成功能

#### 后端服务 (2.后台Python/)
- [x] FastAPI框架搭建
- [x] SQLite数据库设计和初始化
- [x] 用户认证系统 (v0_auth.py)
- [x] 用户信息管理 (v0_edit_nickname.py, v0_get_home_info.py)
- [x] 激励广告系统 (v0_watch_ad.py)
- [x] 收纳盒管理 (v1_add_box.py, v1_delete_box.py, v1_edit_box.py, v1_get_box.py)
- [x] 收纳袋管理 (v2_add_bag.py, v2_delete_bag.py, v2_edit_bag.py, v2_get_bag.py)
- [x] 物品管理 (v3_add_item.py, v3_delete_item.py, v3_edit_item.py, v3_get_item.py)
- [x] 图片上传和AI识别 (v3_upload_image.py)
- [x] 智谱AI GLM-4V集成
- [x] 配置文件管理
- [x] CORS跨域支持
- [x] 静态文件服务

#### 前端小程序 (1.前端小程序/)
- [x] 微信小程序框架搭建
- [x] ColorUI v2.1.6 + WeUI v2.5.11 集成
- [x] 分包架构设计 (5个功能分包)
- [x] 启动页和首页
- [x] 用户认证和个人中心
- [x] 收纳盒、收纳袋、物品管理页面
- [x] 拍照识别功能
- [x] 搜索功能
- [x] 骨架屏加载
- [x] 自定义导航栏
- [x] 响应式设计
- [x] 深色模式支持

#### 开发工具
- [x] 接口测试脚本 (Bruno测试集合)
- [x] 项目文档和说明
- [x] 开发过程记录

### 🚧 待优化功能

- [ ] 数据同步优化
- [ ] 图片压缩算法优化
- [ ] 搜索性能优化
- [ ] 缓存策略完善
- [ ] 错误处理增强
- [ ] 单元测试覆盖
- [ ] 性能监控
- [ ] 部署自动化脚本

### 🔮 未来规划

- [ ] 家庭成员共享功能
- [ ] 物品到期提醒
- [ ] 数据导出功能
- [ ] 多语言支持
- [ ] 语音输入
- [ ] 更多AI识别类型
- [ ] 云端数据备份

## API接口文档

### 系统接口 (v0)
| 接口路径 | 请求方式 | 功能描述 |
|---------|---------|----------|
| `/auth/login` | POST | 微信小程序用户登录认证 |
| `/v0/user/edit_nickname` | POST | 编辑用户昵称 |
| `/v0/user/watch_ad` | POST | 用户观看广告奖励 |
| `/v0/home/info` | GET | 获取用户首页信息 |

### 收纳盒管理 (v1)
| 接口路径 | 请求方式 | 功能描述 |
|---------|---------|----------|
| `/v1/box/add` | POST | 添加收纳盒 |
| `/v1/box/delete` | POST | 删除收纳盒 |
| `/v1/box/edit` | POST | 编辑收纳盒信息 |
| `/v1/box/get` | GET | 获取收纳盒详细信息 |

### 收纳袋管理 (v2)
| 接口路径 | 请求方式 | 功能描述 |
|---------|---------|----------|
| `/v2/bag/add` | POST | 添加收纳袋 |
| `/v2/bag/delete` | POST | 删除收纳袋 |
| `/v2/bag/edit` | POST | 编辑收纳袋信息 |
| `/v2/bag/get` | GET | 获取收纳袋信息 |

### 物品管理 (v3)
| 接口路径 | 请求方式 | 功能描述 |
|---------|---------|----------|
| `/v3/image/upload` | POST | 图片上传与AI识别 |
| `/v3/item/add` | POST | 添加物品 |
| `/v3/item/delete` | POST | 删除物品 |
| `/v3/item/edit` | POST | 编辑物品信息 |
| `/v3/item/get` | GET | 获取物品详细信息 |

> 📝 **接口测试**: 项目提供了完整的Bruno测试脚本，位于 `3.接口测试脚本/` 目录

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

### 如何贡献
1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 联系方式

- **开发者**: Lordli
- **邮箱**: cnPro@163.com
- **官网**: https://lordli.com/
- **项目地址**: [GitHub Repository](https://github.com/your-username/ai-inventory-app)

## 致谢

感谢以下开源项目和服务：
- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/) - 前端框架
- [FastAPI](https://fastapi.tiangolo.com/) - 后端框架
- [ColorUI](https://github.com/weilanwl/ColorUI) - UI组件库
- [智谱AI](https://www.zhipuai.cn/) - AI图像识别服务

---

<div align="center">
  <p>⭐ 如果这个项目对你有帮助，请给它一个星标！</p>
  <p>🔄 欢迎分享给更多需要的朋友</p>
</div>