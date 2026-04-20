import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '156012032169-1ndeglp6eaeli9fp6ai7t6slpsjrc794.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0a0e1a',
              color: '#f1f5f9',
              border: '1px solid #1e2942',
              boxShadow: '0 10px 40px rgba(6, 182, 212, 0.15)',
            },
          }}
        />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
