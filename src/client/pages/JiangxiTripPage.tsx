import { useCallback, useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import styles from './JiangxiTripPage.module.css'
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
  drive?: string
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
  car: <Ic><path d="M5 17h14M6 17v-5l2.5-5h7L18 12v5" /><circle cx="8.5" cy="17" r="1.5" /><circle cx="15.5" cy="17" r="1.5" /></Ic>,
  hotel: <Ic><path d="M3 21h18M5 21V4h14v17M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-5h4v5" /></Ic>,
  mapPin: <Ic><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></Ic>,
  sun: <Ic><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Ic>,
  partlyCloudy: <Ic><circle cx="15" cy="8" r="3" /><path d="M11.5 5.5 10 7M15 2v2M21 8h-2M18 14H7a4 4 0 1 1 .7-7.9A5 5 0 0 1 18 10a3 3 0 0 1 0 4Z" /></Ic>,
  cloudy: <Ic><path d="M18 18H7a5 5 0 1 1 1.5-9.8A6 6 0 0 1 20 11a3.5 3.5 0 0 1-2 7Z" /></Ic>,
  rain: <Ic><path d="M18 15H7a5 5 0 1 1 1.5-9.8A6 6 0 0 1 20 8a3.5 3.5 0 0 1-2 7Z" /><path d="m8 18-1 3M12 18l-1 3M16 18l-1 3" /></Ic>,
  windy: <Ic><path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h16a2.5 2.5 0 1 1-2.5 2.5M3 16h8" /></Ic>,
  mountain: <Ic><path d="m3 20 7-11 3 5 3-4 5 10" /><path d="m13 9 2-3 2 3" /></Ic>,
  waterfall: <Ic><path d="M8 2h8M9 2v9M12 2v12M15 2v9" /><path d="M5 22c2.5-1.5 3.5-4 3.5-7M19 22c-2.5-1.5-3.5-4-3.5-7" /><path d="M3 22h18" /></Ic>,
  temple: <Ic><path d="M12 3 7 8h10L12 3Z" /><path d="M6 8v3h12V8" /><path d="M8 11v10M16 11v10" /><path d="M4 21h16" /></Ic>,
  porcelain: <Ic><path d="M10 2h4" /><path d="M10 2c0 2.5-1 3.5-2.2 4.8C6.6 8.2 6 10 6 12.5 6 16.6 8.6 20 12 20s6-3.4 6-7.5c0-2.5-.6-4.3-1.8-5.7C15 5.5 14 4.5 14 2" /><path d="M8.5 22h7" /></Ic>,
  museum: <Ic><path d="m3 9 9-5 9 5M5 9v10M9 9v10M15 9v10M19 9v10M3 19h18" /></Ic>,
  ticket: <Ic><path d="M4 6h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8a2 2 0 0 1 2-2Z" /><path d="M13 6v12" /></Ic>,
  calendar: <Ic><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></Ic>,
  alert: <Ic><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></Ic>,
  check: <Ic><path d="m5 12 4 4L19 6" /></Ic>,
  route: <Ic><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a5 5 0 0 0 5-5V8" /></Ic>,
  info: <Ic><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ic>,
  camera: <Ic><path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></Ic>,
  home: <Ic><path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" /></Ic>,
}

function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  return <span className={`${styles.icon} ${className}`} style={{ width: size, height: size }}>{ICONS[name] || ICONS.info}</span>
}

function weatherTextToIcon(text: string): string {
  if (!text) return 'cloudy'
  if (text.includes('晴')) return 'sun'
  if (text.includes('多云') || text.includes('少云')) return 'partlyCloudy'
  if (text.includes('雨')) return 'rain'
  if (text.includes('雪')) return 'cloudy'
  if (text.includes('风') || text.includes('沙') || text.includes('雾') || text.includes('霾')) return 'windy'
  return 'cloudy'
}

