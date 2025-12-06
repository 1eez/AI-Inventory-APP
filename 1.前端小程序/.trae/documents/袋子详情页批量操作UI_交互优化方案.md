## 问题与目标
- 修复批量勾选事件错误（"true"方法不存在）。
- 清晰区分“已选/未选”视觉状态，且不影响点按打开详情的默认行为。
- 统一按钮风格：目标位置用 A 版 `cu-btn bg-gradual-green lg`；全选/全不选用 `cu-btn line-blue sm`。
- 重做位置选择浮层：盒/袋卡片使用自身颜色作为底色；提供选中态反馈。
- 完成结果使用可手动关闭的 Modal，而非自动消失的 Toast。

## 具体改动
### 1）批量勾选与事件修复
- 替换 `catchtap="true"` 为 `catchtap="stopPropagation"`（防止事件冒泡且避免报错），涉及：
  - 勾选控件与“更多”菜单区域（`bag-detail.wxml` 图片网格覆盖层）。
- 为网格项增加选中态类：
  - `class="photo-item {{selectedItemIds.indexOf(item.id) >= 0 ? 'is-selected' : ''}}"`
  - 视觉：选中时图片加高亮边框/轻微缩放，左上角勾选圆点填充为主题色；未选为灰色细框。

### 2）按钮样式统一
- 批量工具栏：
  - “全选/全不选”按钮替换为 `cu-btn line-blue sm`。
  - “选择目标位置”按钮替换为 `cu-btn bg-gradual-green lg`（A 版）。
- 位置弹窗底部“确认并开始移动”同样使用 `cu-btn bg-gradual-green lg`。

### 3）位置选择浮层重做
- 列表改为卡片网格：
  - 位置：轻量标签样式，选中高亮边框。
  - 盒子卡片：`style="background: {{item.color || '#1296db'}}"`；卡片内显示盒名与位置；选中加白色描边+勾选角标。
  - 袋子卡片：`style="background: {{item.color || '#1296db'}}"`；显示袋名；选中同勾选角标。
- 选中态判定：
  - 盒子：`(selectedBox.id || selectedBox.box_id) === (item.id || item.box_id)`。
  - 袋子：`selectedBag.bag_id === item.bag_id`。
- 为位置、盒、袋列表分别添加 `.selected` 类与对应高亮样式。

### 4）结果汇总改为可关闭Modal
- 新增：`showResultModal` 与 `resultSummary`（成功/跳过/失败）。
- 完成后：
  - 关闭进度弹窗，打开结果 Modal，展示统计与“我知道了”按钮。
  - `onCloseResultModal()` 手动关闭，保留在当前页。

### 5）不改动后端与核心逻辑
- 批量移动仍为顺序执行（并发=1），跳过判定保持不变；失败不重试、不列出ID。

## 代码改动范围
- `packageStorage/pages/bag-detail/bag-detail.wxml`：
  - 批量工具栏按钮类名更新、网格项选中态类、勾选控件修复、位置选择卡片结构与选中态。
  - 新增结果 Modal 结构。
- `packageStorage/pages/bag-detail/bag-detail.wxss`：
  - 批量勾选状态与图片选中态的视觉样式。
  - 位置选择卡片网格与选中态样式（盒/袋底色取各自颜色）。
  - 结果 Modal 样式。
- `packageStorage/pages/bag-detail/bag-detail.js`：
  - 新增 `showResultModal`、`resultSummary` 状态与 `onCloseResultModal` 方法。
  - 替换模板交互需要的事件名（使用已有 `stopPropagation`）。

## 验证
- 逐步模拟：进入批量模式→勾选/全选→选择位置（位置→盒→袋）→执行移动→查看进度→查看结果 Modal 并手动关闭。
- 检查控制台无“true”方法报错；选中/未选视觉清晰。

## 记录
- 变更完成后，将本次问答记录追加新文件到 `.trae/prompts`，延续既定格式。

请确认以上改动方案；确认后我将按此方案进行UI与交互优化的代码修改。