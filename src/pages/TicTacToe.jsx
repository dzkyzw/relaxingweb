import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { STORAGE_KEYS, createTicTacToeStats, readJSON, writeJSON } from '../utils/storage'

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function evaluateBoard(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }

  if (board.every(Boolean)) {
    return { winner: 'draw', line: [] }
  }

  return null
}

function minimax(board, isMaximizing, depth = 0) {
  const result = evaluateBoard(board)
  if (result) {
    if (result.winner === 'O') return 10 - depth
    if (result.winner === 'X') return depth - 10
    return 0
  }

  const scores = []

  board.forEach((cell, index) => {
    if (cell) return

    const nextBoard = [...board]
    nextBoard[index] = isMaximizing ? 'O' : 'X'
    scores.push(minimax(nextBoard, !isMaximizing, depth + 1))
  })

  return isMaximizing ? Math.max(...scores) : Math.min(...scores)
}

function getBestMove(board) {
  let bestScore = -Infinity
  let bestMove = -1

  board.forEach((cell, index) => {
    if (cell) return

    const nextBoard = [...board]
    nextBoard[index] = 'O'
    const score = minimax(nextBoard, false)

    if (score > bestScore) {
      bestScore = score
      bestMove = index
    }
  })

  return bestMove
}

function cloneStats(stats) {
  return {
    ...stats,
    pvp: { ...stats.pvp },
    ai: { ...stats.ai },
  }
}

const DEFAULT_SCORE = createTicTacToeStats()

