# 山西旅行攻略页面重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新设计 ShanxiTripPage，实现底部胶囊日期导航、每个景点的百度地图导航按钮、每日住宿卡内嵌，风格延续暖棕手账风。

**Architecture:** 纯前端改动，两个文件。先改数据层（加 dayId / 导航辅助函数），再全量重写 CSS 导航部分并补充新组件样式，最后更新 JSX 渲染逻辑。无后端变更。

**Tech Stack:** React 19, CSS Modules, TypeScript, Vite

---

## 文件范围

| 文件 | 操作 |
|------|------|
| `src/client/pages/ShanxiTripPage.tsx` | 修改：数据结构、辅助函数、JSX 渲染 |
| `src/client/pages/ShanxiTripPage.module.css` | 修改：删除旧 tab 样式，新增 pill nav / navBtn / hotelSection 样式 |

---

## Task 1: 数据层——HOTELS 加 dayId、新增辅助函数

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.tsx` (data section, lines ~516–530)

- [ ] **Step 1.1: 在 `ShanxiTripPage.tsx` 中添加 `HotelData` interface 和 `buildBaiduNavUrl` 函数**

在文件顶部 `interface Props` 下方（约第 5 行后）插入：

```ts
interface HotelData {
  dayId: string
  night: string
  name: string
  desc: string
}

function buildBaiduNavUrl(placeName: string): string {
  return `baidumap://map/geocoder?address=${encodeURIComponent(placeName)}&src=webapp.windssea.daily`
}
```

- [ ] **Step 1.2: 替换 `HOTELS` 常量，加上 `dayId`，拆分 5/3-4 为两条**

将现有：
```ts
const HOTELS = [
  { night: '5/1', name: '大同古城四星亲子酒店', desc: '永泰门附近 · 含早餐 · 停车位充足' },
  { night: '5/2', name: '应县县城连锁酒店', desc: '近应县木塔 · 出行便利' },
  { night: '5/3-4', name: '太原南站周边高端酒店', desc: '方便还车与返程 · 连住两晚' },
]
```

替换为：
```ts
const HOTELS: HotelData[] = [
  { dayId: 'd1', night: '5/1', name: '大同古城四星亲子酒店', desc: '永泰门附近 · 含早餐 · 停车位充足' },
  { dayId: 'd2', night: '5/2', name: '应县县城连锁酒店', desc: '近应县木塔 · 出行便利' },
  { dayId: 'd3', night: '5/3', name: '太原南站周边高端酒店', desc: '方便还车与返程 · 连住两晚' },
  { dayId: 'd4', night: '5/4', name: '太原南站周边高端酒店', desc: '方便还车与返程 · 续住第二晚' },
]
```

- [ ] **Step 1.3: 启动开发服务器，确认 TypeScript 无报错**

```bash
cd D:/dev/windssea/windssea-daily
pnpm dev
```

预期：浏览器打开后页面正常加载，控制台无 TS 错误。

- [ ] **Step 1.4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.tsx
git commit -m "refactor: add HotelData interface, dayId fields and buildBaiduNavUrl helper"
```

---

## Task 2: CSS——替换旧 tab 导航为胶囊 pill nav，新增 navBtn 和 hotelSection 样式

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 2.1: 找到并删除旧的 tab 导航相关样式块**

删除 CSS 文件中以下整个注释块及其内容（`/* ── Bottom Tab Navigation */` 开始到最后一个 `.tab.active .tabIcon { ... }` 结束）。这些类名后续不再使用：`.tabsWrap`、`.tab`、`.tabIcon`。

- [ ] **Step 2.2: 在删除位置插入新的底部胶囊导航样式**

