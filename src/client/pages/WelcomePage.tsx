import styles from './WelcomePage.module.css'

interface Props {
  onEnter: () => void
}

function WelcomePage({ onEnter }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>📋</div>
        <h1 className={styles.title}>Windssea Daily</h1>
        <p className={styles.subtitle}>记录每天的事，一件一件做完</p>
        <button className={styles.btn} onClick={onEnter}>
          我的待办
        </button>
      </div>
    </div>
  )
}

export default WelcomePage
