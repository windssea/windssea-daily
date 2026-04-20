import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './PinModal.module.css'

interface Props {
  visible: boolean
  onSuccess: (pin: string) => void
  onClose: () => void
}

export function PinModal({ visible, onSuccess, onClose }: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  useEffect(() => {
    if (visible) {
      setDigits(['', '', '', ''])
      setError(false)
      setLoading(false)
      setTimeout(() => inputRefs.current[0]?.focus(), 80)
    }
  }, [visible])

  const submit = useCallback(async (pin: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json() as { success: boolean }
      if (data.success) {
        onSuccess(pin)
      } else {
        setError(true)
        setDigits(['', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      }
    } catch {
      setError(true)
      setDigits(['', '', '', ''])
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setError(false)
    setDigits(prev => {
      const next = [...prev]
      next[index] = digit
      if (digit && index < 3) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
      }
      if (digit && index === 3 && !next.slice(0, 3).includes('')) {
        setTimeout(() => submit(next.join('')), 0)
      }
      return next
    })
  }, [submit])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }, [digits])

  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.lockIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h2 className={styles.title}>输入 PIN 码</h2>
        <p className={styles.sub}>验证身份以查看私密内容</p>
        <div className={`${styles.digits} ${error ? styles.shake : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              className={`${styles.digit} ${digits[i] ? styles.digitFilled : ''} ${error ? styles.digitError : ''}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digits[i]}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              autoComplete="off"
            />
          ))}
        </div>
        {error && <p className={styles.errorMsg}>PIN 码错误，请重试</p>}
        {loading && <p className={styles.loadingMsg}>验证中…</p>}
      </div>
    </div>
  )
}