export default function TicTacToe() {
  const [mode, setMode] = useState('ai')
  const [board, setBoard] = useState(() => Array(9).fill(null))
  const [turn, setTurn] = useState('X')
  const [result, setResult] = useState(null)
  const [thinking, setThinking] = useState(false)
  const [scores, setScores] = useState(() => readJSON(STORAGE_KEYS.tictactoe, DEFAULT_SCORE))
  const aiTimeoutRef = useRef(null)

  useEffect(() => {
    writeJSON(STORAGE_KEYS.tictactoe, scores)
  }, [scores])

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current)
        aiTimeoutRef.current = null
      }
    }
  }, [])

  const statusText = useMemo(() => {
    if (result) {
      if (result.winner === 'draw') return 'Permainan berakhir seri.'
      if (mode === 'ai') return result.winner === 'X' ? 'Kamu menang.' : 'AI menang.'
      return result.winner === 'X' ? 'Player X menang.' : 'Player O menang.'
    }

    if (thinking) return 'AI sedang menghitung langkah terbaik.'
    if (mode === 'ai') return turn === 'X' ? 'Giliran kamu.' : 'Giliran AI.'
    return turn === 'X' ? 'Giliran Player X.' : 'Giliran Player O.'
  }, [mode, result, thinking, turn])

  const activeScore = mode === 'ai' ? scores.ai : scores.pvp

  function resetRound(nextMode = mode) {
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current)
      aiTimeoutRef.current = null
    }
    if (nextMode !== mode) {
      setMode(nextMode)
    }
    setBoard(Array(9).fill(null))
    setTurn('X')
    setResult(null)
    setThinking(false)
  }

  function clearStats() {
    setScores(createTicTacToeStats())
    resetRound()
  }

  function finishRound(nextBoard) {
    const nextResult = evaluateBoard(nextBoard)
    if (!nextResult) {
      setTurn((prev) => (prev === 'X' ? 'O' : 'X'))
      return
    }

    setResult(nextResult)
    setScores((prev) => {
      const next = cloneStats(prev)
      next.totalRounds += 1

      if (mode === 'ai') {
        if (nextResult.winner === 'draw') next.ai.draws += 1
        else if (nextResult.winner === 'X') next.ai.playerWins += 1
        else next.ai.aiWins += 1
      } else {
        if (nextResult.winner === 'draw') next.pvp.draws += 1
        else if (nextResult.winner === 'X') next.pvp.xWins += 1
        else next.pvp.oWins += 1
      }

      return next
    })
  }

  function handleCellClick(index) {
    if (board[index] || result || thinking) return
    if (mode === 'ai' && turn !== 'X') return

    const nextBoard = [...board]
    nextBoard[index] = turn
    setBoard(nextBoard)
    finishRound(nextBoard)
  }

  useEffect(() => {
    if (mode !== 'ai' || turn !== 'O' || result) return

    setThinking(true)
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current)
    }
    const timer = window.setTimeout(() => {
      const move = getBestMove(board)
      if (move === -1) {
        setThinking(false)
        aiTimeoutRef.current = null
        return
      }

      const nextBoard = [...board]
      nextBoard[move] = 'O'
      setBoard(nextBoard)
      finishRound(nextBoard)
      setThinking(false)
      aiTimeoutRef.current = null
    }, 420)

    aiTimeoutRef.current = timer

    return () => window.clearTimeout(timer)
  }, [board, mode, result, turn])

  const scoreLabels = mode === 'ai'
    ? [
        { key: 'playerWins', label: 'Kamu' },
        { key: 'draws', label: 'Seri' },
        { key: 'aiWins', label: 'AI' },
      ]
    : [
        { key: 'xWins', label: 'Player X' },
        { key: 'draws', label: 'Seri' },
        { key: 'oWins', label: 'Player O' },
      ]

  const totalThisMode = mode === 'ai'
    ? activeScore.playerWins + activeScore.aiWins + activeScore.draws
    : activeScore.xWins + activeScore.oWins + activeScore.draws

  return (
    <div className="space-y-6">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="badge">Game 2</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Tic Tac Toe</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Game strategi ringan dengan mode dua pemain atau lawan AI. Gunakan strategi terbaikmu untuk menang!
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
            <button
              className={`btn-ghost ${mode === 'pvp' ? 'bg-white/10 text-white' : ''}`}
              onClick={() => resetRound('pvp')}
              type="button"
            >
              Mode 2 pemain
            </button>
            <button
              className={`btn-ghost ${mode === 'ai' ? 'bg-white/10 text-white' : ''}`}
              onClick={() => resetRound('ai')}
              type="button"
            >
              Lawan AI
            </button>
            <button className="btn-ghost" onClick={() => resetRound()} type="button">
              Reset ronde
            </button>
            <button className="btn-ghost" onClick={clearStats} type="button">
              Hapus skor
            </button>
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</div>
          <div className="mt-2 text-sm leading-7 text-slate-200">{statusText}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {scoreLabels.map((item) => (
          <div key={item.label} className="stat-chip">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">{item.label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{activeScore[item.key]}</div>
          </div>
        ))}
      </section>

      <section className="flex justify-center">
        <div className="w-full max-w-[28rem]">
          <div className="ttt-board grid-cols-3">
            {board.map((cell, index) => {
              const isWinner = result?.line?.includes(index)
              const isTaken = Boolean(cell)

              return (
                <button
                  key={index}
                  className={`ttt-cell flex items-center justify-center text-5xl font-semibold text-white ${isTaken ? 'taken' : ''} ${isWinner ? 'winner' : ''}`}
                  onClick={() => handleCellClick(index)}
                  type="button"
                  aria-label={`Sel ${index + 1}${cell ? `, terisi ${cell}` : ', kosong'}`}
                >
                  {cell === 'X' && <span className="text-rose-300">X</span>}
                  {cell === 'O' && <span className="text-cyan-200">O</span>}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {result && (
        <section className="panel p-6 text-center sm:p-8">
          <div className="text-xs uppercase tracking-[0.32em] text-slate-400">Hasil ronde</div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {result.winner === 'draw'
              ? 'Permainan seri'
              : mode === 'ai'
                ? result.winner === 'X'
                  ? 'Kamu menang'
                  : 'AI menang'
                : result.winner === 'X'
                  ? 'Player X menang'
                  : 'Player O menang'}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={() => resetRound()} type="button">
              Main lagi
            </button>
            <Link to="/memory" className="btn-secondary">
              Coba Memory
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