```css
/* ── Bottom Pill Navigation ─────────────────── */
.pillNav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 20;
  background: oklch(17% 0.02 30 / 0.97);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-top: 1px solid oklch(30% 0.018 35);
  box-shadow: 0 -4px 24px oklch(0% 0 0 / 0.18);
  padding: 10px 12px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.pillNav::-webkit-scrollbar { display: none; }

.pill {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  background: rgba(255,255,255,0.08);
  color: oklch(60% 0.01 50);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
  -webkit-tap-highlight-color: transparent;
  letter-spacing: 0.02em;
}

.pill.active {
  background: #c47c5a;
  color: #fff2e0;
}

.pill:active:not(.active) {
  background: rgba(255,255,255,0.15);
}
```

- [ ] **Step 2.3: 更新 `.page` 的 `padding-bottom`**

将现有（来自上一次会话的改动）：
```css
padding-bottom: calc(58px + env(safe-area-inset-bottom));
```

替换为：
```css
padding-bottom: calc(72px + env(safe-area-inset-bottom));
```

（pill nav 高度约 56px，多留 16px 缓冲）

- [ ] **Step 2.4: 确认 `.section` 的 `scroll-margin-top` 为 `66px`**

确认（上次会话已改，无需再改）：
```css
.section {
  scroll-margin-top: 66px;
}
```

- [ ] **Step 2.5: 在 CSS 文件末尾（`.footer::before` 之后）添加新样式**

```css
/* ── Baidu Nav Button ───────────────────────── */
.navBtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--accent-light);
  border: 1px solid oklch(85% 0.05 40);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  margin-top: 4px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
  cursor: pointer;
  font-family: inherit;
}

.navBtn:active {
  background: oklch(88% 0.06 40);
}

/* ── Inline Hotel Section ───────────────────── */
.hotelSection {
  padding: 4px 20px 20px;
}

.hotelSectionLabel {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 8px;
}
```

- [ ] **Step 2.6: 检查页面显示效果**

在 `pnpm dev` 运行的情况下，进入山西旅游页面，确认：
- 底部出现深色背景的胶囊导航条
- 旧的图标+文字 tab 消失（如果 TSX 还未改，看不到 pill，但也不应该有旧 tab）
- 页面底部有足够空白，内容不被遮挡

- [ ] **Step 2.7: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: replace tab nav with pill nav, add navBtn and hotelSection styles"
```

---

## Task 3: JSX——更新导航渲染、加景点导航按钮、加每日住宿卡

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.tsx` (component section, lines ~533–884)

- [ ] **Step 3.1: 在 `ShanxiTripPage` 组件内部，新增 `pillsRef` 和更新 `scrollToDay`**

找到 `const tabsRef = useRef<HTMLDivElement>(null)` 这一行，将其改为：
```ts
const pillsRef = useRef<HTMLDivElement>(null)
```

找到 `scrollToDay` 函数中 `const topOffset = 66` 这行，确认值为 `66`（上次会话已设，无需改）。

找到 `scrollToDay` 中以下代码：
```ts
const tabIndex = DAYS.findIndex(d => d.id === dayId)
if (tabsRef.current && tabIndex >= 0) {
  const tabButtons = tabsRef.current.querySelectorAll('button')
  tabButtons[tabIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}
```

替换为：
```ts
const pillIndex = DAYS.findIndex(d => d.id === dayId)
if (pillsRef.current && pillIndex >= 0) {
  const pillButtons = pillsRef.current.querySelectorAll('button')
  pillButtons[pillIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}
```

- [ ] **Step 3.2: 替换底部导航的 JSX**

找到现有的 `{/* BOTTOM TAB NAV */}` 块（约行 645–659）：
```tsx
{/* BOTTOM TAB NAV */}
<nav className={styles.tabsWrap} ref={tabsRef}>
  {DAYS.map(d => (
    <button
      key={d.id}
      className={`${styles.tab} ${activeDay === d.id ? styles.active : ''}`}
      onClick={() => scrollToDay(d.id)}
    >
      <span className={styles.tabIcon}>
        <Icon name={DAY_ICONS[d.id] || 'backpack'} size={20} />
      </span>
      <span>{d.label}</span>
    </button>
  ))}
</nav>
```

