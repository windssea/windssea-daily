# Travel Map Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增旅行地图页面，使用高德地图 JS API v2 展示已去过的城市图钉，点击图钉弹出城市名和到访时间。

**Architecture:** 新增 `TravelMapPage` 组件遵循现有 hash 路由模式（`onBack` prop + `#travelmap`），`useEffect` 内用 `@amap/amap-jsapi-loader` 加载高德地图并创建 Marker/InfoWindow，城市数据维护在组件顶部的 `VISITED_CITIES` 数组，无后端依赖。

**Tech Stack:** React 19, TypeScript, CSS Modules, `@amap/amap-jsapi-loader`, 高德地图 JS API v2

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/client/pages/TravelMapPage.tsx` | 新建 | 城市数据、地图初始化、Marker/InfoWindow、返回按钮 |
| `src/client/pages/TravelMapPage.module.css` | 新建 | 地图容器全屏、悬浮按钮/标签定位样式 |
| `src/client/App.tsx` | 修改 | 增加 `'travelmap'` 路由类型和渲染分支 |
| `src/client/pages/WelcomePage.tsx` | 修改 | 增加 `onTravelMap` prop 和入口卡片按钮 |

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json` (pnpm 自动更新)

- [ ] **Step 1: 安装 `@amap/amap-jsapi-loader`**

```bash
cd D:/dev/windssea/windssea-daily
pnpm add @amap/amap-jsapi-loader
```

Expected output: 包含 `@amap/amap-jsapi-loader` 的 `added 1 package` 或类似信息。

- [ ] **Step 2: 确认安装成功**

```bash
cat package.json | grep amap
```

Expected: `"@amap/amap-jsapi-loader": "^2.x.x"` 出现在 dependencies 中。

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @amap/amap-jsapi-loader"
```

---

### Task 2: 创建 CSS Module

**Files:**
- Create: `src/client/pages/TravelMapPage.module.css`

- [ ] **Step 1: 创建样式文件**

```css
/* TravelMapPage.module.css */
.container {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
}

.mapEl {
  width: 100%;
  height: 100%;
}

