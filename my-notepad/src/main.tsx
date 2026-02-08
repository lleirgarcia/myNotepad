import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'
import AuthCallback from './pages/AuthCallback.tsx'
import Landing from './pages/Landing.tsx'
import NativeAppShell from './pages/NativeAppShell.tsx'
import Pricing from './pages/Pricing.tsx'
import Terms from './pages/Terms.tsx'
import Privacy from './pages/Privacy.tsx'

const isNative = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        {isNative ? (
          <>
            <Route path="/" element={<NativeAppShell />} />
            <Route path="/app" element={<NativeAppShell />} />
            <Route path="*" element={<NativeAppShell />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<App />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
