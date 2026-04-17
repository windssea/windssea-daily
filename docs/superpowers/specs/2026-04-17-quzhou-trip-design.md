# 衢州山行旅游攻略页面设计

**Date:** 2026-04-17  
**Status:** Approved

## Overview

Build a 衢州 trip guide page (`QuzhouTripPage`) modeled on `ShanxiTripPage`, covering a 5-day 4-night Quzhou family road trip departing from Nanjing. Add a homepage card in `WelcomePage` and wire up routing in `App.tsx`.

## Changes Required

### 1. App.tsx
- Add `'quzhou'` to `Page` union type
- Add `'quzhou'` to `getPageFromHash` guard
- Import `QuzhouTripPage`
- Add `onQuzhouTrip` callback to `WelcomePage` props
- Add route: `if (page === 'quzhou') return <QuzhouTripPage onBack={() => navigate('welcome')} />`

### 2. WelcomePage.tsx
- Add `onQuzhouTrip: () => void` to Props interface
- Add new trip card button (green icon, label "衢州山行", sub "5 DAYS JOURNEY")
- Use existing `IconTrees` or new leaf SVG icon with green `iconWrapGreen` style

### 3. New: QuzhouTripPage.tsx
Structure mirrors `ShanxiTripPage.tsx`:

**Ambient animation — `BambooLeaves`** (replaces `SandDrift`)
- Canvas overlay, fixed, pointer-events none, z-index 9998
- Leaves spawn from top, drift diagonally down-left with gentle rotation
- Shape: thin green ellipse (~8×2px), rotated per leaf angle
- Color: `rgba(80, 140, 80, 0.5)` with fade-in/fade-out envelope
- Continuous emission ~1-2 leaves/frame, lifetime 6-10s

**Hero section**
- Title: 衢州五日亲子游
- Sub: 五一自驾 · 2026.5.1 — 5.5 · 南京出发
- Stats: 5天 / 8景 / 800公里 / 4人
- Day chips: 🌿市区 / 🪨龙游 / 🏛️文化 / 🏔️南线 / 🏠返程

**Route map**
- Row 1: 南京(5/1) → 衢州(5/1-4)
- Connector
- Row 2: 南京(5/5) ← 衢州(5/4) ← 廿八都(5/4) ← 龙游(5/2)

**DAYS tabs**
```
d1: 市区  d2: 龙游  d3: 文化  d4: 南线  d5: 返程
```

**ITINERARY data (from 攻略.md)**

- **Day 1 (5/1)** 南京→衢州 · 城市绿肺初体验
  - 抵达入住（希尔顿双树 or 悦苑）
  - 景点: 鹿鸣公园（高架红栈道、平坦适儿童）
  - 景点: 水亭门（古城墙、江边晚餐、古铺良食）

- **Day 2 (5/2)** 东线探秘 · 龙游
  - 景点: 龙游石窟（洞内16℃、手电筒、防滑鞋）
  - 午餐龙游县城
  - 景点: 龙游民居苑（平坦、树荫、寻宝任务）

- **Day 3 (5/3)** 文化沉浸日
  - 景点: 衢州博物馆（恐龙化石、提前预约）
  - 黄金午休
  - 景点: 孔氏南宗家庙（喂锦鲤）
  - 水亭门/府山公园采购特产

- **Day 4 (5/4)** 南线 · 江郎山/廿八都
  - 景点: 清漾毛氏文化村（远观江郎山三爿石）
  - 就近农家午餐
  - 景点: 廿八都古镇（3小时沉浸）
  - 马站底美食街晚餐

- **Day 5 (5/5)** 错峰返程
  - 打包退房
  - 杭长高速→长深高速返宁

**Hotels**
- 5/1-5/4（4晚）: 衢州希尔顿双树酒店 或 衢州悦苑酒店（市区中心，停车/泳池）

**Reservations**
- 龙游石窟: 官方公众号，建议08:30前到
- 龙游民居苑: 随时，免预约
- 衢州博物馆: 公众号预约，节假日提前抢票
- 孔氏南宗家庙: 无需预约
- 清漾毛氏文化村: 无需预约
- 廿八都古镇: 无需预约

**Tips**
- 避辣指南：衢州菜辣度高且隐蔽，点菜务必强调"全桌免辣"
- 导航离线包：山区路段信号波动，提前下载高德/百度离线地图
- 儿童装备：龙游石窟穿防滑鞋，洞内备外套（常年16℃）
- 午休策略：连住一地最大优势，每日回酒店午休
- 错峰出行：五一早入园（8:30前），避开11-14点高峰
- 特产采购：龙游发糕、廿八都铜锣糕，第三天统一采购

### 4. New: QuzhouTripPage.module.css
- Reuse same CSS class names as `ShanxiTripPage.module.css`
- Theme accent: `--accent: #5a8a5c` (竹绿)
- Hero gradient: `linear-gradient(160deg, #1a2e1a 0%, #2d4a2d 60%, #3d5e3d 100%)`
- Sight card highlight: green tint border
- Footer seal character: 衢

## File Structure

```
src/client/pages/
  QuzhouTripPage.tsx         (new)
  QuzhouTripPage.module.css  (new)
  WelcomePage.tsx            (modified)
  App.tsx                    (modified)
```

## Out of Scope

- Weather API integration (can be added later like ShanxiTripPage)
- Baidu nav links on hotels/sights (included via `buildBaiduNavUrl` helper)
