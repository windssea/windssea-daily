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
  weatherDate: string
  weatherFallback: WeatherFallback
  entries: TimelineEntry[]
  decision?: {
    title: string
    body: string
    tone: DecisionTone
  }
}

interface ReservationItem {
  id: string
  date: string
  title: string
  detail: string
  channel: string
  action: string
  tone: 'urgent' | 'soon' | 'weather' | 'confirmed'
  status: '已预订' | '待预约' | '待抢票' | '天气备用'
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
  长白山: { icon: 'cloudy', temp: '山地参考', text: '山顶多变', wind: '山顶风力随时变化', advice: '雨衣、薄外套和防滑鞋；天池以当天调度为准' },
  沈阳: { icon: 'partlyCloudy', temp: '夏季参考', text: '高温/阵雨复核', wind: '以当日预报为准', advice: '高温或大雨时优先室内场馆，取消红梅文创园' },
}

const DAYS = [
  { id: 'd0', label: '出发', emoji: '🚂' },
  { id: 'd1', label: '哈尔滨', emoji: '🏙️' },
  { id: 'd2', label: '虎园/哈工大', emoji: '🐅' },
  { id: 'd3', label: '转场', emoji: '🚄' },
  { id: 'd4', label: '天池', emoji: '🏔️' },
  { id: 'd5', label: '备用', emoji: '♨️' },
  { id: 'd6', label: '沈阳', emoji: '🏯' },
  { id: 'd7', label: '故宫', emoji: '👑' },
  { id: 'd8', label: '工业', emoji: '🏭' },
  { id: 'd9', label: '返程', emoji: '🏠' },
]

