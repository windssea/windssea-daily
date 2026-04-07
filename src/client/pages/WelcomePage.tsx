import { useEffect, useState } from 'react'
import styles from './WelcomePage.module.css'

interface Props {
  onEnter: () => void
  onShanxiTrip: () => void
}

function getTodayLabel() {
  const d = new Date()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekDays[d.getDay()]}`
}

function WelcomePage({ onEnter, onShanxiTrip }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>
      <div className={styles.paper}>
        <div className={styles.topRule} />

        <div className={styles.body}>
          <p className={styles.dateLine}>{getTodayLabel()}</p>
          <h1 className={styles.title}>windssea<br />的日常</h1>
          <p className={styles.tagline}>今天也要好好的。</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={onEnter}>
            打开待办
          </button>
          <a
            className={styles.linkBtn}
            href="https://trip.nanopanda.site/"
            target="_blank"
            rel="noreferrer"
          >
            黄山旅游 ↗
          </a>
          <button className={styles.linkBtn} onClick={onShanxiTrip}>
            山西旅游 ↗
          </button>
        </div>

        <div className={styles.bottomRule} />
      </div>
    </div>
  )
}

export default WelcomePage
