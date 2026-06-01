import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './NingxiaTripPage.module.css'
import { api } from '../lib/api'

interface Props {
  onBack: () => void
}

interface HotelData {
  dayId: string
  night: string
  name: string
  desc: string
}

function buildBaiduNavUrl(placeName: string): string {
  return `baidumap://map/geocoder?address=${encodeURIComponent(placeName)}&src=webapp.windssea.daily`
}

/* ── SVG Icon System ─────────────────────────── */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Ic({ children, ...extra }: { children: React.ReactNode } & React.SVGProps<SVGSVGElement>) {
  return <svg {...iconProps} {...extra}>{children}</svg>
}

const ICONS: Record<string, React.ReactNode> = {
  arrowLeft: (
    <Ic><path d="M19 12H5M12 19l-7-7 7-7"/></Ic>
  ),
  plane: (
    <Ic>
      <path d="M22 2L11 13"/>
      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
    </Ic>
  ),
  camel: (
    <Ic>
      <path d="M3 18c2-2 6-4 10-4s8 2 8 4"/>
      <path d="M5 14c1-4 4-6 7-6s6 2 7 6"/>
      <ellipse cx="10" cy="8" rx="1.5" ry="1"/>
      <path d="M17 8c0 0 1-3 4-4v4"/>
      <path d="M7 14v4"/>
      <path d="M17 14v4"/>
    </Ic>
  ),
  castle: (
    <Ic>
      <path d="M12 2L3 8h18L12 2z"/>
      <rect x="4" y="8" width="16" height="4"/>
      <path d="M7 12v5h10v-5"/>
      <path d="M3 17h18"/>
      <rect x="10" y="17" width="4" height="4"/>
    </Ic>
  ),
  mountain: (
    <Ic>
      <path d="M2 20l7-10 4 6 3-4 6 8"/>
      <path d="M14 6l2-3 3 5"/>
    </Ic>
  ),
  temple: (
    <Ic>
      <path d="M12 3L3 9h18L12 3z"/>
      <path d="M6 9v12M18 9v12M12 9v12"/>
      <path d="M4 21h16"/>
      <path d="M12 3v6"/>
    </Ic>
  ),
  home: (
    <Ic>
      <path d="M3 12l9-8 9 8"/>
      <path d="M5 10.5V20a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1v-9.5"/>
    </Ic>
  ),
  car: (
    <Ic>
      <path d="M5 17h14"/>
      <path d="M6 17V12l2.5-5h7L18 12v5"/>
      <circle cx="8.5" cy="17" r="1.5"/>
      <circle cx="15.5" cy="17" r="1.5"/>
    </Ic>
  ),
  hotel: (
    <Ic>
      <path d="M3 21h18"/>
      <rect x="5" y="3" width="14" height="18" rx="1"/>
      <path d="M10 21v-5h4v5"/>
      <path d="M9 8h0.01M15 8h0.01M9 12h0.01M15 12h0.01"/>
    </Ic>
  ),
  ticket: (
    <Ic>
      <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v1a1 1 0 01-1 1 1 1 0 00-1 1v2a1 1 0 001 1 1 1 0 011 1v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1a1 1 0 011-1 1 1 0 001-1v-2a1 1 0 00-1-1 1 1 0 01-1-1V9z"/>
      <path d="M13 6v12"/>
    </Ic>
  ),
  calendar: (
    <Ic>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h0.01M12 14h0.01M16 14h0.01M8 18h0.01M12 18h0.01"/>
    </Ic>
  ),
  mapPin: (
    <Ic>
      <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </Ic>
  ),
  sunny: (
    <Ic>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </Ic>
  ),
  cloudy: (
    <Ic>
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
    </Ic>
  ),
  partlyCloudy: (
    <Ic>
      <path d="M12.5 6.5L11 8l1.5 1.5M14 2v2M21 9h-2"/>
      <circle cx="14" cy="9" r="3"/>
      <path d="M17 15H7a4 4 0 01-.4-7.98A5 5 0 0117 12a3 3 0 010 3z"/>
    </Ic>
  ),
  windy: (
    <Ic>
      <path d="M9.59 4.59A2 2 0 1111 8H2M12.59 19.41A2 2 0 1014 16H2M17.73 7.73A2.5 2.5 0 1119.5 12H2"/>
    </Ic>
  ),
  compass: (
    <Ic>
      <circle cx="12" cy="12" r="10"/>
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
    </Ic>
  ),
  water: (
    <Ic>
      <path d="M2 12c2-4 8-8 10-8s8 4 10 8c-2 4-8 8-10 8s-8-4-10-8z"/>
      <path d="M12 10v5M10 12h4"/>
    </Ic>
  ),
  star: (
    <Ic>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </Ic>
  ),
  backpack: (
    <Ic>
      <rect x="6" y="8" width="12" height="13" rx="2"/>
      <path d="M9 8V6a3 3 0 016 0v2"/>
      <path d="M6 13h12"/>
    </Ic>
  ),
}

function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={`${styles.icon} ${className}`}
      style={{ width: size, height: size }}
    >
      {ICONS[name]}
    </span>
  )
}

/* ── Helper ──────────────────────────────────── */

const stripEmoji = (s: string) => s.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]+\s*/u, '')

