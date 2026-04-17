import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './QuzhouTripPage.module.css'
import { api } from '../lib/api'

interface Props {
  onBack: () => void
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

/* ── SVG Icon System ─────────────────────────── */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Ic({ children, ...extra }: { children: React.ReactNode } & React.SVGProps<SVGSVGElement>) {
  return <svg {...iconProps} {...extra}>{children}</svg>
}

const ICONS: Record<string, React.ReactNode> = {
  arrowLeft: <Ic><path d="M19 12H5M12 19l-7-7 7-7"/></Ic>,
  car: (
    <Ic>
      <path d="M5 17h14"/><path d="M6 17V12l2.5-5h7L18 12v5"/>
      <circle cx="8.5" cy="17" r="1.5"/><circle cx="15.5" cy="17" r="1.5"/>
    </Ic>
  ),
  hotel: (
    <Ic>
      <path d="M3 21h18"/><rect x="5" y="3" width="14" height="18" rx="1"/>
      <path d="M10 21v-5h4v5"/><path d="M9 8h0.01M15 8h0.01M9 12h0.01M15 12h0.01"/>
    </Ic>
  ),
  ticket: (
    <Ic>
      <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v1a1 1 0 01-1 1 1 1 0 00-1 1v2a1 1 0 001 1 1 1 0 011 1v1a3 3 0 01-3 3H5a3 3 0 01-3-3v-1a1 1 0 011-1 1 1 0 001-1v-2a1 1 0 00-1-1 1 1 0 01-1-1V9z"/>
      <path d="M13 6v12"/>
    </Ic>
  ),
  mapPin: (
    <Ic>
      <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </Ic>
  ),
  sunny: (
    <Ic>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </Ic>
  ),
  cloudy: <Ic><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></Ic>,
  partlyCloudy: (
    <Ic>
      <path d="M12.5 6.5L11 8l1.5 1.5M14 2v2M21 9h-2"/>
      <circle cx="14" cy="9" r="3"/>
      <path d="M17 15H7a4 4 0 01-.4-7.98A5 5 0 0117 12a3 3 0 010 3z"/>
    </Ic>
  ),
  rainy: (
    <Ic>
      <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25"/>
      <path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2"/>
    </Ic>
  ),
}

function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <span className={`${styles.icon} ${className}`} style={{ width: size, height: size }}>
      {ICONS[name]}
    </span>
  )
}

const stripEmoji = (s: string) => s.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F]+\s*/u, '')

/* ── BambooLeaves: 竹叶飘动 canvas animation ── */
function BambooLeaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const LEAF_COLORS = ['#4a9860', '#3d8850', '#5aac70', '#6ab865', '#409055', '#52a868']
    const PETAL_COLORS = ['rgba(255,182,193,1)', 'rgba(255,158,178,1)', 'rgba(255,200,212,1)', 'rgba(250,172,188,1)', 'rgba(255,220,228,1)']

    interface Particle {
      x: number; y: number
      len: number; wid: number
      rotation: number; rotSpeed: number
      vx: number; vy: number
      color: string
      maxAlpha: number
      born: number; life: number
      type: 'leaf' | 'petal'
    }

    const particles: Particle[] = []
    let lastLeafSpawn = 0
    let lastPetalSpawn = 0

    function spawnLeaf(now: number) {
      const len = 13 + Math.random() * 10
      particles.push({
        x: -10 + Math.random() * (canvas.width + 20),
        y: -len,
        len,
        wid: len * 0.26,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.022,
        vx: -0.5 + Math.random() * 0.7,
        vy: 0.45 + Math.random() * 0.65,
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        maxAlpha: 0.5 + Math.random() * 0.35,
        born: now,
        life: 10000 + Math.random() * 8000,
        type: 'leaf',
      })
    }

    function spawnPetal(now: number) {
      const len = 7 + Math.random() * 5
      particles.push({
        x: -10 + Math.random() * (canvas.width + 20),
        y: -len,
        len,
        wid: len * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.038,
        vx: -1.0 + Math.random() * 1.4,
        vy: 0.3 + Math.random() * 0.45,
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        maxAlpha: 0.55 + Math.random() * 0.28,
        born: now,
        life: 12000 + Math.random() * 9000,
        type: 'petal',
      })
    }

    function drawParticle(p: Particle, alpha: number) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = alpha
      if (p.type === 'leaf') {
        ctx.fillStyle = p.color
        const hl = p.len / 2
        const hw = p.wid / 2
        ctx.beginPath()
        ctx.moveTo(0, -hl)
        ctx.bezierCurveTo(hw, -hl * 0.38, hw, hl * 0.38, 0, hl)
        ctx.bezierCurveTo(-hw, hl * 0.38, -hw, -hl * 0.38, 0, -hl)
        ctx.fill()
        ctx.strokeStyle = 'rgba(20, 65, 30, 0.28)'
        ctx.lineWidth = 0.4
        ctx.beginPath()
        ctx.moveTo(0, -p.len * 0.4)
        ctx.lineTo(0, p.len * 0.4)
        ctx.stroke()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.ellipse(0, 0, p.len / 2, p.wid / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    let raf: number
    function tick(now: number) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (now - lastLeafSpawn > 450 + Math.random() * 500) {
        spawnLeaf(now)
        lastLeafSpawn = now
      }
      if (now - lastPetalSpawn > 680 + Math.random() * 720) {
        spawnPetal(now)
        lastPetalSpawn = now
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        const elapsed = now - p.born
        const t = elapsed / p.life
        if (t >= 1 || p.y > canvas.height + 20) { particles.splice(i, 1); continue }
        const fade = t < 0.12 ? t / 0.12 : t > 0.82 ? (1 - t) / 0.18 : 1
        p.x += p.vx + Math.sin(elapsed * 0.0011 + p.rotation) * (p.type === 'petal' ? 0.5 : 0.35)
        p.y += p.vy
        p.rotation += p.rotSpeed
        drawParticle(p, fade * p.maxAlpha)
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}
    />
  )
}

