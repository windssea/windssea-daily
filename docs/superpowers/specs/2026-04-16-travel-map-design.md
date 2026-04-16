# Travel Map Page — Design Spec

**Date:** 2026-04-16  
**Status:** Approved

---

## Overview

新增旅行地图页面（`TravelMapPage`），使用高德地图 JS API v2 展示已去过的城市，以图钉标记，点击图钉弹出城市名称和到访时间卡片。城市数据以前端数组维护。

---

## Files Changed

| File | Action |
|------|--------|
| `src/client/pages/TravelMapPage.tsx` | 新建 |
| `src/client/pages/TravelMapPage.module.css` | 新建 |
| `src/client/App.tsx` | 修改：增加 `'travelmap'` 路由 |
| `src/client/pages/WelcomePage.tsx` | 修改：增加入口按钮 |

---

## Routing

遵循现有 hash 路由模式：

- Hash: `#travelmap`
- `App.tsx` 增加 `'travelmap'` 到 `Page` 类型
- `WelcomePage` 增加 `onTravelMap` prop 和对应入口按钮

---

## Data Structure

城市数组维护在 `TravelMapPage.tsx` 顶部，新增城市直接编辑该数组。

```ts
interface City {
  name: string
  coords: [number, number]  // [经度, 纬度] — 高德坐标系
  visitDate: string          // 如 '2024年3月'，留空则弹卡不显示时间
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
```

---

## Map Configuration

| 参数 | 值 |
|------|----|
| SDK | `@amap/amap-jsapi-loader`（官方 npm 包） |
| API 版本 | JS API v2 |
| Key | `4a5d859ceb11047c18fa7bb7d6b5267e` |
| 安全密钥 | `e36c00409cc30b19630919b19a7c981c`（通过 `window._AMapSecurityConfig` 注入） |
| 底图风格 | 标准地图（默认，不设 `mapStyle`） |
| 初始中心 | `[116, 36]`（中国中部） |
| 初始缩放 | `zoom: 5` |

---

## Component Logic

### 初始化流程（`useEffect`）

1. 设置 `window._AMapSecurityConfig = { securityJsCode: '...' }`
2. 调用 `AMapLoader.load({ key, version: '2.0', plugins: [] })`
3. `new AMap.Map(containerRef.current, { zoom: 5, center: [116, 36] })`
4. 遍历 `VISITED_CITIES`，每个城市创建 `AMap.Marker` 并添加到地图
5. 每个 Marker 绑定 `click` 事件：
   - 关闭当前已打开的 InfoWindow（如有）
   - 创建 `AMap.InfoWindow`，内容为城市名 + 到访时间（若 `visitDate` 为空则只显示城市名）
   - 在 Marker 位置打开 InfoWindow
6. 组件卸载时 `return () => map.destroy()`

### InfoWindow 内容模板

```html
<div style="padding:8px 4px;min-width:80px">
  <div style="font-size:15px;font-weight:600">{name}</div>
  {visitDate ? `<div style="font-size:12px;color:#888;margin-top:2px">{visitDate}</div>` : ''}
</div>
```

---

## UI Layout

- **地图容器**：`width: 100%; height: 100vh` — 全屏铺满
- **返回按钮**：绝对定位左上角，`position: absolute; top: 14px; left: 14px; z-index: 1000`，白色半透明背景（`rgba(255,255,255,0.9)`），样式参考现有页面返回箭头
- **城市计数标签**：绝对定位右下角，`position: absolute; bottom: 14px; right: 14px; z-index: 1000`，显示「已去 N 个城市」，白色半透明背景

---

## Dependencies

```bash
pnpm add @amap/amap-jsapi-loader
```

TypeScript 类型：`@amap/amap-jsapi-types`（可选，提供 AMap 命名空间类型）

---

## Out of Scope

- 后端存储（城市数据纯前端数组）
- 自定义图钉样式（使用高德默认红色图钉）
- 城市间路线连线
- 照片/游记详情
