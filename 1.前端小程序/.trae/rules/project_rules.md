## 最重要，这里是微信小程序，不要试图运行npm start 或者 npm install之类的启动服务之类的命令。

1. 与智能体之间的对话，需要把所有的用户问题和智能体回答都记录下来（代码无需记录），并保存在当前目录下的子目录.trae/prompts中，文件名按时间顺序从1.xxxx.md（xxxx为总结的标题）。并且严格遵守以下格式，：
```
**用户：** 
[用户问题]

**智能体：** 
[智能体回答]
```
2. 当前项目使用微信小程序JavaScript框架，不要引入node的包管理，或者运行什么npm npx之类的命令。
3. 项目代码需要有注释，注释需要使用Google风格的简体中文注释

## Location字段显示规则
**重要：** location字段必须严格按照以下格式显示：
```xml
<text class="cuIcon-locationfill location-icon text-gray">{{item.location}}</text>
```
不得将图标和文本分离为两个独立的text元素。
