# ShanxiTripPage 重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ShanxiTripPage 升级为 App 级体验：深色 Hero + 暖白内容区 + 景点独立卡片时间线。

**Architecture:** 纯前端改动，不涉及数据层。CSS Module 文件修复结构 bug 并重写视觉样式，TSX 文件新增 Hero 统计行 + 横滑芯片 + 景点条目卡片结构。所有行程数据、天气 API、滚动逻辑保持不变。

**Tech Stack:** React 18, TypeScript, CSS Modules, Vite (`pnpm dev:client` 启动前端预览)

---

## 文件范围

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/client/pages/ShanxiTripPage.module.css` | 修改 | 修复 CSS bug + 全量样式重写 |
| `src/client/pages/ShanxiTripPage.tsx` | 修改 | 新增 heroStats / heroChips JSX + 景点卡片结构 |

---

## Task 1: 修复 CSS 结构性 Bug

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

当前文件有两处 CSS 结构错误，必须先修复，否则后续所有 timeline 样式失效。

**Bug 1 (Line ~595):** `.timeline::before` 规则缺少闭合 `}`，导致 `.tlItem` 等规则被嵌套其中。

**Bug 2 (Lines ~957-1020):** `@media (prefers-reduced-motion)` 内有孤立规则 `.tlNameText` 和重复的 `.caret` / `.footerSeal` 等；文件末尾有多余闭合 `}`。

- [ ] **Step 1: 修复 `.timeline::before` 缺失的 `}`**

找到以下代码段（约第 595 行）：

```css
.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  width: 1.5px;
  background: oklch(82% 0.02 45);
  border-radius: 1px;

.tlItem {
```

替换为：

```css
.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  width: 1.5px;
  background: oklch(82% 0.02 45);
  border-radius: 1px;
}

.tlItem {
```

- [ ] **Step 2: 修复文件末尾的孤立规则和重复 @media 块**

找到文件末尾 `@media (prefers-reduced-motion: reduce)` 闭合 `}` 之后的内容（约第 993 行起）：

```css
  .tlBody {
    animation: none;
  }
  .tlDetail {
    transition: none;
  }