const WEATHER_REFERENCE: Record<string, WeatherFallback> = {
  九江: { icon: 'rain', temp: '11月参考 8—16°C', text: '昼夜温差大，前期降雨决定瀑布水量', wind: '以出发前预报为准', advice: '秀峰石阶雨后湿滑，防滑鞋必备；索道状态 11/14 晚再确认' },
  南昌: { icon: 'partlyCloudy', temp: '11月参考 10—18°C', text: '温和，但江边夜风明显', wind: '以当日预报为准', advice: '滕王阁看蓝调与夜景时备防风外套' },
  上饶: { icon: 'partlyCloudy', temp: '11月参考 9—17°C', text: '山区昼夜温差大', wind: '以当日预报为准', advice: '夜观亮灯长时间户外，保暖外套必备；持续大雨影响步行与拍照' },
  景德镇: { icon: 'partlyCloudy', temp: '11月参考 9—17°C', text: '秋高气爽，昼夜温差明显', wind: '以当日预报为准', advice: '轻便羽绒或防风外套随身；陶溪川夜逛注意保暖' },
}

const DAYS = [
  { id: 'd1', label: '南京—庐山', emoji: '🚗' },
  { id: 'd2', label: '秀峰·滕王阁', emoji: '🌊' },
  { id: 'd3', label: '望仙谷', emoji: '🏮' },
  { id: 'd4', label: '景德镇', emoji: '🏺' },
  { id: 'd5', label: '返程', emoji: '🏠' },
]