/* ── MountainScape: 云雾远山 + 三爿石 + 徽派建筑 + 桃树 + 河舟 ── */
function MountainScape() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 200"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <defs>
        <linearGradient id="qzRiver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c2e4f5" stopOpacity="0.92"/>
          <stop offset="55%" stopColor="#a4d2ec" stopOpacity="0.86"/>
          <stop offset="100%" stopColor="#88bfe6" stopOpacity="0.80"/>
        </linearGradient>
        <linearGradient id="qzSkyRefl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4d7e" stopOpacity="0.16"/>
          <stop offset="100%" stopColor="#3080c0" stopOpacity="0.04"/>
        </linearGradient>
      </defs>

      {/* ── Far mountains (hazy blue) ── */}
      <path
        d="M0 132 C35 102, 72 118, 105 100 C138 83, 165 112, 205 97 C244 82, 272 108, 312 94 C352 80, 390 104, 424 90 C450 80, 468 95, 480 108 L480 200 L0 200Z"
        fill="rgba(155, 198, 218, 0.38)"
      />

      {/* ── Mid mountains (muted green) ── */}
      <path
        d="M0 152 C28 130, 58 142, 85 127 C112 112, 138 134, 172 120 C206 106, 232 130, 262 118 C292 106, 318 126, 350 114 C382 102, 420 122, 455 112 C468 108, 476 116, 480 122 L480 200 L0 200Z"
        fill="rgba(68, 136, 98, 0.42)"
      />

      {/* ── Mist bands ── */}
      <ellipse cx="240" cy="140" rx="145" ry="11" fill="rgba(255,255,255,0.30)"/>
      <ellipse cx="75"  cy="150" rx="75"  ry="8"  fill="rgba(255,255,255,0.24)"/>
      <ellipse cx="405" cy="144" rx="88"  ry="9"  fill="rgba(255,255,255,0.26)"/>

      {/* ══════════════════════════════════════════
          徽派建筑 LEFT — 宽院落，白墙青瓦，圆洞门
          ══════════════════════════════════════════ */}
      <g opacity="0.88">
        {/* ─ Back building (visible above front roof) ─ */}
        <rect x="14" y="133" width="130" height="17" fill="#f2f0ec" stroke="none"/>
        <path d="M8 133 Q79 121 150 133" fill="#546872" stroke="none"/>
        <line x1="14" y1="132.5" x2="144" y2="132.5" stroke="#3a4e58" strokeWidth="0.5"/>
        {/* Back 马头墙 L — 2 steps */}
        <path d="M14 133 L14 129 L18 125 L18 129 L22 129 L22 124 L26 120 L26 124 L26 133" fill="#f2f0ec" stroke="#8a9ea8" strokeWidth="0.4"/>
        <path d="M22 124 L26 120 L30 124Z" fill="#546872"/>
        <path d="M18 129 L22 125 L26 129Z" fill="#546872"/>
        {/* Back 马头墙 R — 2 steps */}
        <path d="M144 133 L144 129 L140 125 L140 129 L136 129 L136 124 L132 120 L132 124 L132 133" fill="#f2f0ec" stroke="#8a9ea8" strokeWidth="0.4"/>
        <path d="M136 124 L132 120 L128 124Z" fill="#546872"/>
        <path d="M140 129 L136 125 L132 129Z" fill="#546872"/>

        {/* ─ Main compound wall ─ */}
        <rect x="0" y="148" width="158" height="24" fill="#f7f5f1" stroke="none"/>
        {/* Section divider line */}
        <line x1="82" y1="148" x2="82" y2="172" stroke="rgba(140,158,168,0.20)" strokeWidth="0.8"/>

        {/* 圆洞门 moon gate (left section) */}
        <circle cx="42" cy="162" r="11.5" fill="#e0dbd0" stroke="#96a8b2" strokeWidth="0.9"/>
        <circle cx="42" cy="162" r="9.8"  fill="rgba(30,58,78,0.14)" stroke="none"/>
        <rect x="35" y="171.5" width="14" height="1.2" fill="#c2bba8" stroke="none"/>

        {/* Dark window openings (right section, no lattice) */}
        <rect x="100" y="156" width="18" height="9" rx="0.5" fill="rgba(38,58,72,0.20)" stroke="#96a8b2" strokeWidth="0.35"/>
        <rect x="124" y="156" width="18" height="9" rx="0.5" fill="rgba(38,58,72,0.20)" stroke="#96a8b2" strokeWidth="0.35"/>

        {/* ─ Front roof — two sections ─ */}
        <path d="M-5 148 Q40 135 83 148" fill="#5c6e78" stroke="none"/>
        <line x1="0"  y1="147.5" x2="82" y2="147.5" stroke="#3a4e58" strokeWidth="0.55"/>
        <line x1="-3" y1="149.5" x2="83" y2="149.5" stroke="#7a8e98" strokeWidth="0.28"/>
        <path d="M81 148 Q120 136 163 148" fill="#627c86" stroke="none"/>
        <line x1="82"  y1="147.5" x2="158" y2="147.5" stroke="#3a4e58" strokeWidth="0.55"/>
        <line x1="80"  y1="149.5" x2="160" y2="149.5" stroke="#7a8e98" strokeWidth="0.28"/>

        {/* ─ 马头墙 far-left — 3 steps ─ */}
        <path d="M0 148 L0 143 L5 139 L5 143 L10 143 L10 137 L15 133 L15 137 L20 137 L20 131 L25 127 L25 131 L25 148" fill="#f7f5f1" stroke="#8a9ea8" strokeWidth="0.48"/>
        <path d="M20 131 L25 127 L30 131Z" fill="#5c6e78"/>
        <path d="M10 137 L15 133 L20 137Z" fill="#5c6e78"/>
        <path d="M5  143 L10 139 L15 143Z" fill="#5c6e78"/>

        {/* ─ 马头墙 mid-section divider ─ */}
        <path d="M79 148 L79 143 L82 140 L85 143 L85 148" fill="#f7f5f1" stroke="#8a9ea8" strokeWidth="0.4"/>
        <path d="M79 143 L82 140 L85 143Z" fill="#5c6e78"/>

        {/* ─ 马头墙 far-right — 3 steps ─ */}
        <path d="M158 148 L158 143 L153 139 L153 143 L148 143 L148 137 L143 133 L143 137 L138 137 L138 131 L133 127 L133 131 L133 148" fill="#f7f5f1" stroke="#8a9ea8" strokeWidth="0.48"/>
        <path d="M138 131 L133 127 L128 131Z" fill="#627c86"/>
        <path d="M148 137 L143 133 L138 137Z" fill="#627c86"/>
        <path d="M153 143 L148 139 L143 143Z" fill="#627c86"/>

        {/* ─ Compound outer wall stub ─ */}
        <rect x="0" y="164" width="5" height="8" fill="#eae6dc" stroke="#96a8b2" strokeWidth="0.3"/>
        <path d="M-2 164 Q2 161 6 164" fill="#5c6e78" stroke="none"/>
      </g>

      {/* ══════════════════════════════════════════
          徽派建筑 RIGHT — 宽院落，白墙青瓦，圆洞门
          ══════════════════════════════════════════ */}
      <g opacity="0.86">
        {/* ─ Back building ─ */}
        <rect x="330" y="133" width="130" height="17" fill="#f2f0ec" stroke="none"/>
        <path d="M324 133 Q395 121 466 133" fill="#546872" stroke="none"/>
        <line x1="330" y1="132.5" x2="460" y2="132.5" stroke="#3a4e58" strokeWidth="0.5"/>
        {/* Back 马头墙 L */}
        <path d="M330 133 L330 129 L334 125 L334 129 L338 129 L338 124 L342 120 L342 124 L342 133" fill="#f2f0ec" stroke="#8a9ea8" strokeWidth="0.4"/>
        <path d="M338 124 L342 120 L346 124Z" fill="#546872"/>
        <path d="M334 129 L338 125 L342 129Z" fill="#546872"/>
        {/* Back 马头墙 R */}
        <path d="M460 133 L460 129 L456 125 L456 129 L452 129 L452 124 L448 120 L448 124 L448 133" fill="#f2f0ec" stroke="#8a9ea8" strokeWidth="0.4"/>
        <path d="M452 124 L448 120 L444 124Z" fill="#546872"/>
        <path d="M456 129 L452 125 L448 129Z" fill="#546872"/>

        {/* ─ Main compound wall ─ */}
        <rect x="318" y="148" width="162" height="24" fill="#f7f5f1" stroke="none"/>
        <line x1="398" y1="148" x2="398" y2="172" stroke="rgba(140,158,168,0.20)" strokeWidth="0.8"/>

        {/* Dark window openings (left section) */}
        <rect x="332" y="156" width="18" height="9" rx="0.5" fill="rgba(38,58,72,0.20)" stroke="#96a8b2" strokeWidth="0.35"/>
        <rect x="356" y="156" width="18" height="9" rx="0.5" fill="rgba(38,58,72,0.20)" stroke="#96a8b2" strokeWidth="0.35"/>

        {/* 圆洞门 moon gate (right section) */}
        <circle cx="436" cy="162" r="11.5" fill="#e0dbd0" stroke="#96a8b2" strokeWidth="0.9"/>
        <circle cx="436" cy="162" r="9.8"  fill="rgba(30,58,78,0.14)" stroke="none"/>
        <rect x="429" y="171.5" width="14" height="1.2" fill="#c2bba8" stroke="none"/>

        {/* ─ Front roof — two sections ─ */}
        <path d="M315 148 Q356 136 400 148" fill="#627c86" stroke="none"/>
        <line x1="318" y1="147.5" x2="398" y2="147.5" stroke="#3a4e58" strokeWidth="0.55"/>
        <line x1="316" y1="149.5" x2="399" y2="149.5" stroke="#7a8e98" strokeWidth="0.28"/>
        <path d="M397 148 Q440 135 485 148" fill="#5c6e78" stroke="none"/>
        <line x1="398" y1="147.5" x2="480" y2="147.5" stroke="#3a4e58" strokeWidth="0.55"/>
        <line x1="397" y1="149.5" x2="482" y2="149.5" stroke="#7a8e98" strokeWidth="0.28"/>

        {/* ─ 马头墙 far-left — 3 steps ─ */}
        <path d="M318 148 L318 143 L323 139 L323 143 L328 143 L328 137 L333 133 L333 137 L338 137 L338 131 L343 127 L343 131 L343 148" fill="#f7f5f1" stroke="#8a9ea8" strokeWidth="0.48"/>
        <path d="M338 131 L343 127 L348 131Z" fill="#627c86"/>
        <path d="M328 137 L333 133 L338 137Z" fill="#627c86"/>
        <path d="M323 143 L328 139 L333 143Z" fill="#627c86"/>

        {/* ─ 马头墙 mid-section divider ─ */}
        <path d="M395 148 L395 143 L398 140 L401 143 L401 148" fill="#f7f5f1" stroke="#8a9ea8" strokeWidth="0.4"/>
        <path d="M395 143 L398 140 L401 143Z" fill="#5c6e78"/>

        {/* ─ 马头墙 far-right — 3 steps ─ */}
        <path d="M480 148 L480 143 L475 139 L475 143 L470 143 L470 137 L465 133 L465 137 L460 137 L460 131 L455 127 L455 131 L455 148" fill="#f7f5f1" stroke="#8a9ea8" strokeWidth="0.48"/>
        <path d="M460 131 L455 127 L450 131Z" fill="#5c6e78"/>
        <path d="M470 137 L465 133 L460 137Z" fill="#5c6e78"/>
        <path d="M475 143 L470 139 L465 143Z" fill="#5c6e78"/>

        {/* ─ Compound outer wall stub ─ */}
        <rect x="475" y="164" width="5" height="8" fill="#eae6dc" stroke="#96a8b2" strokeWidth="0.3"/>
        <path d="M474 164 Q478 161 482 164" fill="#5c6e78" stroke="none"/>
      </g>

      {/* ══ 三爿石 ══ */}
      <path
        d="M178 164 C190 150, 202 154, 215 157 C221 154, 229 151, 237 155 C245 151, 257 154, 270 157 C282 154, 296 150, 310 160 L310 176 L178 176Z"
        fill="#1e3c2e"
      />
      {/* 郎峰 */}
      <path d="M199 163 L199 98 L200 74 L202 54 L203 40 L205 32 L207 35 L209 48 L211 70 L213 98 L215 163Z" fill="#1c3828"/>
      <path d="M206 35 L207 35 L209 48 L211 70 L213 98 L213 163 L210 163 L210 98 L208 70 L207 50Z" fill="rgba(110,175,130,0.22)"/>
      <path d="M203 58 Q205 82 203 118" stroke="rgba(12,26,18,0.35)" strokeWidth="0.7" fill="none"/>
      {/* 亚峰 */}
      <path d="M222 163 L222 106 L223 82 L225 64 L226 52 L228 47 L230 51 L232 64 L234 84 L236 106 L238 163Z" fill="#183222"/>
      <path d="M228 49 L230 51 L232 64 L234 84 L236 106 L236 163 L233 163 L233 106 L231 84 L229 65Z" fill="rgba(110,175,130,0.20)"/>
      <path d="M225 68 Q227 98 225 132" stroke="rgba(12,26,18,0.30)" strokeWidth="0.6" fill="none"/>
      {/* 灵峰 */}
      <path d="M245 163 L245 116 L246 93 L248 75 L251 62 L254 58 L257 62 L260 74 L262 92 L264 116 L267 163Z" fill="#142c1e"/>
      <path d="M254 60 L257 62 L260 74 L262 92 L264 116 L267 163 L264 163 L264 116 L261 92 L258 75Z" fill="rgba(110,175,130,0.18)"/>

      {/* Mist veil in front of pillars */}
      <ellipse cx="232" cy="152" rx="62" ry="7"  fill="rgba(255,255,255,0.38)"/>
      <ellipse cx="185" cy="160" rx="38" ry="5"  fill="rgba(255,255,255,0.28)"/>
      <ellipse cx="285" cy="158" rx="42" ry="5"  fill="rgba(255,255,255,0.24)"/>

      {/* ══════════════════════════════════════════
          桃树 LEFT — 桃花盛开 (larger)
          ══════════════════════════════════════════ */}
      <g opacity="0.93">
        {/* Main trunk */}
        <path d="M38 174 Q41 160 37 147" stroke="#6a4828" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {/* Primary branches */}
        <path d="M37 147 Q28 139 22 133" stroke="#6a4828" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M37 147 Q42 140 50 134" stroke="#6a4828" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M37 155 Q25 149 18 144" stroke="#6a4828" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M37 155 Q48 150 55 146" stroke="#6a4828" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* Secondary branches */}
        <path d="M22 133 Q17 128 14 124" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M22 133 Q20 127 18 122" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M50 134 Q54 129 58 125" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M50 134 Q52 128 56 123" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M18 144 Q12 140 8 136" stroke="#6a4828" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
        <path d="M55 146 Q61 142 65 138" stroke="#6a4828" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
        {/* Blossom clusters — branch tips */}
        <circle cx="14" cy="123" r="6.5" fill="rgba(255,172,188,0.82)"/>
        <circle cx="19" cy="120" r="5.5" fill="rgba(255,150,172,0.78)"/>
        <circle cx="10" cy="127" r="5.0" fill="rgba(255,198,212,0.76)"/>
        <circle cx="16" cy="117" r="4.5" fill="rgba(255,162,182,0.72)"/>
        <circle cx="58" cy="124" r="6.5" fill="rgba(255,172,188,0.82)"/>
        <circle cx="53" cy="121" r="5.5" fill="rgba(255,150,172,0.78)"/>
        <circle cx="62" cy="128" r="5.0" fill="rgba(255,198,212,0.76)"/>
        <circle cx="56" cy="117" r="4.5" fill="rgba(255,162,182,0.72)"/>
        {/* Mid branch blossoms */}
        <circle cx="8" cy="135" r="5.5" fill="rgba(255,175,192,0.76)"/>
        <circle cx="13" cy="132" r="4.8" fill="rgba(255,155,176,0.72)"/>
        <circle cx="65" cy="137" r="5.5" fill="rgba(255,175,192,0.76)"/>
        <circle cx="60" cy="134" r="4.8" fill="rgba(255,155,176,0.72)"/>
        {/* Scattered fill blossoms */}
        <circle cx="22" cy="131" r="5.0" fill="rgba(255,182,198,0.70)"/>
        <circle cx="50" cy="132" r="5.0" fill="rgba(255,182,198,0.70)"/>
        <circle cx="35" cy="143" r="4.5" fill="rgba(255,198,212,0.62)"/>
        <circle cx="27" cy="146" r="4.0" fill="rgba(255,215,228,0.58)"/>
        <circle cx="46" cy="147" r="4.0" fill="rgba(255,215,228,0.58)"/>
        <circle cx="18" cy="140" r="3.5" fill="rgba(255,215,228,0.54)"/>
        <circle cx="55" cy="141" r="3.5" fill="rgba(255,215,228,0.54)"/>
      </g>

      {/* ══════════════════════════════════════════
          桃树 RIGHT — 桃花盛开 (larger)
          ══════════════════════════════════════════ */}
      <g opacity="0.91">
        <path d="M442 174 Q439 160 443 147" stroke="#6a4828" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <path d="M443 147 Q452 139 458 133" stroke="#6a4828" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M443 147 Q438 140 430 134" stroke="#6a4828" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M443 155 Q455 149 462 144" stroke="#6a4828" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M443 155 Q432 150 425 146" stroke="#6a4828" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M458 133 Q463 128 466 124" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M458 133 Q460 127 462 122" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M430 134 Q426 129 422 125" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M430 134 Q428 128 424 123" stroke="#6a4828" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        <path d="M462 144 Q468 140 472 136" stroke="#6a4828" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
        <path d="M425 146 Q419 142 415 138" stroke="#6a4828" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
        {/* Blossom clusters */}
        <circle cx="466" cy="123" r="6.5" fill="rgba(255,172,188,0.82)"/>
        <circle cx="461" cy="120" r="5.5" fill="rgba(255,150,172,0.78)"/>
        <circle cx="470" cy="127" r="5.0" fill="rgba(255,198,212,0.76)"/>
        <circle cx="464" cy="117" r="4.5" fill="rgba(255,162,182,0.72)"/>
        <circle cx="422" cy="124" r="6.5" fill="rgba(255,172,188,0.82)"/>
        <circle cx="427" cy="121" r="5.5" fill="rgba(255,150,172,0.78)"/>
        <circle cx="418" cy="128" r="5.0" fill="rgba(255,198,212,0.76)"/>
        <circle cx="424" cy="117" r="4.5" fill="rgba(255,162,182,0.72)"/>
        <circle cx="472" cy="135" r="5.5" fill="rgba(255,175,192,0.76)"/>
        <circle cx="467" cy="132" r="4.8" fill="rgba(255,155,176,0.72)"/>
        <circle cx="415" cy="137" r="5.5" fill="rgba(255,175,192,0.76)"/>
        <circle cx="420" cy="134" r="4.8" fill="rgba(255,155,176,0.72)"/>
        <circle cx="458" cy="131" r="5.0" fill="rgba(255,182,198,0.70)"/>
        <circle cx="430" cy="132" r="5.0" fill="rgba(255,182,198,0.70)"/>
        <circle cx="445" cy="143" r="4.5" fill="rgba(255,198,212,0.62)"/>
        <circle cx="453" cy="146" r="4.0" fill="rgba(255,215,228,0.58)"/>
        <circle cx="434" cy="147" r="4.0" fill="rgba(255,215,228,0.58)"/>
        <circle cx="462" cy="141" r="3.5" fill="rgba(255,215,228,0.54)"/>
        <circle cx="425" cy="142" r="3.5" fill="rgba(255,215,228,0.54)"/>
      </g>

      {/* ── Left bamboo grove ── */}
      <g>
        <line x1="26" y1="200" x2="20" y2="126" stroke="#3e8258" strokeWidth="2.6" strokeLinecap="round"/>
        <ellipse cx="20.5" cy="148" rx="4"   ry="2"   fill="none" stroke="#3e8258" strokeWidth="1"/>
        <ellipse cx="20.5" cy="165" rx="4"   ry="2"   fill="none" stroke="#3e8258" strokeWidth="1"/>
        <ellipse cx="10"   cy="140" rx="13"  ry="3.2" transform="rotate(-34 10 140)"  fill="#50a068" opacity="0.75"/>
        <ellipse cx="28"   cy="134" rx="11"  ry="2.8" transform="rotate(24 28 134)"   fill="#50a068" opacity="0.75"/>
        <ellipse cx="8"    cy="155" rx="9"   ry="2.4" transform="rotate(-27 8 155)"   fill="#469a5e" opacity="0.65"/>
        <line x1="48" y1="200" x2="44" y2="136" stroke="#3a8252" strokeWidth="2.1" strokeLinecap="round"/>
        <ellipse cx="44.5" cy="156" rx="3.5" ry="1.8" fill="none" stroke="#3a8252" strokeWidth="0.9"/>
        <ellipse cx="37"   cy="150" rx="10"  ry="2.6" transform="rotate(-30 37 150)"  fill="#4c9862" opacity="0.70"/>
        <ellipse cx="50"   cy="143" rx="9"   ry="2.2" transform="rotate(19 50 143)"   fill="#4c9862" opacity="0.70"/>
        <line x1="10" y1="200" x2="6"  y2="142" stroke="#326a48" strokeWidth="1.6" strokeLinecap="round" opacity="0.65"/>
        <ellipse cx="2"    cy="156" rx="8"   ry="2"   transform="rotate(-33 2 156)"   fill="#408255" opacity="0.60"/>
        <ellipse cx="10"   cy="148" rx="7"   ry="1.8" transform="rotate(26 10 148)"   fill="#408255" opacity="0.60"/>
      </g>

      {/* ── Right bamboo grove ── */}
      <g>
        <line x1="454" y1="200" x2="460" y2="128" stroke="#3e8258" strokeWidth="2.6" strokeLinecap="round"/>
        <ellipse cx="459.5" cy="150" rx="4"   ry="2"   fill="none" stroke="#3e8258" strokeWidth="1"/>
        <ellipse cx="459.5" cy="168" rx="4"   ry="2"   fill="none" stroke="#3e8258" strokeWidth="1"/>
        <ellipse cx="450"   cy="144" rx="12"  ry="3"   transform="rotate(32 450 144)"  fill="#50a068" opacity="0.73"/>
        <ellipse cx="467"   cy="137" rx="11"  ry="2.7" transform="rotate(-22 467 137)" fill="#50a068" opacity="0.73"/>
        <line x1="470" y1="200" x2="473" y2="138" stroke="#3a8252" strokeWidth="2.1" strokeLinecap="round"/>
        <ellipse cx="472.5" cy="158" rx="3.5" ry="1.8" fill="none" stroke="#3a8252" strokeWidth="0.9"/>
        <ellipse cx="478"   cy="150" rx="9"   ry="2.3" transform="rotate(-26 478 150)" fill="#4c9862" opacity="0.68"/>
        <ellipse cx="465"   cy="146" rx="8"   ry="2"   transform="rotate(21 465 146)"  fill="#4c9862" opacity="0.68"/>
        <line x1="478" y1="200" x2="479" y2="146" stroke="#326a48" strokeWidth="1.6" strokeLinecap="round" opacity="0.62"/>
        <ellipse cx="474"   cy="153" rx="7"   ry="1.8" transform="rotate(30 474 153)"  fill="#408255" opacity="0.58"/>
      </g>

      {/* ── Foreground ridge (riverbank) ── */}
      <path
        d="M0 172 C55 164, 130 171, 200 168 C272 165, 348 170, 408 167 C436 165, 460 169, 480 172 L480 200 L0 200Z"
        fill="#2a5038"
      />

      {/* ══════════════════════════════════════════
          河 RIVER
          ══════════════════════════════════════════ */}
      <path
        d="M0 179 Q80 176, 160 178 Q240 180, 320 178 Q400 176, 480 178 L480 200 L0 200Z"
        fill="url(#qzRiver)"
      />
      {/* Sky reflection in water */}
      <path
        d="M0 179 Q80 176, 160 178 Q240 180, 320 178 Q400 176, 480 178 L480 187 Q400 184, 320 186 Q240 188, 160 186 Q80 184, 0 187Z"
        fill="url(#qzSkyRefl)"
      />
      {/* Shimmer lines */}
      <line x1="18"  y1="184" x2="52"  y2="183" stroke="rgba(255,255,255,0.44)" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="72"  y1="188" x2="118" y2="187" stroke="rgba(255,255,255,0.36)" strokeWidth="0.5" strokeLinecap="round"/>
      <line x1="143" y1="183" x2="176" y2="182" stroke="rgba(255,255,255,0.40)" strokeWidth="0.5" strokeLinecap="round"/>
      <line x1="292" y1="184" x2="336" y2="183" stroke="rgba(255,255,255,0.36)" strokeWidth="0.5" strokeLinecap="round"/>
      <line x1="358" y1="188" x2="404" y2="187" stroke="rgba(255,255,255,0.34)" strokeWidth="0.5" strokeLinecap="round"/>
      <line x1="428" y1="183" x2="464" y2="182" stroke="rgba(255,255,255,0.40)" strokeWidth="0.5" strokeLinecap="round"/>

      {/* ══════════════════════════════════════════
          舟 BOAT (乌篷船)
          ══════════════════════════════════════════ */}
      {/* Reflection shadow */}
      <ellipse cx="230" cy="196" rx="30" ry="2.2" fill="rgba(28,48,38,0.16)"/>
      {/* Hull */}
      <path d="M202 192 C210 188, 250 188, 258 192 C253 197, 207 197, 202 192Z" fill="#3a2010"/>
      <line x1="204" y1="192" x2="256" y2="192" stroke="#2a1408" strokeWidth="0.5"/>
      {/* 乌篷 awning arch */}
      <path d="M212 191 Q222 183, 232 182 Q242 183, 248 191" fill="none" stroke="#241408" strokeWidth="2.6" strokeLinecap="round"/>
      {/* Awning inner shadow */}
      <path d="M214 192 Q222 185, 232 184 Q242 185, 247 192" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinecap="round"/>
      {/* Stern pole */}
      <line x1="210" y1="191" x2="207" y2="180" stroke="#4a3020" strokeWidth="1.1" strokeLinecap="round"/>
      {/* Small red pennant */}
      <path d="M207 180 L216 177 L210 182Z" fill="rgba(188,42,42,0.68)"/>
      {/* Oar reaching back */}
      <path d="M254 190 Q262 193, 270 196" stroke="#5a4030" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      {/* Ripple rings */}
      <ellipse cx="230" cy="193" rx="36" ry="1.8" fill="none" stroke="rgba(180,215,235,0.32)" strokeWidth="0.7"/>
      <ellipse cx="230" cy="194" rx="44" ry="2.2" fill="none" stroke="rgba(180,215,235,0.18)" strokeWidth="0.5"/>

      {/* Fallen petals on water surface */}
      <ellipse cx="148" cy="185" rx="3.2" ry="1.4" fill="rgba(255,178,193,0.52)" transform="rotate(-18 148 185)"/>
      <ellipse cx="175" cy="188" rx="2.5" ry="1.1" fill="rgba(255,165,182,0.46)" transform="rotate(26 175 188)"/>
      <ellipse cx="282" cy="184" rx="3.0" ry="1.3" fill="rgba(255,178,193,0.50)" transform="rotate(14 282 184)"/>
      <ellipse cx="312" cy="188" rx="2.5" ry="1.2" fill="rgba(255,196,210,0.44)" transform="rotate(-22 312 188)"/>
      <ellipse cx="374" cy="185" rx="3.0" ry="1.3" fill="rgba(255,178,193,0.48)" transform="rotate(8 374 185)"/>
      <ellipse cx="420" cy="188" rx="2.2" ry="1.0" fill="rgba(255,200,214,0.42)" transform="rotate(-12 420 188)"/>
    </svg>
  )
}