.tlNameText {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.caret {
    transition: none;
  }
  .footerSeal {
    animation: none;
  }
  .pill {
    transition: none;
  }
  .pinLink {
    transition: none;
  }
}
```

替换为（将 `.tlNameText` 移出，删除多余的重复 reduced-motion 片段）：

```css
.tlNameText {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
```

- [ ] **Step 3: 验证 CSS 文件结构正确**

运行以下命令，输出应为 0（无错误）：

```bash
cd D:/dev/windssea/windssea-daily
pnpm dev:client 2>&1 | head -20
```

Vite 启动时如有 CSS parse error 会立即报错。若无报错则结构正确。Ctrl+C 停止。

- [ ] **Step 4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "fix: repair CSS structural bugs in ShanxiTripPage (missing brace, orphaned rules)"
```

---

## Task 2: 重写 Header 样式（深色毛玻璃）

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 1: 替换 `.header` 样式**

找到：

```css
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  background: oklch(97% 0.012 60 / 0.92);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--paper-line);
  position: sticky;
  top: 0;
  z-index: 20;
}
```

替换为：

```css
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: rgba(18, 17, 30, 0.93);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: sticky;
  top: 0;
  z-index: 20;
}
```

- [ ] **Step 2: 替换 `.backBtn` 和 `.headerTitle` 样式**

找到 `.backBtn { ... }` 块，替换为：

```css
.backBtn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.backBtn:active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: scale(0.93);
}

.backBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

找到 `.headerTitle { ... }` 块，替换为：

```css
.headerTitle {
  flex: 1;
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 3: 启动 dev 预览确认 Header 变为深色毛玻璃效果**

```bash
pnpm dev:client
```

在浏览器打开本地地址，进入山西行程页，顶部 Header 应为深色半透明，返回按钮为暗底白图标。

- [ ] **Step 4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: dark frosted-glass header for ShanxiTripPage"
```

---

## Task 3: 重写 Hero 背景 + 标题渐变

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 1: 替换 `.hero` 及其伪元素**

找到：

```css
.hero {
  position: relative;
  padding: 56px 24px 44px;
  overflow: hidden;
  background: linear-gradient(
    155deg,
    var(--accent-deep) 0%,
    var(--accent) 40%,
    oklch(62% 0.13 35) 100%
  );
  color: oklch(97% 0.005 50);
}
```

替换为：

```css
.hero {
  position: relative;
  padding: 28px 20px 0;
  overflow: hidden;
  background: linear-gradient(160deg, #12111e 0%, #1e1630 45%, #2c1a3e 100%);
  color: #fff;
}
```

找到 `.hero::before { ... }` 块，替换为：

```css
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 60% at 85% 15%, rgba(212, 112, 74, 0.2) 0%, transparent 60%),
    radial-gradient(ellipse 50% 45% at 8% 90%, rgba(80, 50, 160, 0.15) 0%, transparent 60%);
  pointer-events: none;
}
```

`.hero::after` 保持不变（网格纹理）。

- [ ] **Step 2: 替换 `.heroTitle` `.heroSub` `.heroSubDetail`**

找到 `.heroTitle { ... }` 块，替换为：

```css
.heroTitle {
  position: relative;
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: clamp(30px, 9vw, 42px);
  line-height: 1.1;
  margin: 0 0 8px;
  letter-spacing: 0.02em;
  text-wrap: balance;
  background: linear-gradient(135deg, #ffffff 0%, #f5c4a0 55%, #e8956a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

找到 `.heroSub { ... }` 块，替换为：

```css
.heroSub {
  position: relative;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 4px;
  letter-spacing: 0.08em;
}
```

找到 `.heroSubDetail { ... }` 块，替换为：

```css
.heroSubDetail {
  position: relative;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 18px;
  letter-spacing: 0.15em;
}
```

- [ ] **Step 3: 验证 Hero 变为深色渐变 + 标题橙黄渐变文字**

```bash
pnpm dev:client
```

Hero 背景应为深紫黑渐变，右上角有橙色光晕，标题为白→橙黄渐变文字。

- [ ] **Step 4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: dark gradient hero with orange-gradient title"
```

---

## Task 4: 更新 heroStats 配色 + 新增 heroChips CSS

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 1: 替换 `.heroStats` `.heroStat` `.heroStatN` `.heroStatL`**

找到 `.heroStats { ... }` 块（当前为 3 列），替换为：

```css
.heroStats {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.heroStat {
  background: rgba(255, 255, 255, 0.04);
  padding: 10px 4px;
  text-align: center;
}

.heroStatN {
  font-size: 20px;
  font-family: 'ZCOOL XiaoWei', serif;
  font-variant-numeric: tabular-nums;
  display: block;
  line-height: 1;
  color: #e8956a;
}

.heroStatL {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  display: block;
  margin-top: 4px;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 2: 在 `.heroStatL` 规则之后追加 heroChips 新类**

在 `.heroStatL { ... }` 结束的 `}` 之后，追加：

```css
/* ── Hero Chips ─────────────────────────────── */
.heroChips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin: 0 -20px;
  padding: 0 20px 16px;
  position: relative;
}

.heroChips::-webkit-scrollbar {
  display: none;
}

.heroChip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.heroChip.heroChipActive {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.heroChip:active:not(.heroChipActive) {
  background: rgba(255, 255, 255, 0.15);
}
```

- [ ] **Step 3: 验证 CSS 无报错**

```bash
pnpm dev:client 2>&1 | head -10
```

无报错即可。Ctrl+C。

- [ ] **Step 4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: update heroStats to 4-col orange theme, add heroChips CSS"
```

---

## Task 5: 更新日期角标 + 时间线 CSS

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 1: 替换 `.dayDateCircle` `.dayDateM` `.dayDateD`**

找到 `.dayDateCircle { ... }` 块，替换为：

```css
.dayDateCircle {
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #fff;
  border-radius: var(--r-sm);
  padding: 6px 12px;
  text-align: center;
  flex-shrink: 0;
  min-width: 52px;
  box-shadow: 0 4px 14px oklch(58% 0.12 30 / 0.35);
}

.dayDateM {
  font-size: 11px;
  opacity: 0.8;
  display: block;
  line-height: 1.2;
}

.dayDateD {
  font-size: 26px;
  font-family: 'ZCOOL XiaoWei', serif;
  font-weight: 800;
  line-height: 1;
  display: block;
  margin-top: 2px;
}
```

- [ ] **Step 2: 替换 `.dayName` 字重**

找到 `.dayName { ... }` 块，替换为：

```css
.dayName {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.35;
  color: var(--ink);
  text-wrap: balance;
}
```

- [ ] **Step 3: 替换时间线线条和节点样式**

找到 `.timeline::before { ... }` 块，替换为：

```css
.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent), var(--paper-line), var(--accent));
  border-radius: 1px;
  opacity: 0.35;
}
```

找到 `.tlItem::before { ... }` 块，替换为：

```css
.tlItem::before {
  content: '';
  position: absolute;
  left: -19px;
  top: 14px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--paper);
  border: 2px solid oklch(75% 0.04 50);
  transition: border-color 0.25s, background 0.25s, transform 0.25s;
}
```

找到 `.tlItem.highlight::before { ... }` 块，替换为：

```css
.tlItem.highlight::before {
  background: var(--accent);
  border-color: var(--accent);
  width: 10px;
  height: 10px;
  left: -20px;
  top: 13px;
  box-shadow: 0 0 0 3px rgba(212, 112, 74, 0.18);
}
```

- [ ] **Step 4: 验证日期角标有橙红渐变阴影，时间线更细腻**

```bash
pnpm dev:client
```

日期角标应有渐变 + 橙色投影，时间线节点大小有区分。

- [ ] **Step 5: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: gradient day badge, refined timeline nodes"
```

---

## Task 6: 新增景点卡片 CSS

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

景点条目从「带左边框的 tlBody」升级为独立白色卡片，需要新增 CSS 类。

- [ ] **Step 1: 在 `.tlBody.isSight { ... }` 之后追加景点卡片新类**

找到：

```css
.tlBody.isSight {
  border-left-color: var(--accent);
  background: oklch(96% 0.014 40);
}
```

在其之后追加：

```css
/* ── Sight Card (replaces tlBody.isSight) ───── */
.sightTimeAbove {
  font-size: 11px;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
  display: block;
  padding-left: 4px;
  margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
}

.sightCard {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(212, 112, 74, 0.15);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07), 0 0 0 1px rgba(212, 112, 74, 0.05);
  margin: 0 0 8px -4px;
  overflow: hidden;
}

.sightCardHead {
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 12px 14px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.sightCardHead:hover {
  background: rgba(212, 112, 74, 0.03);
}

.sightCardHead:active {
  background: rgba(212, 112, 74, 0.06);
}

.sightCardHead:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.sightCardLeft {
  flex: 1;
  min-width: 0;
}

.sightCardLabel {
  font-size: 11px;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.06em;
  display: block;
  margin-bottom: 2px;
}

.sightCardName {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.sightCardActions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}

.sightCardBody {
  border-top: 1px solid oklch(92% 0.02 50);
  padding: 10px 14px 12px;
  background: linear-gradient(to bottom, rgba(212, 112, 74, 0.03), transparent);
  animation: tlBodyIn 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: add sight card CSS classes"
```

---

## Task 7: 更新 Hotel 卡片 + 底部导航 CSS

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 1: 替换 `.hotelItem` 样式**

找到 `.hotelItem { ... }` 块，替换为：

```css
.hotelItem {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid var(--paper-line);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
```

找到 `.hotelNight { ... }` 块，替换为：

```css
.hotelNight {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--ink);
  color: oklch(97% 0.005 50);
  border-radius: var(--r-xs);
  padding: 5px 8px;
  font-size: 12px;
  flex-shrink: 0;
  text-align: center;
  min-width: 44px;
  justify-content: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: 替换 `.pillNav` `.pill` `.pill.active` 样式**

找到 `.pillNav { ... }` 块，替换为：

```css
.pillNav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  z-index: 20;
  background: rgba(12, 11, 20, 0.97);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.22);
  padding: 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  gap: 5px;
}
```

找到 `.pill { ... }` 块，替换为：

```css
.pill {
  flex-shrink: 0;
  padding: 8px 13px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.4);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.25s cubic-bezier(0.25, 1, 0.5, 1), color 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  -webkit-tap-highlight-color: transparent;
  letter-spacing: 0.02em;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
