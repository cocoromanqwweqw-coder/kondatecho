import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DisplayModeProvider } from './hooks/useDisplayMode.tsx'
import { enablePressFeedback } from './lib/haptic'

enablePressFeedback()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DisplayModeProvider>
      <App />
    </DisplayModeProvider>
  </StrictMode>,
)