/* ── Weather icon helper ─────────────────────── */
function weatherTextToIcon(text: string): string {
  if (!text) return 'cloudy'
  if (text.includes('晴')) return 'sunny'
  if (text.includes('多云') || text.includes('少云')) return 'partlyCloudy'
  if (text.includes('雨')) return 'rainy'
  if (text.includes('阴') || text.includes('雪')) return 'cloudy'
  return 'cloudy'
}

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥']

/* ── Static Data ─────────────────────────────── */

const DAYS = [
  { id: 'd1', label: '古镇', emoji: '🏮' },
  { id: 'd2', label: '世遗', emoji: '⛰️' },
  { id: 'd3', label: '慢游', emoji: '🏛️' },
  { id: 'd4', label: '石窟', emoji: '🪨' },
  { id: 'd5', label: '返程', emoji: '🏠' },
]

interface TimelineDetail { label: string; value: string }
interface Badge { text: string; type?: 'red' | 'green' | 'gold' | 'default' }

interface TimelineEntry {
  id: string; time: string; desc: string; body?: string
  isSight?: boolean; detailsList?: TimelineDetail[]; badges?: Badge[]
}

interface DayData {
  id: string; month: string; dayDate: string; title: string
  distance?: string; hotel?: string; weather?: string; temp?: string
  weatherCity?: string; weatherDate?: string; entries: TimelineEntry[]
}

