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
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <header className="rise flex items-center justify-between" style={{ animationDelay: '0ms' }}>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight">Pupil</span>
            <span className="h-2 w-2 rounded-full bg-coral" />
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-ink-faint">
            a mirror for what you understand
          </span>
        </header>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <section>
            <p
              className="rise text-xs uppercase tracking-[0.25em] text-copper"
              style={{ animationDelay: '60ms' }}
            >
              Instrument 01
            </p>
            <h1
              className="rise mt-4 text-balance text-5xl leading-[1.02] md:text-6xl"
              style={{ animationDelay: '120ms' }}
            >
              You don&apos;t study.
              <br />
              <span className="italic text-copper">You teach.</span>
            </h1>
            <p
              className="rise mt-6 max-w-md text-lg leading-relaxed text-ink-soft"
              style={{ animationDelay: '200ms' }}
            >
              Meet a student who genuinely doesn&apos;t get it — and holds the exact
              misconceptions real beginners hold. Teach them well and they pass an exam.
              Teach them badly and they fail. <span className="text-ink">Their score is yours.</span>{' '}
              There&apos;s no &ldquo;show answer&rdquo; — the only way to win is to actually understand.
            </p>

            <div className="rise mt-10" style={{ animationDelay: '280ms' }}>
              <label className="text-xs uppercase tracking-[0.2em] text-ink-faint">
                Or teach your own material
              </label>
              <div className="mt-3 rounded-lg border border-line bg-paper-card p-1">
                <textarea
                  ref={pasteRef}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Paste lecture notes, a textbook section, an article — anything you want to be able to explain…"
                  className="h-32 w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint"
                />
                <div className="flex items-center justify-between gap-3 px-3 pb-2">
                  <span className="text-xs text-ink-faint">
                    {source.trim().length < 80
                      ? `${80 - source.trim().length} more characters`
                      : 'ready'}
                  </span>
                  <button
                    disabled={source.trim().length < 80 || busy === 'custom'}
                    onClick={() => start({ kind: 'custom', source })}
                    className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition enabled:hover:bg-copper-deep disabled:opacity-30"
                  >
                    {busy === 'custom' ? 'Reading your material…' : 'Build a student →'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rise" style={{ animationDelay: '340ms' }}>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">
              Three students are waiting
            </p>
            <div className="mt-4 space-y-4">
              {topics === null
                ? [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-lg border border-line bg-paper-card/60"
                    />
                  ))
                : topics.map((t, i) => (
                    <button
                      key={t.slug}
                      onClick={() => start({ kind: 'builtin', topicSlug: t.slug })}
                      disabled={busy !== null}
                      className="group block w-full rounded-lg border border-line bg-paper-card p-5 text-left shadow-[0_2px_8px_rgba(33,28,23,0.04)] transition hover:-translate-y-0.5 hover:border-copper/50 hover:shadow-[0_8px_24px_rgba(33,28,23,0.08)] disabled:opacity-50"
                      style={{ rotate: `${i % 2 === 0 ? -0.4 : 0.5}deg` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.18em] text-copper">
                          {t.subject}
                        </span>
                        <span className="text-xs text-ink-faint">{t.concept_count} ideas</span>
                      </div>
                      <p className="mt-2 font-display text-xl">{t.title}</p>
                      <p className="mt-1.5 line-clamp-2 text-sm italic leading-snug text-ink-soft">
                        &ldquo;{t.blurb}&rdquo;
                      </p>
                      <span className="mt-3 inline-block text-sm font-medium text-ink transition group-hover:text-copper">
                        {busy === t.slug ? 'Waking them up…' : 'Teach them →'}
                      </span>
                    </button>
                  ))}
            </div>
          </section>
        </div>

        {error && (
          <div className="mt-8 rounded-md border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        <footer className="mt-20 border-t border-line pt-6 text-xs text-ink-faint">
          Built by{' '}
          <a className="underline decoration-copper/40 hover:text-copper" href="https://dhruvsa1.org">
            Dhruvsai Dhulipudi
          </a>
          . No account, no setup — your sessions stay on this device.
        </footer>
      </div>
    </main>
  )
}
