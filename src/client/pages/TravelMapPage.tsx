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
    let cancelled = false

    AMapLoader.load({
      key: '4a5d859ceb11047c18fa7bb7d6b5267e',
      version: '2.0',
    }).then((AMap) => {
      if (cancelled) return
      map = new AMap.Map(mapElRef.current!, {
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