const ITINERARY: DayData[] = [
  {
    id: 'd1', month: '5月', dayDate: '1',
    title: '赶早出发\n直奔深山古镇',
    distance: '约480km', hotel: '廿八都客栈',
    weather: 'partlyCloudy', temp: '18~26°C',
    weatherCity: '江山', weatherDate: '2026-05-01',
    entries: [
      {
        id: 'd1-1', time: '07:00 出发底线', desc: '抢在第一波出城大军前上高速',
        body: '务必在07:00前通过高速收费站！早这10分钟，能帮你省下后面几十公里的拥堵时间。',
      },
      {
        id: 'd1-2', time: '07:00 - 14:30', desc: '分段式赶路：南京 ➔ 廿八都',
        body: '铁律：每开2小时必须进服务区休息15分钟。二休（约10:00）在建德服务区大休整40分钟吃早午餐。',
      },
      {
        id: 'd1-3', time: '14:40 - 15:00', desc: '抵达廿八都 · 办理入住',
        body: '导航到“廿八都北入口停车场”，步行2分钟到客栈（推荐念八铺客栈、郎峰客栈，方便拿行李）。',
      },
      {
        id: 'd1-4', time: '15:00 - 17:30', desc: '休息调整',
        body: '长途车程后，先在客栈休息，吃点水果，喝点茶，调整状态。',
      },
      {
        id: 'd1-5', time: '17:30 - 20:30', desc: '古镇夜游',
        isSight: true,
        detailsList: [
          { label: '概述', value: '藏于大山深处的国家历史文化名镇，夜晚游客稀少，更显古朴' },
          { label: '晚餐', value: '客栈附近吃，点些不辣的廿八都豆腐、土鸡煲' },
          { label: '必打卡', value: '挂满红灯笼的古街漫步' },
        ],
        badges: [
          { text: '免费', type: 'green' }, { text: '21:00前回房休息', type: 'gold' },
        ],
      },
    ],
  },
  {
    id: 'd2', month: '5月', dayDate: '2',
    title: '晨雾古镇与世遗野餐\n前往市区',
    distance: '约100km', hotel: '衢州高星酒店',
    weather: 'sunny', temp: '17~28°C',
    weatherCity: '江山', weatherDate: '2026-05-02',
    entries: [
      {
        id: 'd2-1', time: '07:30 - 09:00', desc: '独享清晨古镇',
        body: '旅游团还没来，带孩子拍拍晨雾里的古镇，顺手买点铜锣糕路上吃。',
      },
      {
        id: 'd2-2', time: '09:00 - 10:00', desc: '驱车北上前往江郎山',
        body: '必须要9点走，争取10点前到，避开五一排队坐景交车的大长龙。',
      },
      {
        id: 'd2-3', time: '10:00 - 13:30', desc: '江郎山轻松游',
        isSight: true,
        detailsList: [
          { label: '概述', value: '世界自然遗产，典型丹霞地貌，三爿石拔地而起' },
          { label: '路线', value: '坐景交车进山，走开明禅寺➔会仙岩这段平路（约30分钟），不去爬台阶，主打轻松' },
          { label: '必打卡', value: '须女湖走木栈道，江郎山大草坪' },
        ],
        badges: [
          { text: '成人90元(含景交)', type: 'red' }, { text: '儿童优惠', type: 'green' }
        ],
      },
      {
        id: 'd2-4', time: '13:30 - 15:00', desc: '午休转移 · 江郎山 ➔ 衢州市区',
        body: '这段1.5小时的车程刚好让孩子在车上睡一觉。',
      },
      {
        id: 'd2-5', time: '15:00 - 17:00', desc: '安顿大本营',
        body: '抵达衢州市区高星酒店，把后备箱搬空，接下来的几天都不用再整理行李了。',
      },
      {
        id: 'd2-6', time: '17:00 - 19:00', desc: '鹿鸣公园放风',
        isSight: true,
        detailsList: [
          { label: '概述', value: '衢州城区绿肺，以极具逻辑美感的高架红色栈道著称' },
          { label: '必打卡', value: '高架栈道和大草坪跑跑跳跳' },
        ],
        badges: [
          { text: '免费开放', type: 'green' }, { text: '记得喷防蚊液', type: 'gold' },
        ],
      },
    ],
  },
  {
    id: 'd3', month: '5月', dayDate: '3',
    title: '市中心人文慢游\n零车程睡饱吃好',
    distance: '零车程', hotel: '衢州高星酒店(续住)',
    weather: 'sunny', temp: '19~29°C',
    weatherCity: '衢州', weatherDate: '2026-05-03',
    entries: [
      {
        id: 'd3-1', time: '09:00 - 10:30', desc: '衢州博物馆看大恐龙',
        isSight: true,
        detailsList: [
          { label: '概述', value: '国家一级博物馆，馆藏衢州地区史前至近代珍贵文物' },
          { label: '必打卡', value: '一楼的恐龙骨架化石和历史展厅' },
        ],
        badges: [
          { text: '免费', type: 'green' }, { text: '公众号提前预约', type: 'red' },
        ],
      },
      {
        id: 'd3-2', time: '10:30 - 12:00', desc: '衢州科技馆',
        isSight: true,
        detailsList: [
          { label: '概述', value: '寓教于乐的互动场馆' },
          { label: '亮点', value: '有很多适合小朋友玩的互动小实验' },
        ],
        badges: [
          { text: '步行5分钟即达', type: 'green' },
        ],
      },
      {
        id: 'd3-3', time: '12:00 - 14:30', desc: '回房午睡',
        body: '在酒店附近吃完午饭，直接溜达回房间睡个踏实的长午觉。',
      },
      {
        id: 'd3-4', time: '15:00 - 16:30', desc: '孔氏南宗家庙',
        isSight: true,
        detailsList: [
          { label: '概述', value: '儒家文化在南方的重要传承地' },
          { label: '亮点', value: '院子里很安静，带孩子在后花园喂锦鲤' },
        ],
        badges: [
          { text: '免费', type: 'green' }, { text: '喂锦鲤', type: 'gold' },
        ],
      },
      {
        id: 'd3-5', time: '17:00 - 20:30', desc: '水亭门历史文化街区',
        isSight: true,
        detailsList: [
          { label: '必打卡', value: '城墙上看衢江日落，看灯光秀' },
          { label: '美食与购物', value: '古铺良食吃儿童餐，买徐氏水晶糕，买齐带回南京的特产（烤饼、麻糍等）' },
        ],
        badges: [
          { text: '提前问灯光秀时间' }, { text: '不辣儿童餐', type: 'green' },
        ],
      },
    ],
  },
  {
    id: 'd4', month: '5月', dayDate: '4',
    title: '地下探秘与古建\n早去早回不挤人',
    distance: '约80km(双程)', hotel: '衢州高星酒店(续住)',
    weather: 'partlyCloudy', temp: '18~27°C',
    weatherCity: '龙游', weatherDate: '2026-05-04',
    entries: [
      {
        id: 'd4-1', time: '08:00 - 08:45', desc: '前往龙游',
        body: '酒店吃完早饭，开车去龙游（全程高速40分钟）。',
      },
      {
        id: 'd4-2', time: '08:45 - 11:30', desc: '龙游石窟',
        isSight: true,
        detailsList: [
          { label: '概述', value: '趁大部队没来，第一批进地下奇观' },
          { label: '亮点', value: '里面常年16度，带手电筒玩探险' },
        ],
        badges: [
          { text: '成人 60元', type: 'red' }, { text: '儿童加薄外套', type: 'gold' }, { text: '带小手电筒' },
        ],
      },
      {
        id: 'd4-3', time: '11:30 - 13:00', desc: '龙游县城午餐',
        body: '点单时一定要交代全桌免辣，来点特色的发糕和葱花馒头。',
      },
      {
        id: 'd4-4', time: '13:30 - 16:00', desc: '龙游民居苑',
        isSight: true,
        detailsList: [
          { label: '概述', value: '明清徽派建筑群落' },
        ],
        badges: [
          { text: '成人 30元', type: 'red' } 
        ],
      },
      {
        id: 'd4-5', time: '16:00 - 16:50', desc: '返回衢州市区大本营',
        body: '早早结束行程往回开，避开晚高峰。',
      },
      {
        id: 'd4-6', time: '19:00', desc: '烟火夜宵',
        body: '晚上打个车去“马站底”美食街，吃一顿最地道的衢州特色小吃。',
      },
    ],
  },
  {
    id: 'd5', month: '5月', dayDate: '5',
    title: '错峰返程\n从容归家',
    weather: 'sunny', temp: '18~27°C',
    weatherCity: '衢州', weatherDate: '2026-05-05',
    entries: [
      {
        id: 'd5-1', time: '08:30 - 10:00', desc: '从容收拾',
        body: '睡到自然醒，安安心心吃顿自助早餐。东西前一晚就装得差不多了，慢慢收拾装车。',
      },
      {
        id: 'd5-2', time: '10:30', desc: '办理退房',
        body: '交卡退房，最后检查遗漏物品。',
      },
      {
        id: 'd5-3', time: '11:00 - 17:00', desc: '准时上高速 · 顺利回家',
        body: '11点准时上高速向北开！首选：衢州➔杭长高速➔长深高速➔南京。备用：如杭长(龙游-建德)拥堵，换走杭州绕城西复线。',
      },
    ],
  },
]