const ITINERARY: DayData[] = [
  {
    id: 'd0', month: '8月', dayDate: '14', weekday: '周五', city: '南京 → 哈尔滨', title: '南京站乘 Z366 卧铺出发（已预订）',
    flight: 'Z366 南京站 16:58 → 哈尔滨西次日 14:51（已预订）', hotel: '火车软卧', weatherCity: '南京', weatherDate: '2026-08-14', weatherFallback: WEATHER_REFERENCE.南京,
    entries: [
      { id: 'd0-1', time: '14:20前', desc: '行李、证件、充电宝和车上食物最终检查', body: '四人身份证原件、车票订单、充电宝、少量零食和水放入随身包。孩子各自保管水杯、薄外套和书。' },
      { id: 'd0-2', time: '15:20', desc: '抵达南京站，完成安检和候车', body: '出发站是南京站，不是南京南站。预留安检、上厕所、补水和购买少量食品的时间。' },
      { id: 'd0-3', time: '16:58', desc: 'Z366 发车：已预订软卧', body: '南京至哈尔滨车票已预订成功。当前行程为软卧四张，参考历时约 21 小时 53 分，次日 14:51 抵达哈尔滨西站；出发前只需核对乘车人、铺位和车次状态。\n\n7 岁、9 岁儿童使用本人有效身份证件乘车，最终以 12306 订单和车站公告为准。' },
      { id: 'd0-4', time: '20:30—21:30', desc: '火车晚餐、洗漱、整理铺位后休息', body: '不带过量桶装食品；卧铺车厢较热且不便整理。' },
    ],
  },
  {
    id: 'd1', month: '8月', dayDate: '15', weekday: '周六', city: '哈尔滨', title: '抵达哈尔滨：中央大街与松花江',
    hotel: '哈尔滨中央大街区域家庭房', weatherCity: '哈尔滨', weatherDate: '2026-08-15', weatherFallback: WEATHER_REFERENCE.哈尔滨,
    entries: [
      { id: 'd1-1', time: '14:51', desc: '抵达哈尔滨西站', body: '下车、出站、上厕所后打车前往中央大街中段至圣索菲亚教堂之间。哈尔滨停留时间短，不建议住哈尔滨西站附近。' },
      { id: 'd1-2', time: '15:15—16:25', desc: '办理入住、简单洗漱、轻装出门', body: '优先家庭房或两张 1.35 米以上床的双床房；8 月 17 日退房后确认可免费寄存行李至 13:30。' },
      { id: 'd1-3', time: '16:30—17:10', desc: '圣索菲亚教堂广场与外观', isSight: true, detailsList: [
        { label: '方式', value: '以外观和广场为主，教堂内部不列为必选。' },
        { label: '亲子', value: '刚结束近 22 小时卧铺，不安排大型场馆，先让孩子适应城市环境。' },
      ], badges: [{ text: '免费外观', type: 'green' }, { text: '无需预约' }] },
      { id: 'd1-4', time: '17:10—18:35', desc: '中央大街慢逛', body: '沿街观察建筑和街景，步行节奏放慢，不为打卡压缩孩子休息时间。' },
      { id: 'd1-5', time: '18:35—19:20', desc: '防洪纪念塔、松花江边', body: '江边短暂停留后在附近用餐；如遇阵雨，直接回中央大街室内餐厅。' },
      { id: 'd1-6', time: '19:30—21:00', desc: '晚餐、返回酒店、早休息', body: '第一顿东北菜控制在三四道，铁锅炖不安排在需要赶时间的晚上。' },
    ],
  },
  {
    id: 'd2', month: '8月', dayDate: '16', weekday: '周日', city: '哈尔滨', title: '东北虎林园＋哈工大航天馆',
    flight: '中央大街 → 虎林园西北门 → 哈工大一校区', hotel: '哈尔滨中央大街区域家庭房', weatherCity: '哈尔滨', weatherDate: '2026-08-16', weatherFallback: WEATHER_REFERENCE.哈尔滨,
    decision: { title: '哈工大预约失败怎么办？', body: '虎林园上午保持不变；下午在哈工大中心区或校园周边公开区域、黑龙江省科技类公共场馆中择一，或回中央大街休息，不临时强塞远距离景点。', tone: 'info' },
    entries: [
      { id: 'd2-1', time: '07:10—07:50', desc: '起床、早餐、打车出发' },
      { id: 'd2-2', time: '08:30—11:15', desc: '东北虎林园：先观光车，再步行观虎区', isSight: true, detailsList: [
        { label: '导航', value: '黑龙江东北虎林园西北门。夏季参考开放 08:30—17:00，16:30 停止检票。' },
        { label: '票型', value: '孩子不害怕大型动物可选惊险车；胆小则选普通观光车。价格和儿童优惠以官方购票页为准。' },
        { label: '顺序', value: '观光车 → 猛兽车行区 → 步行观虎区 → 观虎台 → 科普/萌虎区，11:15 前结束。' },
      ], badges: [{ text: '亲子主任务', type: 'green' }, { text: '建议提前购票' }] },
      { id: 'd2-3', time: '11:15—12:10', desc: '跨江前往哈工大和兴路区域' },
      { id: 'd2-4', time: '12:10—13:15', desc: '简餐＋坐下休息', body: '不返回中央大街再折返，附近简餐即可，留半小时给孩子恢复体力。' },
      { id: 'd2-5', time: '13:30—14:10', desc: '哈工大一校区校园开放区', isSight: true, detailsList: [
        { label: '预约', value: '一位成人预约即可覆盖一家四口；儿童必须由预约成功的监护人陪同。' },
        { label: '路径', value: '哈工大官方微信公众号 → 服务 → 校园参观预约 → 入校预约。' },
      ], badges: [{ text: '免费', type: 'green' }, { text: '先预约入校' }] },
      { id: 'd2-6', time: '14:10—15:50', desc: '哈工大航天馆', isSight: true, detailsList: [
        { label: '重点', value: '航天模型、工程技术和孩子可理解的“人类如何飞上太空”。' },
        { label: '入馆', value: '航天馆不单独预约，但以入校预约和现场开放安排为准，16:30 前离开馆区。' },
      ], badges: [{ text: '免费', type: 'green' }, { text: '室内避暑' }] },
      { id: 'd2-7', time: '16:40—18:30', desc: '回酒店休息，附近晚餐', body: '晚上不再增加必游项目；孩子状态好再短逛中央大街。' },
    ],
  },
  {
    id: 'd3', month: '8月', dayDate: '17', weekday: '周一', city: '哈尔滨 → 长白山', title: '哈药六厂＋D552 转场（已预订）',
    flight: 'D552 哈尔滨站 15:37 → 长白山站 19:38（已预订）', hotel: '二道白河／池北区酒店', weatherCity: '长白山', weatherDate: '2026-08-17', weatherFallback: WEATHER_REFERENCE.长白山,
    decision: { title: 'D552 已预订：按票面执行', body: '车票已预订成功。出发前核对乘车人、座位和上车站；当天按计划提前到哈尔滨站候车。若铁路临时晚点或调整，以 12306 和车站公告为准，并及时联系二道白河酒店调整接站。', tone: 'success' },
    entries: [
      { id: 'd3-1', time: '07:30—08:20', desc: '早餐、退房，大行李寄存酒店' },
      { id: 'd3-2', time: '09:00—10:30', desc: '哈药六厂南直路老厂区', isSight: true, detailsList: [
        { label: '导航', value: '哈尔滨市道外区南直路 326 号。重点看建筑、厂区大厅、楼梯和老厂区空间。' },
        { label: '票务', value: '公开区域参考为免费、凭身份证登记；开放政策以当天公告为准。' },
        { label: '取舍', value: '若只能改上午直达车，直接取消此项，不压缩车站安检和候车时间。' },
      ], badges: [{ text: '免费登记', type: 'green' }, { text: '转场敏感' }] },
      { id: 'd3-3', time: '11:30—13:20', desc: '午餐、取行李、确认接站', body: '确认二道白河酒店接站司机、电话、车型，并让酒店确认 20:30 后入住和简餐安排。' },
      { id: 'd3-4', time: '13:50—15:10', desc: '前往哈尔滨站，安检、候车、补水' },
      { id: 'd3-5', time: '15:37', desc: 'D552 从哈尔滨站发出（已预订）', body: '当前订单为哈尔滨站上车。请以 12306 订单中的车次、座位、检票口为准，提前完成安检和候车。', variant: 'decision' },
      { id: 'd3-6', time: '19:38参考', desc: '抵达长白山站，酒店接站到二道白河', body: '终点必须是长白山站，不是长白山西站。晚到超过常规公交时段，提前安排酒店接站或正规车辆。' },
    ],
  },
  {
    id: 'd4', month: '8月', dayDate: '18', weekday: '周二', city: '长白山北景区', title: '天池核心日：天气允许就先上主峰',
    hotel: '二道白河／池北区酒店', weatherCity: '长白山', weatherDate: '2026-08-18', weatherFallback: WEATHER_REFERENCE.长白山,
    decision: { title: '天池不是唯一成功标准', body: '天池能否开放取决于风、雾、雷雨等安全条件。主峰开放时优先服从景区调度；关闭时照常游览瀑布、温泉群、绿渊潭和森林，不为全打卡硬走。', tone: 'warning' },
    entries: [
      { id: 'd4-1', time: '06:45—07:50', desc: '起床、早餐、检查身份证／雨衣／薄外套／水' },
      { id: 'd4-2', time: '08:00—09:00', desc: '目标入园：池北区游客集散中心', isSight: true, detailsList: [
        { label: '预约', value: '计划 8 月 18 日游览，8 月 11 日 17:55 进入官方平台，18:00 抢票。' },
        { label: '渠道', value: '“长白山”官方微信公众号、小程序或“长白山一机游”，实名分时预约。' },
        { label: '策略', value: '入园后先看景区调度，主峰开放时优先天池，不在山下小景点停留过久。' },
      ], badges: [{ text: '提前7天18:00', type: 'red' }, { text: '天气敏感', type: 'gold' }] },
      { id: 'd4-3', time: '09:10—10:40', desc: '天池主峰（若开放）', body: '山顶风大、温度变化快，雨衣优于雨伞，服从现场安全调度。' },
      { id: 'd4-4', time: '10:40—13:00', desc: '长白瀑布、聚龙温泉群', isSight: true, detailsList: [
        { label: '取舍', value: '主峰关闭时将这里作为当天核心体验；步行节奏放慢，给孩子补水和能量。' },
        { label: '装备', value: '防滑运动鞋、薄防风外套、一次性雨衣和少量高能量零食。' },
      ], badges: [{ text: '北坡必留', type: 'green' }] },
      { id: 'd4-5', time: '13:00—14:30', desc: '简餐、绿渊潭', body: '绿渊潭后判断孩子体力，地下森林是最后一个可放弃项目。' },
      { id: 'd4-6', time: '14:30—16:00', desc: '地下森林（视体力决定）' },
      { id: 'd4-7', time: '16:00—20:30', desc: '返程、晚餐、回酒店泡温泉', body: '晚上不再去镇上长距离逛街。' },
    ],
  },
  {
    id: 'd5', month: '8月', dayDate: '19', weekday: '周三', city: '二道白河', title: '天气备用日：小镇亲子＋温泉',
    hotel: '二道白河／池北区酒店', weatherCity: '长白山', weatherDate: '2026-08-19', weatherFallback: WEATHER_REFERENCE.长白山,
    decision: { title: 'D4 关闭时只走官方回流', body: '前一晚查看长白山官方公告和 D5 票源；取得合法官方票源且天气改善，再决定二次入园。不通过个人或非官方“代抢”，不临时搬去西坡。', tone: 'info' },
    entries: [
      { id: 'd5-1', time: '08:30—09:30', desc: '自然醒、早餐、观察天气与景区公告' },
      { id: 'd5-2', time: '10:00—11:30', desc: 'D4 顺利游览：美人松公园、小镇散步', body: '轻松散步，不再安排远距离转场；给孩子保留自由活动和拍照时间。' },
      { id: 'd5-3', time: '13:30—16:30', desc: '午休、温泉或酒店亲子活动', body: '温泉是否包含、儿童年龄/身高限制和开放时段，按酒店当天规则执行。' },
      { id: 'd5-4', time: '全天备用', desc: 'D4 主峰关闭：二次入园候选或继续休整', body: '即使两天都看不到天池，瀑布、温泉群、森林和火山地貌体验仍然成立。' },
      { id: 'd5-5', time: '17:30—19:00', desc: '朝鲜族风味或东北菜，整理次日行李' },
    ],
  },
  {
    id: 'd6', month: '8月', dayDate: '20', weekday: '周四', city: '长白山 → 沈阳', title: '高铁转场：下午入住，晚上只逛中街',
    flight: 'G3554 长白山 12:23 → 沈阳北 14:25（参考）', hotel: '沈阳中街—故宫区域家庭房', weatherCity: '沈阳', weatherDate: '2026-08-20', weatherFallback: WEATHER_REFERENCE.沈阳,
    entries: [
      { id: 'd6-1', time: '08:00—10:15', desc: '早餐、整理行李、退房' },
      { id: 'd6-2', time: '10:30—12:00', desc: '前往长白山站，安检、候车、简餐', body: '优先长白山站直达沈阳北的上午至中午班次，不为早到安排清晨过早起床。' },
      { id: 'd6-3', time: '12:23参考', desc: 'G3554 长白山站出发', body: '当前参考历时约 2 小时；车次、时间和座位最终以 12306 为准。' },
      { id: 'd6-4', time: '14:25参考', desc: '抵达沈阳北站，前往中街酒店', body: '沈阳北站到酒店预留打车和入住时间，行李安顿好后再出门。' },
      { id: 'd6-5', time: '18:00—20:00', desc: '中街晚餐和散步', body: '可尝老边饺子、沈阳鸡架或东北菜；孩子疲劳就只用餐回酒店。' },
    ],
  },
  {
    id: 'd7', month: '8月', dayDate: '21', weekday: '周五', city: '沈阳', title: '沈阳故宫＋张学良旧居',
    hotel: '沈阳中街—故宫区域家庭房', weatherCity: '沈阳', weatherDate: '2026-08-21', weatherFallback: WEATHER_REFERENCE.沈阳,
    entries: [
      { id: 'd7-1', time: '07:30—08:15', desc: '早餐，携带预约证件原件出发' },
      { id: 'd7-2', time: '08:30—11:30', desc: '沈阳故宫', isSight: true, detailsList: [
        { label: '预约', value: '分时实名预约，预约使用的证件原件入馆；目标 08:30 附近上午场。' },
        { label: '亲子', value: '观察大政殿与十王亭，比较沈阳故宫和北京故宫的差异。' },
        { label: '讲法', value: '用努尔哈赤、皇太极和清初历史讲建筑故事，不让孩子一次接收过多政治史。' },
      ], badges: [{ text: '分时预约', type: 'red' }, { text: '凭原件入馆' }] },
      { id: 'd7-3', time: '11:40—13:20', desc: '午餐＋休息', body: '两个场馆距离不远，也不要立刻连续参观，先坐下吃饭和休息。' },
      { id: 'd7-4', time: '14:00—16:30', desc: '张学良旧居', isSight: true, detailsList: [
        { label: '重点', value: '大青楼、小青楼、中式与西式建筑差异、张学良和近代沈阳的人物故事。' },
        { label: '购票', value: '以场馆官方或明示授权平台显示的 8 月 21 日场次为准。' },
      ], badges: [{ text: '14:00左右', type: 'green' }, { text: '亲子观察' }] },
      { id: 'd7-5', time: '16:30以后', desc: '体力判断：金融博物馆／回酒店／中街散步', body: '状态好再看金融博物馆；已经疲劳就回酒店。高温或大雨时减少户外步行。' },
    ],
  },
  {
    id: 'd8', month: '8月', dayDate: '22', weekday: '周六', city: '沈阳', title: '中国工业博物馆＋老北市',
    hotel: '沈阳中街—故宫区域家庭房', weatherCity: '沈阳', weatherDate: '2026-08-22', weatherFallback: WEATHER_REFERENCE.沈阳,
    decision: { title: '高温或下雨：红梅文创园直接取消', body: '中国工业博物馆为主任务，红梅文创园不是必游。天气差或孩子累时改为酒店午休、商场活动或辽宁省博物馆重点展厅。', tone: 'success' },
    entries: [
      { id: 'd8-1', time: '07:45—08:50', desc: '早餐，打车前往铁西区' },
      { id: 'd8-2', time: '09:00—12:00', desc: '中国工业博物馆', isSight: true, detailsList: [
        { label: '重点', value: '大型机床、铸造设备、老工业厂房和工厂生产场景复原。' },
        { label: '亲子任务', value: '找出全馆最大机器、最喜欢的工业产品，并猜一猜不同机器的用途。' },
        { label: '票务', value: '免费，现场扫码登记；开放时间和入馆要求以官方渠道当天信息为准。' },
      ], badges: [{ text: '沈阳特色', type: 'gold' }, { text: '室内主任务', type: 'green' }] },
      { id: 'd8-3', time: '12:10—13:30', desc: '铁西区午餐', body: '避免立刻返回中街，给孩子一段坐下休息时间。' },
      { id: 'd8-4', time: '14:00—15:30', desc: '红梅文创园（可选）', body: '适合看旧厂房改造、拍照和喝饮料休息；高温、下雨或孩子疲劳时取消。' },
      { id: 'd8-5', time: '16:00—18:00', desc: '回酒店午休、整理行李' },
      { id: 'd8-6', time: '18:30—20:30', desc: '老北市夜游、晚餐', body: '看老建筑和民俗街区，吃小吃或看非遗/街头表演，控制在两小时以内。' },
    ],
  },
  {
    id: 'd9', month: '8月', dayDate: '23', weekday: '周日', city: '沈阳 → 南京', title: 'G98/G99 高铁返程',
    flight: 'G98/G99 沈阳北 12:31 → 南京南 19:28（参考）', hotel: '回家', weatherCity: '沈阳', weatherDate: '2026-08-23', weatherFallback: WEATHER_REFERENCE.沈阳,
    entries: [
      { id: 'd9-1', time: '08:00—10:00', desc: '早餐、整理行李、退房', body: '退房后可在酒店大厅短暂休息，补充车上食物，不安排景点。' },
      { id: 'd9-2', time: '10:40—12:00', desc: '前往沈阳北站，安检、候车、午餐' },
      { id: 'd9-3', time: '12:31参考', desc: 'G98/G99 从沈阳北出发', body: 'G98 是途经沈阳北的列车，不是从沈阳北始发，建议至少提前 70 分钟抵达。途中可能显示为 G99，不需要换车。' },
      { id: 'd9-4', time: '19:28参考', desc: '抵达南京南站，回家', body: '车上准备零食和简单活动，晚间抵达后不再安排额外行程。' },
    ],
  },
]

