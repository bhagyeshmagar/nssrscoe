import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('Main.tsx is loading...')

const rootElement = document.getElementById('root')

if (rootElement) {
  console.log('Root element found, mounting React...')
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('React render called')
} else {
  console.error('Root element not found!')
}
