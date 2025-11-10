import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bria FIBO Studio',
  description: 'Brand-aware, JSON-native creative engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