```

找到 `.pill.active { ... }` 块，替换为：

```css
.pill.active {
  background: var(--accent);
  color: #fff;
}
```

- [ ] **Step 3: 验证 hotel 卡片变白色，底部导航更深更暗 active 为橙红**

```bash
pnpm dev:client
```

hotel 卡片应为纯白带轻阴影，底部导航更暗，active pill 为橙红色。

- [ ] **Step 4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: white hotel cards, darker bottom nav with orange active"
```

---

## Task 8: TSX — 新增 Hero 统计行

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.tsx`

- [ ] **Step 1: 在 Hero 区 `heroSubDetail` 之后插入 `heroStats` JSX**

找到：

```tsx
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>山西五日深度游</h1>
        <p className={styles.heroSub}>五一亲子自驾 · 2025.4.30 — 5.5</p>
        <p className={styles.heroSubDetail}>南京出发 · 晋北环线</p>
      </section>
```

替换为：

```tsx
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroSubDetail}>SHANXI · FAMILY ROAD TRIP · 2025</p>
        <h1 className={styles.heroTitle}>山西五日深度游</h1>
        <p className={styles.heroSub}>五一亲子自驾 · 2025.4.30 — 5.5 · 南京出发</p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>5</span>
            <span className={styles.heroStatL}>天</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>8</span>
            <span className={styles.heroStatL}>景点</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>760</span>
            <span className={styles.heroStatL}>公里</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>4</span>
            <span className={styles.heroStatL}>人</span>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: 验证 TypeScript 编译无报错**

