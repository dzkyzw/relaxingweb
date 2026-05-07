import { useEffect, useMemo, useState } from 'react'

function pad(value) {
  return String(value).padStart(2, '0')
}

function getGreeting(hour) {
  if (hour >= 4 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return useMemo(() => {
    const hour = now.getHours()
    const minute = now.getMinutes()
    const second = now.getSeconds()

    return {
      greeting: getGreeting(hour),
      period: hour >= 4 && hour < 11 ? 'Pagi' : hour >= 11 && hour < 15 ? 'Siang' : hour >= 15 && hour < 18 ? 'Sore' : 'Malam',
      timeLabel: `${pad(hour)}:${pad(minute)}:${pad(second)}`,
      dateLabel: now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      shortDateLabel: now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    }
  }, [now])
}