const RESERVATIONS: ReservationItem[] = [
  { id: 'r1', date: '8月14日 · 已出票', title: 'Z366', detail: '南京站 → 哈尔滨西站 · 软卧', channel: '铁路12306', action: '已预订成功；出发前核对乘车人、铺位和南京站进站信息', tone: 'confirmed', status: '已预订', icon: 'train' },
  { id: 'r2', date: '8月17日 · 已出票', title: 'D552', detail: '哈尔滨站 → 长白山站', channel: '铁路12306', action: '已预订成功；核对上车站、座位、检票口和酒店接站', tone: 'confirmed', status: '已预订', icon: 'train' },
  { id: 'r3', date: '8月6日 · 16:30', title: 'G3554', detail: '长白山站 → 沈阳北站', channel: '铁路12306', action: '首选直达，记录1—2个相邻备选班次', tone: 'soon', status: '待抢票', icon: 'train' },
  { id: 'r4', date: '8月9日 · 08:00起', title: '哈工大入校预约', detail: '8月16日校园和航天馆', channel: '哈工大官方微信公众号', action: '预约1位成人＋另外3名同行者', tone: 'soon', status: '待预约', icon: 'school' },
  { id: 'r5', date: '8月9日 · 09:00', title: 'G98/G99', detail: '沈阳北站 → 南京南站', channel: '铁路12306', action: '优先二等座相邻席位，确认途经车次', tone: 'soon', status: '待抢票', icon: 'train' },
  { id: 'r6', date: '8月11日 · 18:00', title: '长白山北景区', detail: '8月18日 08:00—09:00目标入园', channel: '长白山官方小程序', action: '17:55进入，18:00抢票；无票关注官方回流', tone: 'weather', status: '天气备用', icon: 'mountain' },
]