```bash
pnpm dev:client 2>&1 | grep -i error | head -10
```

无报错。在浏览器中 Hero 区底部应出现 4 列数据卡片（5天/8景点/760公里/4人），橙黄色数字。

- [ ] **Step 3: Commit**

```bash
git add src/client/pages/ShanxiTripPage.tsx
git commit -m "feat: add hero stats row (5天/8景点/760公里/4人)"
```

---

## Task 9: TSX — 新增 Hero 横滑芯片导航

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.tsx`

- [ ] **Step 1: 在 `heroStats` 之后插入 `heroChips` JSX**

找到上一步插入的 `</div>` (heroStats 闭合) 之后 `</section>` 之前，插入：

```tsx
        <div className={styles.heroChips}>
          {DAYS.map(d => (
            <button
              key={d.id}
              className={`${styles.heroChip} ${activeDay === d.id ? styles.heroChipActive : ''}`}
              onClick={() => scrollToDay(d.id)}
            >
              {d.emoji} {d.label}
            </button>
          ))}
        </div>
```

完整 Hero 区应如下：

```tsx
      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroSubDetail}>SHANXI · FAMILY ROAD TRIP · 2025</p>
        <h1 className={styles.heroTitle}>山西五日深度游</h1>
        <p className={styles.heroSub}>五一亲子自驾 · 2025.4.30 — 5.5 · 南京出发</p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}><span className={styles.heroStatN}>5</span><span className={styles.heroStatL}>天</span></div>
          <div className={styles.heroStat}><span className={styles.heroStatN}>8</span><span className={styles.heroStatL}>景点</span></div>
          <div className={styles.heroStat}><span className={styles.heroStatN}>760</span><span className={styles.heroStatL}>公里</span></div>
          <div className={styles.heroStat}><span className={styles.heroStatN}>4</span><span className={styles.heroStatL}>人</span></div>
        </div>
        <div className={styles.heroChips}>
          {DAYS.map(d => (
            <button
              key={d.id}
              className={`${styles.heroChip} ${activeDay === d.id ? styles.heroChipActive : ''}`}
              onClick={() => scrollToDay(d.id)}
            >
              {d.emoji} {d.label}
            </button>
          ))}
        </div>
      </section>