const RESERVATIONS = [
  { name: '衢州博物馆', channel: '官方公众号', advance: '提前3天', price: '免费' },
  { name: '衢州科技馆', channel: '官方公众号', advance: '提前3天', price: '免费' },
  { name: '龙游石窟', channel: '官方公众号/OTA', advance: '提前1-2天', price: '成人60元' },
  { name: '江郎山', channel: '官方公众号/OTA', advance: '提前1-2天', price: '成人90元含景交' },
  { name: '龙游民居苑', channel: '现场/OTA', advance: '—', price: '成人30元' },
  { name: '孔氏南宗家庙', channel: '现场', advance: '—', price: '免费' },
]

const HOTELS: HotelData[] = [
  { dayId: 'd1', night: '5/1', name: '廿八都北入口客栈(念八铺/郎峰)', desc: '方便拿行李，免走石板路' },
  { dayId: 'd2', night: '5/2', name: '衢州市区高星酒店', desc: '大本营安营扎寨，停车便利' },
  { dayId: 'd3', night: '5/3', name: '衢州市区高星酒店', desc: '连住不折腾' },
  { dayId: 'd4', night: '5/4', name: '衢州市区高星酒店', desc: '连住不折腾' },
]

const TIPS = [
  '时间红线：D1务必在7:00前上高速；D5务必在11:00前上高速返程，卡准时间极大降低拥堵痛苦',
  '避辣指南：衢州菜辣度极高且"隐蔽"，点任何热菜务必反复叮嘱"全桌免辣，锅里不能沾辣椒"',
  '超级大堵车预案：D1若下午3点未出杭州，果断就近(江山/衢州)下高速找酒店住下，安全第一',
  '避开人群预案：若江郎山排队超1小时去清漾村；若龙游石窟约满去根宫佛国',
  '带娃神器与药品：防蚊喷雾(鹿鸣公园和廿八都必备)、退烧药/晕车贴',
]

