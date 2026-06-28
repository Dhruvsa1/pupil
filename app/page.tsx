'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { anonOwner } from '@/lib/anon'

interface TopicCard {
  slug: string
  title: string
  subject: string
  blurb: string
  concept_count: number
}

const DOODLE: Record<string, string> = {
  recursion: '/art/doodle-recursion.jpg',
  'bayes-theorem': '/art/doodle-bayes.jpg',
  photosynthesis: '/art/doodle-photo.jpg',
}

export default function Home() {
  const router = useRouter()
  const [topics, setTopics] = useState<TopicCard[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState('')
  const pasteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/topics')
      .then((r) => r.json())
      .then((d) => setTopics(d.topics ?? []))
      .catch(() => setTopics([]))
  }, [])

  async function start(payload: { kind: 'builtin' | 'custom'; topicSlug?: string; source?: string }) {
    setError(null)
    setBusy(payload.topicSlug ?? 'custom')
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anonOwner: anonOwner(), ...payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      router.push(`/teach/${data.id}`)
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      {/* chalk header */}
      <header className="rise flex items-center justify-between" style={{ animationDelay: '0ms' }}>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-semibold tracking-tight text-chalk">Pupil</span>
          <span className="chalk text-xl text-coral">— teach to learn</span>
        </div>
        <span className="hidden text-xs uppercase tracking-[0.22em] text-chalk-faint sm:block">
          a mirror for what you understand
        </span>
      </header>

      {/* hero */}
      <section className="mt-12 grid items-center gap-10 md:mt-16 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
        <div>
          <p
            className="rise chalk text-2xl text-cyan"
            style={{ animationDelay: '80ms' }}
          >
            today&apos;s lesson
          </p>
          <h1
            className="rise mt-2 text-5xl leading-[0.98] text-chalk md:text-7xl"
            style={{ animationDelay: '150ms' }}
          >
            You don&apos;t study.
            <br />
            <span className="relative inline-block">
              You teach.
              <svg
                className="absolute -bottom-3 left-0 w-full"
                height="16"
                viewBox="0 0 320 16"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  className="chalk-draw"
                  style={{ ['--len' as string]: '340' }}
                  d="M3 9C60 4 130 12 318 6"
                  stroke="var(--coral)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p
            className="rise mt-7 max-w-md text-lg leading-relaxed text-chalk-soft"
            style={{ animationDelay: '240ms' }}
          >
            Meet a student who genuinely doesn&apos;t get it — and holds the exact
            misconceptions real beginners hold. Teach them well and they pass an exam.
            Teach them badly and they fail.{' '}
            <span className="text-chalk">Their score is yours.</span>{' '}There&apos;s no
            &ldquo;show answer&rdquo; — the only way to win is to actually understand.
          </p>

          <div className="rise mt-9" style={{ animationDelay: '320ms' }}>
            <label className="chalk text-lg text-chalk-faint">or bring your own material to the board</label>
            <div className="mt-2 rounded-xl border border-line bg-slate-card/70 p-1 backdrop-blur-sm">
              <textarea
                ref={pasteRef}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Paste lecture notes, a textbook section, an article…"
                className="h-28 w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-chalk outline-none placeholder:text-chalk-faint"
              />
              <div className="flex items-center justify-between gap-3 px-3 pb-2">
                <span className="text-xs text-chalk-faint">
                  {source.trim().length < 80 ? `${80 - source.trim().length} more characters` : 'ready'}
                </span>
                <button
                  disabled={source.trim().length < 80 || busy === 'custom'}
                  onClick={() => start({ kind: 'custom', source })}
                  className="rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-slate transition enabled:hover:bg-coral-deep disabled:opacity-30"
                >
                  {busy === 'custom' ? 'Reading your material…' : 'Build a student →'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* the chalk-head signature */}
        <div className="rise relative" style={{ animationDelay: '420ms' }}>
          <div className="overflow-hidden rounded-2xl border border-line shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/art/hero.jpg"
              alt="A mind drawn in chalk, ideas connecting outward from one understood point"
              className="block w-full"
              width={1280}
              height={1024}
            />
          </div>
          <span className="chalk absolute -right-2 top-4 rotate-6 text-xl text-cyan md:text-2xl">
            what they actually know ↑
          </span>
        </div>
      </section>

      {/* students */}
      <section className="mt-20">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <h2 className="font-display text-xl text-chalk">Students at the board</h2>
          <span className="chalk text-lg text-chalk-faint">pick one to teach</span>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics === null
            ? [0, 1, 2].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl border border-line bg-slate-card/40" />
              ))
            : topics.map((t, i) => (
                <button
                  key={t.slug}
                  onClick={() => start({ kind: 'builtin', topicSlug: t.slug })}
                  disabled={busy !== null}
                  className="rise group flex flex-col rounded-xl border border-line bg-slate-card/60 p-5 text-left backdrop-blur-sm transition hover:-translate-y-1 hover:border-coral/50 hover:bg-slate-card disabled:opacity-50"
                  style={{ animationDelay: `${500 + i * 90}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-cyan">{t.subject}</span>
                      <p className="mt-1 font-display text-xl text-chalk">{t.title}</p>
                    </div>
                    {DOODLE[t.slug] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={DOODLE[t.slug]}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg object-cover opacity-90 transition group-hover:opacity-100"
                        width={768}
                        height={768}
                      />
                    )}
                  </div>
                  <p className="chalk mt-3 flex-1 text-lg leading-snug text-chalk-soft">
                    &ldquo;{t.blurb}&rdquo;
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-chalk transition group-hover:text-coral">
                    {busy === t.slug ? 'Waking them up…' : 'Teach them →'}
                  </span>
                </button>
              ))}
        </div>
      </section>

      {error && (
        <div className="mt-8 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      <footer className="mt-20 border-t border-line pt-6 text-xs text-chalk-faint">
        Built by{' '}
        <a className="text-chalk-soft underline decoration-coral/40 hover:text-coral" href="https://dhruvsa1.org">
          Dhruvsai Dhulipudi
        </a>
        . No account, no setup — your sessions stay on this device.
      </footer>
    </main>
  )
}