```

- [ ] **Step 2: 验证 Hero 底部出现横滑芯片，点击可跳转到对应日期**

```bash
pnpm dev:client
```

Hero 底部应有 5 个横滑芯片（🏯大同 / 🗿云冈 / ⚔️边塞 / 🏛️晋祠 / 🏠返程），点击任意芯片页面平滑滚动到对应 section，芯片高亮跟随 activeDay 变化。

- [ ] **Step 3: Commit**

```bash
git add src/client/pages/ShanxiTripPage.tsx
git commit -m "feat: add hero chips nav bar with active state sync"
```

---

## Task 10: TSX — 景点条目重构为卡片结构

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.tsx`

这是改动最大的 TSX 任务。将 `isSight` 条目从普通 accordion 重构为独立卡片。

- [ ] **Step 1: 替换时间线渲染区块**

找到：

```tsx
          <div className={styles.timeline}>
            {day.entries.map((entry) => {
              const isOpen = !!openItems[entry.id]
              const hasAccordion = !!(entry.body || (entry.detailsList && entry.detailsList.length > 0))

              return (
                <div key={entry.id} className={`${styles.tlItem} ${entry.isSight ? styles.highlight : ''} ${isOpen ? styles.open : ''}`}>
                  {hasAccordion ? (
                    <button className={styles.tlBtn} onClick={() => toggleItem(entry.id)} aria-expanded={isOpen} aria-controls={entry.id + '-detail'}>
                      <span className={styles.tlTime}>{entry.time}</span>
                      <span className={styles.tlName}>
                        <span className={styles.tlNameText}>{stripEmoji(entry.desc)}</span>
                        {entry.isSight && (
                          <a className={styles.pinLink} href={buildBaiduNavUrl(stripEmoji(entry.desc))} aria-label="导航" onClick={e => e.stopPropagation()}>
                            <Icon name="mapPin" size={14} />
                          </a>
                        )}
                        <svg className={styles.caret} viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </button>
                  ) : (
                    <div className={`${styles.tlBtn} ${styles.tlBtnStatic}`}>
                      <span className={styles.tlTime}>{entry.time}</span>
                      <span className={styles.tlName}>
                        <span className={styles.tlNameText}>{stripEmoji(entry.desc)}</span>
                        {entry.isSight && (
                          <a className={styles.pinLink} href={buildBaiduNavUrl(stripEmoji(entry.desc))} aria-label="导航">
                            <Icon name="mapPin" size={14} />
                          </a>
                        )}
                      </span>
                    </div>
                  )}

                  {hasAccordion && (
                    <div className={styles.tlDetail} id={entry.id + '-detail'}>
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
              )
            })}
          </div>
```

替换为：