const ITINERARY: DayData[] = [
  {
    id: 'd1', month: '11月', dayDate: '14', weekday: '周六', city: '南京 → 庐山市', title: '长途自驾：抵达即休整，不上山',
    drive: '约500km · 5.5—6h（含休息）', hotel: '全季酒店（庐山秀峰景区铜锣湾广场店）',
    weatherCity: '九江', weatherLabel: '庐山市', weatherDate: '2026-11-14', weatherFallback: WEATHER_REFERENCE.九江,
    decision: {
      title: '今天只赶路，第一导航目的地是全季酒店',
      body: '不要导航牯岭镇、庐山索道上站或三叠泉——本次庐山目标只有秀峰瀑布。抵达后不去秀峰；加满油/充好电再休息，晚上检查次日秀峰天气与降雨：前一两天有雨对瀑布水量是利好，但山路更湿滑。',
      tone: 'warning',
    },
    entries: [
      { id: 'd1-1', time: '06:15', desc: '起床、最后检查行李' },
      { id: 'd1-2', time: '06:30', desc: '南京出发，全程以高速为主', body: '出发前过一遍：油量/电量、胎压、玻璃水、ETC、手机支架、充电线；约500km按5.5—6小时（含休息）预留。' },
      { id: 'd1-3', time: '约09:00', desc: '高速服务区休息15—20分钟', body: '单人驾驶每2—2.5小时休息一次，即使不困也下车走动10分钟。' },
      { id: 'd1-4', time: '约12:30—13:00', desc: '抵达庐山市' },
      { id: 'd1-5', time: '13:00—14:00', desc: '午餐', body: '江西家常菜、鄱阳湖鱼类（正规餐厅、明码标价）、石耳类、竹笋农家小炒；第一晚不为网红餐厅在市区绕路。' },
      { id: 'd1-6', time: '14:00以后', desc: '入住全季酒店、休整' },
      { id: 'd1-7', time: '15:30—17:00', desc: '可选：庐山市区轻松散步', body: '不安排强体力景点，以恢复长途驾驶精力为主。' },
      { id: 'd1-8', time: '18:00', desc: '晚餐（清淡为主）' },
      { id: 'd1-9', time: '21:30前', desc: '建议休息', body: '晚上检查次日秀峰天气、降雨与索道公告，为全程最有诗意的一天养精蓄锐。' },
    ],
  },
  {
    id: 'd2', month: '11月', dayDate: '15', weekday: '周日', city: '庐山秀峰 → 南昌', title: '上午李白瀑布，傍晚滕王阁落霞',
    drive: '秀峰 → 南昌 约120—130km · 1.5—2h', hotel: '南昌滕王阁八一馆江景亚朵见野酒店',
    weatherCity: '九江', weatherLabel: '庐山 → 南昌', weatherDate: '2026-11-15', weatherFallback: WEATHER_REFERENCE.九江,
    decision: {
      title: '按天气选游法，11月天黑早',
      body: '天气干燥、步道状况好：步行游山麓 → 索道上 → 重点观瀑 → 步行下；前一天下雨、路面湿滑：索道往返优先，不为"必须徒步"增加滑倒风险。11月中旬天黑比夏季早，滕王阁 16:00 前后入园，别按暑期 17:30 才进景区。',
      tone: 'info',
    },
    entries: [
      { id: 'd2-1', time: '07:00', desc: '酒店早餐' },
      { id: 'd2-2', time: '07:30', desc: '退房，行李全部放车上' },
      { id: 'd2-3', time: '07:40左右', desc: '驾车前往秀峰' },
      { id: 'd2-4', time: '08:00—11:30', desc: '庐山秀峰：山麓步道 + 索道观瀑', isSight: true, detailsList: [
        { label: '主题', value: '李白《望庐山瀑布》"飞流直下三千尺"对应庐山南麓秀峰瀑布一带，不是三叠泉；所有时间围绕瀑布与香炉峰方向景观。' },
        { label: '游法', value: '步行游山麓 → 索道上 → 重点观瀑 → 步行下；雨后湿滑改索道往返。游览 3—3.5 小时足够，不追求走完所有小景点。' },
        { label: '开放', value: '景区约 08:00—17:30；索道约 09:00 开机、16:00 停止售票，11月实际运行出发前必须再次确认。' },
      ], badges: [{ text: '单票约56—62元', type: 'red' }, { text: '票制 11/10 前后核实' }, { text: '必带身份证·防滑鞋' }] },
      { id: 'd2-5', time: '11:45—12:45', desc: '午餐（秀峰附近）' },
      { id: 'd2-6', time: '13:00', desc: '驾车前往南昌', body: '约120—130km，1.5—2小时，目标 15:00 前后到酒店。' },
      { id: 'd2-7', time: '15:00—15:30', desc: '入住亚朵见野酒店', body: '先停车，当晚尽量不再挪车；安静高楼层优先，价差合理再选江景房。' },
      { id: 'd2-8', time: '15:40左右', desc: '步行/打车前往滕王阁' },
      { id: 'd2-9', time: '16:00—18:20', desc: '滕王阁：主阁登高 + 赣江落霞', isSight: true, detailsList: [
        { label: '动线', value: '主阁内部 → 登高看赣江 → 王勃/滕王阁文化展示 → 约 17:20 等日落 → 17:40—18:20 看蓝调、拍外观。' },
        { label: '开放', value: '约 08:00—22:00，21:00 停止售票/入园；成人票约 50 元，夜游/演出/数字馆/游船均另收费，不必全买齐。' },
      ], badges: [{ text: '成人票约50元', type: 'red' }, { text: '周日建议提前购' }] },
      { id: 'd2-10', time: '18:20—19:20', desc: '晚餐', body: '南昌拌粉、瓦罐汤、藜蒿炒腊肉、辣椒炒肉、白糖糕；滕王阁/大士院及酒店周边步行可达，点菜说"少辣/微辣"。' },
      { id: 'd2-11', time: '19:30以后', desc: '回江边看滕王阁夜景/城市灯光' },
      { id: 'd2-12', time: '20:30左右', desc: '返回酒店' },
    ],
  },
  {
    id: 'd3', month: '11月', dayDate: '16', weekday: '周一', city: '南昌 → 望仙谷', title: '望仙谷：从白天峡谷到蓝调夜景',
    drive: '约195km · 约3h', hotel: '望仙谷仙宿（景区内）',
    weatherCity: '上饶', weatherLabel: '望仙谷', weatherDate: '2026-11-16', weatherFallback: WEATHER_REFERENCE.上饶,
    decision: {
      title: '17:10—18:30 是全天最重要的观景窗口',
      body: '11月中旬日落约 17:10，最漂亮的是"夕阳前 → 蓝调 → 建筑亮灯"的过渡。16:00 后提前向核心悬崖建筑观景区移动，不要 17 点后才找位置；不为赶某场演出打乱节奏。夜景结束直接回仙宿，夜间不再开山路——这正是住景区内的原因。',
      tone: 'success',
    },
    entries: [
      { id: 'd3-1', time: '07:30—08:30', desc: '早餐、整理行李' },
      { id: 'd3-2', time: '09:00', desc: '南昌出发', body: '约195km，按3小时预留；后半段为地方/山区道路：不超速、不抢弯，天黑前尽量不再开山路。' },
      { id: 'd3-3', time: '约10:30', desc: '途中服务区短休' },
      { id: 'd3-4', time: '约12:00—12:30', desc: '抵达望仙谷' },
      { id: 'd3-5', time: '12:30—13:30', desc: '午餐 / 办理入住 / 寄存行李', body: '优先按仙宿预订成功后官方入住指引导航，不要凭地图猜测往景区深处开。到达顺序：指定接待点 → 确认停车点 → 入住/寄存 → 确认门票权益 → 早餐地点时间 → 次日凭房卡/门票再入园规则。' },
      { id: 'd3-6', time: '14:00—16:00', desc: '白天峡谷：溪流、瀑布与街巷', isSight: true, detailsList: [
        { label: '重点', value: '峡谷、溪流、瀑布、传统街巷、夯土建筑、桥梁与山谷视角；这段时间不要一直停在商店里。' },
        { label: '票务', value: '开放约 09:30—23:00，约 20:30 停止售票、21:00 停止入园；成人票约 140 元，先确认仙宿套餐是否已含 2 张两日门票。' },
      ], badges: [{ text: '成人票约140元', type: 'red' }, { text: '先订房再买票' }] },
      { id: 'd3-7', time: '16:00—16:40', desc: '提前占据观景位', body: '望仙谷最漂亮的不是纯黑后的夜景，而是夕阳前 → 蓝调 → 建筑亮灯的过渡时段。' },
      { id: 'd3-8', time: '17:10—18:30', desc: '蓝调时刻：悬崖建筑亮灯', isSight: true, detailsList: [
        { label: '主体', value: '悬崖建筑、山谷层次、天空仍带蓝色时的灯光、桥梁与街巷亮灯；远景与近景各拍一轮。' },
        { label: '提示', value: '这是整趟旅行最值得留足时间拍照的一段；11月中旬日落约 17:10，具体以当天为准。' },
      ], badges: [{ text: '全程重点', type: 'gold' }, { text: '拍照黄金段' }] },
      { id: 'd3-9', time: '18:30—20:30', desc: '景区内晚餐 + 夜游', body: '上饶地方小炒、铅山烫粉、灯盏粿、弋阳年糕类、汤粉热食；11月夜里凉，晚餐安排热食。民俗/互动演出时间每天可能变化，遇上就看。' },
      { id: 'd3-10', time: '20:30—21:00', desc: '返回仙宿', body: '不需要赶着离开景区，也不需要夜间再开车。' },
    ],
  },
  {
    id: 'd4', month: '11月', dayDate: '17', weekday: '周二', city: '望仙谷 → 景德镇', title: '清晨仙谷 + 陶瓷博物馆 + 陶溪川',
    drive: '约130km · 2—2.5h', hotel: '景德镇陶溪川陶阳新村亚朵见野酒店',
    weatherCity: '景德镇', weatherDate: '2026-11-17', weatherFallback: WEATHER_REFERENCE.景德镇,
    decision: {
      title: '博物馆免费，但必须预约 + 实体身份证',
      body: '中国陶瓷博物馆免费但强制实名预约：11月12日起在"畅游景德镇"微信小程序预约 13:30—14:00 附近时段（最长提前5天）。无预约不可入馆；实体身份证是唯一入馆凭证，电子身份证、户口本不能替代刷闸机。11月17日为周二，正常开放。',
      tone: 'warning',
    },
    entries: [
      { id: 'd4-1', time: '07:30', desc: '起床' },
      { id: 'd4-2', time: '08:00', desc: '早餐' },
      { id: 'd4-3', time: '08:20—09:00', desc: '景区内再轻松走一轮', body: '视住宿权益而定；清晨游客少、光线柔、街巷安静，补拍前晚人多时没拍到的角度。' },
      { id: 'd4-4', time: '09:00—09:30', desc: '退房、取车' },
      { id: 'd4-5', time: '09:30', desc: '驾车前往景德镇', body: '约130km，2—2.5小时，地方道路+高速组合，目标 12:00 左右到达。' },
      { id: 'd4-6', time: '12:00—13:00', desc: '午餐（先吃再去酒店）', body: '景德镇冷粉、饺子粑、碱水粑、油条包麻糍、江西小炒。' },
      { id: 'd4-7', time: '13:00左右', desc: '入住/寄存行李（亚朵见野）' },
      { id: 'd4-8', time: '13:30—17:00', desc: '中国陶瓷博物馆', isSight: true, detailsList: [
        { label: '预约', value: '"畅游景德镇"微信小程序实名预约，最长提前5天；11/12 起约 13:30—14:00 时段，实体身份证刷闸机入馆。' },
        { label: '开放', value: '周二至周日 09:00—17:00，16:30 停止进馆，周一闭馆（11/17 周二正常开放）。' },
        { label: '重点', value: '约2.5小时：中国陶瓷发展脉络 → 历代代表瓷 → 明清瓷器 → 近现代陶瓷；不逐件看说明避免超时。' },
      ], badges: [{ text: '免费', type: 'green' }, { text: '强制预约', type: 'red' }, { text: '实体身份证' }] },
      { id: 'd4-9', time: '17:00左右', desc: '回酒店/停车' },
      { id: 'd4-10', time: '17:30—18:30', desc: '陶溪川晚餐' },
      { id: 'd4-11', time: '18:30—21:00', desc: '陶溪川夜逛', isSight: true, detailsList: [
        { label: '视角', value: '博物馆看"历史"，陶溪川看"当代"；红砖厂房看"城市转型"，文创市集看"年轻陶艺"。' },
        { label: '买瓷', value: '第一眼喜欢的不要立刻大量购买：先逛、比价、看工艺、再决定；易碎品让商家加强包装。' },
      ], badges: [{ text: '免费街区', type: 'green' }, { text: '夜逛' }] },
      { id: 'd4-12', time: '21:00左右', desc: '返回亚朵', body: '晚上不吃过辣过油，为第五天长途返程保持状态。' },
    ],
  },
  {
    id: 'd5', month: '11月', dayDate: '18', weekday: '周三', city: '景德镇 → 南京', title: '上午陶阳里御窑，午后从容返程',
    drive: '约430—440km · 5—5.5h', hotel: '返回南京',
    weatherCity: '景德镇', weatherLabel: '景德镇 → 南京', weatherDate: '2026-11-18', weatherFallback: WEATHER_REFERENCE.景德镇,
    decision: {
      title: '返程不加远郊，保留御窑即可',
      body: 'D5 不再增加婺源、瑶里、三清山等远郊景区，避免破坏"不绕路、五天四晚"的节奏。陶阳里重点放在御窑厂遗址、御窑博物馆建筑和老里弄；12:30 左右出发，中途休息一次 20 分钟，预计 18:00—19:00 进入南京，遇晚高峰可能更晚。',
      tone: 'info',
    },
    entries: [
      { id: 'd5-1', time: '07:30', desc: '起床' },
      { id: 'd5-2', time: '08:00', desc: '早餐' },
      { id: 'd5-3', time: '08:30', desc: '退房、行李放车上' },
      { id: 'd5-4', time: '09:00—11:15', desc: '陶阳里 / 御窑', isSight: true, detailsList: [
        { label: '重点', value: '御窑厂遗址 → 御窑博物馆建筑 → 老里弄 → 老城陶瓷文化空间；约2小时，不把时间消耗在长时间购物上。' },
        { label: '开放', value: '旅游区约 08:30—22:00，21:30 停止入园；御窑博物馆周一闭馆，11/18 周三不受影响；成人票约 53 元。' },
        { label: '停车', value: '以当天高德/百度实时停车场状态为准；大客流时官方推荐陶阳里3号停车场、博物馆1号停车场或外围停车场+接驳。' },
      ], badges: [{ text: '成人票约53元', type: 'red' }, { text: '按天气再购票' }] },
      { id: 'd5-5', time: '11:15', desc: '离开陶阳里' },
      { id: 'd5-6', time: '11:30—12:20', desc: '午餐', body: '不吃太撑，下午还有5小时以上驾驶。' },
      { id: 'd5-7', time: '12:30左右', desc: '出发返南京', body: '约430—440km，纯驾驶5—5.5小时，中途服务区休息一次20分钟。' },
      { id: 'd5-8', time: '18:00—19:00', desc: '预计进入南京，回家', body: '遇晚高峰实际到家可能更晚；行程圆满结束。' },
    ],
  },
]