/* ── Component ─────────────────────────────── */
export default function QuzhouTripPage({ onBack }: Props) {
  const [visible, setVisible] = useState(false)
  const [activeDay, setActiveDay] = useState('prep')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [weatherMap, setWeatherMap] = useState<Record<string, { icon: string; temp: string }>>({})

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isScrolling = useRef(false)
  const pillsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const items = ITINERARY.filter(d => d.weatherCity && d.weatherDate)
      .map(d => ({ city: d.weatherCity!, date: d.weatherDate! }))
    if (items.length === 0) return
    api.batchWeather(items)
      .then(res => {
        const map: Record<string, { icon: string; temp: string }> = {}
        for (const day of ITINERARY) {
          if (!day.weatherCity || !day.weatherDate) continue
          const key = `${day.weatherCity}:${day.weatherDate}`
          const w = res.results[key]
          if (w) map[day.id] = { icon: weatherTextToIcon(w.textDay), temp: `${w.tempLow}~${w.tempHigh}°C` }
        }
        setWeatherMap(map)
      })
      .catch(() => {})
  }, [])

  const scrollToDay = useCallback((dayId: string) => {
    isScrolling.current = true
    setActiveDay(dayId)
    const el = sectionRefs.current[dayId]
    if (el) {
      const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
    const pillIndex = DAYS.findIndex(d => d.id === dayId)
    if (pillsRef.current && pillIndex >= 0) {
      const pillButtons = pillsRef.current.querySelectorAll('button')
      pillButtons[pillIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
    setTimeout(() => { isScrolling.current = false }, 800)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveDay(entry.target.id)
        }
      },
      { rootMargin: '0px 0px -65% 0px', threshold: 0 }
    )
    const prepEl = sectionRefs.current['prep']
    if (prepEl) observer.observe(prepEl)
    for (const day of ITINERARY) {
      const el = sectionRefs.current[day.id]
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => { sectionRefs.current[id] = el },
    []
  )

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <BambooLeaves />
      <button onClick={onBack} className={styles.backBtn} aria-label="返回">
        <Icon name="arrowLeft" size={20} />
      </button>

      <div className={`${styles.page} ${visible ? styles.visible : ''}`}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.poemQuote}>
            <span className={styles.poemLine}>梅子黄时日日晴</span>
            <span className={styles.poemLine}>小溪泛尽却山行</span>
            <span className={styles.poemDivider} />
            <span className={styles.poemAuthor}>三衢道中</span>
          </div>
          <h1 className={styles.heroTitle}>衢州五日亲子游</h1>
          <p className={styles.heroSub}>五一自驾 · 2026.5.1 — 5.5 · 南京出发</p>
          {/* 云雾远山 + 三爿石 SVG landscape */}
          <div className={styles.heroScape}>
            <MountainScape />
          </div>
        </section>

        {/* ── Route ── */}
        <section className={styles.section} id="prep" ref={setSectionRef('prep')}>
          <p className={styles.sectionLabel}>行程路线</p>
          <h2 className={styles.sectionTitle}>大本营策略</h2>
          <div className={styles.routeMap}>
            <div className={styles.routeRow}>
              <span className={styles.routeStop}>
                <span className={styles.routeStopDot}/>
                <span className={styles.routeStopName}>南京</span>
                <span className={styles.routeStopDate}>5/1</span>
              </span>
              <span className={styles.routeDash}/>
              <span className={styles.routeStop}>
                <span className={styles.routeStopDot}/>
                <span className={styles.routeStopName}>廿八都</span>
                <span className={styles.routeStopDate}>5/1</span>
              </span>
              <span className={styles.routeDash}/>
              <span className={styles.routeStop}>
                <span className={styles.routeStopDot}/>
                <span className={styles.routeStopName}>江郎山</span>
                <span className={styles.routeStopDate}>5/2</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className={styles.routeConnector}/>
            </div>
            <div className={`${styles.routeRow} ${styles.routeRowReverse}`}>
              <span className={styles.routeStop}>
                <span className={styles.routeStopDot}/>
                <span className={styles.routeStopName}>衢州</span>
                <span className={styles.routeStopDate}>5/2-5</span>
              </span>
              <span className={styles.routeDash}/>
              <span className={styles.routeStop}>
                <span className={styles.routeStopDot}/>
                <span className={styles.routeStopName}>龙游</span>
                <span className={styles.routeStopDate}>5/4</span>
              </span>
              <span className={styles.routeDash}/>
              <span className={styles.routeStop}>
                <span className={styles.routeStopDot}/>
                <span className={styles.routeStopName}>南京</span>
                <span className={styles.routeStopDate}>5/5</span>
              </span>
            </div>
          </div>

          <h3 className={`${styles.subTitle} ${styles.subTitleGapMd}`}>
            <span className={styles.subTitleIcon}><Icon name="ticket" size={18}/></span>
            票务预约指南
          </h3>
          <div className={styles.reservList}>
            {RESERVATIONS.map(r => (
              <div key={r.name} className={styles.reservItem}>
                <span className={styles.reservName}>{r.name}</span>
                <span className={styles.reservMeta}>
                  <span className={styles.reservChannel}>{r.channel}</span>
                  {r.advance !== '—' && <span className={styles.reservAdvance}>提前{r.advance}</span>}
                  <span className={styles.reservPrice}>{r.price}</span>
                </span>
              </div>
            ))}
          </div>

          <h3 className={`${styles.subTitle} ${styles.subTitleGapLg}`}>
            <span className={styles.subTitleIcon}><Icon name="hotel" size={18}/></span>
            住宿安排
          </h3>
          <div className={styles.hotelSingle}>
            <div className={styles.hotelSingleIcon}><Icon name="hotel" size={20}/></div>
            <div className={styles.hotelSingleInfo}>
              <div className={styles.hotelSingleName}>
                1晚客栈 + 3晚高星酒店
              </div>
              <div className={styles.hotelSingleMeta}>1晚古镇客栈免走石板路</div>
              <div className={styles.hotelSingleDesc}>3晚市区酒店做大本营 · 避免每日整理行李</div>
            </div>
          </div>
        </section>

        {/* ── Itinerary ── */}
        {ITINERARY.map(day => (
          <section key={day.id} className={styles.section} id={day.id} ref={setSectionRef(day.id)}>
            {(() => {
              const dayInfo = DAYS.find(d => d.id === day.id)
              if (!dayInfo) return null
              return (
                <div className={styles.dayDivider}>
                  <span className={styles.dayDividerEmoji}>{dayInfo.emoji}</span>
                </div>
              )
            })()}
            <div className={styles.dayHeader}>
              <div className={styles.dayDateCircle}>
                <span className={styles.dayDateM}>{day.month}</span>
                <span className={styles.dayDateD}>{day.dayDate}</span>
              </div>
              <div className={styles.dayInfo}>
                <div className={styles.dayName}>
                  {day.title.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
                </div>
                <div className={styles.dayMeta}>
                  {day.distance && (
                    <span className={styles.dayMetaItem}>
                      <span className={styles.dayMetaIcon}><Icon name="car" size={14}/></span>
                      {day.distance}
                    </span>
                  )}
                  {day.hotel && (
                    <span className={styles.dayMetaItem}>
                      <span className={styles.dayMetaIcon}><Icon name="hotel" size={14}/></span>
                      {day.hotel}
                    </span>
                  )}
                  {(weatherMap[day.id]?.icon || day.weather) && (
                    <span className={styles.dayMetaItem}>
                      <span className={styles.dayMetaIcon}>
                        <Icon name={weatherMap[day.id]?.icon || day.weather!} size={14}/>
                      </span>
                      {weatherMap[day.id]?.temp || day.temp}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.timeline}>
              {day.entries.map((entry) => {
                const isOpen = !!openItems[entry.id]
                const isSightWithDetail = entry.isSight && !!(entry.detailsList?.length)
                const hasRegularAccordion = !entry.isSight && !!entry.body

                return (
                  <div key={entry.id} className={`${styles.tlItem} ${entry.isSight ? styles.highlight : ''} ${isOpen ? styles.open : ''}`}>
                    {isSightWithDetail ? (
                      <>
                        <span className={styles.sightTimeAbove}>{entry.time}</span>
                        <div className={styles.sightCard}>
                          <button className={styles.sightCardHead} onClick={() => toggleItem(entry.id)} aria-expanded={isOpen} aria-controls={entry.id + '-detail'}>
                            <div className={styles.sightCardLeft}>
                              <span className={styles.sightCardLabel}>景点</span>
                              <div className={styles.sightCardName}>{stripEmoji(entry.desc)}</div>
                            </div>
                            <div className={styles.sightCardActions}>
                              <a className={styles.pinLink} href={buildBaiduNavUrl(stripEmoji(entry.desc))} aria-label="导航" onClick={e => e.stopPropagation()}>
                                <Icon name="mapPin" size={14}/>
                              </a>
                              <svg className={styles.caret} viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </button>
                          <div className={styles.tlDetail} id={entry.id + '-detail'}>
                            <div className={styles.tlInner}>
                              <div className={styles.sightCardBody}>
                                {entry.detailsList?.map((dt, i) => (
                                  <div key={i} className={styles.sightRow}>
                                    <span className={styles.sightLabel}>{dt.label}</span>
                                    <span className={styles.sightValue}>{dt.value}</span>
                                  </div>
                                ))}
                                {entry.badges && entry.badges.length > 0 && (
                                  <div className={styles.badgeRow}>
                                    {entry.badges.map((b, i) => (
                                      <span key={i} className={`${styles.badge} ${styles['badge-' + (b.type || 'default')]}`}>{b.text}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : hasRegularAccordion ? (
                      <>
                        <button className={styles.tlBtn} onClick={() => toggleItem(entry.id)} aria-expanded={isOpen} aria-controls={entry.id + '-detail'}>
                          <span className={styles.tlTime}>{entry.time}</span>
                          <span className={styles.tlName}>
                            <span className={styles.tlNameText}>{stripEmoji(entry.desc)}</span>
                            <svg className={styles.caret} viewBox="0 0 16 16" fill="none">
                              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </button>
                        <div className={styles.tlDetail} id={entry.id + '-detail'}>
                          <div className={styles.tlInner}>
                            <div className={styles.tlBody}>
                              <div className={styles.tlBodyText}>{entry.body}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={`${styles.tlBtn} ${styles.tlBtnStatic}`}>
                        <span className={styles.tlTime}>{entry.time}</span>
                        <span className={styles.tlName}>
                          <span className={styles.tlNameText}>{stripEmoji(entry.desc)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(() => {
              const hotel = HOTELS.find(h => h.dayId === day.id)
              if (!hotel) return null
              return (
                <div className={styles.hotelSection}>
                  <div className={styles.hotelSectionLabel}>今日住宿</div>
                  <div className={styles.hotelItem}>
                    <div className={styles.hotelNight}>
                      <span className={styles.hotelNightIcon}><Icon name="hotel" size={13}/></span>
                      {hotel.night}
                    </div>
                    <div className={styles.hotelInfo}>
                      <div className={styles.hotelName}>
                        {hotel.name}
                        <a className={styles.pinLink} href={buildBaiduNavUrl(hotel.name)} aria-label="导航到酒店" onClick={e => e.stopPropagation()}>
                          <Icon name="mapPin" size={14}/>
                        </a>
                      </div>
                      <div className={styles.hotelDesc}>{hotel.desc}</div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </section>
        ))}

        {/* ── Tips ── */}
        <section className={`${styles.section} ${styles.tipsSection}`} id="tips">
          <p className={styles.sectionLabel}>出行须知</p>
          <h2 className={styles.sectionTitle}>注意事项</h2>
          <ul className={styles.tipsList}>
            {TIPS.map((tip, i) => {
              const [bold, rest] = tip.split('：')
              return (
                <li key={i}>
                  <span className={styles.tipsCircle}>{CIRCLED_NUMBERS[i] || i + 1}</span>
                  <div className={styles.tipsText}><strong>{bold}</strong>：{rest}</div>
                </li>
              )
            })}
          </ul>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerSeal}>衢</span>
          <p className={styles.footerPoem}>绿阴不减来时路 · 添得黄鹂四五声</p>
        </footer>
      </div>

      <nav className={styles.pillNav} ref={pillsRef}>
        {DAYS.map(d => (
          <button key={d.id} className={`${styles.pill} ${activeDay === d.id ? styles.active : ''}`} onClick={() => scrollToDay(d.id)}>
            {d.emoji} {d.label}
          </button>
        ))}
      </nav>
    </>
  )
}
