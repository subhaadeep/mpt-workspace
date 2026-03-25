import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'MPT Workspace',
  description: 'Modular Platform for Trading & Content',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} bg-[#0a0f1a] text-slate-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