/* ── MeteorShower: Slow, bright, easily visible shooting stars ── */
function MeteorShower() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    /* ── Starfield: 200 stars ── */
    interface Star { x: number; y: number; r: number; baseAlpha: number; phase: number; speed: number }
    const stars: Star[] = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.3 + Math.random() * 2.0,
        baseAlpha: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0012,
      })
    }

    /* ── Meteors: slow, bright, long trail ── */
    interface Meteor {
      x: number; y: number
      vx: number; vy: number
      life: number; duration: number; born: number
      trailLen: number
      r: number; g: number; b: number
    }
    const meteors: Meteor[] = []
    const MAX_METEORS = 3

    function spawnMeteor(now: number) {
      if (meteors.length >= MAX_METEORS) return
      const startX = Math.random() * canvas.width * 0.85
      const startY = -30 + Math.random() * canvas.height * 0.12
      const angle = (Math.PI * 0.3) + Math.random() * (Math.PI * 0.4)
      const speed = 1.5 + Math.random() * 1.8  // slow: ~90-200 px/s → clearly visible

      // Colors: bright visible tones
      const hueRand = Math.random()
      let rVal: number, gVal: number, bVal: number
      if (hueRand < 0.45) {
        rVal = 255; gVal = 230; bVal = 100  // warm gold
      } else if (hueRand < 0.75) {
        rVal = 255; gVal = 250; bVal = 220  // warm white
      } else if (hueRand < 0.92) {
        rVal = 200; gVal = 220; bVal = 255  // cool blue-white
      } else {
        rVal = 255; gVal = 210; bVal = 250  // pink-white
      }

      meteors.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        duration: 2000 + Math.random() * 1500,  // 2-3.5s — long enough to appreciate
        born: now,
        trailLen: 120 + Math.random() * 100,     // long visible streak
        r: rVal, g: gVal, b: bVal,
      })
    }

    let lastSpawn = 0
    let raf: number

    function tick(now: number) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      /* ── Starfield ── */
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(now * s.speed + s.phase)
        const alpha = s.baseAlpha * twinkle
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,250,235,${alpha.toFixed(2)})`
        ctx.fill()
        if (s.r > 0.6 && twinkle > 0.8) {
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,230,160,${(alpha * 0.18).toFixed(2)})`
          ctx.fill()
        }
      }

      /* ── Spawn: one meteor every 1.5-3s ── */
      const spawnInterval = 1500 + Math.random() * 1500
      if (now - lastSpawn > spawnInterval) {
        spawnMeteor(now)
        lastSpawn = now
      }

      /* ── Draw meteors ── */
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]
        const elapsed = now - m.born
        m.life = elapsed / m.duration
        if (m.life >= 1) { meteors.splice(i, 1); continue }

        m.x += m.vx
        m.y += m.vy

        // Fade: gentle rise, long sustain, gentle fall
        let fade: number
        if (m.life < 0.2) fade = m.life / 0.2
        else if (m.life < 0.7) fade = 1
        else fade = (1 - m.life) / 0.3

        const spd = Math.hypot(m.vx, m.vy)
        const trailX = m.x - m.vx * (m.trailLen / spd)
        const trailY = m.y - m.vy * (m.trailLen / spd)

        // Wide outer glow
        const glowGrad = ctx.createLinearGradient(trailX, trailY, m.x, m.y)
        glowGrad.addColorStop(0, `rgba(${m.r},${m.g},${m.b},0)`)
        glowGrad.addColorStop(0.5, `rgba(${m.r},${m.g},${m.b},${(fade * 0.2).toFixed(2)})`)
        glowGrad.addColorStop(1, `rgba(${m.r},${m.g},${m.b},${(fade * 0.5).toFixed(2)})`)

        ctx.beginPath()
        ctx.moveTo(trailX, trailY)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = glowGrad
        ctx.lineWidth = 7 + fade * 5
        ctx.lineCap = 'round'
        ctx.stroke()

        // Bright core trail
        const coreGrad = ctx.createLinearGradient(trailX, trailY, m.x, m.y)
        coreGrad.addColorStop(0, `rgba(${m.r},${m.g},${m.b},0)`)
        coreGrad.addColorStop(0.5, `rgba(${m.r},${m.g},${m.b},${(fade * 0.6).toFixed(2)})`)
        coreGrad.addColorStop(1, `rgba(255,255,250,${(fade * 0.98).toFixed(2)})`)

        ctx.beginPath()
        ctx.moveTo(trailX, trailY)
        ctx.lineTo(m.x, m.y)
        ctx.strokeStyle = coreGrad
        ctx.lineWidth = 3 + fade * 2
        ctx.lineCap = 'round'
        ctx.stroke()

        // Large bright head with glow
        ctx.beginPath()
        ctx.arc(m.x, m.y, 3 + fade * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,250,${(fade * 0.95).toFixed(2)})`
        ctx.shadowColor = `rgba(255,230,140,${(fade * 0.75).toFixed(2)})`
        ctx.shadowBlur = 10 + fade * 16
        ctx.fill()

        // Extra sparkle core
        ctx.beginPath()
        ctx.arc(m.x, m.y, 1.5 + fade * 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,1)`
        ctx.fill()
        ctx.shadowBlur = 0
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  )
}

/** Map QWeather Chinese textDay to our icon name */
function weatherTextToIcon(text: string): string {
  if (!text) return 'cloudy'
  if (text.includes('晴')) return 'sunny'
  if (text.includes('多云') || text.includes('少云')) return 'partlyCloudy'
  if (text.includes('阴')) return 'cloudy'
  if (text.includes('雨')) return 'cloudy'
  if (text.includes('雪')) return 'cloudy'
  if (text.includes('风') || text.includes('沙') || text.includes('雾') || text.includes('霾')) return 'windy'
  return 'cloudy'
}

const CIRCLED_NUMBERS = ['①','②','③','④','⑤','⑥','⑦','⑧']

/* ── Static Data ─────────────────────────────── */

