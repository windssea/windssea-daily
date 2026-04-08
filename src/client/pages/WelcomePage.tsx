import { useMemo } from 'react'
import styles from './WelcomePage.module.css'

interface Props {
  onEnter: () => void
  onShanxiTrip: () => void
  onHuangshanTrip: () => void
}

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

function WelcomePage({ onEnter, onShanxiTrip, onHuangshanTrip }: Props) {
  const greeting = useGreeting()
  const dateLabel = useDateLabel()

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <div className={styles.shell}>
        <div className={styles.greeting}>
          <p className={styles.dateLine}>{dateLabel}</p>
          <h1 className={styles.greetTitle}>{greeting}</h1>
          <p className={styles.greetSub}>windssea 的日常</p>
        </div>

        <div className={styles.grid}>
          <button
            className={`${styles.tile} ${styles.tileFeatured}`}
            onClick={onEnter}
            aria-label="打开今日待办"
          >
            <span className={styles.tileIcon}>📝</span>
            <div>
              <p className={styles.tileLabel}>今日待办</p>
              <p className={styles.tileDesc}>Daily Tasks</p>
            </div>
          </button>

          <button
            className={`${styles.tile} ${styles.tileSecondary}`}
            onClick={onShanxiTrip}
            aria-label="查看山西旅游"
          >
            <span className={styles.tileIcon}>🏔️</span>
            <div>
              <p className={styles.tileLabel}>山西旅游</p>
              <p className={styles.tileDesc}>Shanxi Trip</p>
            </div>
          </button>
        </div>

        <button
          className={`${styles.tile} ${styles.tileWide}`}
          onClick={onHuangshanTrip}
          aria-label="查看黄山旅游"
        >
          <span className={styles.tileIcon}>🌲</span>
          <div className={styles.tileContent}>
            <p className={styles.tileLabel}>黄山旅游</p>
            <p className={styles.tileDesc}>Huangshan Trip</p>
          </div>
          <span className={styles.tileArrow}>›</span>
        </button>

        <div className={styles.indicator}>
          <div className={styles.indicatorBar} />
        </div>
      </div>
    </div>
  )
}

export default WelcomePage