替换为：
```tsx
{/* BOTTOM PILL NAV */}
<nav className={styles.pillNav} ref={pillsRef}>
  {DAYS.map(d => (
    <button
      key={d.id}
      className={`${styles.pill} ${activeDay === d.id ? styles.active : ''}`}
      onClick={() => scrollToDay(d.id)}
    >
      {d.label}
    </button>
  ))}
</nav>
```

- [ ] **Step 3.3: 确认 `Icon` 组件和 `DAY_ICONS` 仍保留（hero 区域可能用到图标），只是底部导航不再用**

搜索文件中其他用到 `Icon` 的地方（header 的返回按钮、section 标题、day meta 等）。如果这些地方仍在用，不要删除 `Icon` 组件定义。只删除对 `DAY_ICONS` 的引用（如果确认只在旧 tab nav 中使用，可以删掉 `DAY_ICONS` 常量；如果有其他用途保留）。

> 注：在步骤 3.2 中我们已经移除了 tab nav 里的 `Icon` 调用，所以 `DAY_ICONS` 可以安全删除。

- [ ] **Step 3.4: 在景点条目（`isSight: true`）下方加百度导航按钮**

找到渲染时间轴 item 的部分，定位到以下代码（约行 812–826）：
```tsx
{hasAccordion ? (
  <button className={styles.tlBtn} onClick={() => toggleItem(entry.id)}>
    <span className={styles.tlTime}>{entry.time}</span>
    <span className={styles.tlName}>
      {stripEmoji(entry.desc)}
      <svg className={styles.caret} .../>
    </span>
  </button>
) : (
  <div className={`${styles.tlBtn} ${styles.tlBtnStatic}`}>
    <span className={styles.tlTime}>{entry.time}</span>
    <span className={styles.tlName}>{stripEmoji(entry.desc)}</span>
  </div>
)}
```

在这个 `hasAccordion ? ... : ...` 块之后（在 `{hasAccordion && ( ... detail ... )}` 之前），插入：

```tsx
{entry.isSight && (
  <a
    className={styles.navBtn}
    href={buildBaiduNavUrl(stripEmoji(entry.desc))}
  >
    📍 百度地图导航
  </a>
)}
```

完整的 tlItem 渲染块改后如下（供参考）：
```tsx
<div key={entry.id} className={`${styles.tlItem} ${entry.isSight ? styles.highlight : ''} ${isOpen ? styles.open : ''}`}>
  {hasAccordion ? (
    <button className={styles.tlBtn} onClick={() => toggleItem(entry.id)}>
      <span className={styles.tlTime}>{entry.time}</span>
      <span className={styles.tlName}>
        {stripEmoji(entry.desc)}
        <svg className={styles.caret} viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    </button>
  ) : (
    <div className={`${styles.tlBtn} ${styles.tlBtnStatic}`}>
      <span className={styles.tlTime}>{entry.time}</span>
      <span className={styles.tlName}>{stripEmoji(entry.desc)}</span>
    </div>
  )}

  {entry.isSight && (
    <a
      className={styles.navBtn}
      href={buildBaiduNavUrl(stripEmoji(entry.desc))}
    >
      📍 百度地图导航
    </a>
  )}

  {hasAccordion && (
    <div className={styles.tlDetail}>
      <div className={styles.tlInner}>
        <div className={`${styles.tlBody} ${entry.isSight ? styles.isSight : ''}`}>
          {entry.body && <div className={styles.tlBodyText}>{entry.body}</div>}
          {entry.detailsList && entry.detailsList.map((dt, i) => (
            <div key={i} className={styles.sightRow}>
              <span className={styles.sightLabel}>{dt.label}</span>
              <span className={styles.sightValue}>{dt.value}</span>
            </div>
          ))}
          {entry.badges && entry.badges.length > 0 && (
            <div className={styles.badgeRow}>
              {entry.badges.map((b, i) => (
                <span key={i} className={`${styles.badge} ${styles['badge-' + (b.type || 'default')]}`}>
                  {b.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 3.5: 在每个 ITINERARY day section 底部加当日住宿卡**

找到渲染主行程的循环（约行 769–858）：
```tsx
{ITINERARY.map(day => (
  <section key={day.id} className={styles.section} id={day.id} ref={setSectionRef(day.id)}>
    ...
    <div className={styles.timeline}>
      ...
    </div>
  </section>
))}
```

在 `</section>` 关闭标签之前（`</div>` 时间线结束后），插入住宿卡渲染：

```tsx
{/* 当日住宿 */}
{(() => {
  const hotel = HOTELS.find(h => h.dayId === day.id)
  if (!hotel) return null
  return (
    <div className={styles.hotelSection}>
      <div className={styles.hotelSectionLabel}>今日住宿</div>
      <div className={styles.hotelItem}>
        <div className={styles.hotelNight}>
          <span className={styles.hotelNightIcon}><Icon name="hotel" size={13} /></span>
          {hotel.night}
        </div>
        <div className={styles.hotelInfo}>
          <div className={styles.hotelName}>{hotel.name}</div>
          <div className={styles.hotelDesc}>{hotel.desc}</div>
        </div>
      </div>
    </div>
  )
})()}
```

- [ ] **Step 3.6: 检查并删除 `DAY_ICONS` 常量（已无用）**

删除文件中：
```ts
const DAY_ICONS: Record<string, string> = {
  prep: 'backpack',
  d0: 'train',
  d1: 'castle',
  d2: 'mountain',
  d3: 'swords',
  d4: 'temple',
  d5: 'home',
}
```

确认没有其他地方引用 `DAY_ICONS`（全局搜索 `DAY_ICONS`，应只出现一处定义）。

- [ ] **Step 3.7: 视觉验收检查（在浏览器中）**

打开 `http://localhost:5173`，进入山西旅游页面，逐一确认：

1. 底部固定显示深色背景的胶囊导航，7个胶囊：准备/出发/大同/云冈/边塞/晋祠/返程
2. 点击任意胶囊 → 页面平滑滚动到对应区块，该胶囊变为暖棕色
3. 手动滚动页面 → 当前可见区块对应的胶囊自动高亮
4. 每个景点条目（大同古城墙/云冈石窟/悬空寺等）下方有「📍 百度地图导航」按钮
5. 点击导航按钮，浏览器地址栏或移动端跳转 URL 格式为 `baidumap://map/geocoder?address=<景点名>&src=webapp.windssea.daily`
6. 有住宿的天（d1/d2/d3/d4）在行程时间线下方显示住宿卡
7. 返程日（d5）无住宿卡
8. 滚动到页面底部，内容不被底部导航遮挡

- [ ] **Step 3.8: Commit**

```bash
git add src/client/pages/ShanxiTripPage.tsx
git commit -m "feat: pill nav, baidu map nav buttons, inline hotel cards per day

- Replace icon+label tab nav with horizontal pill nav
- Add baidumap:// deep link for each isSight attraction
- Show hotel card inline at bottom of each day section
- Remove unused DAY_ICONS constant"
```

---

## 验收清单（对应 spec）

- [ ] 底部胶囊导航固定在屏幕底部，7个日期可左右滑动
- [ ] 点击胶囊平滑滚动到对应日期区块，且该胶囊高亮
- [ ] 滚动内容时，当前可见区块对应的胶囊自动高亮
- [ ] 每个 `isSight: true` 条目下方有「📍 百度地图导航」按钮
- [ ] 点击导航按钮，URL 为 `baidumap://map/geocoder?address=<景点名>&src=webapp.windssea.daily`
- [ ] 展开景点详情显示概述/亮点/必打卡 + 价格徽章
- [ ] 每个有住宿的日期（d1/d2/d3/d4）底部显示当日住宿卡
- [ ] 返程日（d5）无住宿卡
- [ ] 内容不被底部导航遮挡（padding-bottom 足够）
- [ ] iOS 安全区（home indicator）不遮挡底部导航（env(safe-area-inset-bottom)）
