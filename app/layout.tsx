import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CS Intel - Counter-Strike 2 Analysis & Betting Intelligence',
  description:
    'Match analysis, community insight, predictions and discussion for Counter-Strike 2 fans and bettors.',
  keywords:
    'Counter-Strike 2, CS2, esports, betting, analysis, predictions, community',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f1419] text-gray-100">
        {children}
      </body>
    </html>
  )
}