const HOTELS: HotelData[] = [
  { dayId: 'd0', night: 'D0 宿火车', name: 'Z366 软卧包厢', desc: '车票已预订；南京站 16:58 出发，次日 14:51 抵达哈尔滨西。' },
  { dayId: 'd1', night: 'D1—D2 宿哈尔滨', name: '中央大街—圣索菲亚教堂之间', desc: '家庭房或两张 1.35 米以上床的双床房；退房后确认行李可寄存至 13:30。' },
  { dayId: 'd3', night: 'D3—D5 宿二道白河', name: '池北区游客集散中心附近', desc: '确认长白山站晚间接站、早餐时间、洗衣和温泉规则；连续住 3 晚不搬酒店。' },
  { dayId: 'd6', night: 'D6—D8 宿沈阳', name: '中街—沈阳故宫—青年大街北段', desc: '方便故宫、帅府和中街，也方便 D9 前往沈阳北站；D9 退房后可短暂寄存行李。' },
]

const TIPS = [
  '天气：哈尔滨、长白山和沈阳的具体天气以出发前 1 天及当天官方预报为准；长白山天池以景区调度为准。',
  '穿衣：短袖＋薄长袖＋轻薄防风外套，长白山另带一次性雨衣和防滑运动鞋。',
  '证件：4 人身份证原件、12306 订单、哈工大预约、长白山预约、沈阳场馆订单在两个成人手机中各保存一份。',
  '车票：Z366、D552 已预订，出发前核对订单；G3554、G98 仍按节点抢票，只以 12306 成功订单和当天车站信息为准。',
  '亲子：每天保留休息窗口；地下森林、红梅文创园和额外场馆都是可放弃项目，不为全打卡硬走。',
  '长白山：两成人各背轻便背包，孩子只带水杯和薄外套；山顶不建议撑雨伞。',
  '饮食：东北菜分量大，每顿少点一些；晚到二道白河的当天提前和酒店确认简餐。',
  '核验：景区开放、门票、车次、接站和天气敏感项目，出发前一天再次通过官方渠道确认。',
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

function ReservationRail({ items }: { items: ReservationItem[] }) {
  return (
    <div className={styles.reservationRail}>
      {items.map(item => (
        <article key={item.id} className={`${styles.reservationCard} ${styles[`reservation-${item.tone}`]}`}>
          <div className={styles.reservationHead}>
            <span className={styles.reservationIcon}><Icon name={item.icon} size={18} /></span>
            <span className={styles.reservationMeta}><span className={styles.reservationDate}>{item.date}</span><span className={styles.reservationStatus}>{item.status}</span></span>
          </div>
          <h3 className={styles.reservationTitle}>{item.title}</h3>
          <p className={styles.reservationDetail}>{item.detail}</p>
          <div className={styles.reservationChannel}>{item.channel}</div>
          <p className={styles.reservationAction}><Icon name={item.tone === 'weather' ? 'alert' : item.tone === 'confirmed' ? 'check' : 'calendar'} size={14} />{item.action}</p>
        </article>
      ))}
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
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'd1-3': true, 'd2-2': true, 'd4-2': true })
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherState>>({})
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
          <h1 className={styles.heroTitle}>2026 东北亲子避暑 10 日</h1>
          <p className={styles.heroSub}>8.14—8.23 · 2 大 2 小 · 南京出发 · 白山松水间</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><strong>10</strong><span>天</span></div>
            <div className={styles.heroStat}><strong>3</strong><span>个目的地</span></div>
            <div className={styles.heroStat}><strong>4</strong><span>位同行者</span></div>
            <div className={styles.heroStat}><strong>1</strong><span>天气备用日</span></div>
          </div>
          <div className={styles.heroRoute} aria-label="行程路线">
            {['南京', '哈尔滨', '长白山', '沈阳', '南京'].map((stop, index) => (
              <span key={`${stop}-${index}`} className={styles.heroRouteStop}><span className={styles.heroRouteDot}>{index === 0 ? '出发' : index === 4 ? '回家' : index + 1}</span><strong>{stop}</strong>{index < 4 && <span className={styles.heroRouteLine} />}</span>
            ))}
          </div>
          <div className={styles.heroAlert}><Icon name="alert" size={17} /><span>Z366、D552 已预订；长白山天池受天气和景区调度影响，景区门票及返程车票仍按节点确认。</span></div>
          <div className={styles.heroChips}>
            {DAYS.map(day => <button key={day.id} className={`${styles.heroChip} ${activeDay === day.id ? styles.heroChipActive : ''}`} onClick={() => scrollToDay(day.id)}>{day.emoji} {day.label}</button>)}
          </div>
        </section>

        <section className={`${styles.section} ${styles.overviewSection}`} id="prep" ref={setSectionRef('prep')}>
          <div className={styles.sectionKicker}>01 · 先看全程</div>
          <div className={styles.sectionHeadingRow}><div><h2 className={styles.sectionTitle}>路线与关键节点</h2><p className={styles.sectionLead}>把需要提前确认的事情放在每天行程之前，旅途中只看当天卡片就够了。</p></div><div className={styles.sourceNote}><Icon name="calendar" size={14} />所有时间均为北京时间</div></div>
          <ReservationRail items={RESERVATIONS} />
          <div className={styles.overviewGrid}>
            <div className={styles.panel}><div className={styles.panelTitle}><Icon name="hotel" size={17} />住宿分段</div><div className={styles.hotelList}>{HOTELS.map(hotel => <HotelCard key={hotel.dayId} hotel={hotel} />)}</div></div>
            <div className={styles.panel}><div className={styles.panelTitle}><Icon name="route" size={17} />全程规则</div><ul className={styles.ruleList}><li><Icon name="check" size={15} />车次参考不等于最终票面，以 12306 订单为准。</li><li><Icon name="check" size={15} />长白山到站是长白山站，不是长白山西站。</li><li><Icon name="check" size={15} />天气敏感项目提前留出备用日，不临时跨区换坡。</li><li><Icon name="check" size={15} />两个孩子的体力优先于全景点打卡。</li></ul></div>
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
                <WeatherCard city={day.weatherCity} state={weather} />
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
          <div className={styles.sectionKicker}>12 · 最后检查</div><h2 className={styles.sectionTitle}>出发前与旅途中的小规则</h2><ul className={styles.tipsList}>{TIPS.map((tip, index) => <li key={index}><span className={styles.tipsIndex}>{String(index + 1).padStart(2, '0')}</span><span>{tip}</span></li>)}</ul>
        </section>

        <footer className={styles.footer}><span className={styles.footerSeal}>北</span><p>东北亲子避暑十日 · 2026年暑期</p><small>天气、车次和景区开放信息以出发前官方核验为准</small></footer>
      </main>

      <nav className={`${styles.pillNav} ${prepActive ? styles.pillNavPrep : ''}`} ref={pillsRef} aria-label="十日行程导航">
        <button className={`${styles.pill} ${prepActive ? styles.active : ''}`} onClick={() => scrollToDay('prep')}><Icon name="route" size={15} />总览</button>
        {DAYS.map(day => <button key={day.id} className={`${styles.pill} ${activeDay === day.id ? styles.active : ''}`} onClick={() => scrollToDay(day.id)}>{day.emoji} {day.label}</button>)}
      </nav>
    </>
  )
}