const DAYS = [
  { id: 'd1', label: '银川', emoji: '🕌' },
  { id: 'd2', label: '贺兰', emoji: '⛰️' },
  { id: 'd3', label: '西夏', emoji: '🏛️' },
  { id: 'd4', label: '水洞沟', emoji: '🏜️' },
  { id: 'd5', label: '青铜峡', emoji: '🌊' },
  { id: 'd6', label: '66号', emoji: '🛣️' },
  { id: 'd7', label: '沙漠', emoji: '🐪' },
  { id: 'd8', label: '沙坡头', emoji: '🏜️' },
  { id: 'd9', label: '返程', emoji: '✈️' },
]

interface TimelineDetail {
  label: string
  value: string
}

interface Badge {
  text: string
  type?: 'red' | 'green' | 'gold' | 'default'
}

interface TimelineEntry {
  id: string
  time: string
  desc: string
  body?: string
  isSight?: boolean
  detailsList?: TimelineDetail[]
  badges?: Badge[]
}

interface DayData {
  id: string
  month: string
  dayDate: string
  title: string
  distance?: string
  hotel?: string
  flight?: string
  weather?: string
  temp?: string
  weatherCity?: string
  weatherDate?: string
  entries: TimelineEntry[]
}

const ITINERARY: DayData[] = [
  {
    id: 'd1',
    month: '8月',
    dayDate: '1',
    title: '南京→银川\n落地休整日',
    flight: '南京飞银川',
    hotel: '银川市区酒店（金凤区/兴庆区）',
    weather: 'sunny',
    temp: '18~32°C',
    weatherCity: '银川',
    weatherDate: '2026-08-01',
    entries: [
      {
        id: 'd1-1',
        time: '全天',
        desc: '南京飞银川 · 取车 · 入住休整',
        body: '南京飞银川，抵达银川河东机场后取车，入住银川市区酒店。第一天不安排重景点，只做适应和补给。建议选择金凤区、兴庆区、鼓楼/怀远夜市附近住宿，吃饭和补给都方便。\n\n取车时重点检查：儿童安全座椅、空调、胎压、备胎、玻璃水、刹车、车身划痕。',
      },
      {
        id: 'd1-2',
        time: '傍晚',
        desc: '怀远夜市 / 鼓楼商圈轻逛',
        body: '不建议第一晚深逛夜市，带孩子浅尝即可。8月银川紫外线强，第二天开始户外较多，晚上提前准备防晒用品。',
      },
    ],
  },
  {
    id: 'd2',
    month: '8月',
    dayDate: '2',
    title: '镇北堡→贺兰山岩画\n银川北线精华日',
    distance: '约60km',
    hotel: '银川市区酒店',
    weather: 'sunny',
    temp: '19~33°C',
    weatherCity: '银川',
    weatherDate: '2026-08-02',
    entries: [
      {
        id: 'd2-1',
        time: '08:00 - 09:00',
        desc: '银川市区出发前往镇北堡',
        body: '银川市区出发，约40–60分钟车程抵达镇北堡西部影城。建议早出发，避开正午暴晒。',
      },
      {
        id: 'd2-2',
        time: '09:00 - 11:30',
        desc: '镇北堡西部影城',
        isSight: true,
        detailsList: [
          { label: '概述', value: '中国西北最具代表性的影视拍摄基地，《大话西游》《红高粱》《新龙门客栈》等经典取景地' },
          { label: '亮点', value: '影视场景丰富，孩子容易进入状态，适合拍照、换装、看表演或实景互动' },
          { label: '必打卡', value: '明城、清城、老银川一条街、月亮门、盘丝洞、唐僧受刑台' },
        ],
        badges: [
          { text: '成人 100元', type: 'red' },
          { text: '儿童半价', type: 'green' },
          { text: '友好·拍照圣地' },
        ],
      },
      {
        id: 'd2-3',
        time: '11:30 - 14:30',
        desc: '镇北堡/漫葡小镇午餐 · 休息',
        body: '中午不要回银川市区，避免来回折腾。建议在镇北堡、漫葡小镇或沿线找餐厅休息。推荐：羊肉面片、手抓羊肉、烩小吃、炒糊饽。孩子可选番茄鸡蛋面、牛肉面、炒饭。',
      },
      {
        id: 'd2-4',
        time: '15:00 - 17:00',
        desc: '贺兰山岩画',
        isSight: true,
        detailsList: [
          { label: '概述', value: '全国重点文物保护单位，远古游牧民族在贺兰山岩石上刻制的艺术画廊，距今3000-10000年' },
          { label: '亮点', value: '"自然山体 + 远古图像 + 贺兰山地貌"，适合给孩子讲"远古人类怎样记录生活"' },
          { label: '必打卡', value: '太阳神岩画、人面像群、动物岩画群、贺兰山峡谷地貌' },
        ],
        badges: [
          { text: '成人 70元', type: 'red' },
          { text: '儿童半价', type: 'green' },
          { text: '看核心区域即可·不深度徒步' },
        ],
      },
      {
        id: 'd2-5',
        time: '17:00 之后',
        desc: '返回银川市区',
        body: '不建议D2加西夏陵，会过于疲劳。镇北堡和岩画都偏户外，上午和下午分开玩，中午必须休息。车上准备：遮阳伞、冰袖、防晒帽、儿童墨镜、足量饮水。',
      },
    ],
  },
  {
    id: 'd3',
    month: '8月',
    dayDate: '3',
    title: '西夏陵→宁夏博物馆\n历史文化半日游',
    hotel: '银川市区酒店',
    weather: 'partlyCloudy',
    temp: '19~33°C',
    weatherCity: '银川',
    weatherDate: '2026-08-03',
    entries: [
      {
        id: 'd3-1',
        time: '08:30 - 12:00',
        desc: '西夏陵国家考古遗址公园',
        isSight: true,
        detailsList: [
          { label: '概述', value: '世界文化遗产，西夏历代帝王陵寝所在地，贺兰山下的"东方金字塔"，现存9座帝陵、253座陪葬墓' },
          { label: '亮点', value: '贺兰山下大型王陵遗址、考古展示和西夏历史，可坐景区观光车减少步行' },
          { label: '必打卡', value: '3号陵（最大帝陵）、西夏博物馆、双陵、贺兰山背景全景' },
        ],
        badges: [
          { text: '成人 88元', type: 'red' },
          { text: '儿童半价', type: 'green' },
          { text: '建议坐观光车' },
          { text: '世界文化遗产', type: 'gold' },
        ],
      },
      {
        id: 'd3-2',
        time: '12:00 - 14:30',
        desc: '返回银川市区午餐 · 午休',
        body: '中午回银川市区吃，选择更丰富。推荐：老毛手抓/国强手抓一类手抓羊肉、羊肉臊子面、清真小炒、八宝茶。孩子可选清汤牛肉面、蒸蛋、炒饭、酸奶。',
      },
      {
        id: 'd3-3',
        time: '15:00 - 17:00',
        desc: '宁夏博物馆',
        isSight: true,
        detailsList: [
          { label: '概述', value: '国家一级博物馆，全面展示宁夏历史文化、西夏文明、黄河文化、丝路文化与回族民俗' },
          { label: '亮点', value: '作为下午避暑点非常合适，可以把西夏、黄河、丝路、宁夏地理文化串讲给孩子' },
          { label: '必打卡', value: '西夏文物展厅、贺兰山岩画展厅、黄河古灌区模型、丝路文物展区' },
        ],
        badges: [
          { text: '免费开放', type: 'green' },
          { text: '无需预约', type: 'green' },
          { text: '全程室内·避暑优选' },
        ],
      },
      {
        id: 'd3-4',
        time: '17:00 之后',
        desc: '银川市区补给 · 轻松晚餐',
        body: 'D3晚上可以在银川补给：水、零食、防晒、湿巾、儿童常用药。第二天开始南下，沿途补给减少。',
      },
    ],
  },
  {
    id: 'd4',
    month: '8月',
    dayDate: '4',
    title: '水洞沟→吴忠\n穿越古今南下游学日',
    distance: '约150km',
    hotel: '吴忠市区酒店',
    weather: 'sunny',
    temp: '19~34°C',
    weatherCity: '灵武',
    weatherDate: '2026-08-04',
    entries: [
      {
        id: 'd4-1',
        time: '08:00 - 09:00',
        desc: '银川退房出发前往水洞沟',
        body: '这一天开始离开银川，正式进入南下路线。银川市区到水洞沟约1小时车程。',
      },
      {
        id: 'd4-2',
        time: '09:00 - 13:00',
        desc: '水洞沟完整游玩',
        isSight: true,
        detailsList: [
          { label: '概述', value: '5A级景区，中国最早发掘的旧石器时代遗址，集遗址展示、峡谷、藏兵洞、长城边塞、景区接驳于一体' },
          { label: '亮点', value: '不是简单遗址点，体验丰富：遗址展示→峡谷→藏兵洞→长城边塞，多种交通工具接驳' },
          { label: '必打卡', value: '水洞沟遗址博物馆、明长城遗址、藏兵洞、红山湖峡谷、芦花谷' },
        ],
        badges: [
          { text: '成人 76元', type: 'red' },
          { text: '儿童半价', type: 'green' },
          { text: '预留3.5-4小时' },
          { text: '多种接驳交通体验' },
        ],
      },
      {
        id: 'd4-3',
        time: '13:00 - 14:00',
        desc: '简餐 · 休息',
        body: '水洞沟内部耗时较长，出来后简单用餐休整，不要加其他景点。',
      },
      {
        id: 'd4-4',
        time: '14:30 - 16:00',
        desc: '自驾前往吴忠',
        body: '全程约1-1.5小时，下午16:30前后抵达吴忠市区入住。',
      },
      {
        id: 'd4-5',
        time: '傍晚',
        desc: '吴忠美食探索',
        body: '吴忠是这趟路线中非常值得期待的美食城市。推荐晚餐：吴忠早茶式餐厅（晚餐也可吃）、手抓羊肉、羊杂碎、牛肉面、八宝茶、炒糊饽、夹板。孩子可选牛肉面、蒸饺、馄饨、清炖羊肉汤。',
      },
    ],
  },
  {
    id: 'd5',
    month: '8月',
    dayDate: '5',
    title: '青铜峡→中卫\n黄河峡谷过渡日',
    distance: '约200km',
    hotel: '中卫市区酒店',
    weather: 'windy',
    temp: '18~33°C',
    weatherCity: '青铜峡',
    weatherDate: '2026-08-05',
    entries: [
      {
        id: 'd5-1',
        time: '08:30 - 09:30',
        desc: '吴忠早餐后出发前往青铜峡',
        body: '吴忠市区到青铜峡约40-60分钟。原则：保留青铜峡，但轻量游玩，最晚18:00前抵达中卫。',
      },
      {
        id: 'd5-2',
        time: '09:30 - 12:30',
        desc: '青铜峡108塔 + 黄河大峡谷简游',
        isSight: true,
        detailsList: [
          { label: '108塔', value: '全国重点文物保护单位，西夏时期建造，108座喇嘛塔依山势排列，文化辨识度高，轻量打卡优选' },
          { label: '黄河大峡谷', value: '黄河峡谷景观壮观，但8月户外暴晒明显。建议以核心观景、短时间游览为主，不深度排满' },
          { label: '必打卡', value: '108塔全景、黄河峡谷观景台、青铜峡水利枢纽远眺' },
        ],
        badges: [
          { text: '108塔 30元', type: 'red' },
          { text: '大峡谷 50元', type: 'red' },
          { text: '轻量游览·不贪多' },
        ],
      },
      {
        id: 'd5-3',
        time: '12:30 - 13:30',
        desc: '青铜峡附近午餐',
        body: '中午在青铜峡附近解决，不建议拖到中卫再吃。推荐：羊肉臊子面、牛肉面、清炖羊肉、炒面片、凉皮/酿皮。',
      },
      {
        id: 'd5-4',
        time: '14:00 - 17:00',
        desc: '自驾前往中卫市区',
        body: '全程约2-2.5小时。如果孩子状态不好，直接降级为"108塔+黄河边简看"，早点去中卫。当天务必在中卫市区补给：水、零食、一次性雨衣、防晒、湿巾。D6进入66号公路和黄河宿集段，沿线补给少。',
      },
      {
        id: 'd5-5',
        time: '傍晚',
        desc: '入住中卫 · 中卫美食',
        body: '中卫晚餐推荐：蒿子面、羊肉小炒、烤羊排、手抓羊肉、中卫硒砂瓜（若季节合适）、酸奶、杏皮水。',
      },
    ],
  },
  {
    id: 'd6',
    month: '8月',
    dayDate: '6',
    title: '66号公路→黄河宿集\n西北自驾体验日',
    distance: '约80km',
    hotel: '黄河宿集',
    weather: 'sunny',
    temp: '17~32°C',
    weatherCity: '中卫',
    weatherDate: '2026-08-06',
    entries: [
      {
        id: 'd6-1',
        time: '08:30 前',
        desc: '中卫市区早餐 · 采购补给',
        body: '早餐吃饱，准备好全天补给：每人至少1.5-2L水、零食、简餐、垃圾袋、充电宝。沿线补给明显减少。',
      },
      {
        id: 'd6-2',
        time: '09:00 - 12:00',
        desc: '66号公路 · 沿线观景',
        isSight: true,
        detailsList: [
          { label: '概述', value: '中卫"中国版66号公路"，一边是荒漠山体，一边是黄河峡谷，西北自驾的经典取景地' },
          { label: '亮点', value: '荒野公路+黄河峡谷+荒漠山体的视觉组合，非常适合自驾慢开和拍照' },
          { label: '必打卡', value: '公路起伏路段、黄河峡谷观景点、荒漠山体背景、安全开阔处停车拍照' },
        ],
        badges: [
          { text: '免费', type: 'green' },
          { text: '不要占道停车', type: 'red' },
          { text: '安全开阔处停留拍照' },
        ],
      },
      {
        id: 'd6-3',
        time: '12:00 - 13:30',
        desc: '简餐 · 休息',
        body: '午餐建议提前准备简餐或在沿线条件允许处解决。',
      },
      {
        id: 'd6-4',
        time: '14:00 - 15:30',
        desc: '北长滩 / 南长滩轻游',
        isSight: true,
        detailsList: [
          { label: '概述', value: '黄河北岸的原始村落，保留了西北传统土坯民居和黄河峡谷荒野风貌' },
          { label: '亮点', value: '更偏村落、黄河、峡谷、荒野感，适合慢看，不适合赶路打卡' },
          { label: '必打卡', value: '北长滩古村落、黄河峡谷湾景、百年梨树/枣树林' },
        ],
        badges: [
          { text: '免费', type: 'green' },
          { text: '慢看为主·不赶路' },
        ],
      },
      {
        id: 'd6-5',
        time: '16:00 前后',
        desc: '抵达黄河宿集 · 黄河落日',
        body: '黄河宿集更像"黄河边的设计型度假村落"，适合傍晚入住，看落日、拍照、休息。晚餐优先在黄河宿集内或附近预约。推荐：宿集餐厅套餐、西北风味羊肉、黄河鱼类菜品、面食、烤馍、咖啡、甜品。',
      },
    ],
  },
  {
    id: 'd7',
    month: '8月',
    dayDate: '7',
    title: '黄河宿集→沙漠酒店\n沙漠星空体验日',
    hotel: '沙漠酒店（沙漠星星或同级）',
    weather: 'sunny',
    temp: '17~33°C',
    weatherCity: '中卫',
    weatherDate: '2026-08-07',
    entries: [
      {
        id: 'd7-1',
        time: '上午',
        desc: '黄河宿集慢起 · 早餐 · 拍照 · 散步',
        body: '从"黄河边"切换到"沙漠里"。核心是沙漠酒店体验，不安排高强度景点。上午在宿集悠闲度过。',
      },
      {
        id: 'd7-2',
        time: '11:30 - 12:00',
        desc: '退房 · 前往沙坡头/沙漠酒店指定接待点',
        body: '黄河宿集到沙坡头/沙漠酒店接待点约1-1.5小时车程。中午建议在去接待点前吃好，或提前问酒店是否含餐。',
      },
      {
        id: 'd7-3',
        time: '下午',
        desc: '沙漠酒店入住 · 接驳进入沙漠',
        isSight: true,
        detailsList: [
          { label: '概述', value: '腾格里沙漠边缘的沙漠度假酒店，通常需要在沙坡头景区或指定接待点办理接驳' },
          { label: '亮点', value: '沙漠日落、星空观测、沙漠下午茶、泳池与沙漠的视觉对撞' },
          { label: '必打卡', value: '沙漠日落观景台、星空剧场/观星区、沙漠泳池、沙丘漫步道' },
        ],
        badges: [
          { text: '提前确认停车/接驳/含餐', type: 'red' },
          { text: '沙漠温差大·带薄外套' },
          { text: '旺季尽早预订', type: 'gold' },
        ],
      },
      {
        id: 'd7-4',
        time: '傍晚 - 晚上',
        desc: '沙漠日落 · 星空 · 酒店活动',
        body: '沙漠夜晚温差比白天明显，带薄外套。不建议当天安排乌兰湖，乌兰湖属于腾格里沙漠深处越野路线，不是顺路自驾景点。提前和酒店确认：停车点、接驳时间、入住时间、是否含门票/项目、儿童政策。',
      },
    ],
  },
  {
    id: 'd8',
    month: '8月',
    dayDate: '8',
    title: '沙坡头全天→中卫市区\n核心景区收官日',
    distance: '约30km',
    hotel: '中卫市区酒店',
    weather: 'sunny',
    temp: '17~33°C',
    weatherCity: '中卫',
    weatherDate: '2026-08-08',
    entries: [
      {
        id: 'd8-1',
        time: '上午',
        desc: '沙坡头黄河区',
        isSight: true,
        detailsList: [
          { label: '概述', value: '沙坡头是宁夏最具代表性的景区，"大漠、黄河、高山、绿洲"同框的核心体验区' },
          { label: '亮点', value: '站在沙坡头可同时看到黄河、大漠、高山、绿洲交汇的景象，世界罕见的地理景观' },
          { label: '必打卡', value: '黄河观景台、黄河飞索（视年龄）、羊皮筏子体验、黄河玻璃桥' },
        ],
        badges: [
          { text: '成人 80元', type: 'red' },
          { text: '儿童半价', type: 'green' },
          { text: '项目另收费' },
        ],
      },
      {
        id: 'd8-2',
        time: '12:00 - 15:00',
        desc: '景区内/附近午餐 · 躲避正午暴晒',
        body: '8月中午沙漠暴晒强，12:00-15:00尽量休息。午餐可在景区或景区外解决。',
      },
      {
        id: 'd8-3',
        time: '下午',
        desc: '沙坡头沙漠区轻体验',
        isSight: true,
        detailsList: [
          { label: '概述', value: '腾格里沙漠东南缘，中国四大鸣沙山之一，唐代"沙坡鸣钟"古景所在地' },
          { label: '亮点', value: '骑骆驼、滑沙、沙丘拍照等按孩子年龄选择，不建议把刺激项目排满' },
          { label: '必打卡', value: '沙漠驼队、百米沙坡滑沙、沙海观景、大漠孤烟拍照点' },
        ],
        badges: [
          { text: '骑骆驼 100元', type: 'red' },
          { text: '滑沙 40元', type: 'red' },
          { text: '优先安全体验' },
        ],
      },
      {
        id: 'd8-4',
        time: '17:00 - 18:00',
        desc: '离开沙坡头 · 返回中卫市区',
        body: '离开景区后顺路加满油，D9不再临时找加油站。沙坡头项目很多，不要贪多。优先：安全、体验、休息，不追求全部项目。',
      },
      {
        id: 'd8-5',
        time: '晚上',
        desc: '中卫市区晚餐 · 整理行李 · 加油',
        body: '中卫晚餐推荐：中卫蒿子面、羊肉小炒、烤羊排、手抓羊肉、炒面片、杏皮水、硒砂瓜。饭后核对证件与机票，收拾全部行李，为明日返程做好准备。',
      },
    ],
  },
  {
    id: 'd9',
    month: '8月',
    dayDate: '9',
    title: '中卫→银川→南京\n轻松返程日',
    flight: '银川飞南京（建议16:00-18:00航班）',
    weather: 'sunny',
    temp: '18~32°C',
    weatherCity: '银川',
    weatherDate: '2026-08-09',
    entries: [
      {
        id: 'd9-1',
        time: '08:00 - 09:00',
        desc: '中卫市区早餐 · 出发',
        body: '早餐在中卫市区吃：牛肉面、包子/馄饨、鸡蛋、酸奶，简单清淡为主。D8晚上已提前加满油，直接出发。',
      },
      {
        id: 'd9-2',
        time: '09:00 - 12:00',
        desc: '自驾前往银川河东机场',
        body: '中卫到银川约179公里，正常耗时约2.5小时，自驾建议按3-3.5小时预留。全程走高速，不绕路不停留景点。',
      },
      {
        id: 'd9-3',
        time: '12:00 - 13:00',
        desc: '抵达机场附近 · 还车 · 午餐',
        body: '午餐可以在机场或机场附近解决，不建议途中绕路找餐厅。还车前检查车内物品，核对租车合同。',
      },
      {
        id: 'd9-4',
        time: '下午/傍晚',
        desc: '银川飞南京 · 行程圆满结束',
        body: '最推荐选择银川16:00-18:00起飞的航班，这样上午不用太赶。提前确认还车点位置、是否需要摆渡。儿童证件、登机信息、租车合同、停车票据提前整理好。',
      },
    ],
  },
]

