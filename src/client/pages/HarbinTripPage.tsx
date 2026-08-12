import { useCallback, useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import styles from './HarbinTripPage.module.css'
import { api } from '../lib/api'

interface Props {
  onBack: () => void
}

type WeatherSource = 'live' | 'reference'
type BadgeType = 'red' | 'green' | 'gold' | 'default'
type DecisionTone = 'warning' | 'info' | 'success'

interface WeatherState {
  icon: string
  text: string
  temp: string
  wind: string
  source: WeatherSource
  advice: string
}

type WeatherFallback = Omit<WeatherState, 'source'>

interface TimelineDetail {
  label: string
  value: string
}

interface Badge {
  text: string
  type?: BadgeType
}

interface TimelineEntry {
  id: string
  time: string
  desc: string
  body?: string
  isSight?: boolean
  detailsList?: TimelineDetail[]
  badges?: Badge[]
  variant?: 'normal' | 'decision'
}

interface DayData {
  id: string
  month: string
  dayDate: string
  weekday: string
  city: string
  title: string
  flight?: string
  hotel?: string
  weatherCity: string
  weatherLabel?: string
  weatherDate: string
  weatherFallback: WeatherFallback
  entries: TimelineEntry[]
  decision?: {
    title: string
    body: string
    tone: DecisionTone
  }
}

type ReservationState = 'confirmed' | 'today' | 'upcoming' | 'walkin' | 'overdue'

interface ReservationWindow {
  /** 处理窗口起止日期，YYYY-MM-DD；窗口内当天会标记为「今天处理」，窗口过期未处理标记为「尽快处理」 */
  from: string
  to: string
}

interface ReservationItem {
  id: string
  date: string
  title: string
  detail: string
  channel: string
  action: string
  /** 静态基线状态：confirmed=已确认/已购票，upcoming=未来待预定，walkin=无需预约 */
  state: ReservationState
  /** 状态徽章文案（如 已购票 / 待预约 / 待购票 / 待抢票 / 无需预约） */
  status: string
  /** 仅 upcoming 使用：预约/购票的处理窗口，用于按当天日期动态派生 today / overdue */
  window?: ReservationWindow
  icon: string
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

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Ic({ children, ...extra }: { children: ReactNode } & SVGProps<SVGSVGElement>) {
  return <svg {...iconProps} {...extra}>{children}</svg>
}

const ICONS: Record<string, ReactNode> = {
  arrowLeft: <Ic><path d="M19 12H5M12 19l-7-7 7-7" /></Ic>,
  chevron: <Ic><path d="m6 9 6 6 6-6" /></Ic>,
  train: <Ic><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M4 14h16M8 3v11M16 3v11M8 18h.01M16 18h.01" /></Ic>,
  hotel: <Ic><path d="M3 21h18M5 21V4h14v17M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-5h4v5" /></Ic>,
  mapPin: <Ic><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></Ic>,
  sun: <Ic><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Ic>,
  partlyCloudy: <Ic><circle cx="15" cy="8" r="3" /><path d="M11.5 5.5 10 7M15 2v2M21 8h-2M18 14H7a4 4 0 1 1 .7-7.9A5 5 0 0 1 18 10a3 3 0 0 1 0 4Z" /></Ic>,
  cloudy: <Ic><path d="M18 18H7a5 5 0 1 1 1.5-9.8A6 6 0 0 1 20 11a3.5 3.5 0 0 1-2 7Z" /></Ic>,
  rain: <Ic><path d="M18 15H7a5 5 0 1 1 1.5-9.8A6 6 0 0 1 20 8a3.5 3.5 0 0 1-2 7Z" /><path d="m8 18-1 3M12 18l-1 3M16 18l-1 3" /></Ic>,
  windy: <Ic><path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h16a2.5 2.5 0 1 1-2.5 2.5M3 16h8" /></Ic>,
  snowflake: <Ic><path d="M12 2v20M4.9 6l14.2 12M4.9 18 19.1 6M2 12h20" /><path d="m8 4 4 3 4-3M8 20l4-3 4 3M4 8l4 4-4 4M20 8l-4 4 4 4" /></Ic>,
  mountain: <Ic><path d="m3 20 7-11 3 5 3-4 5 10" /><path d="m13 9 2-3 2 3" /></Ic>,
  tiger: <Ic><path d="M5 16c0-5 3-9 7-9s7 4 7 9M8 18c1.2 1.2 2.5 2 4 2s2.8-.8 4-2M8 12h.01M16 12h.01M10 15c1.3 1 2.7 1 4 0" /><path d="M7 8 5 5M17 8l2-3" /></Ic>,
  school: <Ic><path d="m3 10 9-6 9 6-9 6-9-6Z" /><path d="M7 13v5h10v-5M4 11v5M20 11v5" /></Ic>,
  museum: <Ic><path d="m3 9 9-5 9 5M5 9v10M9 9v10M15 9v10M19 9v10M3 19h18" /></Ic>,
  hotSpring: <Ic><path d="M4 20c2-2 4-4 8-4s6 2 8 4M6 16c1-3 3-5 6-5s5 2 6 5M9 10c1-3 3-5 5-5" /><path d="M10 14h.01M14 14h.01" /></Ic>,
  ticket: <Ic><path d="M4 6h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8a2 2 0 0 1 2-2Z" /><path d="M13 6v12" /></Ic>,
  calendar: <Ic><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></Ic>,
  alert: <Ic><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></Ic>,
  check: <Ic><path d="m5 12 4 4L19 6" /></Ic>,
  backpack: <Ic><rect x="6" y="8" width="12" height="13" rx="2" /><path d="M9 8V6a3 3 0 0 1 6 0v2M6 13h12" /></Ic>,
  home: <Ic><path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" /></Ic>,
  route: <Ic><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a5 5 0 0 0 5-5V8" /></Ic>,
  info: <Ic><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ic>,
}

function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  return <span className={`${styles.icon} ${className}`} style={{ width: size, height: size }}>{ICONS[name] || ICONS.info}</span>
}

function weatherTextToIcon(text: string): string {
  if (!text) return 'cloudy'
  if (text.includes('晴')) return 'sun'
  if (text.includes('多云') || text.includes('少云')) return 'partlyCloudy'
  if (text.includes('雨')) return 'rain'
  if (text.includes('雪')) return 'snowflake'
  if (text.includes('风') || text.includes('沙') || text.includes('雾') || text.includes('霾')) return 'windy'
  return 'cloudy'
}

const WEATHER_REFERENCE: Record<string, WeatherFallback> = {
  南京: { icon: 'sun', temp: '夏季参考', text: '出发前复核', wind: '以出发前预报为准', advice: '出发日注意高温，车站候车预留安检时间' },
  哈尔滨: { icon: 'partlyCloudy', temp: '夏季参考', text: '舒适但有阵雨可能', wind: '以当日预报为准', advice: '轻薄长袖、防晒和一次性雨衣随身' },
  长春: { icon: 'partlyCloudy', temp: '夏季参考', text: '高温/阵雨复核', wind: '以当日预报为准', advice: '市区活动多，遮阳、驱蚊和雨具随身，午后动物园注意补水' },
  沈阳: { icon: 'partlyCloudy', temp: '夏季参考', text: '高温/阵雨复核', wind: '以当日预报为准', advice: '高温或大雨时优先室内场馆，取消红梅文创园' },
}

const DAYS = [
  { id: 'd0', label: '出发', emoji: '🚂' },
  { id: 'd1', label: '哈尔滨', emoji: '🏙️' },
  { id: 'd2', label: '虎园/哈工大', emoji: '🐅' },
  { id: 'd3', label: '转长春', emoji: '🚄' },
  { id: 'd4', label: '长影/动物园', emoji: '🦒' },
  { id: 'd5', label: '转沈阳', emoji: '🚄' },
  { id: 'd6', label: '沈飞/工博', emoji: '✈️' },
  { id: 'd7', label: '故宫/帅府', emoji: '👑' },
  { id: 'd8', label: '返程', emoji: '🏠' },
]

const ITINERARY: DayData[] = [
  {
    id: 'd0', month: '8月', dayDate: '14', weekday: '周五', city: '南京 → 哈尔滨', title: '南京站乘 Z366 卧铺出发',
    flight: 'Z366 南京站 16:58 → 哈尔滨西次日 14:51（已购票）', hotel: '火车软卧', weatherCity: '南京', weatherDate: '2026-08-14', weatherFallback: WEATHER_REFERENCE.南京,
    entries: [
      { id: 'd0-1', time: '14:30', desc: '从家中出发前检查证件、充电宝和儿童药品' },
      { id: 'd0-2', time: '15:20', desc: '抵达南京站', body: '出发站是南京站，不是南京南站。' },
      { id: 'd0-3', time: '15:20—15:55', desc: '安检、找候车区、上厕所' },
      { id: 'd0-4', time: '15:55—16:20', desc: '补充饮水和火车食物' },
      { id: 'd0-5', time: '16:20以后', desc: '留意检票，尽早上车整理铺位' },
      { id: 'd0-6', time: '16:58', desc: 'Z366 发车', body: '车票已确认（软卧）；参考历时约 21 小时 53 分，次日 14:51 抵达哈尔滨西站。上车后尽快安顿铺位和随身行李。', variant: 'decision' },
      { id: 'd0-7', time: '18:00—19:00', desc: '火车晚餐', body: '准备少量车上食物和水，不带过量桶装食品。' },
      { id: 'd0-8', time: '20:30—21:30', desc: '洗漱、整理铺位', body: '卧铺车厢较热且不便整理，尽早把随身包和孩子的薄外套放在手边。' },
      { id: 'd0-9', time: '21:30后', desc: '休息' },
    ],
  },
  {
    id: 'd1', month: '8月', dayDate: '15', weekday: '周六', city: '哈尔滨', title: '抵达哈尔滨：索菲亚、中央大街与松花江',
    hotel: '哈尔滨中央大街区域家庭房', weatherCity: '哈尔滨', weatherDate: '2026-08-15', weatherFallback: WEATHER_REFERENCE.哈尔滨,
    entries: [
      { id: 'd1-1', time: '07:30—08:30', desc: '火车早餐', body: '卧铺上吃早餐，提前备好面包、牛奶和水果。' },
      { id: 'd1-2', time: '11:30—12:30', desc: '火车午餐', body: '午餐后开始整理行李，准备到站。' },
      { id: 'd1-3', time: '14:51参考', desc: '抵达哈尔滨西站' },
      { id: 'd1-4', time: '15:00—15:20', desc: '出站、上厕所、叫车' },
      { id: 'd1-5', time: '15:20—16:00', desc: '打车前往中央大街附近酒店', body: '周末路况按 40 分钟左右预留；哈尔滨停留时间短，不建议住哈尔滨西站附近。' },
      { id: 'd1-6', time: '16:00—16:25', desc: '办理入住、洗漱、轻装出门', body: '优先家庭房或两张至少 1.35 米宽的床，并确认 8 月 17 日退房后可寄存行李。' },
      { id: 'd1-7', time: '16:30—17:10', desc: '圣索菲亚教堂广场及外观', isSight: true, detailsList: [
        { label: '方式', value: '以外观和广场为主，教堂内部不列为必选。' },
        { label: '亲子', value: '刚结束近 22 小时卧铺，不安排大型场馆，先让孩子适应城市环境。' },
      ], badges: [{ text: '免费外观', type: 'green' }, { text: '无需预约' }] },
      { id: 'd1-8', time: '17:10—18:35', desc: '中央大街慢逛', body: '沿街观察建筑和街景，步行节奏放慢，不为打卡压缩孩子休息时间。' },
      { id: 'd1-9', time: '18:35—19:20', desc: '防洪纪念塔、松花江边', body: '江边短暂停留后在附近用餐；如遇阵雨，直接回中央大街室内餐厅。' },
      { id: 'd1-10', time: '19:30—20:30', desc: '晚餐', body: '第一顿东北菜控制在三四道，铁锅炖不安排在需要赶时间的晚上。' },
      { id: 'd1-11', time: '21:00前', desc: '返回酒店' },
      { id: 'd1-12', time: '21:00后', desc: '洗澡、休息' },
    ],
  },
  {
    id: 'd2', month: '8月', dayDate: '16', weekday: '周日', city: '哈尔滨', title: '东北虎林园＋哈工大校园与航天馆',
    flight: '中央大街 → 虎林园西北门 → 哈工大一校区', hotel: '哈尔滨中央大街区域家庭房', weatherCity: '哈尔滨', weatherDate: '2026-08-16', weatherFallback: WEATHER_REFERENCE.哈尔滨,
    decision: { title: '哈工大入校预约已完成', body: '8月16日哈工大入校预约已完成。虎林园结束后先在和兴路附近午餐，13:15 前后到和兴路校门核验入校；校园开放区域与航天馆按预约安排，两位成人手机各保存预约截图并携带预约所用证件原件。', tone: 'success' },
    entries: [
      { id: 'd2-1', time: '07:10', desc: '起床' },
      { id: 'd2-2', time: '07:20—07:50', desc: '早餐' },
      { id: 'd2-3', time: '07:50', desc: '打车前往东北虎林园西北门' },
      { id: 'd2-4', time: '08:30—11:15', desc: '东北虎林园：先观光车，再步行观虎区', isSight: true, detailsList: [
        { label: '导航', value: '黑龙江东北虎林园西北门。夏季参考开放 08:30—17:00，16:30 停止检票。' },
        { label: '票型', value: '孩子不害怕大型动物可选惊险车；胆小则选普通观光车。价格和儿童优惠以官方购票页为准。' },
        { label: '顺序', value: '观光车 → 猛兽车行区 → 步行观虎区 → 观虎台 → 科普/萌虎区，11:15 前结束。' },
      ], badges: [{ text: '亲子主任务', type: 'green' }, { text: '已购票', type: 'green' }] },
      { id: 'd2-5', time: '11:15—12:10', desc: '打车前往哈工大和兴路校门', body: '两段跨区移动直接使用网约车，带孩子和背包时不建议多次换乘。' },
      { id: 'd2-6', time: '12:10—13:15', desc: '和兴路附近午餐、补水、休息', body: '不返回中央大街再折返，校门附近简餐即可，13:15 前整理好预约所用证件。' },
      { id: 'd2-7', time: '13:15—13:30', desc: '和兴路校门入校核验' },
      { id: 'd2-8', time: '13:30—14:10', desc: '哈工大一校区校园开放区域', isSight: true, detailsList: [
        { label: '预约', value: '8月16日入校预约已完成；一位成人预约即可覆盖一家四口，儿童必须由预约成功的监护人陪同。' },
        { label: '路径', value: '哈工大官方微信公众号 → 服务 → 校园参观预约 → 入校预约；入口按和兴路校门／个人通道执行。' },
      ], badges: [{ text: '免费', type: 'green' }, { text: '已预约' }] },
      { id: 'd2-9', time: '14:10—15:50', desc: '哈工大航天馆', isSight: true, detailsList: [
        { label: '重点', value: '中国航天、发动机、火箭/导弹模型和孩子能理解的“人类如何飞上太空”。' },
        { label: '入馆', value: '航天馆不单独预约，随已完成的入校预约进入。' },
      ], badges: [{ text: '免费', type: 'green' }, { text: '已预约' }] },
      { id: 'd2-10', time: '15:50—16:25', desc: '校园补逛、文创或休息' },
      { id: 'd2-11', time: '16:40—17:30', desc: '返回酒店' },
      { id: 'd2-12', time: '17:30—18:30', desc: '酒店休息' },
      { id: 'd2-13', time: '18:30以后', desc: '酒店附近晚餐', body: '不再增加必游项目，孩子状态好再短逛中央大街。' },
    ],
  },
  {
    id: 'd3', month: '8月', dayDate: '17', weekday: '周一', city: '哈尔滨 → 长春', title: '哈药六厂＋G126 前往长春＋这有山',
    flight: 'G126 哈尔滨站 16:42 → 长春西 17:51（已购票）', hotel: '长春人民广场—重庆路区域酒店', weatherCity: '长春', weatherDate: '2026-08-17', weatherFallback: WEATHER_REFERENCE.长春,
    decision: { title: 'G126 已购票：哈尔滨站上车，长春西下车', body: 'G126 车票已确认，8月17日哈尔滨站发车、长春西到站；当天 15:15 左右从酒店出发去哈尔滨站，不要误去哈尔滨西站。到长春西后打车去人民广场—重庆路区域酒店。', tone: 'info' },
    entries: [
      { id: 'd3-1', time: '07:30—08:05', desc: '早餐' },
      { id: 'd3-2', time: '08:05—08:20', desc: '退房、寄存行李' },
      { id: 'd3-3', time: '08:20', desc: '打车前往南直路 326 号' },
      { id: 'd3-4', time: '09:00—10:30', desc: '哈药六厂公开区域及建筑打卡', isSight: true, detailsList: [
        { label: '导航', value: '哈尔滨市道外区南直路 326 号。地图若显示“哈药六版画博物馆”不算走错，重点是老厂区建筑、欧式大厅、楼梯与穹顶。' },
        { label: '票务', value: '暑期公开参观 09:00—17:00，16:30 停止入场，周一正常开放；身份证登记、无需预约。' },
        { label: '取舍', value: '午餐后留足车站安检和候车时间，不压缩高铁进站余量。' },
      ], badges: [{ text: '免费登记', type: 'green' }, { text: '转场敏感' }] },
      { id: 'd3-5', time: '10:45—11:25', desc: '返回酒店区域' },
      { id: 'd3-6', time: '11:30—12:30', desc: '午餐' },
      { id: 'd3-7', time: '12:30—14:20', desc: '酒店附近休息', body: '午饭后回到酒店区域休息，14:20 开始取行李。' },
      { id: 'd3-8', time: '14:20—15:00', desc: '取行李、检查证件和订单' },
      { id: 'd3-9', time: '15:15', desc: '从中央大街附近酒店前往哈尔滨站', body: '确认是哈尔滨站，不是哈尔滨西站。' },
      { id: 'd3-10', time: '15:35—15:50', desc: '抵达哈尔滨站' },
      { id: 'd3-11', time: '15:50以后', desc: '安检、候车、补水' },
      { id: 'd3-12', time: '16:42', desc: 'G126 从哈尔滨站出发（已购票）', body: '车票已确认；按票面车次、座位和检票口候车，提前完成安检。', variant: 'decision' },
      { id: 'd3-13', time: '17:51参考', desc: '抵达长春西站' },
      { id: 'd3-14', time: '18:00—18:45', desc: '打车前往长春酒店', body: '目的地人民广场—重庆路区域，入住后轻装去这有山。' },
      { id: 'd3-15', time: '18:45—19:10', desc: '办理入住、放行李' },
      { id: 'd3-16', time: '19:15—21:15', desc: '这有山＋晚餐', isSight: true, detailsList: [
        { label: '安排', value: '先看特色街区再吃饭；这有山公共商业空间无需预约。' },
        { label: '节奏', value: '孩子转场疲劳时缩减逛街时间，21:30 前回酒店。' },
      ], badges: [{ text: '免费街区', type: 'green' }] },
      { id: 'd3-17', time: '21:30左右', desc: '回酒店' },
    ],
  },
  {
    id: 'd4', month: '8月', dayDate: '18', weekday: '周二', city: '长春', title: '长影旧址博物馆＋长春市动植物公园',
    flight: '酒店 → 长影旧址博物馆 → 长春市动植物公园', hotel: '长春人民广场—重庆路区域酒店', weatherCity: '长春', weatherDate: '2026-08-18', weatherFallback: WEATHER_REFERENCE.长春,
    decision: { title: '净月潭已取消：8月18日全部市区活动', body: '本版取消净月潭：市区单程车程可控，亲子节奏更好，也给 8月19日上午留出完整恢复时间。长影与动植物公园都在市区，全天不赶火车。', tone: 'info' },
    entries: [
      { id: 'd4-1', time: '07:30', desc: '起床' },
      { id: 'd4-2', time: '07:40—08:15', desc: '早餐' },
      { id: 'd4-3', time: '08:20', desc: '前往长影旧址博物馆' },
      { id: 'd4-4', time: '08:50左右', desc: '抵达、核验/购票' },
      { id: 'd4-5', time: '09:00—11:30', desc: '长影旧址博物馆', isSight: true, detailsList: [
        { label: '地址', value: '长春市朝阳区红旗街1118号。' },
        { label: '亲子', value: '重点看老摄影机、胶片、摄影棚、老电影道具、洗印流程和特技布景，讲“以前没有电脑，电影是怎么做出来的”。' },
        { label: '核验', value: '8月17日晚通过长影旧址博物馆官方平台核对8月18日开馆时间、票务和演出时刻；演出遇上就看，不为等待延长到下午。' },
      ], badges: [{ text: '上午主任务', type: 'green' }, { text: '前晚核验' }] },
      { id: 'd4-6', time: '11:30—11:45', desc: '离馆、休息' },
      { id: 'd4-7', time: '11:45—12:50', desc: '红旗街附近午餐' },
      { id: 'd4-8', time: '12:50—13:20', desc: '饮料、短暂坐下休息' },
      { id: 'd4-9', time: '13:20—13:45', desc: '前往长春市动植物公园' },
      { id: 'd4-10', time: '13:45—14:00', desc: '到达、核验/购票', body: '只买日场；8月17日晚通过“长春市动植物公园官微”核对日场开园时间、票价、儿童优惠和日夜场是否分票。' },
      { id: 'd4-11', time: '14:00—17:15', desc: '长春市动植物公园（不与虎园重复猛兽主线）', isSight: true, detailsList: [
        { label: '重点', value: '小熊猫、长颈鹿、大象、河马、灵长类和草食动物；植物景观边走边看。' },
        { label: '差异', value: '8月16日已看过东北虎，猛兽区路过即可，不再以虎、狮为主线。' },
        { label: '节奏', value: '午后偏热，动物活跃度可能下降；留足 3 小时，重点看室内和阴凉区域，16:20 开始向出口移动。' },
      ], badges: [{ text: '下午主任务', type: 'green' }, { text: '日场票' }] },
      { id: 'd4-12', time: '17:15', desc: '离园' },
      { id: 'd4-13', time: '17:30—18:00', desc: '返回酒店/餐厅' },
      { id: 'd4-14', time: '18:10—19:30', desc: '晚餐' },
      { id: 'd4-15', time: '19:30以后', desc: '回酒店休息', body: '8月18日晚完成：核对G138票面、确认长春站上车、核对沈飞预约与刘老根门票、行李至少收好80%。' },
    ],
  },
  {
    id: 'd5', month: '8月', dayDate: '19', weekday: '周三', city: '长春 → 沈阳', title: '长春上午留白＋G138 前往沈阳',
    flight: 'G138 长春站 15:54 → 沈阳北 17:11（已购票）', hotel: '沈阳中街—故宫区域家庭房', weatherCity: '长春', weatherLabel: '长春 → 沈阳', weatherDate: '2026-08-19', weatherFallback: WEATHER_REFERENCE.长春,
    decision: { title: 'G138 已购票：长春站上车，晚上只休息', body: 'G138 车票已确认，8月19日 15:54 长春站发车、17:11 到沈阳北。上午主动留白恢复体力，不新增伪满皇宫等大景点；到沈阳后只休息，不安排老北市或中街。', tone: 'info' },
    entries: [
      { id: 'd5-1', time: '08:00—09:00', desc: '自然醒、早餐' },
      { id: 'd5-2', time: '09:00—09:30', desc: '整理行李' },
      { id: 'd5-3', time: '09:30—10:50', desc: '重庆路／人民广场周边轻松散步、买伴手礼', isSight: true, detailsList: [
        { label: '节奏', value: '只安排低强度：步行、买东北伴手礼、咖啡/甜品；不临时加伪满皇宫、大型博物馆或远郊。' },
        { label: '天气', value: '高温时缩短散步，直接回酒店休息。' },
      ], badges: [{ text: '恢复日', type: 'green' }, { text: '转场日' }] },
      { id: 'd5-4', time: '10:50—11:10', desc: '回酒店' },
      { id: 'd5-5', time: '11:10—12:10', desc: '提前午餐' },
      { id: 'd5-6', time: '12:10—12:40', desc: '取行李、最后检查' },
      { id: 'd5-7', time: '12:40—13:00', desc: '酒店大厅休息' },
      { id: 'd5-8', time: '13:10—13:20', desc: '前往长春站', body: 'G138 从长春站上车，不是长春西站。' },
      { id: 'd5-9', time: '13:35—13:55', desc: '抵达长春站' },
      { id: 'd5-10', time: '13:55—15:20', desc: '安检、休息、候车' },
      { id: 'd5-11', time: '15:54', desc: 'G138 从长春站出发（已购票）', body: '车票已确认；按票面车次、座位和检票口候车。', variant: 'decision' },
      { id: 'd5-12', time: '17:11参考', desc: '抵达沈阳北站' },
      { id: 'd5-13', time: '17:30—18:10', desc: '打车前往沈阳酒店', body: '前往中街—故宫区域酒店办理入住。' },
      { id: 'd5-14', time: '18:10以后', desc: '晚餐、洗衣、整理次日物品、休息', body: '晚上只休息：不安排老北市、不逛中街、不加正式景点，孩子 21:30—22:00 前睡觉。' },
    ],
  },
  {
    id: 'd6', month: '8月', dayDate: '20', weekday: '周四', city: '沈阳', title: '沈飞航空博览园＋西塔＋工博＋红梅＋刘老根',
    flight: '酒店 → 沈飞 → 西塔 → 中国工业博物馆 → 红梅 → 刘老根', hotel: '沈阳中街—故宫区域家庭房', weatherCity: '沈阳', weatherDate: '2026-08-20', weatherFallback: WEATHER_REFERENCE.沈阳,
    decision: { title: 'D6 强度最高：按顺序删减', body: '沈飞、酒店休息和已购刘老根演出优先；堵车或疲劳时依次取消红梅文创园、西塔完整逛街，再把工业博物馆压缩到 90 分钟。', tone: 'warning' },
    entries: [
      { id: 'd6-1', time: '07:15', desc: '起床' },
      { id: 'd6-2', time: '07:25—08:00', desc: '酒店早餐' },
      { id: 'd6-3', time: '08:00', desc: '打车前往沈飞航空博览园' },
      { id: 'd6-4', time: '08:25左右', desc: '抵达、核验预约' },
      { id: 'd6-5', time: '08:30—10:30', desc: '沈飞航空博览园', isSight: true, detailsList: [
        { label: '预约', value: '关注“沈飞航空博览园”官方公众号，在预约参观／门票预约中实名预约。' },
        { label: '看点', value: '真实飞机、歼击机发展、发动机和航空结构；控制在 2 小时并及时补水。' },
        { label: '备选', value: '预约不到时，上午改为北陵公园或酒店休息，其他安排不动。' },
      ], badges: [{ text: '沈阳新增主题', type: 'gold' }, { text: '出发前核验' }] },
      { id: 'd6-6', time: '10:30—11:10', desc: '打车前往西塔风情街' },
      { id: 'd6-7', time: '11:10—12:30', desc: '西塔午餐＋短距离逛街', isSight: true, detailsList: [
        { label: '餐食', value: '冷面、石锅拌饭、参鸡汤或简化烤肉，优先选择上菜稳定的店。' },
        { label: '取舍', value: '堵车或排队时只吃饭，不为完整逛街压缩后续场馆。' },
      ], badges: [{ text: '午餐为主', type: 'green' }] },
      { id: 'd6-8', time: '12:30—13:00', desc: '打车前往中国工业博物馆' },
      { id: 'd6-9', time: '13:00—15:10', desc: '中国工业博物馆', isSight: true, detailsList: [
        { label: '地址', value: '铁西区卫工北街 14 号；免费，现场扫码登记。' },
        { label: '重点', value: '大型机床、铸造设备、老厂房和沈阳工业史；若延误至少保留 90 分钟。' },
      ], badges: [{ text: '室内主任务', type: 'green' }, { text: '免费入馆' }] },
      { id: 'd6-10', time: '15:10—15:25', desc: '前往红梅文创园' },
      { id: 'd6-11', time: '15:25—16:10', desc: '红梅文创园（可选）', isSight: true, detailsList: [
        { label: '用途', value: '看旧厂房改造、拍照、喝水和休息。' },
        { label: '删减', value: '高温、下雨、堵车或孩子疲劳时直接取消，这是当天第一可删减项目。' },
      ], badges: [{ text: '可删减', type: 'gold' }] },
      { id: 'd6-12', time: '16:10—16:45', desc: '返回酒店' },
      { id: 'd6-13', time: '16:45—18:00', desc: '酒店完整休息' },
      { id: 'd6-14', time: '18:10', desc: '前往刘老根大舞台' },
      { id: 'd6-15', time: '18:35—19:00', desc: '取票、安检、入场' },
      { id: 'd6-16', time: '19:00—21:30', desc: '刘老根大舞台', isSight: true, detailsList: [
        { label: '购票', value: '建议 8 月 13—17 日购买 19:00 场；儿童票和节目内容以当日售票页为准。' },
        { label: '座位', value: '选择中后区、靠过道座位，孩子犯困或内容不适合时方便提前离场。' },
      ], badges: [{ text: '提前购票', type: 'red' }, { text: '儿童适配复核' }] },
      { id: 'd6-17', time: '21:40左右', desc: '回酒店' },
      { id: 'd6-18', time: '22:15左右', desc: '休息' },
    ],
  },
  {
    id: 'd7', month: '8月', dayDate: '21', weekday: '周五', city: '沈阳', title: '沈阳故宫＋环游巴士＋张学良旧居＋老北市',
    flight: '沈阳故宫 → 中街／方城环游巴士 → 张学良旧居 → 老北市', hotel: '沈阳中街—故宫区域家庭房', weatherCity: '沈阳', weatherDate: '2026-08-21', weatherFallback: WEATHER_REFERENCE.沈阳,
    decision: { title: '环游巴士无票或停运怎么办？', body: '故宫和帅府不变，改为普通公交环一路／环二路或步行中街鼓楼—正阳街；老北市仍保留在晚上。', tone: 'info' },
    entries: [
      { id: 'd7-1', time: '07:30', desc: '起床' },
      { id: 'd7-2', time: '07:40—08:10', desc: '早餐' },
      { id: 'd7-3', time: '08:15', desc: '前往沈阳故宫，携带预约证件原件' },
      { id: 'd7-4', time: '08:30—11:00', desc: '沈阳故宫', isSight: true, detailsList: [
        { label: '预约', value: '分时实名预约，目标 08:30 入馆；携带预约使用的证件原件。' },
        { label: '重点', value: '大政殿、十王亭、崇政殿、凤凰楼；用亲子讲法比较沈阳故宫和北京故宫。' },
      ], badges: [{ text: '分时预约', type: 'red' }, { text: '凭原件入馆' }] },
      { id: 'd7-5', time: '11:00—11:15', desc: '前往观光巴士乘车点' },
      { id: 'd7-6', time: '11:15／11:30—12:15／12:30', desc: '中街／方城环游巴士', isSight: true, detailsList: [
        { label: '预约', value: '8 月 18—20 日查询动态班次，目标 11:00—11:30 附近班次。' },
        { label: '备选', value: '无票或停运时改普通公交环一路／环二路，或步行中街鼓楼—正阳街。' },
      ], badges: [{ text: '动态班次', type: 'gold' }, { text: '可替换' }] },
      { id: 'd7-7', time: '12:30—13:25', desc: '中街午餐' },
      { id: 'd7-8', time: '13:25—13:45', desc: '前往张学良旧居' },
      { id: 'd7-9', time: '13:45—16:20', desc: '张学良旧居', isSight: true, detailsList: [
        { label: '重点', value: '四合院、大青楼、小青楼和中西建筑差异；金融博物馆视体力进入。' },
        { label: '购票', value: '从 8 月 14 日起查看，日期开放后购买 13:45—14:00 附近场次。' },
      ], badges: [{ text: '14:00左右', type: 'green' }, { text: '亲子观察' }] },
      { id: 'd7-10', time: '16:20—17:30', desc: '返回酒店休息' },
      { id: 'd7-11', time: '17:45', desc: '前往老北市' },
      { id: 'd7-12', time: '18:10—20:30', desc: '老北市夜游＋晚餐', isSight: true, detailsList: [
        { label: '安排', value: '先吃饭，天黑后看灯光、街区和民俗氛围；公共街区无需预约。' },
        { label: '节奏', value: '孩子疲劳时缩短为 18:30—20:00，控制晚上活动时长。' },
      ], badges: [{ text: '公共街区', type: 'green' }, { text: '夜游' }] },
      { id: 'd7-13', time: '20:30—21:00', desc: '返回酒店' },
      { id: 'd7-14', time: '21:00以后', desc: '洗澡、整理返程行李' },
    ],
  },
  {
    id: 'd8', month: '8月', dayDate: '22', weekday: '周六', city: '沈阳 → 南京', title: 'G98 高铁返程',
    flight: 'G98 沈阳北 12:31 → 南京南 19:28（已购票，以订单为准）', hotel: '回家', weatherCity: '沈阳', weatherDate: '2026-08-22', weatherFallback: WEATHER_REFERENCE.沈阳,
    entries: [
      { id: 'd8-1', time: '07:45—08:45', desc: '早餐' },
      { id: 'd8-2', time: '08:45—09:40', desc: '整理行李' },
      { id: 'd8-3', time: '09:45—10:00', desc: '办理退房' },
      { id: 'd8-4', time: '10:00—10:20', desc: '购买车上食品、最后检查证件' },
      { id: 'd8-5', time: '10:30', desc: '前往沈阳北站' },
      { id: 'd8-6', time: '10:55—11:10', desc: '抵达沈阳北站' },
      { id: 'd8-7', time: '11:10—12:00', desc: '安检、候车、午餐' },
      { id: 'd8-8', time: '12:31', desc: 'G98 从沈阳北出发（已购票）', body: 'G98 车票已确认，沈阳北上车、南京南下车；属于过路车，至少提前 1 小时以上抵达沈阳北站。', variant: 'decision' },
      { id: 'd8-9', time: '19:28参考', desc: '抵达南京南站，回家', body: '按 G98 订单到达时间回家，晚间不再安排额外行程。' },
    ],
  },
]

const RESERVATIONS: ReservationItem[] = [
  { id: 'r1', date: '已出票 · 8月14日', title: 'Z366', detail: '南京站 16:58 → 哈尔滨西 次日 14:51 · 软卧', channel: '铁路12306 · 已支付', action: '车票已确认；出行前在 12306 复核票面铺位和证件', state: 'confirmed', status: '已购票', icon: 'train' },
  { id: 'r2', date: '已出票 · 8月17日', title: 'G126', detail: '哈尔滨站 16:42 → 长春西 17:51', channel: '铁路12306 · 已支付', action: '车票已确认；哈尔滨站上车，不要误去哈尔滨西站', state: 'confirmed', status: '已购票', icon: 'train' },
  { id: 'r3', date: '已出票 · 8月19日', title: 'G138', detail: '长春站 15:54 → 沈阳北站 17:11', channel: '铁路12306 · 已支付', action: '车票已确认；长春站上车，不是长春西站', state: 'confirmed', status: '已购票', icon: 'train' },
  { id: 'r4', date: '已出票 · 8月22日', title: 'G98', detail: '沈阳北站 12:31 → 南京南站 19:28', channel: '铁路12306 · 已支付', action: '车票已确认；过路车，至少提前 1 小时到沈阳北站', state: 'confirmed', status: '已购票', icon: 'train' },
  { id: 'r5', date: '已预订 · 8月16日', title: '东北虎林园', detail: '8月16日 · 普通／惊险观光车', channel: '东北虎林园购票页 · 已支付', action: '门票已确认；出行前复核观光车票型和儿童优惠规则', state: 'confirmed', status: '已预订', icon: 'tiger' },
  { id: 'r6', date: '已预约 · 8月16日', title: '哈工大入校预约', detail: '8月16日校园和航天馆', channel: '哈工大官方微信公众号 · 已确认', action: '预约已完成；携带预约所用证件，13:15 前后到和兴路校门核验', state: 'confirmed', status: '已预约', icon: 'school' },
  { id: 'r7', date: '8月17日 · 现场', title: '哈药六厂', detail: '南直路326号 · 公开参观区 09:00—17:00', channel: '现场身份证登记', action: '无需预约，身份证登记；午餐后留足高铁进站余量', state: 'walkin', status: '无需预约', icon: 'museum' },
  { id: 'r8', date: '8月17日晚', title: '长影旧址博物馆', detail: '8月18日 · 目标09:00入馆', channel: '长影旧址博物馆官方平台', action: '8月17日晚核对开馆时间、票务和演出时刻；演出遇上就看', state: 'upcoming', status: '待核验', window: { from: '2026-08-17', to: '2026-08-17' }, icon: 'museum' },
  { id: 'r9', date: '8月17日晚', title: '长春市动植物公园', detail: '8月18日 · 日场票 14:00 前后', channel: '长春市动植物公园官微', action: '核对日场开园时间、票价、儿童优惠和日夜场是否分票；只买日场', state: 'upcoming', status: '待核验', window: { from: '2026-08-17', to: '2026-08-17' }, icon: 'tiger' },
  { id: 'r10', date: '8月15—17日', title: '沈飞航空博览园', detail: '8月20日 · 航空科普场馆', channel: '沈飞航空博览园官方公众号', action: '完成实名预约；8月19日晚复核二维码和户外展区状态', state: 'upcoming', status: '待预约', window: { from: '2026-08-15', to: '2026-08-17' }, icon: 'museum' },
  { id: 'r11', date: '8月13—17日', title: '刘老根大舞台', detail: '8月20日 · 目标19:00场', channel: '官方售票页', action: '确认儿童票、节目适龄性和靠过道座位', state: 'upcoming', status: '待购票', window: { from: '2026-08-13', to: '2026-08-17' }, icon: 'ticket' },
  { id: 'r12', date: '8月14日起', title: '沈阳故宫', detail: '8月21日 · 目标08:30入馆', channel: '官方预约/授权平台', action: '日期开放后立即购买；入馆携带预约使用的证件原件', state: 'upcoming', status: '待预约', window: { from: '2026-08-14', to: '2026-08-21' }, icon: 'museum' },
  { id: 'r13', date: '8月18—20日', title: '方城环游巴士', detail: '8月21日 · 目标11:00—11:30班次', channel: '沈阳文旅相关小程序／现场售票', action: '查询动态班次；无票改普通公交或中街步行', state: 'upcoming', status: '待预约', window: { from: '2026-08-18', to: '2026-08-20' }, icon: 'route' },
  { id: 'r14', date: '8月14日起', title: '张学良旧居', detail: '8月21日 · 目标13:45—14:00入馆', channel: '官方预约/授权平台', action: '日期开放后购买；金融博物馆视体力进入', state: 'upcoming', status: '待预约', window: { from: '2026-08-14', to: '2026-08-21' }, icon: 'museum' },
  { id: 'r15', date: '8月20日 · 现场', title: '中国工业博物馆', detail: '免费入馆 · 现场扫码登记', channel: '中国工业博物馆', action: '无需预约；至少预留90分钟，开放时间当天复核', state: 'walkin', status: '无需预约', icon: 'museum' },
]

const LEGEND_ITEMS: { state: ReservationState; label: string }[] = [
  { state: 'confirmed', label: '已确认' },
  { state: 'today', label: '今天处理' },
  { state: 'upcoming', label: '待预定' },
  { state: 'walkin', label: '无需预约' },
]

const TODAY_STATE_LABEL: Record<'today' | 'overdue', string> = {
  today: '今天处理',
  overdue: '尽快处理',
}

function todayString(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 由静态基线与处理窗口派生最终视觉状态：upcoming 在窗口内 → today，窗口过期未处理 → overdue */
function resolveReservationState(item: ReservationItem, today: string): ReservationState {
  if (item.state !== 'upcoming' || !item.window) return item.state
  if (today > item.window.to) return 'overdue'
  if (today >= item.window.from) return 'today'
  return 'upcoming'
}

function reservationActionIcon(state: ReservationState): string {
  if (state === 'confirmed' || state === 'walkin') return 'check'
  if (state === 'today' || state === 'overdue') return 'alert'
  return 'calendar'
}

const HOTELS: HotelData[] = [
  { dayId: 'd0', night: 'D0 宿火车', name: 'Z366 软卧包厢', desc: '已购 Z366 软卧；南京站 16:58 出发，次日 14:51 抵达哈尔滨西。' },
  { dayId: 'd1', night: 'D1—D2 宿哈尔滨', name: '中央大街—圣索菲亚教堂之间', desc: '家庭房或两张 1.35 米以上床的双床房；8月17日退房后寄存行李，下午取件转长春。' },
  { dayId: 'd3', night: 'D3—D4 宿长春', name: '人民广场—重庆路附近', desc: '两晚短停：去长影、动植物公园和长春站都方便；8月19日退房后可寄存行李到下午。' },
  { dayId: 'd5', night: 'D5—D7 宿沈阳', name: '中街—沈阳故宫附近', desc: '方便刘老根、故宫、帅府和老北市；D8 返程打车到沈阳北站方便。' },
]

const TIPS = [
  '天气：哈尔滨、长春和沈阳的具体天气以出发前 1 天及当天官方预报为准；午后户外活动注意防暑补水。',
  '穿衣：短袖＋薄长袖＋轻薄防风外套，防晒帽、驱蚊液和一次性雨衣随身。',
  '证件：4 人身份证原件、12306 订单、哈工大预约截图、沈阳场馆订单在两个成人手机中各保存一份。',
  '车票：Z366、G126、G138、G98 均已购票；出发前只需在 12306 复核车次、时间、座席和到站信息。',
  '哈尔滨：D3 上午哈药六厂后 15:15 前后从酒店出发去哈尔滨站，不要误去哈尔滨西站。',
  '长春：净月潭已取消，8月18日全部市区活动；动物园不重复哈尔滨虎园的猛兽体验。',
  '长春：8月19日上午主动留白，不临时塞伪满皇宫或其他大型场馆；G138 从长春站上车。',
  '沈阳：D6 是高强度日，沈飞、酒店休息和刘老根优先；红梅第一删，西塔逛街和工博时长随后压缩。',
  'D7：故宫、环游巴士、帅府、老北市集中在方城和市中心；巴士无票时不影响故宫和帅府，改公交或步行。',
  '亲子：每天保留休息窗口；红梅文创园、金融博物馆和额外场馆都是可放弃项目，不为全打卡硬走。',
  '饮食：东北菜分量大，每顿少点一些；D3 晚到长春前和酒店确认入住和行李安排。',
  '核验：景区开放、门票、车次和天气敏感项目，出发前一天再次通过官方渠道确认。',
]

function WeatherCard({ city, state }: { city: string; state: WeatherState }) {
  return (
    <div className={`${styles.weatherCard} ${state.source === 'live' ? styles.weatherLive : styles.weatherReference}`}>
      <div className={styles.weatherIcon}><Icon name={state.icon} size={26} /></div>
      <div className={styles.weatherCopy}>
        <div className={styles.weatherTopline}>
          <span className={styles.weatherCity}>{city}</span>
          <span className={`${styles.weatherSource} ${state.source === 'live' ? styles.sourceLive : ''}`}>
            {state.source === 'live' ? '动态预报' : '计划参考'}
          </span>
        </div>
        <div className={styles.weatherMain}>{state.text}<span className={styles.weatherTemp}>{state.temp}</span></div>
        <div className={styles.weatherWind}>{state.wind}</div>
        <div className={styles.weatherAdvice}>{state.advice}</div>
      </div>
    </div>
  )
}

function ReservationLegend() {
  return (
    <ul className={styles.legend} aria-label="预约状态图例">
      {LEGEND_ITEMS.map(item => (
        <li key={item.state}>
          <span className={`${styles.legendDot} ${styles[`legend-${item.state}`]}`} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function ReservationRail({ items, today }: { items: ReservationItem[]; today: string }) {
  return (
    <div className={styles.reservationWrap}>
      <ReservationLegend />
      <div className={styles.reservationRail}>
        {items.map(item => {
          const state = resolveReservationState(item, today)
          const label = state === 'today' || state === 'overdue' ? TODAY_STATE_LABEL[state] : item.status
          return (
            <article key={item.id} className={`${styles.reservationCard} ${styles[`reservation-${state}`]}`}>
              <div className={styles.reservationHead}>
                <span className={styles.reservationIcon}><Icon name={item.icon} size={18} /></span>
                <span className={styles.reservationMeta}><span className={styles.reservationDate}>{item.date}</span><span className={styles.reservationStatus}>{label}</span></span>
              </div>
              <h3 className={styles.reservationTitle}>{item.title}</h3>
              <p className={styles.reservationDetail}>{item.detail}</p>
              <div className={styles.reservationChannel}>{item.channel}</div>
              <p className={styles.reservationAction}><Icon name={reservationActionIcon(state)} size={14} />{item.action}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function HotelCard({ hotel }: { hotel: HotelData }) {
  return (
    <div className={styles.hotelItem}>
      <div className={styles.hotelNight}><span className={styles.hotelNightIcon}><Icon name="hotel" size={14} /></span>{hotel.night}</div>
      <div className={styles.hotelInfo}>
        <div className={styles.hotelName}>
          {hotel.name}
          <a className={styles.pinLink} href={buildBaiduNavUrl(hotel.name)} aria-label="导航到酒店" onClick={event => event.stopPropagation()}>
            <Icon name="mapPin" size={15} />
          </a>
        </div>
        <div className={styles.hotelDesc}>{hotel.desc}</div>
      </div>
    </div>
  )
}

function TimelineItem({ entry, open, onToggle }: { entry: TimelineEntry; open: boolean; onToggle: () => void }) {
  const detailId = `${entry.id}-detail`
  const body = entry.detailsList && entry.detailsList.length > 0 ? (
    <div className={styles.sightBody}>
      {entry.detailsList.map((detail, index) => (
        <div key={index} className={styles.sightRow}><span className={styles.sightLabel}>{detail.label}</span><span className={styles.sightValue}>{detail.value}</span></div>
      ))}
      {entry.badges && <div className={styles.badgeRow}>{entry.badges.map((badge, index) => <span key={index} className={`${styles.badge} ${styles[`badge-${badge.type || 'default'}`]}`}>{badge.text}</span>)}</div>}
    </div>
  ) : entry.body ? <div className={styles.tlBodyText}>{entry.body}</div> : null

  if (!body) {
    return <div className={styles.timelineStatic}><span className={styles.tlTime}>{entry.time}</span><span className={styles.tlNameText}>{entry.desc}</span></div>
  }

  return (
    <div className={`${styles.timelineItemInner} ${open ? styles.open : ''} ${entry.isSight ? styles.sightItem : ''}`}>
      <button className={entry.isSight ? styles.sightCardHead : styles.tlBtn} onClick={onToggle} aria-expanded={open} aria-controls={detailId}>
        <span className={entry.isSight ? styles.sightTimeAbove : styles.tlTime}>{entry.time}</span>
        <span className={entry.isSight ? styles.sightCardTitleWrap : styles.tlName}>
          {entry.isSight && <span className={styles.sightCardLabel}>重点行程</span>}
          <span className={entry.isSight ? styles.sightCardName : styles.tlNameText}>{entry.desc}</span>
        </span>
        <span className={styles.caret}><Icon name="chevron" size={16} /></span>
      </button>
      <div className={styles.tlDetail} id={detailId} hidden={!open}><div className={entry.isSight ? styles.sightCardBody : styles.tlBody}>{body}</div></div>
    </div>
  )
}

export default function HarbinTripPage({ onBack }: Props) {
  const [visible, setVisible] = useState(false)
  const [activeDay, setActiveDay] = useState('prep')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'd1-7': true, 'd2-4': true, 'd4-5': true, 'd4-11': true })
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherState>>({})
  const [today] = useState(() => todayString())
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isScrolling = useRef(false)
  const pillsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 50)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const items = ITINERARY.map(day => ({ city: day.weatherCity, date: day.weatherDate }))
    api.batchWeather(items).then(response => {
      if (cancelled) return
      const next: Record<string, WeatherState> = {}
      for (const day of ITINERARY) {
        const weather = response.results[`${day.weatherCity}:${day.weatherDate}`]
        if (!weather) continue
        const wind = [weather.windDir, weather.windScale].filter(Boolean).join(' · ') || '风力待更新'
        next[day.id] = {
          icon: weatherTextToIcon(weather.textDay),
          text: weather.textDay || day.weatherFallback.text,
          temp: `${weather.tempLow}—${weather.tempHigh}°C`,
          wind,
          source: 'live',
          advice: day.weatherFallback.advice,
        }
      }
      setWeatherMap(next)
    }).catch(() => {
      if (!cancelled) setWeatherMap({})
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (isScrolling.current) return
      for (const entry of entries) {
        if (entry.isIntersecting) setActiveDay(entry.target.id)
      }
    }, { rootMargin: '0px 0px -65% 0px', threshold: 0 })
    Object.values(sectionRefs.current).forEach(element => { if (element) observer.observe(element) })
    return () => observer.disconnect()
  }, [visible])

  const setSectionRef = useCallback((id: string) => (element: HTMLDivElement | null) => {
    sectionRefs.current[id] = element
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    isScrolling.current = true
    setActiveDay(dayId)
    const element = sectionRefs.current[dayId]
    if (element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 18, behavior: 'smooth' })
    const index = DAYS.findIndex(day => day.id === dayId)
    const buttons = pillsRef.current?.querySelectorAll('button')
    if (buttons && index >= 0) buttons[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    window.setTimeout(() => { isScrolling.current = false }, 800)
  }, [])

  const getWeather = (day: DayData): WeatherState => weatherMap[day.id] || { ...day.weatherFallback, source: 'reference' }
  const toggleItem = (id: string) => setOpenItems(current => ({ ...current, [id]: !current[id] }))
  const prepActive = activeDay === 'prep'

  return (
    <>
      <button onClick={onBack} className={styles.backBtn} aria-label="返回"><Icon name="arrowLeft" size={21} /></button>
      <main className={`${styles.page} ${visible ? styles.visible : ''}`}>
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}><span>WINDSSEA DAILY</span><span>FAMILY ROUTE · 2026</span></div>
          <h1 className={styles.heroTitle}>2026 东北亲子避暑 9 日</h1>
          <p className={styles.heroSub}>8.14—8.22 · 2 大 2 小 · 南京出发 · 哈尔滨 · 长春 · 沈阳</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><strong>9</strong><span>天</span></div>
            <div className={styles.heroStat}><strong>3</strong><span>个目的地</span></div>
            <div className={styles.heroStat}><strong>4</strong><span>位同行者</span></div>
            <div className={styles.heroStat}><strong>3</strong><span>段高铁</span></div>
          </div>
          <div className={styles.heroRoute} aria-label="行程路线">
            {['南京', '哈尔滨', '长春', '沈阳', '南京'].map((stop, index) => (
              <span key={`${stop}-${index}`} className={styles.heroRouteStop}><span className={styles.heroRouteDot}>{index === 0 ? '出发' : index === 4 ? '回家' : index + 1}</span><strong>{stop}</strong>{index < 4 && <span className={styles.heroRouteLine} />}</span>
            ))}
          </div>
          <div className={styles.heroAlert}><Icon name="alert" size={17} /><span>Z366、G126、G138、G98 车票与东北虎林园门票均已确认；哈工大入校预约已完成。净月潭已取消，8 月 18 日全部在长春市区活动，8 月 19 日上午留白恢复体力。</span></div>
          <div className={styles.heroChips}>
            {DAYS.map(day => <button key={day.id} className={`${styles.heroChip} ${activeDay === day.id ? styles.heroChipActive : ''}`} onClick={() => scrollToDay(day.id)}>{day.emoji} {day.label}</button>)}
          </div>
        </section>

        <section className={`${styles.section} ${styles.overviewSection}`} id="prep" ref={setSectionRef('prep')}>
          <div className={styles.sectionKicker}>01 · 先看全程</div>
          <div className={styles.sectionHeadingRow}><div><h2 className={styles.sectionTitle}>路线与关键节点</h2><p className={styles.sectionLead}>把需要提前确认的事情放在每天行程之前，旅途中只看当天卡片就够了。</p></div><div className={styles.sourceNote}><Icon name="calendar" size={14} />所有时间均为北京时间</div></div>
          <ReservationRail items={RESERVATIONS} today={today} />
          <div className={styles.overviewGrid}>
            <div className={styles.panel}><div className={styles.panelTitle}><Icon name="hotel" size={17} />住宿分段</div><div className={styles.hotelList}>{HOTELS.map(hotel => <HotelCard key={hotel.dayId} hotel={hotel} />)}</div></div>
            <div className={styles.panel}><div className={styles.panelTitle}><Icon name="route" size={17} />全程规则</div><ul className={styles.ruleList}><li><Icon name="check" size={15} />Z366、G126、G138、G98 已购票；其余车次以 12306 成功订单为准。</li><li><Icon name="check" size={15} />哈工大入校预约已完成，8 月 16 日按预约时段入校。</li><li><Icon name="check" size={15} />G126 哈尔滨站上车、长春西下车；G138 长春站上车、沈阳北下车。</li><li><Icon name="check" size={15} />净月潭已取消；8 月 18 日全部在长春市区活动，8 月 19 日上午留白。</li><li><Icon name="check" size={15} />两个孩子的体力优先于全景点打卡，D6 按删减顺序执行。</li></ul></div>
          </div>
        </section>

        {ITINERARY.map((day, index) => {
          const weather = getWeather(day)
          const hotel = HOTELS.find(item => item.dayId === day.id)
          return (
            <section key={day.id} id={day.id} ref={setSectionRef(day.id)} className={`${styles.section} ${styles.daySection}`}>
              <div className={styles.dayHeader}>
                <div className={styles.dayDateCircle}><span>D{index}</span><strong>{day.dayDate}</strong><small>{day.weekday}</small></div>
                <div className={styles.dayHeading}><div className={styles.dayCity}>{day.city}</div><h2 className={styles.dayName}>{day.title}</h2><div className={styles.dayMeta}>{day.flight && <span><Icon name="train" size={14} />{day.flight}</span>}{day.hotel && <span><Icon name="hotel" size={14} />{day.hotel}</span>}</div></div>
              <WeatherCard city={day.weatherLabel || day.weatherCity} state={weather} />
              </div>
              <div className={styles.dayBody}>
                <div className={styles.timeline}>
                  {day.entries.map(entry => <div key={entry.id} className={`${styles.timelineItem} ${entry.isSight ? styles.timelineSight : ''} ${entry.variant === 'decision' ? styles.timelineDecision : ''} ${openItems[entry.id] ? styles.open : ''}`}><span className={styles.timelineDot} /><TimelineItem entry={entry} open={!!openItems[entry.id]} onToggle={() => toggleItem(entry.id)} /></div>)}
                </div>
                <aside className={styles.dayAside}>
                  {day.decision && <div className={`${styles.decisionCard} ${styles[`decision-${day.decision.tone}`]}`}><div className={styles.decisionTitle}><Icon name={day.decision.tone === 'warning' ? 'alert' : day.decision.tone === 'success' ? 'check' : 'info'} size={16} />{day.decision.title}</div><p>{day.decision.body}</p></div>}
                  {hotel && <div className={styles.dayHotel}><div className={styles.dayAsideLabel}>当晚住宿</div><HotelCard hotel={hotel} /></div>}
                </aside>
              </div>
            </section>
          )
        })}

        <section className={`${styles.section} ${styles.tipsSection}`}>
          <div className={styles.sectionKicker}>10 · 最后检查</div><h2 className={styles.sectionTitle}>出发前与旅途中的小规则</h2><ul className={styles.tipsList}>{TIPS.map((tip, index) => <li key={index}><span className={styles.tipsIndex}>{String(index + 1).padStart(2, '0')}</span><span>{tip}</span></li>)}</ul>
        </section>

        <footer className={styles.footer}><span className={styles.footerSeal}>北</span><p>东北亲子避暑九日 · 2026年暑期</p><small>天气、车次和景区开放信息以出发前官方核验为准</small></footer>
      </main>

      <nav className={`${styles.pillNav} ${prepActive ? styles.pillNavPrep : ''}`} ref={pillsRef} aria-label="九日行程导航">
        <button className={`${styles.pill} ${prepActive ? styles.active : ''}`} onClick={() => scrollToDay('prep')}><Icon name="route" size={15} />总览</button>
        {DAYS.map(day => <button key={day.id} className={`${styles.pill} ${activeDay === day.id ? styles.active : ''}`} onClick={() => scrollToDay(day.id)}>{day.emoji} {day.label}</button>)}
      </nav>
    </>
  )
}
