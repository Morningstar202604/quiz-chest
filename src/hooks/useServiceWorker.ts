import { useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function useServiceWorker(): void {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    registerSW({ immediate: true })
  }, [])
}
