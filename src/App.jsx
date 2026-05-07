import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Memory from './pages/Memory'
import TicTacToe from './pages/TicTacToe'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/memory', label: 'Memory' },
  { to: '/tictactoe', label: 'Tic Tac Toe' },
]

function Shell({ children }) {
  return (
    <div className="min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#030712_100%)]" />
      <div className="pointer-events-none fixed left-0 top-24 -z-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-40 -z-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold tracking-[0.25em] text-cyan-200 transition group-hover:bg-white/10">
              MU
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6 lg:py-10">
        {children}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500 lg:px-6">
        latihan membuat web dengan react js.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
