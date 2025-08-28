import type { AppProps } from 'next/app'
import { ThemeProvider } from '@/contexts/ThemeContext'
import '../app/globals.css'
import '../styles/visualizations.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  )
} 