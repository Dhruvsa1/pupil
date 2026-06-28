import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT'],
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
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
      className={`${fraunces.variable} ${hanken.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
