import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { STORAGE_KEYS, createMemoryStats, readJSON, writeJSON } from '../utils/storage'

const SYMBOL_POOL = ['◈', '◆', '●', '○', '■', '□', '▲', '△', '✦', '✧', '✶', '✺', '☾', '☼', '❖', '⬟', '⬢', '⬥']

const DIFFICULTIES = [
  { key: 'easy', label: 'Mudah', pairs: 6 },
  { key: 'normal', label: 'Normal', pairs: 8 },
  { key: 'hard', label: 'Sulit', pairs: 12 },
]

function buildDeck(pairs) {
  const symbols = SYMBOL_POOL.slice(0, pairs)
  const deck = [...symbols, ...symbols].map((symbol, index) => ({
    id: `${symbol}-${index}-${Math.random().toString(16).slice(2, 8)}`,
    symbol,
    pairId: symbol,
  }))

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }

  return deck
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${String(remaining).padStart(2, '0')}`
}

function cloneMemoryStats(stats) {
  return {
    ...stats,
    byDifficulty: {
      easy: { ...stats.byDifficulty.easy },
      normal: { ...stats.byDifficulty.normal },
      hard: { ...stats.byDifficulty.hard },
    },
  }
}

function getStars(pairs, moves, seconds) {
  const efficiency = moves / pairs
  if (efficiency <= 1.6 && seconds <= pairs * 10) return 3
  if (efficiency <= 2.4) return 2
  return 1
}

export default function Memory() {
  const [difficultyKey, setDifficultyKey] = useState('normal')
  const difficulty = useMemo(
    () => DIFFICULTIES.find((item) => item.key === difficultyKey) ?? DIFFICULTIES[1],
    [difficultyKey],
  )
  const [deck, setDeck] = useState(() => buildDeck(difficulty.pairs))
  const [flippedIds, setFlippedIds] = useState([])
  const [matchedPairIds, setMatchedPairIds] = useState([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [locked, setLocked] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [stars, setStars] = useState(0)
  const [stats, setStats] = useState(() => readJSON(STORAGE_KEYS.memory, createMemoryStats()))
  const timeoutRef = useRef(null)

  useEffect(() => {
    writeJSON(STORAGE_KEYS.memory, stats)
  }, [stats])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!running || completed) return undefined

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running, completed])

  function resetRound(nextDifficultyKey = difficultyKey) {
    const nextDifficulty = DIFFICULTIES.find((item) => item.key === nextDifficultyKey) ?? DIFFICULTIES[1]
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setDifficultyKey(nextDifficulty.key)
    setDeck(buildDeck(nextDifficulty.pairs))
    setFlippedIds([])
    setMatchedPairIds([])
    setMoves(0)
    setSeconds(0)
    setRunning(false)
    setLocked(false)
    setCompleted(false)
    setStars(0)
  }

  function completeRound(nextMoves, nextSeconds) {
    const nextStars = getStars(difficulty.pairs, nextMoves, nextSeconds)
    setStars(nextStars)
    setCompleted(true)
    setRunning(false)
    setLocked(false)

    setStats((prev) => {
      const next = cloneMemoryStats(prev)
      const bucket = next.byDifficulty[difficulty.key]
      bucket.wins += 1
      bucket.bestMoves = bucket.bestMoves === null ? nextMoves : Math.min(bucket.bestMoves, nextMoves)
      bucket.bestSeconds = bucket.bestSeconds === null ? nextSeconds : Math.min(bucket.bestSeconds, nextSeconds)
      bucket.bestStars = Math.max(bucket.bestStars, nextStars)
      next.totalWins += 1
      next.totalMoves += nextMoves
      next.totalSeconds += nextSeconds
      return next
    })
  }

  function handleCardClick(card) {
    if (locked || completed) return
    if (flippedIds.includes(card.id)) return
    if (matchedPairIds.includes(card.pairId)) return

    const nextFlipped = [...flippedIds, card.id]
    setFlippedIds(nextFlipped)

    if (!running) {
      setRunning(true)
    }

    if (nextFlipped.length !== 2) return

    const nextMoves = moves + 1
    setMoves(nextMoves)
    setLocked(true)

    const [first, second] = nextFlipped.map((id) => deck.find((item) => item.id === id))

    if (!first || !second) {
      setLocked(false)
      return
    }

    if (first.pairId === second.pairId) {
      const timeoutId = window.setTimeout(() => {
        const nextMatched = [...matchedPairIds, first.pairId]
        setMatchedPairIds(nextMatched)
        setFlippedIds([])
        setLocked(false)

        if (nextMatched.length === difficulty.pairs) {
          completeRound(nextMoves, seconds)
        }
        timeoutRef.current = null
      }, 380)
      timeoutRef.current = timeoutId
      return
    }

    const timeoutId = window.setTimeout(() => {
      setFlippedIds([])
      setLocked(false)
      timeoutRef.current = null
    }, 650)
    timeoutRef.current = timeoutId
  }

  const currentBest = stats.byDifficulty[difficulty.key]
  const completionProgress = (matchedPairIds.length / difficulty.pairs) * 100

  return (
    <div className="space-y-6">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="badge">Game 1</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Memory Card</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Cari pasangan kartu secepat mungkin, semakin sedikit langkah yang diambil, semakin tinggi skor yang diperoleh.
            </p>
          </div>
          <Link to="/" className="btn-ghost">
            Kembali ke dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.key}
                className={`btn-ghost ${difficulty.key === item.key ? 'bg-white/10 text-white' : ''}`}
                onClick={() => resetRound(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
            <button className="btn-ghost" onClick={() => resetRound()} type="button">
              Ulangi ronde
            </button>
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Progress</div>
          <div className="mt-2 text-sm leading-7 text-slate-200">
            {matchedPairIds.length}/{difficulty.pairs} pasangan berhasil ditemukan.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="stat-chip">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Moves</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{moves}</div>
        </div>
        <div className="stat-chip">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Time</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatTime(seconds)}</div>
        </div>
        <div className="stat-chip">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Best record</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {currentBest.bestSeconds === null ? '—' : formatTime(currentBest.bestSeconds)}
          </div>
        </div>
        <div className="stat-chip">
          <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Bintang</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
        </div>
      </section>

      <section className="panel p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Board</div>
            <div className="mt-1 text-sm text-slate-300">Klik dua kartu untuk mencari pasangan yang sama.</div>
          </div>
          <div className="text-sm text-slate-400">{running ? 'Berjalan' : completed ? 'Selesai' : 'Siap dimainkan'}</div>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${completionProgress}%` }}
          />
        </div>

        <div className={`grid gap-3`} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))' }}>
          {deck.map((card) => {
            const flipped = flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId)
            const matched = matchedPairIds.includes(card.pairId)

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card)}
                className={`mem-card aspect-square ${flipped ? 'is-flipped' : ''}`}
                aria-label={flipped ? `Kartu ${card.symbol}` : 'Kartu tertutup'}
              >
                <div className="mem-card-inner relative h-full w-full">
                  <div className="mem-card-face absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl font-semibold text-slate-300">
                    <span className="opacity-30">◌</span>
                  </div>
                  <div className={`mem-card-face mem-card-back absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 text-3xl font-semibold ${matched ? 'bg-cyan-400/15 text-cyan-100' : 'bg-slate-900/70 text-white'}`}>
                    {card.symbol}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {completed && (
        <section className="panel p-6 text-center sm:p-8">
          <div className="text-xs uppercase tracking-[0.32em] text-slate-400">Round complete</div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-white">Semua pasangan sudah ditemukan.</div>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-slate-300">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Waktu: {formatTime(seconds)}</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Moves: {moves}</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Stars: {'★'.repeat(stars)}</div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={() => resetRound()} type="button">
              Main lagi
            </button>
            <Link to="/tictactoe" className="btn-secondary">
              Coba Tic Tac Toe
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