const RESERVATIONS: ReservationItem[] = [
  { id: 'r1', date: '11/16 入住 · 最先处理', title: '望仙谷仙宿（景区内）', detail: '景区内房型数量有限，与周边住宿体验差异很大', channel: '官方渠道 · 仙宿订单', action: '优先锁房；订房时截图保存房型、是否含 2 张两日门票、早餐、停车接驳与取消规则', state: 'upcoming', status: '优先锁房', window: { from: '2026-08-31', to: '2026-11-13' }, icon: 'hotel' },
  { id: 'r2', date: '11/17 参观 · 免费', title: '中国陶瓷博物馆', detail: '免费但强制实名预约，无预约不可入馆', channel: '"畅游景德镇"微信小程序', action: '11/12 起预约 13:30—14:00 时段；实体身份证为唯一入馆凭证，预约页面截图保存', state: 'upcoming', status: '待预约', window: { from: '2026-11-12', to: '2026-11-12' }, icon: 'museum' },
  { id: 'r3', date: '11/15 · 上午', title: '庐山秀峰', detail: '单票约 56—62 元；2026 年另有"一票通"制度，是否可单独购票待核实', channel: '"一机游庐山"小程序', action: '11/10 前后核实票制与索道公告后购买；不要误买核心景区组合票', state: 'upcoming', status: '待核验', window: { from: '2026-11-10', to: '2026-11-14' }, icon: 'waterfall' },
  { id: 'r4', date: '11/15 · 周日傍晚', title: '滕王阁', detail: '成人票约 50 元；夜游/演出/游船均为另收费项目', channel: '滕王阁景区官方票务渠道', action: '11/12—11/14 提前购买，按 16:00 入园安排；出发前确认亮灯与演出时间', state: 'upcoming', status: '待购票', window: { from: '2026-11-12', to: '2026-11-14' }, icon: 'temple' },
  { id: 'r5', date: '11/16 · 全天', title: '望仙谷门票', detail: '成人票约 140 元；仙宿套餐可能已含 2 张两日有效门票', channel: '望仙谷景区官方渠道', action: '先确认仙宿是否含票，再决定是否单独购买，避免重复购票', state: 'upcoming', status: '待核验', icon: 'ticket' },
  { id: 'r6', date: '11/18 · 上午', title: '陶阳里 / 御窑', detail: '成人票约 53 元；御窑博物馆周三正常开放', channel: '陶阳里官方购票渠道', action: '11/16—11/17 按实时天气再买；具体票种与展览联票以 11 月购票页面为准', state: 'upcoming', status: '待购票', window: { from: '2026-11-16', to: '2026-11-17' }, icon: 'porcelain' },
  { id: 'r7', date: '11/14 · 11/15 · 11/17', title: '全季 + 两晚亚朵', detail: '庐山市全季 / 南昌亚朵见野 / 景德镇亚朵见野', channel: '各酒店官方渠道 / App', action: '均订可免费取消房型；确认停车政策，望仙谷优先级最高', state: 'upcoming', status: '待预订', window: { from: '2026-08-31', to: '2026-11-12' }, icon: 'hotel' },
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
  { dayId: 'd1', night: '11/14 宿庐山市', name: '全季酒店（秀峰景区铜锣湾广场店）', desc: '山南方向不绕路，第二天去秀峰方便；优先含早餐+免费取消+免费停车，不必追求景观房。' },
  { dayId: 'd2', night: '11/15 宿南昌', name: '滕王阁八一馆江景亚朵见野酒店', desc: '近滕王阁和老城；到店先停车，当晚步行/打车去滕王阁，不再挪车；安静高楼层优先。' },
  { dayId: 'd3', night: '11/16 宿望仙谷', name: '望仙谷仙宿（景区内）', desc: '住宿本身即体验：夜游后不开山路，清晨可再拍一轮；订房重点核对含票、早餐与接驳。' },
  { dayId: 'd4', night: '11/17 宿景德镇', name: '陶溪川陶阳新村亚朵见野酒店', desc: '近陶溪川，夜逛步行/短途可达；睡好恢复体力，为 D5 约430km 返程做准备。' },
]

