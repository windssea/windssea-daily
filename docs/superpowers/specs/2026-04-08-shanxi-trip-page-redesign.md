# ShanxiTripPage 重设计规格

**日期：** 2026-04-08  
**目标：** 将现有行程攻略页面升级为 App 级视觉体验

---

## 一、设计方向

**原生 App 风 · 深色 Hero + 暖白内容区**

- Hero 区使用深色（深紫黑渐变），与顶部 Header 融为一体，制造沉浸感
- 内容区保持暖白纸质感（`#f7f4f0`），与 Hero 形成强对比
- 时间线景点条目升级为独立卡片，普通条目保持轻量样式

---

## 二、各区块设计规格

### 2.1 Sticky Header

**变更：**
- 背景改为深色半透明毛玻璃：`rgba(18,17,30,.92)` + `backdrop-filter: blur(16px)`
- 返回按钮改为深色圆角背景 pill 样式（`rgba(255,255,255,.08)`）
- 标题文字改为浅色：`rgba(255,255,255,.9)`
- 下边框改为微透明白线：`rgba(255,255,255,.08)`

### 2.2 Hero 区

**变更：**
- 背景渐变：`linear-gradient(160deg, #12111e 0%, #1e1630 40%, #2c1a3e 100%)`
- 叠加两个径向光晕（橙红 + 紫蓝）增加氛围感
- 保留网格纹理 SVG 背景
- 标题改为渐变文字（白 → 橙黄 → 橙红）：使用 `-webkit-background-clip: text`
- 新增 **统计卡片行**（CSS `.heroStats` 已存在，TSX 中未使用）：
  - 四格：5天 / 8景点 / 760公里 / 4人
  - 数字用橙红色 (`#e8956a`)，背景半透明深色
- 新增 **Hero 底部横滑日程芯片**（替代或补充现有底部导航的语义）：
  - 仅展示在 Hero 区底部，作为视觉装饰 + 快捷导航
  - active 芯片用橙红实色，其余半透明白
  - 区域向左右溢出，负 margin 实现贴边滚动

### 2.3 Day 区块头部

**变更：**
- 日期角标（`.dayDateCircle`）：改为橙红渐变 + `box-shadow` 带橙色光晕
- 日期数字保持大字，月份更小
- `dayName` 字重加强至 800
- `dayMeta` 中的图标 + 文字改为小 chip 样式（不变动 DOM 结构，只调 CSS）

### 2.4 时间线 — 普通条目

**变更（最小化）：**
- 时间轴左侧线条改为橙红渐变，透明度 0.4
- 节点圆点边框改为轻橙色
- 条目文字、时间样式微调（字号、颜色）

### 2.5 时间线 — 景点条目（重点）

**变更（重构）：**
- `isSight` 条目从「带左边框的背景块」升级为**独立白色卡片**
- 卡片样式：
  - `background: #fff`
  - `border-radius: 12px`
  - `border: 1px solid rgba(212,112,74,.15)`
  - `box-shadow: 0 2px 12px rgba(0,0,0,.07)`
  - 内有轻橙渐变背景叠层
- 卡片头部（始终可见）：
  - 左：小标签「景点」（橙红色 + 字重 700）+ 景点名（大字加粗）
  - 右：展开/收起 caret
- 卡片展开区：与现有 `tlDetail` 动画逻辑相同，内容格式不变（sightRow + badges）

### 2.6 当日住宿

**变更：**
- `hotelItem` 改为白色卡片，圆角 10px，轻阴影
- `hotelNight` 标签背景改为深色（`#1a1208`）

### 2.7 底部导航

**变更：**
- 背景加深：`rgba(12,11,20,.97)`
- active pill 颜色改为橙红（`#d4704a`）
- 非 active 文字更暗淡：`rgba(255,255,255,.4)`
- 轻微调整 `border-radius` 至 12px

### 2.8 CSS Bug 修复（必须先修）

当前 `ShanxiTripPage.module.css` 存在两处结构性问题：
1. **Line 595**：`.timeline::before` 规则缺少闭合 `}`，导致后续 `.tlItem` 等规则被嵌套其中
2. **Lines 994-1020**：`@media (prefers-reduced-motion)` 块内有孤立规则，且有重复的 `@media` 块

修复方式：整理 CSS 文件结构，确保所有规则正确闭合。

---

## 三、TSX 变更

1. **Hero 区新增统计行**：在 `<p className={styles.heroSubDetail}>` 之后插入 `heroStats` 区块
   ```tsx
   <div className={styles.heroStats}>
     <div className={styles.heroStat}>
       <span className={styles.heroStatN}>5</span>
       <span className={styles.heroStatL}>天</span>
     </div>
     {/* ... 8景点 / 760公里 / 4人 */}
   </div>
   ```
2. **Hero 底部芯片**：在 heroStats 后新增横滑芯片行，点击行为与 scrollToDay 一致
3. **景点卡片结构调整**：`isSight` 条目的 `.tlBtn` 包裹结构移入 `.tl-sight-card` 形式的容器

---

## 四、不变的内容

- 所有行程数据（ITINERARY / HOTELS / RESERVATIONS / TIPS）
- 天气 API 请求逻辑
- IntersectionObserver 滚动追踪逻辑
- Accordion 展开/收起状态机（openItems）
- 票务预约、酒店汇总、注意事项等区块的结构
- 百度地图导航链接逻辑

---

## 五、文件范围

- `src/client/pages/ShanxiTripPage.module.css` — 主要改动
- `src/client/pages/ShanxiTripPage.tsx` — 小幅改动（Hero 统计行 + 芯片 + 景点卡片结构）