```tsx
          <div className={styles.timeline}>
            {day.entries.map((entry) => {
              const isOpen = !!openItems[entry.id]
              const isSightWithDetail = entry.isSight && !!(entry.detailsList && entry.detailsList.length > 0)
              const hasRegularAccordion = !entry.isSight && !!entry.body

              return (
                <div
                  key={entry.id}
                  className={`${styles.tlItem} ${entry.isSight ? styles.highlight : ''} ${isOpen ? styles.open : ''}`}
                >
                  {/* 景点卡片 */}
                  {isSightWithDetail ? (
                    <>
                      <span className={styles.sightTimeAbove}>{entry.time}</span>
                      <div className={styles.sightCard}>
                        <button
                          className={styles.sightCardHead}
                          onClick={() => toggleItem(entry.id)}
                          aria-expanded={isOpen}
                          aria-controls={entry.id + '-detail'}
                        >
                          <div className={styles.sightCardLeft}>
                            <span className={styles.sightCardLabel}>景点</span>
                            <div className={styles.sightCardName}>
                              {stripEmoji(entry.desc)}
                            </div>
                          </div>
                          <div className={styles.sightCardActions}>
                            <a
                              className={styles.pinLink}
                              href={buildBaiduNavUrl(stripEmoji(entry.desc))}
                              aria-label="导航"
                              onClick={e => e.stopPropagation()}
                            >
                              <Icon name="mapPin" size={14} />
                            </a>
                            <svg className={styles.caret} viewBox="0 0 16 16" fill="none">
                              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>

                        <div className={styles.tlDetail} id={entry.id + '-detail'}>
                          <div className={styles.tlInner}>
                            <div className={styles.sightCardBody}>
                              {entry.detailsList?.map((dt, i) => (
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
                      </div>
                    </>
                  ) : hasRegularAccordion ? (
                    /* 普通可展开条目 */
                    <>
                      <button
                        className={styles.tlBtn}
                        onClick={() => toggleItem(entry.id)}
                        aria-expanded={isOpen}
                        aria-controls={entry.id + '-detail'}
                      >
                        <span className={styles.tlTime}>{entry.time}</span>
                        <span className={styles.tlName}>
                          <span className={styles.tlNameText}>{stripEmoji(entry.desc)}</span>
                          <svg className={styles.caret} viewBox="0 0 16 16" fill="none">
                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </button>
                      <div className={styles.tlDetail} id={entry.id + '-detail'}>
                        <div className={styles.tlInner}>
                          <div className={styles.tlBody}>
                            <div className={styles.tlBodyText}>{entry.body}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* 静态条目（无展开） */
                    <div className={`${styles.tlBtn} ${styles.tlBtnStatic}`}>
                      <span className={styles.tlTime}>{entry.time}</span>
                      <span className={styles.tlName}>
                        <span className={styles.tlNameText}>{stripEmoji(entry.desc)}</span>
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
```

- [ ] **Step 2: 验证 TypeScript 编译无类型报错**

```bash
pnpm dev:client 2>&1 | grep -E "(error|Error)" | head -10
```

应无报错输出。

- [ ] **Step 3: 功能验证**

```bash
pnpm dev:client
```

在浏览器中验证：
- 景点条目显示为白色圆角卡片，有「景点」标签 + 粗体景点名 + 地图图标 + caret
- 点击卡片展开详情（概述/亮点/必打卡 + 徽章），动画与之前一致
- 普通条目（交通、餐饮等）保持轻量文字样式，点击展开 body 文字
- 静态条目（无 body 无 detailsList）正常显示
- 百度地图导航链接点击不触发展开

- [ ] **Step 4: Commit**

```bash
git add src/client/pages/ShanxiTripPage.tsx
git commit -m "feat: refactor sight entries to card UI with separate accordion"
```

---

## Task 11: 收尾 — 清理 @media reduced-motion + 最终验证

**Files:**
- Modify: `src/client/pages/ShanxiTripPage.module.css`

- [ ] **Step 1: 在 `@media (prefers-reduced-motion: reduce)` 块内补充新增类的禁动规则**

找到 `@media (prefers-reduced-motion: reduce)` 块，在已有规则之后、闭合 `}` 之前追加：

```css
  .heroChip {
    transition: none;
  }
  .sightCardHead {
    transition: none;
  }
  .sightCardBody {
    animation: none;
  }
```

- [ ] **Step 2: 全量功能验证**

```bash
pnpm dev:client
```

逐一检查：
1. Header 深色毛玻璃，标题浅色
2. Hero 深紫黑渐变，标题橙黄渐变，4 列统计卡片，底部横滑芯片
3. 日期角标橙红渐变 + 阴影
4. 时间线：普通条目轻量，景点条目白色圆角卡片
5. 景点卡片展开/收起动画正常
6. Hotel 卡片白色带轻阴影
7. 底部导航深色，active 芯片橙红

- [ ] **Step 3: 最终 Commit**

```bash
git add src/client/pages/ShanxiTripPage.module.css
git commit -m "style: add reduced-motion rules for new components, final cleanup"
```
