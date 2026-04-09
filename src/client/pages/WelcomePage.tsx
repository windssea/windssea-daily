import { useMemo } from 'react'
import styles from './WelcomePage.module.css'

interface Props {
  onEnter: () => void
  onShanxiTrip: () => void
  onHuangshanTrip: () => void
}

/* ── Inline SVG Icon Components ─────────────────────────── */

function IconChecklist({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 8.5l1.5 1.5L11 7" />
      <line x1="13" y1="9" x2="18" y2="9" />
      <path d="M7 13.5l1.5 1.5L11 12" />
      <line x1="13" y1="14" x2="18" y2="14" />
    </svg>
  )
}

function IconMountain({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21l4-10 4 10" />
      <path d="M2 21l6.5-13L15 21" />
      <path d="M13 13l4-8 5 16" />
      <circle cx="18" cy="5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconTrees({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M8 22h8" />
      <path d="M12 3L7 12h10L12 3z" />
      <path d="M12 7L8.5 12h7L12 7z" fill="currentColor" opacity="0.15" />
      <path d="M6 22V14" />
      <path d="M6 8L2.5 14h7L6 8z" />
      <path d="M18 22V13" />
      <path d="M18 7L14.5 13h7L18 7z" />
    </svg>
  )
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l5 6-5 6" />
    </svg>
  )
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

/* ── Hooks ──────────────────────────────────────────────── */

function useGreeting() {
  return useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])
}

function useDateLabel() {
  return useMemo(() => {
    const d = new Date()
    const months = [
      'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
      'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
    ]
    const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
  }, [])
}

function useIsEvening() {
  return useMemo(() => new Date().getHours() >= 18, [])
}

/* ── Component ──────────────────────────────────────────── */

function WelcomePage({ onEnter, onShanxiTrip, onHuangshanTrip }: Props) {
  const greeting = useGreeting()
  const dateLabel = useDateLabel()
  const isEvening = useIsEvening()

  return (
    <div className={styles.page}>
      <div className={styles.ambientGlow} />

      <div className={styles.shell}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.avatar}>
            <span className={styles.avatarLetter}>W</span>
          </div>
          <div className={styles.headerText}>
            <p className={styles.dateLine}>{dateLabel}</p>
            <h1 className={styles.greetTitle}>{greeting}</h1>
          </div>
          <div className={styles.timeIcon} aria-hidden="true">
            {isEvening ? <IconMoon /> : <IconSun />}
          </div>
        </header>

        {/* ── Subtitle ── */}
        <p className={styles.subtitle}>windssea 的日常</p>

        {/* ── Quick Actions ── */}
        <section className={styles.section} aria-label="快捷操作">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>快捷操作</h2>
          </div>

          <div className={styles.grid}>
            <button
              className={`${styles.card} ${styles.cardFeatured}`}
              onClick={onEnter}
              aria-label="打开今日待办"
            >
              <div className={styles.cardIconWrap}>
                <IconChecklist className={styles.cardIcon} />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>今日待办</p>
                <p className={styles.cardDesc}>Daily Tasks</p>
              </div>
              <div className={styles.cardBadge}>TODO</div>
            </button>

            <button
              className={`${styles.card} ${styles.cardSecondary}`}
              onClick={onShanxiTrip}
              aria-label="查看山西旅游"
            >
              <div className={styles.cardIconWrap}>
                <IconMountain className={styles.cardIcon} />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>山西旅游</p>
                <p className={styles.cardDesc}>Shanxi Trip</p>
              </div>
              <IconChevron className={styles.cardChevron} />
            </button>
          </div>
        </section>

        {/* ── Trip Collection ── */}
        <section className={styles.section} aria-label="旅行计划">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>旅行计划</h2>
            <span className={styles.sectionCount}>2 trips</span>
          </div>

          <button
            className={`${styles.card} ${styles.cardWide} ${styles.cardGreen}`}
            onClick={onHuangshanTrip}
            aria-label="查看黄山旅游"
          >
            <div className={styles.cardIconWrap}>
              <IconTrees className={styles.cardIcon} />
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardLabel}>黄山旅游</p>
              <p className={styles.cardDesc}>Huangshan Trip</p>
            </div>
            <IconChevron className={styles.cardChevron} />
          </button>
        </section>

        {/* ── Home Indicator ── */}
        <div className={styles.indicator} aria-hidden="true">
          <div className={styles.indicatorBar} />
        </div>
      </div>
    </div>
  )
}

export default WelcomePage
