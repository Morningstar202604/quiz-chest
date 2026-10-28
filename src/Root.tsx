import { App } from './App'
import { useServiceWorker } from './hooks/useServiceWorker'

export function Root() {
  useServiceWorker()
  return <App />
}
