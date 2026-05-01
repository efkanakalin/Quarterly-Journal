import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { MISSING_SUPABASE_ENV } from './lib/supabase'

const root = createRoot(document.getElementById('root')!)

if (MISSING_SUPABASE_ENV) {
  // Build sırasında veya deploy ortamında VITE_SUPABASE_URL /
  // VITE_SUPABASE_ANON_KEY eksikse beyaz ekran yerine net mesaj göster.
  root.render(
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#e5e7eb',
    }}>
      <div style={{
        maxWidth: 560, width: '100%', padding: '24px', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)', background: '#141414',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#fff' }}>
          Configuration error
        </h1>
        <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.6 }}>
          The deployment is missing <code style={codeStyle}>VITE_SUPABASE_URL</code> or{' '}
          <code style={codeStyle}>VITE_SUPABASE_ANON_KEY</code>. Without these the app cannot
          reach its database.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
          Add both variables under your hosting provider's project settings (Cloudflare Pages →
          Settings → Variables and Secrets), then trigger a new deploy. After redeploy this
          page will load normally.
        </p>
      </div>
    </div>
  )
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

const codeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontSize: 12,
}
