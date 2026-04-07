import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './ShanxiTripPage.module.css'

interface Props {
  onBack: () => void
}

/* ── Static Data ───────────────────────────── */

const DAYS = [
  { id: 'd0', label: '出发', emoji: '🚂' },
  { id: 'd1', label: '大同', emoji: '🏯' },
  { id: 'd2', label: '云冈', emoji: '🗿' },
  { id: 'd3', label: '边塞', emoji: '⚔️' },
  { id: 'd4', label: '晋祠', emoji: '🏛️' },
  { id: 'd5', label: '返程', emoji: '🏠' },
]

interface TimelineEntry {
  time: string
  desc: string
  detail?: string
}

interface DayData {
  id: string
  number: string
  date: string
  title: string
  distance?: string
  hotel?: string
  entries: TimelineEntry[]
  warnings?: string[]
}

interface Reservation {
  name: string
  channel: string
  advance: string
  price: string
  free?: boolean
}

const RESERVATIONS: Reservation[] = [
  { name: '云冈石窟', channel: '官方公众号', advance: '1天', price: '成人120元；儿童免票/半价' },
  { name: '悬空寺', channel: '官方平台', advance: '7天', price: '首道15元；登临100元' },
  { name: '应县木塔', channel: '官方公众号', advance: '1天', price: '成人50元；儿童免票/半价' },
  { name: '雁门关', channel: '官方公众号', advance: '1天', price: '成人90元；电瓶车10元' },
  { name: '忻州古城', channel: '免预约', advance: '-', price: '免费', free: true },
  { name: '晋祠博物馆', channel: '官方公众号', advance: '1天', price: '成人80元；儿童免票/半价' },
  { name: '山西博物院', channel: '官方公众号', advance: '3天', price: '免费(7:00放票)' },
  { name: '大同市博物馆', channel: '免预约', advance: '-', price: '免费', free: true },
]

