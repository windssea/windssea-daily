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
  { name: '宿迁', coords: [118.275162, 33.963008], visitDate: '' },
  { name: '连云港', coords: [119.221611, 34.596653], visitDate: '' },
  { name: '高淳', coords: [118.876451, 31.327424], visitDate: '' },
  { name: '昆明', coords: [102.832891, 24.880095], visitDate: '' },
  { name: '大理', coords: [100.267638, 25.606486], visitDate: '' },
  { name: '杭州', coords: [120.153576, 30.287459], visitDate: '' },
  { name: '盱眙', coords: [118.544895, 33.011971], visitDate: '' },
  { name: '南通', coords: [120.864608, 32.016212], visitDate: '' },
  { name: '马鞍山', coords: [118.507906, 31.689362], visitDate: '' },
  { name: '黄山', coords: [118.337765, 29.714655], visitDate: '' },
  { name: '宏村', coords: [118.083229, 29.904628], visitDate: '' },
  { name: '桃花潭', coords: [118.356052, 30.256987], visitDate: '' },
  { name: '丽江', coords: [100.233026, 26.872108], visitDate: '' },
  { name: '香港', coords: [114.173355, 22.320048], visitDate: '' },
  { name: '澳门', coords: [113.549129, 22.198745], visitDate: '' },
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
    let cancelled = false

    AMapLoader.load({
      key: '4a5d859ceb11047c18fa7bb7d6b5267e',
      version: '2.0',
    }).then((AMap) => {
      if (cancelled) return
      map = new AMap.Map(mapElRef.current!, {
        zoom: 4,
        center: [116, 36],
        showIndoorMap: false,
        pitchEnable: false,
        rotateEnable: false,
      })

      let openWindow: any = null

      // 点击地图空白处关闭 InfoWindow
      map.on('click', () => {
        if (openWindow) {
          openWindow.close()
          openWindow = null
        }
      })

      VISITED_CITIES.forEach((city) => {
        // 自定义图钉：44×44 触摸区 + 24×32 SVG 图钉，移动端易点
        const markerContent = `
          <div style="width:44px;height:44px;display:flex;align-items:flex-end;justify-content:center;cursor:pointer">
            <svg width="24" height="32" viewBox="0 0 24 32" fill="#FF5A5F" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z"/>
              <circle cx="12" cy="12" r="5" fill="white"/>
            </svg>
          </div>`

        const marker = new AMap.Marker({
          position: new AMap.LngLat(city.coords[0], city.coords[1]),
          title: city.name,
          content: markerContent,
          offset: new AMap.Pixel(-22, -44),
        })

        const infoWindow = new AMap.InfoWindow({
          content: infoContent(city),
          offset: new AMap.Pixel(0, -48),
        })

        marker.on('click', (e: any) => {
          e.stopPropagation?.()
          if (openWindow) openWindow.close()
          infoWindow.open(map, marker.getPosition())
          openWindow = infoWindow
        })

        map.add(marker)
      })
    }).catch((err: unknown) => {
      if (cancelled) return
      console.error('AMap load failed:', err)
    })

    return () => {
      cancelled = true
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
