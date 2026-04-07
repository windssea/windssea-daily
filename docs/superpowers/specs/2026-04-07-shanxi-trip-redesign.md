# 山西旅行攻略页面重新设计

**日期：** 2026-04-07  
**文件：** `src/client/pages/ShanxiTripPage.tsx` + `ShanxiTripPage.module.css`

---

## 问题诊断

现有页面存在以下问题：
1. 日期导航 tabs 固定在顶部，单手操作时拇指难以触达
2. 景点条目无导航链接，用户需要手动查找地图
3. 每日住宿信息只在「准备」section 有汇总，没有随日程内嵌
4. 整体信息密度偏高，视觉层级不够清晰

---

## 设计决策

### 视觉风格
- **延续手账暖棕风**（与 `.impeccable.md` 保持一致）
- 背景：暖纸色 `oklch(97% 0.012 60)` ≈ `#fdf6e9`
- 主色调：暖赤陶 `#c47c5a`（按钮、active 状态、景点高亮）
- 导航栏：深棕 `#2d1f14`（底部胶囊导航背景）
- 字体：ZCOOL XiaoWei（标题）+ Noto Sans SC（正文）

### 底部胶囊导航（核心改动）
- `position: fixed; bottom: 0`，始终可见
- 7个胶囊：准备 / 出发 / 大同 / 云冈 / 边塞 / 晋祠 / 返程
- 可横向滑动（overflow-x: auto + scrollbar hidden）
- 当前日期胶囊高亮暖棕色背景
- 背景：深棕半透明 + blur 效果
- 安全区适配：`padding-bottom: env(safe-area-inset-bottom)`
- 内容区底部需有足够 padding（约 64px + safe-area）以防内容被遮挡

### 地图导航
- 每个景点条目下方显示「📍 百度地图导航」按钮
- URL scheme：`baidumap://map/geocoder?address=<景点名>&src=webapp.windssea.daily`
- 景点名使用 `encodeURIComponent()` 编码
- 只有 `isSight: true` 的条目显示导航按钮
- 非景点条目（路途/餐饮/休息）不显示

### 每日内容结构
每天包含以下几个区块（按顺序）：

1. **日期头部**
   - 左：暖棕渐变圆角日期徽章（月份 + 日期数字）
   - 右：当日标题（两行）+ 元信息（距离、酒店、列车）

2. **今日行程**（时间线）
   - 垂直时间轴，左侧细线
   - 普通条目：时间 + 名称，无展开
   - 景点条目（`isSight: true`）：
     - 时间 + 名称 + 向下 caret
     - 「📍 百度地图导航」按钮（始终可见，不需展开）
     - 点击条目展开详情：概述/亮点/必打卡 + 价格徽章
   - 景点时间轴圆点：实心暖棕，带光晕圈

3. **今日住宿**（每日行程底部）
   - 小标签：日期 + 酒店名 + 描述
   - 从 `HOTELS` 数据里根据当日日期匹配
   - 最后一天（返程日 d5）无住宿卡

4. **注意事项**（仅在 prep 区块末尾，不单独成 tab）

### 准备 Tab 内容
- 行程路线图（横向城市点位线）
- 票务预约指南表（8个景点）
- 酒店汇总（4条）
- 出行注意事项（6条）

### 滚动与联动
- 滚动页面时，底部胶囊自动高亮当前可见的日期区块（IntersectionObserver）
- 点击胶囊时，平滑滚动到对应区块（`scrollIntoView`）
- `scroll-margin-top` 只需补偿顶部 header 高度（约 60px），不再需要补偿顶部 tabs

---

## 数据结构变更

### HOTELS 数据结构调整
需要给每个酒店条目加上 `dayId` 字段，方便在当日内嵌：

```ts
interface HotelData {
  dayId: string   // 'd1' | 'd2' | 'd3' | 'd4'（与 ITINERARY 的 id 对应）
  night: string
  name: string
  desc: string
}
```

### 导航链接辅助函数
```ts
function buildBaiduNavUrl(placeName: string): string {
  return `baidumap://map/geocoder?address=${encodeURIComponent(placeName)}&src=webapp.windssea.daily`
}
```

---

## 文件影响范围

| 文件 | 改动类型 |
|------|---------|
| `ShanxiTripPage.tsx` | 重写组件结构、添加每日住宿渲染、添加导航按钮 |
| `ShanxiTripPage.module.css` | 重写底部导航样式、调整 section scroll-margin、住宿卡样式 |

不涉及：`App.tsx`、`WelcomePage`、`TodoPage`、路由、后端。

---

## 验收标准

- [ ] 底部胶囊导航固定在屏幕底部，7个日期可左右滑动
- [ ] 点击胶囊平滑滚动到对应日期区块，且该胶囊高亮
- [ ] 滚动内容时，当前可见区块对应的胶囊自动高亮
- [ ] 每个 `isSight: true` 条目下方有「📍 百度地图导航」按钮
- [ ] 点击导航按钮，URL 为正确的 baidumap:// scheme
- [ ] 展开景点详情显示概述/亮点/必打卡 + 价格徽章
- [ ] 每个有住宿的日期底部显示当日住宿卡
- [ ] 内容不被底部导航遮挡（足够的 padding-bottom）
- [ ] iOS 安全区（home indicator）不遮挡底部导航
