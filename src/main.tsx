import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import pandaFaceIcon from './assets/panda-face-nobg.png'
import './index.css'
import App from './App.tsx'

const faviconLink =
  document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
  document.head.appendChild(document.createElement('link'))
faviconLink.rel = 'icon'
faviconLink.type = 'image/png'
faviconLink.href = pandaFaceIcon

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
