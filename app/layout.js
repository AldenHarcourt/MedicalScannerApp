import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary';

export const metadata = {
  title: 'Medical Device Scanner',
  description: 'Professional medical device scanning and inventory management application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Medical Device Scanner</title>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="bg-background text-text min-h-screen">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
} 