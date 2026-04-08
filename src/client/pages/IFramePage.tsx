import styles from './IFramePage.module.css'

interface Props {
  title: string
  src: string
  onBack: () => void
}

function IFramePage({ title, src, onBack }: Props) {
  return (
    <div className={styles.page}>
      <button onClick={onBack} className={styles.backBtn} aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <iframe
        className={styles.iframe}
        src={src}
        title={title}
        loading="lazy"
        allow="geolocation"
      />
    </div>
  )
}

export default IFramePage