const TIPS = [
  '自驾检查：每天出发前检查油量/电量、胎压、玻璃水、ETC、手机支架与充电线；望仙谷进出有地方道路和山区道路。',
  '服务区节奏：单人驾驶每 2—2.5 小时休息一次，即使不困也下车走动 10 分钟。',
  '山路安全：望仙谷不安排夜间驶离景区，弯道提前减速，不跟大巴车太近，雨天增大跟车距离。',
  '南昌停车：抵达亚朵后停车，步行/打车游滕王阁，当晚不再挪车。',
  '景德镇停车：博物馆当天开车，陶溪川住附近尽量步行，陶阳里退房后直接开车去、结束直接出城。',
  '11月穿衣：长袖打底 + 抓绒/卫衣 + 轻薄羽绒或防风外套；望仙谷夜观亮灯保暖外套必备。',
  '雨具：每人一把折叠伞或轻薄雨衣；秀峰前期有雨瀑布更好看，但石阶也更滑。',
  '秀峰变量：关键不是"晴不晴"，而是出发前一周有没有有效降雨——11/10 前后查近 7 日降雨，长期无雨时降低"飞流直下"的预期。',
  '证件：陶瓷博物馆只认实体身份证刷闸机，电子身份证/户口本无效；预约成功页面截图保存。',
  '买瓷器：先逛、比价、看工艺再决定，第一眼喜欢不要立刻大量买；易碎品让商家加强包装。',
  '口味：江西菜偏辣，点菜明确说"少辣/微辣"；D5 午饭不吃太撑，下午还有 5 小时以上驾驶。',
  '核验：开放时间、票价、索道与演出均为 2026-08 整理，出发前以官方渠道为准（一机游庐山 / 各景区官微 / 畅游景德镇）。',
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

export default function JiangxiTripPage({ onBack }: Props) {
  const [visible, setVisible] = useState(false)
  const [activeDay, setActiveDay] = useState('prep')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'd2-4': true, 'd3-8': true, 'd4-8': true })
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
  const heroStops = ['南京', '庐山秀峰', '南昌', '望仙谷', '景德镇', '南京']

  return (
    <>
      <button onClick={onBack} className={styles.backBtn} aria-label="返回"><Icon name="arrowLeft" size={21} /></button>
      <main className={`${styles.page} ${visible ? styles.visible : ''}`}>
        <section className={styles.hero}>
          <div className={styles.heroEyebrow}><span>WINDSSEA DAILY</span><span>SELF-DRIVE ROUTE · 2026</span></div>
          <h1 className={styles.heroTitle}>2026 江西五天四晚自驾</h1>
          <p className={styles.heroSub}>11.14—11.18 · 南京出发 · 庐山秀峰 · 南昌 · 望仙谷 · 景德镇</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><strong>5</strong><span>天</span></div>
            <div className={styles.heroStat}><strong>6</strong><span>大核心</span></div>
            <div className={styles.heroStat}><strong>1500</strong><span>公里（约）</span></div>
            <div className={styles.heroStat}><strong>4</strong><span>城</span></div>
          </div>
          <div className={styles.heroRoute} aria-label="行程路线">
            {heroStops.map((stop, index) => (
              <span key={`${stop}-${index}`} className={styles.heroRouteStop}><span className={styles.heroRouteDot}>{index === 0 ? '出发' : index === heroStops.length - 1 ? '回家' : index}</span><strong>{stop}</strong>{index < heroStops.length - 1 && <span className={styles.heroRouteLine} />}</span>
            ))}
          </div>
          <div className={styles.heroAlert}><Icon name="alert" size={17} /><span>望仙谷仙宿与陶瓷博物馆预约优先处理：仙宿景区内房型有限；陶瓷博物馆免费但强制实名预约，且只认实体身份证。秀峰 2026 票制与索道 11/10 前后通过"一机游庐山"最终核实。</span></div>
          <div className={styles.heroChips}>
            {DAYS.map(day => <button key={day.id} className={`${styles.heroChip} ${activeDay === day.id ? styles.heroChipActive : ''}`} onClick={() => scrollToDay(day.id)}>{day.emoji} {day.label}</button>)}
          </div>
        </section>

        <section className={`${styles.section} ${styles.overviewSection}`} id="prep" ref={setSectionRef('prep')}>
          <div className={styles.sectionKicker}>01 · 先看全程</div>
          <div className={styles.sectionHeadingRow}><div><h2 className={styles.sectionTitle}>路线与关键节点</h2><p className={styles.sectionLead}>每天抓一个重点：D1 赶路休整、D2 诗意双景、D3 全天望仙谷、D4 陶瓷文化、D5 从容返程；需要提前处理的事情放在行程之前。</p></div><div className={styles.sourceNote}><Icon name="calendar" size={14} />票价为 2026-08 参考</div></div>
          <ReservationRail items={RESERVATIONS} today={today} />
          <div className={styles.overviewGrid}>
            <div className={styles.panel}><div className={styles.panelTitle}><Icon name="hotel" size={17} />住宿分段</div><div className={styles.hotelList}>{HOTELS.map(hotel => <HotelCard key={hotel.dayId} hotel={hotel} />)}</div></div>
            <div className={styles.panel}><div className={styles.panelTitle}><Icon name="route" size={17} />全程规则</div><ul className={styles.ruleList}><li><Icon name="check" size={15} />路线闭环：南京 → 庐山市 → 南昌 → 望仙谷 → 景德镇 → 南京，不上牯岭镇、不反复折返。</li><li><Icon name="check" size={15} />秀峰看李白瀑布，不上三叠泉；11/10 前后核实票制与索道。</li><li><Icon name="check" size={15} />望仙谷先订仙宿再决定买票，杜绝"套餐含票又另买"。</li><li><Icon name="check" size={15} />南昌到店即停车，步行/打车游滕王阁，当晚不挪车。</li><li><Icon name="check" size={15} />D5 不加婺源、瑶里、三清山等远郊，12:30 前出发返宁。</li></ul></div>
          </div>
        </section>

        {ITINERARY.map((day, index) => {
          const weather = getWeather(day)
          const hotel = HOTELS.find(item => item.dayId === day.id)
          return (
            <section key={day.id} id={day.id} ref={setSectionRef(day.id)} className={`${styles.section} ${styles.daySection}`}>
              <div className={styles.dayHeader}>
                <div className={styles.dayDateCircle}><span>{day.month}</span><strong>{day.dayDate}</strong><small>{day.weekday}</small></div>
                <div className={styles.dayHeading}><div className={styles.dayCity}>{day.city}</div><h2 className={styles.dayName}>{day.title}</h2><div className={styles.dayMeta}>{day.drive && <span><Icon name="car" size={14} />{day.drive}</span>}{day.hotel && <span><Icon name="hotel" size={14} />{day.hotel}</span>}</div></div>
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
          <div className={styles.sectionKicker}>07 · 出行须知</div><h2 className={styles.sectionTitle}>出发前与旅途中的小规则</h2><ul className={styles.tipsList}>{TIPS.map((tip, index) => <li key={index}><span className={styles.tipsIndex}>{String(index + 1).padStart(2, '0')}</span><span>{tip}</span></li>)}</ul>
        </section>

        <footer className={styles.footer}><span className={styles.footerSeal}>赣</span><p>江西五天四晚自驾 · 2026年11月</p><small>票价与开放信息为 2026-08 整理，出发前以官方渠道核验为准</small></footer>
      </main>

      <nav className={`${styles.pillNav} ${prepActive ? styles.pillNavPrep : ''}`} ref={pillsRef} aria-label="五日行程导航">
        <button className={`${styles.pill} ${prepActive ? styles.active : ''}`} onClick={() => scrollToDay('prep')}><Icon name="route" size={15} />总览</button>
        {DAYS.map(day => <button key={day.id} className={`${styles.pill} ${activeDay === day.id ? styles.active : ''}`} onClick={() => scrollToDay(day.id)}>{day.emoji} {day.label}</button>)}
      </nav>
    </>
  )
}
