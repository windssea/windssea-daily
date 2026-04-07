import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './ShanxiTripPage.module.css'

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
  backpack: (
    <Ic>
      <rect x="6" y="8" width="12" height="13" rx="2"/>
      <path d="M9 8V6a3 3 0 016 0v2"/>
      <path d="M6 13h12"/>
    </Ic>
  ),
  train: (
    <Ic>
      <rect x="4" y="3" width="16" height="15" rx="2"/>
      <path d="M4 9h16"/>
      <path d="M12 3v6"/>
      <path d="M8 22l2-4M16 22l-2-4"/>
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/>
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
  swords: (
    <Ic>
      <path d="M7 4l10 16M17 4L7 20"/>
      <path d="M4 7l3-3 3 3M14 7l3-3 3 3"/>
      <path d="M4 17l3 3 3-3M14 17l3 3 3-3"/>
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

const CIRCLED_NUMBERS = ['①','②','③','④','⑤','⑥']

/* ── Static Data ─────────────────────────────── */

const DAYS = [
  { id: 'prep', label: '准备', emoji: '🎒' },
  { id: 'd0', label: '出发', emoji: '🚂' },
  { id: 'd1', label: '大同', emoji: '🏯' },
  { id: 'd2', label: '云冈', emoji: '🗿' },
  { id: 'd3', label: '边塞', emoji: '⚔️' },
  { id: 'd4', label: '晋祠', emoji: '🏛️' },
  { id: 'd5', label: '返程', emoji: '🏠' },
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
  train?: string
  entries: TimelineEntry[]
}

const ITINERARY: DayData[] = [
  {
    id: 'd0',
    month: '4月',
    dayDate: '30',
    title: '夜间出发\n宿火车软卧',
    train: 'Z196次软卧包厢',
    entries: [
      {
        id: 'd0-1',
        time: '20:54',
        desc: '南京站乘坐Z196出发',
        body: '4人软卧包厢，适配两大两小休息，全程不占用白天游玩时间。行李分游玩随身包与夜间休息包，保证孩子正常入睡。'
      },
      {
        id: 'd0-2',
        time: '次日07:47',
        desc: '抵达太原站·准备提车',
        body: '出站后直接前往租车网点办理提车，提前备好证件，避免慌乱。'
      }
    ],
  },
  {
    id: 'd1',
    month: '5月',
    dayDate: '1',
    title: '太原→大同\n古城休闲体验日',
    distance: '约280km',
    hotel: '大同古城',
    entries: [
      {
        id: 'd1-1',
        time: '07:47 - 08:30',
        desc: '太原站抵达 · 提车 + 早餐',
        body: '步行至租车门店办理手续，检查车辆并安装儿童安全座椅。早餐选择太原站周边面食、鲜肉包、鸡蛋醪糟，口味清淡适配儿童。'
      },
      {
        id: 'd1-2',
        time: '08:30 - 11:30',
        desc: '自驾前往大同',
        body: '走二广高速，全程约3小时，中途服务区停靠15分钟让孩子下车活动。高速费约120元，隧道限速80km/h。'
      },
      {
        id: 'd1-3',
        time: '11:30 - 14:30',
        desc: '入住 · 午餐 · 午休',
        body: '入住大同古城附近酒店，午餐品尝大同什锦铜火锅、烧麦、刀削面（清汤不辣）。12:30-14:30强制午休，避开五一正午高温。'
      },
      {
        id: 'd1-4',
        time: '14:40 - 16:40',
        desc: '大同古城墙',
        isSight: true,
        detailsList: [
          { label: '概述', value: '明代洪武年间修建，周长7.24km，北方保存最完整的明城墙' },
          { label: '亮点', value: '宽阔平整，可租赁四人家庭自行车骑行，360°俯瞰古城' },
          { label: '必打卡', value: '永泰门瓮城、西北角乾楼、雁塔、护城河景观带' },
        ],
        badges: [
          { text: '免费开放', type: 'green' },
          { text: '四人自行车 30元/时', type: 'gold' },
          { text: '一年级：寻找龙头排水口、数城门钉' },
          { text: '三年级：记录城墙防御结构' },
        ],
      },
      {
        id: 'd1-5',
        time: '16:50 - 17:50',
        desc: '大同市博物馆',
        isSight: true,
        detailsList: [
          { label: '概述', value: '国家二级博物馆，馆藏恐龙化石、北魏平城文物、辽金文化遗存' },
          { label: '亮点', value: '恐龙化石展厅（剑龙、鸭嘴龙），低龄儿童极度感兴趣；全程室内，五一不晒' },
          { label: '必打卡', value: '恐龙化石展区、北魏平城模型、辽金陶瓷展区、儿童互动角' },
        ],
        badges: [
          { text: '免费开放', type: 'green' },
          { text: '无需预约', type: 'green' },
          { text: '凭身份证入场' },
        ],
      },
      {
        id: 'd1-6',
        time: '17:50 之后',
        desc: '晚餐 · 返回酒店休息',
        body: '黄米凉糕、家常面食，清淡易消化。夜间不安排额外行程，保证充足睡眠。',
      }
    ],
  },
  {
    id: 'd2',
    month: '5月',
    dayDate: '2',
    title: '云冈石窟→悬空寺\n世界遗产研学日',
    distance: '约160km',
    hotel: '应县',
    entries: [
      {
        id: 'd2-1',
        time: '08:30 - 11:30',
        desc: '云冈石窟深度游览',
        isSight: true,
        detailsList: [
          { label: '概述', value: '世界文化遗产·5A级，北魏皇家石窟，现存45窟、5.1万尊造像' },
          { label: '亮点', value: '造像宏伟，部分洞窟保留彩绘，建议儿童友好讲解' },
          { label: '必打卡', value: '第20窟露天大佛、第5/6窟华丽双窟、第9-13窟飞天浮雕' }
        ],
        badges: [
          { text: '成人 120元', type: 'red' },
          { text: '儿童免票/半价', type: 'green' },
          { text: '讲解 50元/次' },
          { text: '距大同酒店约18km·30分钟车程' },
        ]
      },
      {
        id: 'd2-2',
        time: '11:30 - 13:00',
        desc: '返回大同 · 午餐休整',
        body: '过油肉、莜面鱼鱼等本地简餐，快速补充体力。'
      },
      {
        id: 'd2-3',
        time: '13:00 - 14:30',
        desc: '自驾前往悬空寺',
        body: '全程80km，山区高速，车程1.5小时，中途短暂停靠休息。'
      },
      {
        id: 'd2-4',
        time: '14:30 - 16:00',
        desc: '悬空寺游览（远观为主）',
        isSight: true,
        detailsList: [
          { label: '概述', value: '北魏建造，全球十大奇险建筑，国内唯一佛道儒三教合一悬空古建' },
          { label: '亮点', value: '悬崖建筑视觉震撼，适合讲解力学与历史知识' },
          { label: '必打卡', value: '霞客亭全景台、三教殿、李白"壮观"题刻' }
        ],
        badges: [
          { text: '首道门票 15元', type: 'red' },
          { text: '登临票限量·儿童不建议' }
        ]
      },
      {
        id: 'd2-5',
        time: '16:00 - 17:00',
        desc: '自驾应县 · 入住休息',
        body: '全程70km，1小时车程，17点前抵达，不赶夜路。晚餐：应县免辣凉粉、炖土鸡、黄米糕。'
      }
    ],
  },
  {
    id: 'd3',
    month: '5月',
    dayDate: '3',
    title: '木塔→雁门关→忻州\n边塞文化日',
    distance: '约270km',
    hotel: '太原南站',
    entries: [
      {
        id: 'd3-1',
        time: '08:05 - 09:30',
        desc: '应县木塔研学游览',
        isSight: true,
        detailsList: [
          { label: '概述', value: '辽代建造，世界最高最古老纯木结构塔，无铁钉，斗拱博物馆' },
          { label: '亮点', value: '讲解榫卯结构与抗震智慧，可用积木模拟演示' },
          { label: '必打卡', value: '木塔全景、一层辽代佛像、历代名人牌匾' }
        ],
        badges: [
          { text: '成人 50元', type: 'red' },
          { text: '儿童免票/半价', type: 'green' },
          { text: '距酒店5分钟车程' }
        ]
      },
      {
        id: 'd3-2',
        time: '09:30 - 10:30',
        desc: '自驾前往雁门关北门',
        body: '全程70km，1小时车程。务必走北门，避免南门长距离上坡。'
      },
      {
        id: 'd3-3',
        time: '10:30 - 12:30',
        desc: '雁门关精华游览',
        isSight: true,
        detailsList: [
          { label: '概述', value: '5A级长城关隘，天下九塞之首，杨家将戍边核心战场' },
          { label: '亮点', value: '边塞风光+英雄故事，可穿小将军汉服体验' },
          { label: '必打卡', value: '明月楼、边贸街、瓮城、天险门、镇边祠' }
        ],
        badges: [
          { text: '门票 90元', type: 'red' },
          { text: '电瓶车 10元·必买', type: 'gold' },
          { text: '儿童优惠', type: 'green' }
        ]
      },
      {
        id: 'd3-4',
        time: '12:30 - 14:10',
        desc: '代县午餐 · 休整',
        body: '定襄蒸肉、烩菜、莜面栲栳栳，口味温和适配儿童。'
      },
      {
        id: 'd3-5',
        time: '15:00 - 16:30',
        desc: '忻州古城休闲游览',
        isSight: true,
        detailsList: [
          { label: '概述', value: '晋北边塞千年古城，保留明清街巷格局，集民俗、非遗、小吃于一体' },
          { label: '亮点', value: '网红小吃、非遗手作（剪纸、面塑）、古城巡游表演；全程平路无爬坡，节奏轻松' },
          { label: '必打卡', value: '南北大街、秀容书院、古城墙观景台、非遗手作体验馆、特色小吃街' }
        ],
        badges: [
          { text: '免费开放', type: 'green' },
          { text: '无需预约', type: 'green' }
        ]
      },
      {
        id: 'd3-6',
        time: '16:30 - 17:50',
        desc: '自驾太原 · 办理入住',
        body: '全程100km，1.2小时车程，抵达太原南站附近酒店。晚餐钟楼街：认一力蒸饺、老鼠窟元宵、六味斋酱肉。'
      }
    ],
  },
  {
    id: 'd4',
    month: '5月',
    dayDate: '4',
    title: '晋祠→山西博物院\n历史文化收官日',
    distance: '约50km',
    hotel: '续住太原',
    entries: [
      {
        id: 'd4-1',
        time: '09:10 - 11:40',
        desc: '晋祠博物馆游览',
        isSight: true,
        detailsList: [
          { label: '概述', value: '中国现存最古老祠庙园林，5A级景区，拥有晋祠三宝、三绝' },
          { label: '亮点', value: '园林优美、步道平缓，历史故事丰富，适合慢游研学' },
          { label: '必打卡', value: '圣母殿、鱼沼飞梁、献殿、周柏、难老泉、宋塑侍女像' }
        ],
        badges: [
          { text: '成人 80元', type: 'red' },
          { text: '儿童免票/半价', type: 'green' }
        ]
      },
      {
        id: 'd4-2',
        time: '11:40 - 14:55',
        desc: '晋祠周边午餐 · 酒店午休',
        body: '农家菜、山西特色面食，清淡可口。12:55回酒店午休，避开午后高温与客流高峰。'
      },
      {
        id: 'd4-3',
        time: '15:35 - 18:05',
        desc: '山西博物院深度参观',
        isSight: true,
        detailsList: [
          { label: '概述', value: '国家一级博物馆，以"晋魂"为主题，完整展现三晋历史' },
          { label: '亮点', value: '儿童互动区、镇馆之宝故事性强，室内舒适' },
          { label: '必打卡', value: '晋侯鸟尊、雁鱼铜灯、侯马盟书、儿童体验区' }
        ],
        badges: [
          { text: '免费', type: 'green' },
          { text: '提前3天预约', type: 'red' },
          { text: '每日7:00放票' }
        ]
      },
      {
        id: 'd4-4',
        time: '18:05 之后',
        desc: '市区晚餐 · 收拾行李',
        body: '太原本地正餐，饭后核对证件与车票，收拾全部行李，为明日返程做好准备。'
      }
    ],
  },
  {
    id: 'd5',
    month: '5月',
    dayDate: '5',
    title: '太原→南京\n轻松返程日',
    train: 'G467次 5.8h',
    entries: [
      {
        id: 'd5-1',
        time: '08:30 - 09:00',
        desc: '早餐 · 办理退房',
        body: '整理所有行李，装车后办理退房手续。'
      },
      {
        id: 'd5-2',
        time: '09:00 - 10:30',
        desc: '上午休闲活动（二选一）',
        body: '汾河景区：免费开放，儿童游乐区、沙池、滨河散步\n山西省科技馆：免费预约，互动科学展品，适合小学生'
      },
      {
        id: 'd5-3',
        time: '10:30 - 11:30',
        desc: '前往太原南站 · 办理还车',
        body: '自驾至南站租车点，满油还车，检查车辆与物品，完成交接。'
      },
      {
        id: 'd5-4',
        time: '12:27',
        desc: '🚄 乘坐G467高铁返程',
        body: '太原南 12:27 → 南京南 18:15，全程5小时48分。高铁上可休息、看动画、完成旅行日记。'
      },
      {
        id: 'd5-5',
        time: '18:15',
        desc: '🏠 抵达南京南站',
        body: '行程圆满结束！当日到家休整，不影响次日上学与上班。'
      }
    ],
  },
]

const RESERVATIONS = [
  { name: '云冈石窟', channel: '官方公众号', advance: '1天', price: '成人120元·儿童半价' },
  { name: '悬空寺', channel: '官方平台', advance: '7天', price: '首道15元·登临100元' },
  { name: '应县木塔', channel: '官方公众号', advance: '1天', price: '成人50元·儿童半价' },
  { name: '雁门关', channel: '官方公众号', advance: '1天', price: '成人90元·电瓶车10元' },
  { name: '忻州古城', channel: '免预约', advance: '—', price: '免费' },
  { name: '晋祠博物馆', channel: '官方公众号', advance: '1天', price: '成人80元·儿童半价' },
  { name: '山西博物院', channel: '官方公众号', advance: '3天', price: '免费(7:00放票)' },
  { name: '大同市博物馆', channel: '免预约', advance: '—', price: '免费' },
]

const HOTELS: HotelData[] = [
  { dayId: 'd1', night: '5/1', name: '大同古城四星亲子酒店', desc: '永泰门附近 · 含早餐 · 停车位充足' },
  { dayId: 'd2', night: '5/2', name: '应县县城连锁酒店', desc: '近应县木塔 · 出行便利' },
  { dayId: 'd3', night: '5/3', name: '太原南站周边高端酒店', desc: '方便还车与返程 · 连住两晚' },
  { dayId: 'd4', night: '5/4', name: '太原南站周边高端酒店', desc: '方便还车与返程 · 续住第二晚' },
]

const TIPS = [
  '儿童政策：6周岁以下/1.2米以下景区免票，6-18周岁半价，均需携带户口本',
  '自驾安全：山西高速隧道多，限速80km/h；景区停车费10-20元/次',
  '游览节奏：每日保证午休，人文与游乐交替，避免孩子疲劳抵触',
  '错峰提示：景点尽量8:30前或15:00后入园，减少排队',
  '天气适配：五月晋北早晚温差大，务必携带薄外套，做好防晒防风',
  '应急预留：每日行程预留30分钟弹性时间，应对堵车、排队等突发情况',
]

/* ── Component ─────────────────────────────── */

export default function ShanxiTripPage({ onBack }: Props) {
  const [visible, setVisible] = useState(false)
  const [activeDay, setActiveDay] = useState('prep')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isScrolling = useRef(false)
  const pillsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    isScrolling.current = true
    setActiveDay(dayId)
    const el = sectionRefs.current[dayId]
    if (el) {
      const topOffset = 66 // Header height only (tabs are now bottom nav)
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }

    // Scroll tab into view
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
      { rootMargin: '-70px 0px -65% 0px', threshold: 0 }
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

  return (
    <>
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>
      {/* Sticky Header */}
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn} aria-label="返回">
          <Icon name="arrowLeft" size={20} />
        </button>
        <span className={styles.headerTitle}>山西五日亲子自驾攻略</span>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <p className={styles.heroBadge}>
          <span className={styles.heroBadgeIcon}><Icon name="calendar" size={13} /></span>
          五一亲子自驾 · 2025年4月30日—5月5日
        </p>
        <h1 className={styles.heroTitle}>山西五日<br/>深度游</h1>
        <p className={styles.heroSub}>南京出发 · 晋北环线 · 两大两小</p>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>5</span>
            <span className={styles.heroStatL}>天行程</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>760</span>
            <span className={styles.heroStatL}>公里自驾</span>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatN}>8+</span>
            <span className={styles.heroStatL}>核心景点</span>
          </div>
        </div>
      </section>

      {/* ROUTE */}
      <section className={styles.section} id="prep" ref={setSectionRef('prep')}>
        <p className={styles.sectionLabel}>行程路线</p>
        <h2 className={styles.sectionTitle}>晋北环线</h2>
        <div className={styles.routeBar}>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>南京</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>4/30</div>
          </div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeArrow}><Icon name="arrowLeft" size={12} /></div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>太原</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>5/1</div>
          </div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeArrow}><Icon name="arrowLeft" size={12} /></div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>大同</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>5/1-2</div>
          </div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeArrow}><Icon name="arrowLeft" size={12} /></div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>应县</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>5/2-3</div>
          </div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeArrow}><Icon name="arrowLeft" size={12} /></div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>忻州</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>5/3</div>
          </div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeArrow}><Icon name="arrowLeft" size={12} /></div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>太原</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>5/3-5</div>
          </div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeArrow}><Icon name="arrowLeft" size={12} /></div>
          <div className={styles.routeLine}></div>
          <div className={styles.routeCity}>
            <div className={styles.routeCityName}>南京</div>
            <div className={styles.routeCityDot}></div>
            <div className={styles.routeCityDate}>5/5</div>
          </div>
        </div>

        <h3 className={styles.subTitle} style={{ marginTop: 24 }}>
          <span className={styles.subTitleIcon}><Icon name="ticket" size={18} /></span>
          票务预约指南
        </h3>
        <div className={styles.reservList}>
          {RESERVATIONS.map(r => (
            <div key={r.name} className={styles.reservItem}>
              <span className={styles.reservName}>{r.name}</span>
              <span className={styles.reservMeta}>
                <span className={styles.reservChannel}>{r.channel}</span>
                {r.advance !== '—' && <span className={styles.reservAdvance}>提前{r.advance}</span>}
                <span className={styles.reservPrice}>{r.price}</span>
              </span>
            </div>
          ))}
        </div>

        <h3 className={styles.subTitle} style={{ marginTop: 28 }}>
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
                <div className={styles.hotelName}>{h.name}</div>
                <div className={styles.hotelDesc}>{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Itinerary */}
      {ITINERARY.map(day => (
        <section key={day.id} className={styles.section} id={day.id} ref={setSectionRef(day.id)}>
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
                {day.train && (
                  <span className={styles.dayMetaItem}>
                    <span className={styles.dayMetaIcon}><Icon name="train" size={14} /></span>
                    {day.train}
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
              </div>
            </div>
          </div>

          <div className={styles.timeline}>
            {day.entries.map((entry) => {
              const isOpen = !!openItems[entry.id]
              const hasAccordion = !!(entry.body || (entry.detailsList && entry.detailsList.length > 0))

              return (
                <div key={entry.id} className={`${styles.tlItem} ${entry.isSight ? styles.highlight : ''} ${isOpen ? styles.open : ''}`}>
                  {hasAccordion ? (
                    <button className={styles.tlBtn} onClick={() => toggleItem(entry.id)}>
                      <span className={styles.tlTime}>{entry.time}</span>
                      <span className={styles.tlName}>
                        {stripEmoji(entry.desc)}
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
                        {stripEmoji(entry.desc)}
                        {entry.isSight && (
                          <a className={styles.pinLink} href={buildBaiduNavUrl(stripEmoji(entry.desc))} aria-label="导航">
                            <Icon name="mapPin" size={14} />
                          </a>
                        )}
                      </span>
                    </div>
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
                    <div className={styles.hotelName}>{hotel.name}</div>
                    <div className={styles.hotelDesc}>{hotel.desc}</div>
                  </div>
                </div>
              </div>
            )
          })()}
        </section>
      ))}

      {/* TIPS */}
      <section className={styles.section} id="tips" style={{ paddingBottom: 40 }}>
        <p className={styles.sectionLabel}>出行须知</p>
        <h2 className={styles.sectionTitle}>注意事项</h2>
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
        <span className={styles.footerSeal}>晋</span>
        <p>山西五日亲子自驾 · 2025年五一</p>
        <p style={{ marginTop: 4, opacity: 0.6 }}>一路平安 · 满载而归</p>
      </footer>
    </div>

    {/* BOTTOM PILL NAV — outside .page to avoid transform breaking position:fixed */}
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