const RESERVATIONS = [
  { name: '镇北堡西部影城', channel: '官方公众号', advance: '随时', price: '成人100元·儿童半价' },
  { name: '贺兰山岩画', channel: '官方平台', advance: '随时', price: '成人70元·儿童半价' },
  { name: '西夏陵', channel: '官方公众号', advance: '随时', price: '成人88元·儿童半价' },
  { name: '宁夏博物馆', channel: '免预约', advance: '—', price: '免费' },
  { name: '水洞沟', channel: '官方公众号', advance: '随时', price: '成人76元·儿童半价' },
  { name: '青铜峡108塔', channel: '现场购票', advance: '—', price: '30元' },
  { name: '沙坡头', channel: '官方公众号', advance: '随时', price: '成人80元·儿童半价·项目另收费' },
  { name: '沙漠酒店', channel: '官方/OTA平台', advance: '尽早', price: '旺季价格波动大·尽早预订', advanceWarn: true },
]

const HOTELS: HotelData[] = [
  { dayId: 'd1', night: '8/1', name: '银川市区酒店（金凤区/兴庆区）', desc: '近怀远夜市·鼓楼商圈' },
  { dayId: 'd2', night: '8/2', name: '银川市区酒店', desc: '连住第二晚' },
  { dayId: 'd3', night: '8/3', name: '银川市区酒店', desc: '连住第三晚' },
  { dayId: 'd4', night: '8/4', name: '吴忠市区酒店', desc: '近美食街·停车方便' },
  { dayId: 'd5', night: '8/5', name: '中卫市区酒店', desc: '近鼓楼·补给便利' },
  { dayId: 'd6', night: '8/6', name: '黄河宿集', desc: '黄河边设计型度假村落' },
  { dayId: 'd7', night: '8/7', name: '沙漠酒店（沙漠星星或同级）', desc: '腾格里沙漠·星空观测' },
  { dayId: 'd8', night: '8/8', name: '中卫市区酒店', desc: '方便D9返程' },
]

