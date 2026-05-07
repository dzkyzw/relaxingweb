import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useClock } from '../hooks/useClock'
import { STORAGE_KEYS, createMemoryStats, createTicTacToeStats, readJSON } from '../utils/storage'

const GAME_CARDS = [
  {
    title: 'Memory Card',
    path: '/memory',
    description: 'Temukan dan cocokkan pasangan kartu.',
    accent: 'from-cyan-400/20 via-white/5 to-transparent',
    label: 'Focus game',
  },
  {
    title: 'Tic Tac Toe',
    path: '/tictactoe',
    description: 'Mainkan mode dua pemain atau lawan Bot.',
    accent: 'from-emerald-400/20 via-white/5 to-transparent',
    label: 'Strategy game',
  },
]

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-chip">
      <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{hint}</div>
    </div>
  )
}

function GameCard({ title, path, description, label, accent }) {
  return (
    <Link to={path} className="group panel relative overflow-hidden p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-100`} />
      <div className="relative">
        <div className="badge">{label}</div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition group-hover:gap-3">
          Buka halaman
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { greeting, period, timeLabel, dateLabel } = useClock()

  const summary = useMemo(() => {
    const memory = readJSON(STORAGE_KEYS.memory, createMemoryStats())
    const ttt = readJSON(STORAGE_KEYS.tictactoe, createTicTacToeStats())

    const bestMemoryTime = Object.values(memory.byDifficulty)
      .map((item) => item.bestSeconds)
      .filter((value) => value !== null)
      .sort((a, b) => a - b)[0]

    const totalRounds = ttt.totalRounds
    const totalWins = ttt.ai.playerWins + ttt.pvp.xWins + ttt.pvp.oWins

    return {
      memory,
      ttt,
      bestMemoryTime,
      totalRounds,
      totalWins,
    }
  }, [])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="panel p-6 sm:p-8">
          <div className="badge">Dashboard</div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {greeting}.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Web ini dibuat untuk mengurangi kejenuhan.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/memory" className="btn-primary">
              Main Memory Card Game
            </Link>
            <Link to="/tictactoe" className="btn-secondary">
              Main Tic Tac Toe
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Waktu" value={period} hint="Nikmati waktu santaimu." />
            <StatCard label="Session" value="Active" hint="Jangan lupa untuk beristirahat." />
            <StatCard label="Games" value="2" hint="Jumlah permainan yang tersedia." />
          </div>
        </div>

        <div className="panel p-6 sm:p-8">
          <div className="section-label">Realtime clock</div>
          <div className="mt-4 text-5xl font-semibold tracking-tight text-white sm:text-6xl">{timeLabel}</div>
          <div className="mt-3 text-sm text-slate-300">{dateLabel}</div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="stat-chip">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Memory Card</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.memory.totalWins}</div>
              <div className="mt-1 text-sm text-slate-400">Total permainan yang berhasil diselesaikan.</div>
            </div>
            <div className="stat-chip">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Tic Tac Toe</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.totalRounds}</div>
              <div className="mt-1 text-sm text-slate-400">Jumlah Ronde yang telah dimainkan.</div>
            </div>
            <div className="stat-chip">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Best time</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {summary.bestMemoryTime === undefined ? '—' : `${Math.floor(summary.bestMemoryTime / 60)}:${String(summary.bestMemoryTime % 60).padStart(2, '0')}`}
              </div>
              <div className="mt-1 text-sm text-slate-400">Waktu terbaik saat bermain Memory Card.</div>
            </div>
            <div className="stat-chip">
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Total Menang</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.totalWins}</div>
              <div className="mt-1 text-sm text-slate-400">Total menang saat bermain Tic Tac Toe.</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-label mb-4">Pilihan game</div>
        <div className="grid gap-4 md:grid-cols-2">
          {GAME_CARDS.map((card) => (
            <GameCard key={card.title} {...card} />
          ))}
        </div>
      </section>
    </div>
  )
}
