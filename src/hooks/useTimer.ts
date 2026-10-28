import { useEffect, useState } from 'react'
import { formatDuration } from '../lib/quiz'

export function useTimer(running: boolean): string {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return undefined
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  return formatDuration(elapsed)
}
