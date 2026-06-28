import type { Metadata } from 'next'
import { Bricolage_Grotesque, Hanken_Grotesk, Caveat } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const body = Hanken_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
})

const chalk = Caveat({
  variable: '--font-chalk',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Pupil — teach an AI student, find out what you actually understand',
  description:
    "You don't study — you teach a confused AI student that then sits an exam. Its score is your grade. The only way to win is to truly understand.",
  metadataBase: new URL('https://pupil.dhruvsa1.org'),
  openGraph: {
    title: 'Pupil — the student you teach takes your test',
    description:
      'Teach a believably-confused AI student, then watch it pass or fail an exam built from what you taught it.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${chalk.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
