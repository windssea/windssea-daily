import { useMemo } from 'react'
import styles from './WelcomePage.module.css'

interface Props {
  onEnter: () => void
  onShanxiTrip: () => void
  onQuzhouTrip: () => void
  onHuangshanTrip: () => void
  onTravelMap: () => void
}

/* ── SVG Icons (Thinner strokes for elegance) ── */

function IconChecklist({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

function IconMountain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l4 8 5-5 5 9H2L8 3z" />
    </svg>
  )
}

function IconTrees({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14l3-3.19a1 1 0 000-1.4L16 5" />
      <path d="M21 21v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1" />
      <path d="M12 3L8 9h8l-4-6z" />
      <path d="M12 9v8" />
    </svg>
  )
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconMap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconBamboo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M12 7c-2-1-4-1-5 1" />
      <path d="M12 12c2-1 4-1 5 1" />
      <path d="M12 17c-2-1-4-1-5 1" />
      <path d="M12 7h0.01M12 12h0.01M12 17h0.01" />
    </svg>
  )
}

/* ── Hooks ──────────────────────────────────────────────── */

function useGreeting() {
  return useMemo(() => {
    const h = new Date().getHours()
    if (h < 5) return '深夜好'
    if (h < 12) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  }, [])
}

function useDateLabel() {
  return useMemo(() => {
    const d = new Date()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${days[d.getDay()]}  ·  ${months[d.getMonth()]} ${d.getDate()}`
  }, [])
}

/* ── Component ──────────────────────────────────────────── */

function WelcomePage({ onEnter, onShanxiTrip, onQuzhouTrip, onHuangshanTrip, onTravelMap }: Props) {
  const greeting = useGreeting()
  const dateLabel = useDateLabel()

  return (
    <div className={styles.page}>
      <div className={styles.shell}>

        {/* ── Magazine-style Header ── */}
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.dateLine}>{dateLabel}</p>
            <h1 className={styles.greetTitle}>{greeting}，<br />windssea</h1>
          </div>
          <div className={styles.avatar}>W</div>
        </header>

        {/* ── Daily Tasks (Quiet Luxury White Card) ── */}
        <section className={styles.section} aria-label="今日待办">
          <button
            className={`${styles.card} ${styles.widgetDaily}`}
            onClick={onEnter}
            aria-label="打开今日待办"
          >
            <div className={styles.widgetHeader}>
              <div className={styles.iconWrap}>
                <IconChecklist className={styles.iconElement} />
              </div>
              <div className={styles.widgetBadge}>FOCUS</div>
            </div>

            <div className={styles.widgetBody}>
              <h2 className={styles.widgetTitle}>今日待办</h2>
              <p className={styles.widgetSub}>整理思绪，推进最重要的事情。</p>
            </div>

            <IconArrowRight className={styles.widgetArrow} />
          </button>
        </section>

        {/* ── Trips Grid (Stacked Rows) ── */}
        <section className={styles.section} aria-label="旅行计划">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Plannings</h2>
          </div>

          <div className={styles.tripList}>
            <button
              className={`${styles.card} ${styles.tripCard}`}
              onClick={onShanxiTrip}
              aria-label="查看山西旅游"
            >
              <div className={styles.tripHeader}>
                <div className={`${styles.iconWrap} ${styles.iconWrapOrange}`}>
                  <IconMountain className={styles.iconElement} />
                </div>
              </div>
              <div className={styles.tripBody}>
                <p className={styles.tripLabel}>山西探索</p>
                <p className={styles.tripDesc}>6 DAYS EXPLORE</p>
              </div>
              <IconArrowRight className={styles.tripArrow} />
            </button>

            <button
              className={`${styles.card} ${styles.tripCard}`}
              onClick={onQuzhouTrip}
              aria-label="查看衢州旅游"
            >
              <div className={styles.tripHeader}>
                <div className={`${styles.iconWrap} ${styles.iconWrapGreen}`}>
                  <IconBamboo className={styles.iconElement} />
                </div>
              </div>
              <div className={styles.tripBody}>
                <p className={styles.tripLabel}>衢州山行</p>
                <p className={styles.tripDesc}>5 DAYS JOURNEY</p>
              </div>
              <IconArrowRight className={styles.tripArrow} />
            </button>

            <button
              className={`${styles.card} ${styles.tripCard}`}
              onClick={onHuangshanTrip}
              aria-label="查看黄山旅游"
            >
              <div className={styles.tripHeader}>
                <div className={`${styles.iconWrap} ${styles.iconWrapGreen}`}>
                  <IconTrees className={styles.iconElement} />
                </div>
              </div>
              <div className={styles.tripBody}>
                <p className={styles.tripLabel}>黄山之旅</p>
                <p className={styles.tripDesc}>4 DAYS ESCAPE</p>
              </div>
              <IconArrowRight className={styles.tripArrow} />
            </button>

            <button
              className={`${styles.card} ${styles.tripCard}`}
              onClick={onTravelMap}
              aria-label="查看旅行地图"
            >
              <div className={styles.tripHeader}>
                <div className={`${styles.iconWrap}`}>
                  <IconMap className={styles.iconElement} />
                </div>
              </div>
              <div className={styles.tripBody}>
                <p className={styles.tripLabel}>旅行地图</p>
                <p className={styles.tripDesc}>22 CITIES VISITED</p>
              </div>
              <IconArrowRight className={styles.tripArrow} />
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

export default WelcomePage
