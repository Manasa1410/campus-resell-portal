import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'

const savedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark
document.documentElement.classList.toggle('dark', shouldUseDark)
document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </AuthProvider>,
)