const TIPS = [
  '防晒防暑：防晒衣、遮阳帽、儿童墨镜、高倍防晒霜、冰袖、湿巾、便携小风扇、藿香正气、降温贴必备',
  '补水策略：每人每天至少2L水，车内常备整箱矿泉水，沙漠段更要翻倍',
  '游览节奏：上午主玩，中午休息，下午15:00后再出门，每天保证午休',
  '自驾安全：每天出发前检查油量和胎压；66号公路不占道停车；不开进未开放沙地',
  '沙漠安全：沙漠、黄河边、峡谷边不让孩子单独行动；每开车1-1.5小时让孩子下车活动10分钟',
  '补给节点：D5晚上在中卫市区补足水、零食、水果、湿巾、防晒霜、常用药、充电宝',
  '酒店规划：黄河宿集和沙漠酒店最先锁定，旺季房源紧价格波动大；沙漠酒店提前确认接驳/停车/含餐/儿童政策',
  '航班建议：回程选择银川16:00-18:00起飞航班最推荐，不建议选12:00以前的航班',
]

/* ── Component ─────────────────────────────── */

export default function NingxiaTripPage({ onBack }: Props) {
  const [visible, setVisible] = useState(false)
  const [activeDay, setActiveDay] = useState('prep')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [weatherMap, setWeatherMap] = useState<Record<string, { icon: string; temp: string }>>({})

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isScrolling = useRef(false)
  const pillsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Fetch weather data from API on mount
  useEffect(() => {
    const items = ITINERARY
      .filter(d => d.weatherCity && d.weatherDate)
      .map(d => ({ city: d.weatherCity!, date: d.weatherDate! }))

    if (items.length === 0) return

    api.batchWeather(items)
      .then(res => {
        const map: Record<string, { icon: string; temp: string }> = {}
        for (const day of ITINERARY) {
          if (!day.weatherCity || !day.weatherDate) continue
          const key = `${day.weatherCity}:${day.weatherDate}`
          const w = res.results[key]
          if (w) {
            map[day.id] = {
              icon: weatherTextToIcon(w.textDay),
              temp: `${w.tempLow}~${w.tempHigh}°C`,
            }
          }
        }
        setWeatherMap(map)
      })
      .catch(() => {
        // Silently fall back to static data
      })
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    isScrolling.current = true
    setActiveDay(dayId)
    const el = sectionRefs.current[dayId]
    if (el) {
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }

    const pillIndex = DAYS.findIndex(d => d.id === dayId)
    if (pillsRef.current && pillIndex >= 0) {
      const pillButtons = pillsRef.current.querySelectorAll('button')
      pillButtons[pillIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }

    setTimeout(() => {
      isScrolling.current = false
    }, 800)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveDay(entry.target.id)
          }
        }
      },
      { rootMargin: '0px 0px -65% 0px', threshold: 0 }
    )

    const prepEl = sectionRefs.current['prep']
    if (prepEl) observer.observe(prepEl)

    for (const day of ITINERARY) {
      const el = sectionRefs.current[day.id]
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[id] = el
    },
    []
  )

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const getReservAdvanceClass = (r: typeof RESERVATIONS[number]) => {
    if (r.advanceWarn) return styles.reservWarn
    if (r.advance === '—') return ''
    return styles.reservAdvance
  }

  return (
    <>
    <MeteorShower />
    <button onClick={onBack} className={styles.backBtn} aria-label="返回">
      <Icon name="arrowLeft" size={20} />
    </button>
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>宁夏九日沙漠探索</h1>
        <p className={styles.heroSub}>暑期自驾 · 2026.8.1 — 8.9 · 南京出发 ✦ 银河沙漠</p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>9</span>
            <span className={styles.heroStatL}>天</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>12</span>
            <span className={styles.heroStatL}>景点</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>800</span>
            <span className={styles.heroStatL}>公里</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>4</span>
            <span className={styles.heroStatL}>人</span>
          </div>
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

      {/* ROUTE */}
      <section className={styles.section} id="prep" ref={setSectionRef('prep')}>
        <p className={styles.sectionLabel}>行程路线</p>
        <h2 className={styles.sectionTitle}>银川→中卫环线</h2>
        <div className={styles.routeMap}>
          <div className={styles.routeRow}>
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>南京</span>
              <span className={styles.routeStopDate}>8/1</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>银川</span>
              <span className={styles.routeStopDate}>8/1-4</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>吴忠</span>
              <span className={styles.routeStopDate}>8/4-5</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>中卫</span>
              <span className={styles.routeStopDate}>8/5-9</span>
            </span>
          </div>
          <div className={styles.routeConnector} />
          <div className={`${styles.routeRow} ${styles.routeRowReverse}`}>
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>南京</span>
              <span className={styles.routeStopDate}>8/9</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>银川机场</span>
              <span className={styles.routeStopDate}>8/9</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>中卫</span>
              <span className={styles.routeStopDate}>8/9</span>
            </span>
          </div>
        </div>

        <h3 className={`${styles.subTitle} ${styles.subTitleGapMd}`}>
          <span className={styles.subTitleIcon}><Icon name="ticket" size={18} /></span>
          票务预约指南
        </h3>
        <div className={styles.reservList}>
          {RESERVATIONS.map(r => (
            <div key={r.name} className={styles.reservItem}>
              <span className={styles.reservName}>{r.name}</span>
              <span className={styles.reservMeta}>
                <span className={styles.reservChannel}>{r.channel}</span>
                {r.advance !== '—' && <span className={getReservAdvanceClass(r)}>提前{r.advance}</span>}
                <span className={styles.reservPrice}>{r.price}</span>
              </span>
            </div>
          ))}
        </div>

        <h3 className={`${styles.subTitle} ${styles.subTitleGapLg}`}>
          <span className={styles.subTitleIcon}><Icon name="hotel" size={18} /></span>
          酒店安排
        </h3>
        <div className={styles.hotelList}>
          {HOTELS.map((h, i) => (
            <div key={i} className={styles.hotelItem}>
              <div className={styles.hotelNight}>
                <span className={styles.hotelNightIcon}><Icon name="hotel" size={13} /></span>
                {h.night}
              </div>
              <div className={styles.hotelInfo}>
                <div className={styles.hotelName}>
                  {h.name}
                  <a
                    className={styles.pinLink}
                    href={buildBaiduNavUrl(h.name)}
                    aria-label="导航到酒店"
                    onClick={e => e.stopPropagation()}
                  >
                    <Icon name="mapPin" size={14} />
                  </a>
                </div>
                <div className={styles.hotelDesc}>{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Itinerary */}
      {ITINERARY.map(day => (
        <section key={day.id} className={styles.section} id={day.id} ref={setSectionRef(day.id)}>
          {(() => {
            const dayInfo = DAYS.find(d => d.id === day.id)
            if (!dayInfo) return null
            return (
              <div className={styles.dayDivider}>
                <span className={styles.dayDividerEmoji}>{dayInfo.emoji}</span>
              </div>
            )
          })()}
          <div className={styles.dayHeader}>
            <div className={styles.dayDateCircle}>
              <span className={styles.dayDateM}>{day.month}</span>
              <span className={styles.dayDateD}>{day.dayDate}</span>
            </div>
            <div className={styles.dayInfo}>
              <div className={styles.dayName}>
                {day.title.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
              <div className={styles.dayMeta}>
                {day.flight && (
                  <span className={styles.dayMetaItem}>
                    <span className={styles.dayMetaIcon}><Icon name="plane" size={14} /></span>
                    {day.flight}
                  </span>
                )}
                {day.distance && (
                  <span className={styles.dayMetaItem}>
                    <span className={styles.dayMetaIcon}><Icon name="car" size={14} /></span>
                    {day.distance}
                  </span>
                )}
                {day.hotel && (
                  <span className={styles.dayMetaItem}>
                    <span className={styles.dayMetaIcon}><Icon name="hotel" size={14} /></span>
                    {day.hotel}
                  </span>
                )}
                {(weatherMap[day.id]?.icon || day.weather) && (
                  <span className={styles.dayMetaItem}>
                    <span className={styles.dayMetaIcon}>
                      <Icon name={weatherMap[day.id]?.icon || day.weather!} size={14} />
                    </span>
                    {weatherMap[day.id]?.temp || day.temp}
                  </span>
                )}
              </div>
            </div>
          </div>

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
                     <div className={styles.hotelName}>
                       {hotel.name}
                       <a
                         className={styles.pinLink}
                         href={buildBaiduNavUrl(hotel.name)}
                         aria-label="导航到酒店"
                         onClick={e => e.stopPropagation()}
                       >
                         <Icon name="mapPin" size={14} />
                       </a>
                     </div>
                     <div className={styles.hotelDesc}>{hotel.desc}</div>
                   </div>
                 </div>
               </div>
            )
          })()}
        </section>
      ))}

      {/* TIPS */}
      <section className={`${styles.section} ${styles.tipsSection}`} id="tips">
        <p className={styles.sectionLabel}>出行须知</p>
        <h2 className={styles.sectionTitle}>沙漠出行注意事项</h2>
        <ul className={styles.tipsList}>
          {TIPS.map((tip, i) => {
            const [bold, rest] = tip.split('：')
            return (
              <li key={i}>
                <span className={styles.tipsCircle}>{CIRCLED_NUMBERS[i] || i + 1}</span>
                <div className={styles.tipsText}><strong>{bold}</strong>：{rest}</div>
              </li>
            )
          })}
        </ul>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerSeal}>宁</span>
        <p>宁夏九日自驾 · 2026年暑期</p>
        <p className={styles.footerSub}>大漠孤烟直 · 长河落日圆</p>
      </footer>
    </div>

    {/* BOTTOM PILL NAV */}
    <nav className={styles.pillNav} ref={pillsRef}>
      {DAYS.map(d => (
        <button
          key={d.id}
          className={`${styles.pill} ${activeDay === d.id ? styles.active : ''}`}
          onClick={() => scrollToDay(d.id)}
        >
          {d.emoji} {d.label}
        </button>
      ))}
    </nav>
    </>
  )
}