const ITINERARY: DayData[] = [
  {
    id: 'd0',
    number: 'Day 0',
    date: '4月30日',
    title: '夜间出发',
    entries: [
      { time: '20:54', desc: '南京站乘坐Z196次软卧，4人包厢', detail: '次日07:47抵达太原站' },
      { time: '', desc: '行李分游玩随身包与夜间休息包' },
      { time: '', desc: '保证孩子正常入睡' },
      { time: '', desc: '提前备好提车证件' },
    ],
  },
  {
    id: 'd1',
    number: 'Day 1',
    date: '5月1日',
    title: '太原→大同·古城休闲',
    distance: '280km',
    hotel: '大同古城永泰门附近四星亲子酒店',
    entries: [
      { time: '07:47–08:30', desc: '太原站抵达·提车+早餐' },
      { time: '08:30–11:30', desc: '自驾前往大同', detail: '二广高速，约3小时' },
      { time: '11:30–12:30', desc: '办理入住·市区午餐', detail: '什锦铜火锅、烧麦、刀削面' },
      { time: '12:30–14:30', desc: '酒店午休' },
      { time: '14:40–16:40', desc: '大同古城墙游览', detail: '明城墙7.24km，四人自行车30元/h，永泰门瓮城、乾楼、雁塔' },
      { time: '16:50–17:50', desc: '大同市博物馆', detail: '恐龙化石展厅，免费' },
      { time: '17:50+', desc: '晚餐', detail: '黄米凉糕、家常面食' },
    ],
  },
  {
    id: 'd2',
    number: 'Day 2',
    date: '5月2日',
    title: '云冈石窟→悬空寺·世界遗产',
    distance: '160km',
    hotel: '应县县城中心连锁酒店',
    entries: [
      { time: '08:30–11:30', desc: '云冈石窟深度游览', detail: '45窟5.1万尊造像，第20窟露天大佛，成人120元' },
      { time: '11:30–13:00', desc: '返回大同午餐', detail: '过油肉、莜面鱼鱼' },
      { time: '13:00–14:30', desc: '自驾前往悬空寺', detail: '80km，1.5h' },
      { time: '14:30–16:00', desc: '悬空寺游览', detail: '远观为主，全球十大奇险建筑，首道15元' },
      { time: '16:00–17:00', desc: '自驾前往应县', detail: '70km，1h' },
      { time: '17:00+', desc: '应县晚餐', detail: '凉粉、炖土鸡、黄米糕' },
    ],
    warnings: [
      '悬空寺登临票限量且儿童不建议体验',
      '云冈石窟讲解50元/次，建议预约',
    ],
  },
  {
    id: 'd3',
    number: 'Day 3',
    date: '5月3日',
    title: '应县木塔→雁门关→忻州古城·边塞文化',
    distance: '270km',
    hotel: '太原南站周边高端酒店',
    entries: [
      { time: '08:05–09:30', desc: '应县木塔', detail: '辽代，世界最高纯木结构塔，无铁钉，成人50元' },
      { time: '09:30–10:30', desc: '自驾前往雁门关北门', detail: '70km，1h，务必走北门' },
      { time: '10:30–12:30', desc: '雁门关精华游览', detail: '5A，天下九塞之首，杨家将，门票90元+电瓶车10元' },
      { time: '12:30–14:10', desc: '代县午餐', detail: '定襄蒸肉、莜面栲栳栳' },
      { time: '14:10–15:00', desc: '自驾前往忻州古城', detail: '50km，50min' },
      { time: '15:00–16:30', desc: '忻州古城休闲游览', detail: '免费，南北大街、秀容书院、非遗手作' },
      { time: '16:30–17:50', desc: '自驾前往太原', detail: '100km，1.2h' },
      { time: '17:50+', desc: '钟楼街晚餐', detail: '认一力蒸饺、老鼠窟元宵、六味斋酱肉' },
    ],
    warnings: [
      '雁门关务必走北门，避免南门长距离上坡',
      '忻州古城是晋北最适合亲子慢游的古城',
    ],
  },
  {
    id: 'd4',
    number: 'Day 4',
    date: '5月4日',
    title: '晋祠→山西博物院·历史文化收官',
    distance: '50km',
    hotel: '续住太原南站酒店',
    entries: [
      { time: '08:30–09:10', desc: '自驾前往晋祠', detail: '25km，40min' },
      { time: '09:10–11:40', desc: '晋祠博物馆', detail: '最古老祠庙园林，5A，圣母殿、鱼沼飞梁、周柏，成人80元' },
      { time: '11:40–12:55', desc: '晋祠周边午餐' },
      { time: '12:55–14:55', desc: '酒店午休' },
      { time: '14:55–15:35', desc: '自驾前往山西博物院', detail: '25km，40min' },
      { time: '15:35–18:05', desc: '山西博物院', detail: '国家一级，晋侯鸟尊、雁鱼铜灯，免费需预约' },
      { time: '18:05+', desc: '市区晚餐，收拾行李' },
    ],
    warnings: [
      '山西博物院需提前3天预约，每日7:00放票',
    ],
  },
  {
    id: 'd5',
    number: 'Day 5',
    date: '5月5日',
    title: '太原→南京·轻松返程',
    entries: [
      { time: '08:30', desc: '酒店早餐·退房' },
      { time: '09:00–10:30', desc: '上午休闲', detail: '汾河景区 或 山西省科技馆，二选一' },
      { time: '10:30–11:30', desc: '前往太原南站·还车' },
      { time: '11:30–12:10', desc: '高铁站午餐·候车' },
      { time: '12:27', desc: '乘坐G467高铁返程', detail: '5h48min' },
      { time: '18:15', desc: '抵达南京南站' },
    ],
  },
]

const TIPS = [
  '6周岁以下/1.2米以下景区免票，6-18周岁半价，携带户口本',
  '山西高速隧道多，限速80km/h；停车费10-20元/次',
  '每日保证午休，人文与游乐景点交替',
  '景点尽量8:30前或15:00后入园',
  '五月晋北早晚温差大，携带薄外套',
  '每日行程预留30分钟弹性时间',
]

/* ── Component ─────────────────────────────── */

