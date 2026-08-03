# 2026 东北亲子避暑十日驾驶舱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有旧版东北旅行页面重写为以原始 Markdown 行程为唯一内容基线、支持天气容错和快速查看的十日亲子出游驾驶舱，并验证后提交推送到 `main`。

**Architecture:** 保留现有 `HarbinTripPage` 入口和天气 API，重写页面内的本地行程数据与渲染结构。页面由 Hero、路线总览、预约节点、每日时间线、天气卡和出行提醒组成；天气通过一次 batch 请求覆盖所有 D 日，失败时按城市回退到明确标注的夏季参考信息。

**Tech Stack:** React 19、TypeScript、CSS Modules、Vite、现有 Hono/QWeather `/api/weather/batch` 接口。

## Global Constraints

- 页面必须保留 D0—D9 完整路线：南京 → 哈尔滨 → 长白山北景区 → 沈阳 → 南京。
- 哈尔滨 D1—D3 必须以原稿为准：索菲亚/中央大街/松花江、东北虎林园＋哈工大、哈药六厂＋D552 转场。
- 原稿中的参考车次和时间必须标记“参考”，最终以 12306 或景区官方平台为准。
- 天气请求失败时不得伪造精确预报，必须显示“计划参考”和出发前复核提示。
- 不新增依赖，不修改与本次页面无关的 API、数据库和路由。
- 移动端约 320px 宽度不得出现横向滚动；交互目标至少 44px。

---

### Task 1: Replace the trip data model and content baseline

**Files:**
- Modify: `src/client/pages/HarbinTripPage.tsx`
- Reference: `docs/superpowers/specs/2026-08-03-northeast-family-trip-dashboard-design.md`

**Interfaces:**
- Produces `ITINERARY`, `RESERVATIONS`, `HOTELS`, and `TIPS` consumed by the page renderer.
- `DayData` includes `id`, `month`, `dayDate`, `weekday`, `city`, `title`, `flight?`, `hotel?`, `weatherCity`, `weatherDate`, `weatherFallback`, `weatherAdvice`, `entries`, and optional `decision`.
- `TimelineEntry` includes `id`, `time`, `desc`, optional `body`, `isSight`, `detailsList`, `badges`, and optional `variant: 'normal' | 'decision'`.
- `WeatherState` includes `icon`, `text`, `temp`, `wind`, `source: 'live' | 'reference'`, and `advice`.

- [ ] **Step 1: Remove the outdated day data and reservation defaults**

Replace the existing `ITINERARY` data so it contains exactly these day titles and primary actions:

```ts
const DAY_BASELINE = [
  ['d0', '8月14日', '周五', '南京 → 哈尔滨', 'Z366 卧铺出发'],
  ['d1', '8月15日', '周六', '抵达哈尔滨', '圣索菲亚教堂外观 · 中央大街 · 松花江'],
  ['d2', '8月16日', '周日', '哈尔滨亲子日', '东北虎林园 · 哈工大校园与航天馆'],
  ['d3', '8月17日', '周一', '哈尔滨 → 长白山', '哈药六厂 · D552/D553 转场'],
  ['d4', '8月18日', '周二', '长白山北景区', '天池优先 · 瀑布 · 温泉群 · 绿渊潭'],
  ['d5', '8月19日', '周三', '天气备用日', '小镇休整 · 温泉 · 二次入园候选'],
  ['d6', '8月20日', '周四', '长白山 → 沈阳', 'G3554 · 入住 · 中街'],
  ['d7', '8月21日', '周五', '沈阳历史日', '沈阳故宫 · 张学良旧居'],
  ['d8', '8月22日', '周六', '沈阳工业日', '中国工业博物馆 · 红梅文创园可选 · 老北市'],
  ['d9', '8月23日', '周日', '沈阳 → 南京', 'G98/G99 返回南京南'],
] as const
```

Write the detailed entries from the source itinerary into those ten days. D1 must only include the short arrival walk, D2 must start with the tiger park and place Harbin Institute of Technology after lunch, and D3 must include the D552 no-ticket/alternate-train decision. Keep reference markers on `15:37`, `15:53`, `19:38`, `12:23`, `14:25`, `12:31`, and `19:28`.

- [ ] **Step 2: Add reservation and fallback data**

Create reservation items for D552 (8/3 10:00), G3554 (8/6 16:30), Harbin Institute of Technology (8/9 check), G98 (8/9 09:00), and Changbai Mountain tickets (8/11 18:00). Each item must include an official channel, the action, and a fallback sentence. Add decision cards for D552 failure, Harbin Institute of Technology booking failure, Tianchi closure, and Shenyang rain/high heat.

- [ ] **Step 3: Add explicit city-level weather fallback data**

Use reference-only ranges rather than invented daily forecasts:

```ts
const WEATHER_REFERENCE = {
  南京: { temp: '夏季参考', text: '出发前复核', advice: '出发日注意高温，车站候车预留安检时间' },
  哈尔滨: { temp: '夏季参考', text: '舒适但有阵雨可能', advice: '轻薄长袖、防晒和一次性雨衣随身' },
  长白山: { temp: '山地参考', text: '山顶多变', advice: '雨衣、薄外套和防滑鞋；天池以当天调度为准' },
  沈阳: { temp: '夏季参考', text: '高温/阵雨复核', advice: '高温或大雨时优先室内场馆，取消红梅文创园' },
} as const
```

The static fallback must be visible as `计划参考`, while a successful API result is visible as `实时预报`.

- [ ] **Step 4: Run the type checker after data replacement**

Run: `pnpm exec tsc --noEmit`

Expected: the compiler reports no errors before moving to the rendering pass.

### Task 2: Build the cockpit renderer and weather state

**Files:**
- Modify: `src/client/pages/HarbinTripPage.tsx`

**Interfaces:**
- `WeatherCard({ state }: { state: WeatherState })` renders live/reference source state and action advice.
- `ReservationRail({ items }: { items: ReservationItem[] })` renders time-sorted action cards.
- `DaySection({ day, weather, ... })` renders one D-day section and uses existing scroll refs.
- `TimelineItem({ entry, open, onToggle })` preserves keyboard-accessible `aria-expanded` accordion behavior.

- [ ] **Step 1: Replace the hero markup**

Render the title `2026 东北亲子避暑 10 日`, the subtitle `8.14—8.23 · 2 大 2 小 · 南京出发`, four stats (10 天 / 3 个目的地 / 4 位同行者 / 1 个天气备用日), the route ribbon, and an alert that Tianchi is weather-dependent.

- [ ] **Step 2: Add the reservation rail before the daily itinerary**

Render four key cards in chronological order. Each card shows the date/time, target, official channel, and the next action. Use different visual emphasis for `立即处理`, `即将放票`, and `天气敏感`.

- [ ] **Step 3: Implement the weather batch state and fallback**

Keep one `weatherMap` keyed by day id. When the batch request returns, store `text`, `tempLow`, `tempHigh`, `windDir`, and `windScale` in the map. On failure or missing item, use the day’s `weatherFallback` and set `source: 'reference'`; do not hide the weather card.

- [ ] **Step 4: Render each day with clear hierarchy**

Each day must show date/weekday/city, transport, hotel, `WeatherCard`, timeline entries, and an optional decision card. Use sight cards for Northeast Tiger Park, Harbin Institute of Technology, Changbai Mountain North Scenic Area, Shenyang Imperial Palace, Zhang Xueliang Former Residence, and China Industrial Museum. Keep regular timeline entries collapsible.

- [ ] **Step 5: Verify the renderer and interactions in code**

Confirm every button has a label or visible text, every accordion has `aria-expanded`/`aria-controls`, reservation links do not accidentally trigger a parent toggle, and `activeDay` remains synchronized with both top and bottom navigation.

### Task 3: Rewrite the visual system for responsive itinerary reading

**Files:**
- Modify: `src/client/pages/HarbinTripPage.module.css`

- [ ] **Step 1: Define layout and color tokens**

Keep the warm travel-journal direction but use a restrained paper background, ink text, muted teal accent, amber warning, and red action state. Set a desktop content width around 900px and a mobile-first single-column layout.

- [ ] **Step 2: Style the cockpit sections**

Add styles for the route ribbon, reservation rail/cards, alert panel, weather card, source badges, decision cards, city labels, and daily metadata. Ensure long Chinese text wraps without forcing the page wider than the viewport.

- [ ] **Step 3: Preserve and improve interaction states**

Style visible focus rings, hover/active states, expanded accordion states, sticky bottom day navigation, and reduced-motion fallback. All touch targets must be at least 44px.

- [ ] **Step 4: Add responsive breakpoints**

At mobile widths use horizontal scrolling only for the day pill rail; at widths above 760px place summary/reservation content in a two-column grid while keeping the timeline readable in one column. Add a 320px safeguard for padding, font sizes, and metadata wrapping.

### Task 4: Verify, commit, and push to main

**Files:**
- Verify: `src/client/pages/HarbinTripPage.tsx`
- Verify: `src/client/pages/HarbinTripPage.module.css`
- Verify: generated Vite output only; do not commit `dist` unless already tracked by repository policy.

- [ ] **Step 1: Run static checks**

Run:

```powershell
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Expected: all commands exit with code 0.

- [ ] **Step 2: Run a local UI smoke check**

Start the client with `pnpm dev:client`, open `http://localhost:5173/#harbin`, and verify: the ten day tabs appear; D1 shows the central-street walk; D2 shows tiger park plus Harbin Institute of Technology; D3 shows the D552 decision; weather cards show either live or reference state; the page has no horizontal overflow at a 320px viewport.

- [ ] **Step 3: Inspect the final diff**

Run `git status --short`, `git diff --stat`, and `git diff --check`. Confirm only the intended page, CSS, and plan/spec files are changed.

- [ ] **Step 4: Commit the implementation**

```powershell
git add src/client/pages/HarbinTripPage.tsx src/client/pages/HarbinTripPage.module.css docs/superpowers/plans/2026-08-03-northeast-family-trip-dashboard-plan.md
git commit -m "feat: rebuild northeast family trip dashboard"
```

- [ ] **Step 5: Push the current main branch**

```powershell
git push origin main
```

Expected: `origin/main` advances to include the design commit and the implementation commit.

