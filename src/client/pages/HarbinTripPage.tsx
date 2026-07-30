import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './HarbinTripPage.module.css'
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
  train: (
    <Ic>
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 15h18"/>
      <path d="M8 3v12"/>
      <path d="M16 3v12"/>
      <path d="M3 11l4-4M21 11l-4-4"/>
    </Ic>
  ),
  mountain: (
    <Ic>
      <path d="M2 20l7-10 4 6 3-4 6 8"/>
      <path d="M14 6l2-3 3 5"/>
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
  rain: (
    <Ic>
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
      <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>
    </Ic>
  ),
  snowflake: (
    <Ic>
      <path d="M12 2v20M12 2l-4 3.5M12 2l4 3.5M12 22l-4-3.5M12 22l4-3.5"/>
      <path d="M2 12h20M2 12l3.5-4M2 12l3.5 4M22 12l-3.5-4M22 12l-3.5 4"/>
    </Ic>
  ),
  palace: (
    <Ic>
      <path d="M12 2L3 8h18L12 2z"/>
      <rect x="4" y="8" width="16" height="4"/>
      <path d="M7 12v5h10v-5"/>
      <path d="M3 17h18"/>
      <rect x="10" y="17" width="4" height="4"/>
    </Ic>
  ),
  museum: (
    <Ic>
      <path d="M3 21h18"/>
      <path d="M5 21V9l7-5 7 5v12"/>
      <path d="M9 21v-6h6v6"/>
      <path d="M9 13h6"/>
    </Ic>
  ),
  hotSpring: (
    <Ic>
      <path d="M4 20c2-2 4-4 8-4s6 2 8 4"/>
      <path d="M6 16c1-3 3-5 6-5s5 2 6 5"/>
      <path d="M8 12c2-4 5-6 7-4"/>
      <path d="M10 14h0.01M14 14h0.01"/>
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
  backpack: (
    <Ic>
      <rect x="6" y="8" width="12" height="13" rx="2"/>
      <path d="M9 8V6a3 3 0 016 0v2"/>
      <path d="M6 13h12"/>
    </Ic>
  ),
  science: (
    <Ic>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a2 2 0 012 2v3H10V4a2 2 0 012-2z"/>
      <path d="M12 14a3 3 0 100-6 3 3 0 000 6z"/>
    </Ic>
  ),
  star: (
    <Ic>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </Ic>
  ),
  tree: (
    <Ic>
      <path d="M17 14l3-3.19a1 1 0 000-1.4L16 5"/>
      <path d="M21 21v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1"/>
      <path d="M12 3L8 9h8l-4-6z"/>
      <path d="M12 9v8"/>
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

/* ── Map QWeather Chinese textDay to our icon name ── */
function weatherTextToIcon(text: string): string {
  if (!text) return 'cloudy'
  if (text.includes('晴')) return 'sunny'
  if (text.includes('多云') || text.includes('少云')) return 'partlyCloudy'
  if (text.includes('阴')) return 'cloudy'
  if (text.includes('雨')) return 'rain'
  if (text.includes('雪')) return 'snowflake'
  if (text.includes('风') || text.includes('沙') || text.includes('雾') || text.includes('霾')) return 'windy'
  return 'cloudy'
}

const CIRCLED_NUMBERS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩']

/* ── Static Data ─────────────────────────────── */

const DAYS = [
  { id: 'd0', label: '出发', emoji: '🚂' },
  { id: 'd1', label: '哈尔滨', emoji: '🏙️' },
  { id: 'd2', label: '太阳岛', emoji: '🌿' },
  { id: 'd3', label: '转场', emoji: '🚄' },
  { id: 'd4', label: '天池', emoji: '🏔️' },
  { id: 'd5', label: '备用', emoji: '♨️' },
  { id: 'd6', label: '沈阳', emoji: '🏯' },
  { id: 'd7', label: '故宫', emoji: '👑' },
  { id: 'd8', label: '博物馆', emoji: '🔬' },
  { id: 'd9', label: '返程', emoji: '🏠' },
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
    id: 'd0',
    month: '8月',
    dayDate: '15',
    title: '南京→哈尔滨\nZ366卧铺出发',
    flight: '南京→哈尔滨 Z366',
    hotel: '火车软卧',
    weather: 'sunny',
    temp: '27~36°C',
    weatherCity: '南京',
    weatherDate: '2026-08-15',
    entries: [
      {
        id: 'd0-1',
        time: '16:58',
        desc: '南京站乘Z366出发',
        body: '南京站 16:58 出发，次日 14:51 抵达哈尔滨西站，历时约 21 小时 53 分钟。\n\n四口之家最理想：软卧四张铺位，包一个完整包厢。买不到软卧时，硬卧尽量安排在同一车厢、相邻铺位。\n\n孩子满 6 岁、未满 14 岁，需使用本人有效身份证件购买儿童优惠票。',
      },
      {
        id: 'd0-2',
        time: '出发准备',
        desc: '卧铺行李清单检查',
        body: '火车上建议带：\n• 轻便拖鞋、湿巾、一次性毛巾\n• 下载好的电影或动画\n• 少量零食、水果和早餐\n• 两个小背包，让孩子自己保管水杯、外套和书\n\n不要带太多桶装食品，卧铺车厢里热、味道大，也不方便整理。',
      },
    ],
  },
  {
    id: 'd1',
    month: '8月',
    dayDate: '16',
    title: '哈尔滨抵达日\n中央大街·松花江',
    hotel: '哈尔滨酒店（中央大街中段至圣索菲亚教堂之间）',
    weather: 'sunny',
    temp: '18~28°C',
    weatherCity: '哈尔滨',
    weatherDate: '2026-08-16',
    entries: [
      {
        id: 'd1-1',
        time: '14:51—16:20',
        desc: '抵达哈尔滨西站 · 入住酒店',
        body: '不要住哈尔滨西站附近。哈尔滨停留时间短，住中央大街附近可以减少晚间往返。\n\n房型优先：家庭房 > 两张 1.35m+ 床双床房 > 大床+沙发床。',
      },
      {
        id: 'd1-2',
        time: '16:30—18:00',
        desc: '圣索菲亚教堂外观 → 中央大街 → 防洪纪念塔 → 松花江边',
        body: '下卧铺后第一天不进入大型场馆，只步行。圣索菲亚教堂内部是否进入看孩子状态，这一天重点是适应环境，不是完成打卡。',
      },
      {
        id: 'd1-3',
        time: '18:00以后',
        desc: '江边晚餐 · 早回酒店',
        body: '第一顿东北菜建议三四道：锅包肉、地三鲜或大拉皮、饺子、一份汤菜。\n\n铁锅炖时间较长，建议放后一天或不赶时间时吃。',
      },
    ],
  },
  {
    id: 'd2',
    month: '8月',
    dayDate: '17',
    title: '太阳岛＋极地公园\n松花江北岸一日',
    distance: '松花江北岸',
    hotel: '哈尔滨酒店（中央大街区域）',
    weather: 'sunny',
    temp: '17~29°C',
    weatherCity: '哈尔滨',
    weatherDate: '2026-08-17',
    entries: [
      {
        id: 'd2-1',
        time: '08:30—11:30',
        desc: '太阳岛风景区',
        isSight: true,
        detailsList: [
          { label: '概述', value: '松花江北岸城市生态岛，2026夏季开放时间 8:30—17:00，松鼠岛 9:00—16:00' },
          { label: '重点', value: '松鼠岛、林荫和湿地区域、江边草坪活动' },
          { label: '亲子', value: '面积较大不建议全程徒步，根据温度选景区交通，控制步行总量' },
        ],
        badges: [
          { text: '免费入园', type: 'green' },
          { text: '亲子友好' },
        ],
      },
      {
        id: 'd2-2',
        time: '11:30—13:00',
        desc: '太阳岛区域午餐＋休息',
        body: '不建议中午返回中央大街再回来，会增加一次过江交通。附近简餐即可，留半小时给孩子休息。',
      },
      {
        id: 'd2-3',
        time: '13:00—17:00',
        desc: '哈尔滨极地公园',
        isSight: true,
        detailsList: [
          { label: '票务', value: '两日套票含极地馆+海洋馆+企鹅馆，成人 308 元，学生优待 210 元' },
          { label: '对象', value: '6—18 岁中小学生凭有效身份证件享优待' },
          { label: '必看', value: '白鲸、海豚表演；入园第一件事看当天演出表，提前 20-30 分钟到表演区' },
          { label: '策略', value: '下午以室内为主，避开最晒时段；不必强求把所有小馆全部走完' },
        ],
        badges: [
          { text: '成人 308元', type: 'red' },
          { text: '学生 210元', type: 'green' },
          { text: '表演赠送·场满即止' },
        ],
      },
      {
        id: 'd2-4',
        time: '晚上',
        desc: '中央大街附近晚餐',
        body: '孩子不累可以再看一次中央大街夜景，疲劳则直接回酒店。',
      },
    ],
  },
  {
    id: 'd3',
    month: '8月',
    dayDate: '18',
    title: '哈尔滨→长白山\n转场日',
    flight: '哈尔滨西→长白山 D553（参考）',
    hotel: '长白山二道白河酒店',
    weather: 'cloudy',
    temp: '14~24°C',
    weatherCity: '长白山',
    weatherDate: '2026-08-18',
    entries: [
      {
        id: 'd3-1',
        time: '上午',
        desc: '自然醒 · 退房或寄存行李 · 午饭',
        body: '上午自然醒，10:00 左右退房或寄存行李，吃午饭，提前约 1 小时抵达哈尔滨西站。',
      },
      {
        id: 'd3-2',
        time: '15:48—19:24',
        desc: '哈尔滨西→长白山站 D553（约3h36m）',
        body: '第一选择：直达车（哈尔滨西→长白山）。\n第二选择：长春同站换乘，换乘时间至少留 45-60 分钟，不要选紧张的换乘。\n\n订酒店时直接确认：\n"是否免费接长白山站？晚上 19:30 以后还能否接站？四个人加行李用什么车型？"',
      },
      {
        id: 'd3-3',
        time: '晚上',
        desc: '抵达二道白河 · 入住',
        body: '由酒店接站或正规出租车前往二道白河。住宿推荐范围：北景区游客集散中心—美人松雕塑公园—白河大街一带。',
      },
    ],
  },
  {
    id: 'd4',
    month: '8月',
    dayDate: '19',
    title: '长白山北景区\n天池核心日',
    hotel: '长白山二道白河酒店',
    weather: 'partlyCloudy',
    temp: '12~22°C',
    weatherCity: '长白山',
    weatherDate: '2026-08-19',
    entries: [
      {
        id: 'd4-1',
        time: '预约提醒',
        desc: '提前7天18:00 抢票 · 选07:30-08:30入园',
        body: '长白山景区从 2026.6.26 起，门票和车票预约窗口由提前 15 天调整为提前 7 天，对应日期票源一般在晚上 18:00 更新。\n\n例：计划 8 月 19 日游览 → 8 月 12 日 17:50 前进入官方平台，18:00 抢票。\n\n只通过"长白山"官方渠道或官方小程序购票，四个人的信息提前录入。',
      },
      {
        id: 'd4-2',
        time: '07:30—08:30',
        desc: '入园 · 优先前往主峰天池',
        body: '景区当天根据客流和天气调度，如果主峰当天开放，优先服从景区调度前往天池，不要先在山下小景点停留太久。',
      },
      {
        id: 'd4-3',
        time: '上午—下午',
        desc: '长白瀑布 → 聚龙温泉群 → 绿渊潭',
        body: '建议游览顺序：\n1. 主峰天池\n2. 长白瀑布、聚龙温泉群\n3. 绿渊潭\n4. 地下森林（体力判断点）',
      },
      {
        id: 'd4-4',
        time: '下午',
        desc: '地下森林（体力判断点）',
        body: '两个孩子仍有精神 → 进入游览。\n已明显疲劳 → 直接结束行程。\n不要为了"全部打卡"让孩子最后一小时崩溃。',
      },
      {
        id: 'd4-5',
        time: '全天',
        desc: '背包配置：两成人各背一个轻便背包',
        body: '成人A：四件轻薄防风外套 + 一次性雨衣 + 纸巾和湿巾\n成人B：水+少量能量食品 + 充电宝 + 常用药 + 防晒用品\n\n孩子不用背太重，只携带水杯和一件自己的薄外套。',
      },
      {
        id: 'd4-6',
        time: '晚上',
        desc: '回酒店泡温泉',
        body: '晚上回酒店后安排温泉，不再去镇上长距离逛街。',
      },
    ],
  },
  {
    id: 'd5',
    month: '8月',
    dayDate: '20',
    title: '天气备用日\n小镇亲子＋温泉',
    hotel: '长白山二道白河酒店',
    weather: 'cloudy',
    temp: '13~23°C',
    weatherCity: '长白山',
    weatherDate: '2026-08-20',
    entries: [
      {
        id: 'd5-1',
        time: '全天',
        desc: 'D4顺利看到天池 → 轻松亲子活动',
        body: '上午睡到自然醒，美人松公园、空中廊桥附近散步，下午温泉或酒店休息，晚上吃当地朝鲜族风味或东北菜。\n\n不建议临时再去西坡——北坡、西坡之间不是简单的景区内部换乘，亲子出行会增加大量交通和体力成本。',
      },
      {
        id: 'd5-2',
        time: '全天',
        desc: 'D4主峰因天气关闭 → 第二次尝试',
        body: '前一晚查看官方通知和次日票源，能重新预约到合适时段再决定是否二次进入。\n\n不承诺一定能再次购票，也不把"看到天池"作为全家旅行成败标准。即使两天都看不到天池，瀑布、温泉群、森林和整个火山地貌体验仍然成立。',
      },
    ],
  },
  {
    id: 'd6',
    month: '8月',
    dayDate: '21',
    title: '长白山→沈阳\n轻松转场日',
    flight: '长白山→沈阳北 高铁（约2h）',
    hotel: '沈阳酒店（中街—故宫—青年大街北段）',
    weather: 'sunny',
    temp: '19~30°C',
    weatherCity: '沈阳',
    weatherDate: '2026-08-21',
    entries: [
      {
        id: 'd6-1',
        time: '上午—下午',
        desc: '优先 9:00-14:00 出发的直达高铁',
        body: '长白山至沈阳北约 2 小时高铁（如 G8152 约 07:27—09:35，G8158 约 18:40—20:51），优先选上午 9 点至下午 2 点间出发的直达车。\n\n不需要天没亮带孩子起床，也不会深夜入住沈阳。',
      },
      {
        id: 'd6-2',
        time: '下午—晚上',
        desc: '入住 · 中街吃饭 · 商场补给 · 早休息',
        body: '住中街—沈阳故宫—青年大街北段区域，下午只安排入住、中街吃饭、商场补给、早点休息。',
      },
    ],
  },
  {
    id: 'd7',
    month: '8月',
    dayDate: '22',
    title: '沈阳故宫\n＋张学良旧居',
    hotel: '沈阳酒店（中街区域）',
    weather: 'sunny',
    temp: '20~31°C',
    weatherCity: '沈阳',
    weatherDate: '2026-08-22',
    entries: [
      {
        id: 'd7-1',
        time: '08:30—11:30',
        desc: '沈阳故宫',
        isSight: true,
        detailsList: [
          { label: '概述', value: '2026 暑期 7.15-8.31 延时开放，周五周六有夜场，分时段预约凭原件核验入馆' },
          { label: '亲子', value: '购买或租用适合儿童的讲解，不要只看建筑' },
          { label: '任务', value: '找和北京故宫不同的建筑；找清初满族生活和军事元素；判断哪座建筑最像"东北的宫殿"' },
        ],
        badges: [
          { text: '分时段预约', type: 'red' },
          { text: '凭原件入馆' },
        ],
      },
      {
        id: 'd7-2',
        time: '11:30—13:30',
        desc: '午饭和休息',
      },
      {
        id: 'd7-3',
        time: '14:00—17:00',
        desc: '张学良旧居',
        isSight: true,
        detailsList: [
          { label: '概述', value: '暑期周一正常开放，周日至周四至 18:00，周五周六有延时夜游' },
          { label: '亲子', value: '7 岁 9 岁不需要把民国历史讲太复杂：张学良是谁？帅府为什么有中式、西式不同建筑？一座住宅如何反映当时的城市和时代？' },
        ],
        badges: [
          { text: '周一也开放', type: 'green' },
          { text: '亲子友好' },
        ],
      },
      {
        id: 'd7-4',
        time: '晚上',
        desc: '中街附近晚餐',
      },
    ],
  },
  {
    id: 'd8',
    month: '8月',
    dayDate: '23',
    title: '辽宁科技馆\n＋辽宁省博物馆',
    hotel: '沈阳酒店（中街区域）',
    weather: 'sunny',
    temp: '20~31°C',
    weatherCity: '沈阳',
    weatherDate: '2026-08-23',
    entries: [
      {
        id: 'd8-1',
        time: '09:00—13:30',
        desc: '辽宁省科技馆',
        isSight: true,
        detailsList: [
          { label: '概述', value: '2026 暑期 7.10-8.31 每天开放，周一至周四 9:00—18:00，周五至周日 9:00—19:00' },
          { label: '精选', value: '探索发现 + 工业摇篮 + 科技生活 + 一个影院项目，不要试图一天玩完全部展厅' },
          { label: '亲子', value: '7 岁 9 岁正适合，科学+文物组合比再去一次动物园更均衡' },
        ],
        badges: [
          { text: '提前预约', type: 'red' },
          { text: '儿童友好', type: 'green' },
        ],
      },
      {
        id: 'd8-2',
        time: '14:00—17:00',
        desc: '辽宁省博物馆',
        isSight: true,
        detailsList: [
          { label: '概述', value: '2026 暑期周一不闭馆，延长开放时间，实行免预约入馆（高峰期可能因瞬时客流暂缓放行）' },
          { label: '策略', value: '科技馆和辽博距离较近安排在同一天。孩子疲劳时只看两三个重点展厅即可，不必逐层走完。' },
        ],
        badges: [
          { text: '免预约入馆', type: 'green' },
          { text: '周一不闭馆' },
        ],
      },
    ],
  },
  {
    id: 'd9',
    month: '8月',
    dayDate: '24',
    title: '沈阳→南京\n高铁返程',
    flight: '沈阳北→南京南 高铁（约8.5h）',
    hotel: '— 回家',
    weather: 'sunny',
    temp: '20~31°C',
    weatherCity: '沈阳',
    weatherDate: '2026-08-24',
    entries: [
      {
        id: 'd9-1',
        time: '推荐 10:00 左右出发',
        desc: '沈阳北→南京南 高铁',
        body: '当前直达高铁参考：\n• G1223：沈阳北 07:53—南京南 16:17（8h24m）\n• G1213：沈阳北 10:20—南京南 18:40（8h20m）\n\n亲子推荐 10 点左右出发的班次：不必很早叫醒孩子，酒店正常吃早餐，晚饭前后回到南京。\n\n在 12306 中可以勾选"复兴号"筛选，最终以出发日期实际车次为准。',
        detailsList: [
          { label: '车程', value: '约 8 小时 20-45 分钟直达，D9 应视为完整返程日' },
          { label: '票务', value: '四个人统一在一个订单里提交，更有利于系统安排相邻座位' },
        ],
      },
    ],
  },
]

/* ── Reservations ────────────────────────────── */

interface ReservData {
  name: string
  channel: string
  advance: string
  price: string
  advanceWarn?: boolean
}

const RESERVATIONS: ReservData[] = [
  { name: 'Z366 南京→哈尔滨 软卧', channel: '12306 APP', advance: '15天', price: '约¥600+/人' },
  { name: '哈尔滨→长白山 高铁', channel: '12306 APP', advance: '15天', price: '约¥200/人' },
  { name: '长白山→沈阳北 高铁', channel: '12306 APP', advance: '15天', price: '约¥150/人' },
  { name: '沈阳北→南京南 高铁', channel: '12306 APP', advance: '15天', price: '约¥550/人' },
  { name: '长白山北景区门票+车票', channel: '长白山官方小程序', advance: '7天18:00抢', price: '以官方为准', advanceWarn: true },
  { name: '哈尔滨极地公园套票', channel: '哈尔滨极地馆官网', advance: '建议提前', price: '成人308/学生210' },
  { name: '沈阳故宫', channel: '沈阳故宫博物院官网', advance: '分时段预约', price: '以官方为准' },
  { name: '辽宁科技馆', channel: '辽宁科技馆官网', advance: '提前预约', price: '免费/影院另购' },
  { name: '辽宁省博物馆', channel: '免预约入馆', advance: '—', price: '免费' },
  { name: '张学良旧居', channel: '沈阳市文旅局平台', advance: '建议提前', price: '以官方为准' },
]

/* ── Hotels ──────────────────────────────────── */

const HOTELS: HotelData[] = [
  {
    dayId: 'd0',
    night: 'D0 宿火车',
    name: 'Z366 软卧包厢',
    desc: '南京站 16:58 出发，次日 14:51 抵达哈尔滨西，历时约 21 小时 53 分。四口之家最理想为软卧四张铺位包一个包厢。',
  },
  {
    dayId: 'd1',
    night: 'D1—D2 宿哈尔滨',
    name: '哈尔滨中央大街区域酒店',
    desc: '选择中央大街中段至圣索菲亚教堂之间；家庭房或两张 1.35m+ 床双床房，优先选"限时免费取消"。',
  },
  {
    dayId: 'd3',
    night: 'D3—D5 宿长白山',
    name: '长白山温泉希尔顿惠庭酒店（首选）',
    desc: '位于二道白河镇，户外草坪+多个温泉区域，兼顾镇内便利与温泉体验。预订确认：是否合法入住 2 大 2 小、儿童早餐收费、温泉是否含房价、是否提供站接送。',
  },
  {
    dayId: 'd6',
    night: 'D6—D8 宿沈阳',
    name: '沈阳中街—故宫区域酒店',
    desc: '中街—沈阳故宫—青年大街北段区域，家庭房优先；D6 到沈阳后下午只需入住+中街吃饭+补给。',
  },
]

/* ── Tips ────────────────────────────────────── */

const TIPS = [
  '衣服：8 月中旬东北温差大，哈尔滨 17-29°C、长白山 12-25°C、沈阳 19-31°C，带轻薄防风外套和一次性雨衣，长白山山上风大温度低需备薄羽绒',
  '防晒：东北夏季紫外线强尤其长白山高海拔区域，SPF50+防晒霜+太阳镜+遮阳帽必带',
  '车票：所有火车票提前 15 天开售，同一个订单内提交四人车票，有利于系统安排相邻座位或铺位',
  '长白山：游览日前 7 天 18:00 抢票，提前录入四人信息，选择 07:30-08:30 入园时段',
  '温泉：提前了解酒店温泉对儿童的年龄/身高/开放时段要求，预订时确认温泉是否包含在房价内',
  '门票：哈尔滨极地公园提前确认套票范围及演出安排；沈阳故宫分时段预约凭原件核验入馆',
  '药品：退烧药+感冒药+肠胃药+创可贴+防蚊液；护手霜/润唇膏应对干燥天气',
  '预算参考：4人火车票约 ¥7000-9500 + 住宿约 ¥6000-9000（8晚含1晚火车）+ 门票约 ¥2500 + 餐饮+交通约 ¥5000，总计约 ¥20000-26000',
  '高原反应：长白山海拔约 2700m（天池），7 岁和 9 岁孩子一般无高反问题，但山上走路要放慢节奏，多休息、多补水',
  '饮食安全：东北菜分量大、油盐偏重，每顿不宜点太多；路边摊和夜市小吃注意卫生，随身带湿巾',
]

/* ── Component ─────────────────────────────── */

export default function HarbinTripPage({ onBack }: Props) {
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
    <button onClick={onBack} className={styles.backBtn} aria-label="返回">
      <Icon name="arrowLeft" size={20} />
    </button>
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>

      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>东北避暑十日</h1>
        <p className={styles.heroSub}>暑期亲子 · 2026.8.15 — 8.24 · 南京出发 ✦ 清凉东北</p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>10</span>
            <span className={styles.heroStatL}>天</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>3</span>
            <span className={styles.heroStatL}>城市</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>8</span>
            <span className={styles.heroStatL}>景点</span>
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
        <h2 className={styles.sectionTitle}>南京→哈尔滨→长白山→沈阳→南京</h2>
        <div className={styles.routeMap}>
          <div className={styles.routeRow}>
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>南京</span>
              <span className={styles.routeStopDate}>8/15</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>哈尔滨</span>
              <span className={styles.routeStopDate}>8/16-18</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>长白山</span>
              <span className={styles.routeStopDate}>8/18-21</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>沈阳</span>
              <span className={styles.routeStopDate}>8/21-24</span>
            </span>
          </div>
          <div className={styles.routeConnector} />
          <div className={`${styles.routeRow} ${styles.routeRowReverse}`}>
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>南京</span>
              <span className={styles.routeStopDate}>8/24</span>
            </span>
            <span className={styles.routeDash} />
            <span className={styles.routeStop}>
              <span className={styles.routeStopDot} />
              <span className={styles.routeStopName}>沈阳北</span>
              <span className={styles.routeStopDate}>8/24</span>
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
                    <span className={styles.dayMetaIcon}><Icon name="train" size={14} /></span>
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
        <h2 className={styles.sectionTitle}>东北避暑注意事项</h2>
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
        <span className={styles.footerSeal}>北</span>
        <p>东北避暑十日 · 2026年暑期</p>
        <p className={styles.footerSub}>白山松水间 · 清凉亲子行</p>
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
