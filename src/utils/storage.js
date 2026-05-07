export const STORAGE_KEYS = {
  memory: 'zenzone:memory:v1',
  tictactoe: 'zenzone:tictactoe:v1',
}

export function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function createMemoryStats() {
  return {
    totalWins: 0,
    totalMoves: 0,
    totalSeconds: 0,
    byDifficulty: {
      easy: { wins: 0, bestMoves: null, bestSeconds: null, bestStars: 0 },
      normal: { wins: 0, bestMoves: null, bestSeconds: null, bestStars: 0 },
      hard: { wins: 0, bestMoves: null, bestSeconds: null, bestStars: 0 },
    },
  }
}

export function createTicTacToeStats() {
  return {
    totalRounds: 0,
    pvp: { xWins: 0, oWins: 0, draws: 0 },
    ai: { playerWins: 0, aiWins: 0, draws: 0 },
  }
}