function ShanxiTripPage({ onBack }: Props) {
  const [visible, setVisible] = useState(false)
  const [activeDay, setActiveDay] = useState('d0')
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isScrolling = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    isScrolling.current = true
    setActiveDay(dayId)
    const el = sectionRefs.current[dayId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setTimeout(() => {
      isScrolling.current = false
    }, 800)
  }, [])

  // Track which day section is visible on scroll
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
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    )

    for (const day of DAYS) {
      const el = sectionRefs.current[day.id]
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  const setSectionRef = useCallback(
    (dayId: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[dayId] = el
    },
    []
  )

  return (
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>
      {/* Sticky Header */}
      <header className={styles.header}>
        <button onClick={onBack} className={styles.backBtn} aria-label="返回">
          ←
        </button>
        <span className={styles.headerTitle}>山西五日自驾攻略</span>
      </header>

      {/* Scrollable Content */}
      <div>
        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.heroLabel}>五一假期 · 亲子自驾</p>
          <h1 className={styles.heroTitle}>山西五日亲子自驾深度旅游攻略</h1>
          <p className={styles.heroSubtitle}>
            4月30日晚出发 - 5月5日返宁 · 五一假期
          </p>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>5天</span>
              <span className={styles.statLabel}>行程</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>760km</span>
              <span className={styles.statLabel}>自驾</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>太原</span>
              <span className={styles.statLabel}>取还车</span>
            </div>
          </div>
        </div>

        {/* Top Day Nav */}
        <div className={styles.dayNavWrap}>
          <div className={styles.dayNav}>
            {DAYS.map((d) => (
              <button
                key={d.id}
                className={`${styles.dayTab} ${activeDay === d.id ? styles.active : ''}`}
                onClick={() => scrollToDay(d.id)}
              >
                <span className={styles.dayTabEmoji}>{d.emoji}</span>
                <span className={styles.dayTabLabel}>D{d.id[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reservations */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>预约清单</h2>
          <ul className={styles.reservationList}>
            {RESERVATIONS.map((r) => (
              <li key={r.name} className={styles.reservationItem}>
                <div className={styles.reservationName}>{r.name}</div>
                <div className={styles.reservationMeta}>
                  <span>{r.channel}</span>
                  <span>提前{r.advance}</span>
                  {r.free ? (
                    <span className={styles.reservationFree}>{r.price}</span>
                  ) : (
                    <span className={styles.reservationTag}>{r.price}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.divider} />

        {/* Day-by-day Itinerary */}
        {ITINERARY.map((day) => (
          <div
            key={day.id}
            id={day.id}
            ref={setSectionRef(day.id)}
            className={styles.daySection}
          >
            <div className={styles.dayHeader}>
              <div className={styles.dayHeaderRow}>
                <span className={styles.dayNumber}>{day.number}</span>
                <span className={styles.dayDate}>{day.date}</span>
              </div>
              <h3 className={styles.dayTitle}>{day.title}</h3>
              {(day.distance || day.hotel) && (
                <div className={styles.dayMeta}>
                  {day.distance && (
                    <span className={styles.dayMetaItem}>
                      <span className={styles.dayMetaIcon}>🚗</span>
                      {day.distance}
                    </span>
                  )}
                  {day.hotel && (
                    <span className={styles.dayMetaItem}>
                      <span className={styles.dayMetaIcon}>🏨</span>
                      {day.hotel}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.timeline}>
              {day.entries.map((entry, i) => (
                <div key={i} className={styles.timelineEntry}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    {entry.time && (
                      <div className={styles.timelineTime}>{entry.time}</div>
                    )}
                    <div className={styles.timelineDesc}>{entry.desc}</div>
                    {entry.detail && (
                      <div className={styles.timelineDetail}>{entry.detail}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {day.warnings?.map((w, i) => (
              <div key={i} className={styles.warning}>
                <span className={styles.warningIcon}>⚠️</span> {w}
              </div>
            ))}
          </div>
        ))}

        <div className={styles.divider} />

        {/* Tips */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>出行贴士</h2>
          <ol className={styles.tipsList}>
            {TIPS.map((tip, i) => (
              <li key={i} className={styles.tipsItem}>
                <span className={styles.tipsNumber}>{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerMsg}>一路平安，旅途愉快 🧳</p>
          <p className={styles.footerSub}>山西 · 2025 五一假期</p>
        </div>

        {/* Bottom padding for floating nav */}
        <div className={styles.contentPadding} />
      </div>

      {/* Bottom Floating Nav */}
      <div className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          {DAYS.map((d) => (
            <button
              key={d.id}
              className={`${styles.bottomNavItem} ${activeDay === d.id ? styles.active : ''}`}
              onClick={() => scrollToDay(d.id)}
            >
              <span className={styles.bottomNavItemEmoji}>{d.emoji}</span>
              <span className={styles.bottomNavItemLabel}>D{d.id[1]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShanxiTripPage
