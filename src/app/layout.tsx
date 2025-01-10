import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Minesweeper 3D',
  description: 'A modern 3D Minesweeper game built with Next.js, Three.js, and Chakra UI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