.backBtn {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: background 0.2s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.backBtn:active {
  transform: scale(0.96);
  background: rgba(255, 255, 255, 1);
}

.backIcon {
  width: 16px;
  height: 16px;
  stroke: #333;
}

.cityCount {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 1000;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  font-size: 13px;
  color: #555;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.cityCount strong {
  color: #222;
  font-weight: 700;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/pages/TravelMapPage.module.css
git commit -m "feat: add TravelMapPage CSS module"
```

---

### Task 3: 创建 TravelMapPage 组件

**Files:**
- Create: `src/client/pages/TravelMapPage.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { useEffect, useRef } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import styles from './TravelMapPage.module.css'

interface Props {
  onBack: () => void
}

interface City {
  name: string
  coords: [number, number]  // [经度, 纬度]
  visitDate: string          // 如 '2024年3月'，空字符串则弹卡不显示时间
}

const VISITED_CITIES: City[] = [
  { name: '北京', coords: [116.397428, 39.90923],  visitDate: '' },
  { name: '上海', coords: [121.473701, 31.230416], visitDate: '' },
  { name: '南京', coords: [118.796877, 32.060255], visitDate: '' },
  { name: '桐庐', coords: [119.691105, 29.793553], visitDate: '' },
  { name: '溧阳', coords: [119.484211, 31.416911], visitDate: '' },
  { name: '泉州', coords: [118.589421, 24.908853], visitDate: '' },
  { name: '厦门', coords: [118.089425, 24.479833], visitDate: '' },
]

function infoContent(city: City): string {
  return `
    <div style="padding:8px 4px;min-width:80px;font-family:system-ui,sans-serif">
      <div style="font-size:15px;font-weight:600;color:#222">${city.name}</div>
      ${city.visitDate ? `<div style="font-size:12px;color:#888;margin-top:3px">${city.visitDate}</div>` : ''}
    </div>
  `
}

function TravelMapPage({ onBack }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 注入安全密钥（必须在 AMapLoader.load 之前）
    ;(window as any)._AMapSecurityConfig = {
      securityJsCode: 'e36c00409cc30b19630919b19a7c981c',
    }

    let map: any = null

    AMapLoader.load({
      key: '4a5d859ceb11047c18fa7bb7d6b5267e',
      version: '2.0',
    }).then((AMap) => {
      map = new AMap.Map(mapElRef.current, {
        zoom: 5,
        center: [116, 36],
      })

      let openWindow: any = null

      VISITED_CITIES.forEach((city) => {
        const marker = new AMap.Marker({
          position: new AMap.LngLat(city.coords[0], city.coords[1]),
          title: city.name,
        })

        const infoWindow = new AMap.InfoWindow({
          content: infoContent(city),
          offset: new AMap.Pixel(0, -30),
        })

        marker.on('click', () => {
          if (openWindow) openWindow.close()
          infoWindow.open(map, marker.getPosition())
          openWindow = infoWindow
        })

        map.add(marker)
      })
    })

    return () => {
      map?.destroy()
    }
  }, [])

  return (
    <div className={styles.container}>
      <div ref={mapElRef} className={styles.mapEl} />

      <button className={styles.backBtn} onClick={onBack} aria-label="返回">
        <svg
          className={styles.backIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className={styles.cityCount}>
        已去 <strong>{VISITED_CITIES.length}</strong> 个城市
      </div>
    </div>
  )
}

export default TravelMapPage
```

- [ ] **Step 2: Commit**

```bash
git add src/client/pages/TravelMapPage.tsx
git commit -m "feat: add TravelMapPage with AMap markers and InfoWindow"
```

---

### Task 4: 接入 App.tsx 路由

**Files:**
- Modify: `src/client/App.tsx`

- [ ] **Step 1: 修改 App.tsx**

将 `App.tsx` 替换为以下内容：

```tsx
import { useState, useEffect, useCallback } from 'react'
import WelcomePage from './pages/WelcomePage'
import TodoPage from './pages/TodoPage'
import ShanxiTripPage from './pages/ShanxiTripPage'
import IFramePage from './pages/IFramePage'
import TravelMapPage from './pages/TravelMapPage'

type Page = 'welcome' | 'todo' | 'shanxi' | 'huangshan' | 'travelmap'

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'todo' || hash === 'shanxi' || hash === 'huangshan' || hash === 'travelmap') return hash
  return 'welcome'
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  const navigate = useCallback((next: Page) => {
    setPage(next)
    history.pushState(null, '', next === 'welcome' ? location.pathname : `#${next}`)
  }, [])

  useEffect(() => {
    const onPopState = () => setPage(getPageFromHash())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (page === 'todo') return <TodoPage onBack={() => navigate('welcome')} />
  if (page === 'shanxi') return <ShanxiTripPage onBack={() => navigate('welcome')} />
  if (page === 'travelmap') return <TravelMapPage onBack={() => navigate('welcome')} />
  if (page === 'huangshan') return (
    <IFramePage
      title="黄山旅游"
      src="https://trip.nanopanda.site/"
      onBack={() => navigate('welcome')}
    />
  )
  return (
    <WelcomePage
      onEnter={() => navigate('todo')}
      onShanxiTrip={() => navigate('shanxi')}
      onHuangshanTrip={() => navigate('huangshan')}
      onTravelMap={() => navigate('travelmap')}
    />
  )
}

export default App
```

- [ ] **Step 2: Commit**

```bash
git add src/client/App.tsx
git commit -m "feat: add travelmap route to App"
```

---

### Task 5: WelcomePage 增加入口按钮

**Files:**
- Modify: `src/client/pages/WelcomePage.tsx`

- [ ] **Step 1: 添加地图 SVG 图标函数**

在 `WelcomePage.tsx` 中，在 `IconArrowRight` 函数之后（第 46 行后）插入：

```tsx
function IconMap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
```

- [ ] **Step 2: 更新 Props 接口**

将 `interface Props` 替换为：

```tsx
interface Props {
  onEnter: () => void
  onShanxiTrip: () => void
  onHuangshanTrip: () => void
  onTravelMap: () => void
}
```

- [ ] **Step 3: 更新组件签名**

将函数签名从：

```tsx
function WelcomePage({ onEnter, onShanxiTrip, onHuangshanTrip }: Props) {
```

改为：

```tsx
function WelcomePage({ onEnter, onShanxiTrip, onHuangshanTrip, onTravelMap }: Props) {
```

- [ ] **Step 4: 在 tripList 中追加旅行地图卡片**

在 `</div>` 关闭 `.tripList` 之前（黄山按钮之后）追加：

```tsx
            <button
              className={`${styles.card} ${styles.tripCard}`}
              onClick={onTravelMap}
              aria-label="查看旅行地图"
            >
              <div className={styles.tripHeader}>
                <div className={`${styles.iconWrap}`}>
                  <IconMap className={styles.iconElement} />
                </div>
              </div>
              <div className={styles.tripBody}>
                <p className={styles.tripLabel}>旅行地图</p>
                <p className={styles.tripDesc}>7 CITIES VISITED</p>
              </div>
              <IconArrowRight className={styles.tripArrow} />
            </button>
```

- [ ] **Step 5: Commit**

```bash
git add src/client/pages/WelcomePage.tsx
git commit -m "feat: add travel map entry button to WelcomePage"
```

---

### Task 6: 手动验证

**Files:** 无修改

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev:client
```

打开浏览器 `http://localhost:5173`。

- [ ] **Step 2: 验证 WelcomePage 入口**

确认首页底部 Plannings 区域出现「旅行地图」卡片，图标为定位图钉样式，副标题显示「7 CITIES VISITED」。

- [ ] **Step 3: 验证地图加载**

点击「旅行地图」，确认：
- 页面跳转，URL 变为 `#travelmap`
- 高德标准地图加载完成（可见地图底图和道路）
- 地图上出现 7 个红色图钉

- [ ] **Step 4: 验证图钉弹卡**

点击任意图钉，确认弹出 InfoWindow 卡片，显示城市名称（visitDate 为空则只有城市名）。点击另一图钉时旧卡片关闭、新卡片打开。

- [ ] **Step 5: 验证返回**

点击左上角「返回」按钮，确认回到 WelcomePage，浏览器后退按钮同样有效。

- [ ] **Step 6: 验证城市计数**

确认右下角显示「已去 7 个城市」。
