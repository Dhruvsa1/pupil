'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { anonOwner } from '@/lib/anon'
import type {
  BeliefState,
  ConceptSet,
  ExamQuestion,
  ExamResult,
  StudentAnswer,
} from '@/lib/types'

type Status = 'unknown' | 'misconceived' | 'partial' | 'mastered'

const STATUS_META: Record<Status, { label: string; color: string; fill: number }> = {
  unknown: { label: 'not taught', color: 'var(--s-unknown)', fill: 0.08 },
  misconceived: { label: 'confused', color: 'var(--s-misconceived)', fill: 0.33 },
  partial: { label: 'getting there', color: 'var(--s-partial)', fill: 0.66 },
  mastered: { label: 'mastered', color: 'var(--s-mastered)', fill: 1 },
}

interface Msg {
  role: 'teacher' | 'student' | 'system'
  content: string
}

interface ExamData {
  questions: ExamQuestion[]
  answers: StudentAnswer[]
  result: ExamResult
}

export default function TeachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [owner, setOwner] = useState('')
  const [set, setSet] = useState<ConceptSet | null>(null)
  const [belief, setBelief] = useState<BeliefState>({})
  const [studentName, setStudentName] = useState('')
  const [status, setStatus] = useState<'teaching' | 'examined'>('teaching')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [examining, setExamining] = useState(false)
  const [exam, setExam] = useState<ExamData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [turnError, setTurnError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOwner(anonOwner())
  }, [])

  useEffect(() => {
    if (!owner) return
    fetch(`/api/sessions/${id}?owner=${owner}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true)
          return null
        }
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        return d
      })
      .then((d) => {
        if (!d) return
        setSet(d.session.concept_set)
        setBelief(d.session.belief_state)
        setStudentName(d.session.student_name)
        setStatus(d.session.status)
        setMsgs(
          d.turns
            .filter((t: Msg) => t.role !== undefined)
            .map((t: { role: Msg['role']; content: string }) => ({
              role: t.role,
              content: t.content,
            })),
        )
      })
      .catch((e) => setLoadError(e.message))
  }, [owner, id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, sending])

  async function send() {
    const message = input.trim()
    if (!message || sending) return
    setInput('')
    setTurnError(null)
    setMsgs((m) => [...m, { role: 'teacher', content: message }])
    setSending(true)
    try {
      const res = await fetch(`/api/sessions/${id}/turn`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anonOwner: owner, message }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'The student got confused — try again.')
      setBelief(d.belief)
      setMsgs((m) => [...m, { role: 'student', content: d.studentReply }])
    } catch (e) {
      setTurnError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  async function giveExam() {
    if (examining) return
    setExamining(true)
    setTurnError(null)
    try {
      const res = await fetch(`/api/sessions/${id}/exam`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anonOwner: owner }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not run the exam.')
      setExam(d)
      setStatus('examined')
    } catch (e) {
      setTurnError((e as Error).message)
    } finally {
      setExamining(false)
    }
  }

  if (notFound) {
    return (
      <Centered>
        <p className="font-display text-2xl">This session isn&apos;t on this device.</p>
        <p className="mt-2 text-ink-soft">Sessions are stored locally, with no account.</p>
        <Link href="/" className="mt-6 inline-block text-copper underline">
          ← Start a new one
        </Link>
      </Centered>
    )
  }
  if (loadError) {
    return (
      <Centered>
        <p className="font-display text-2xl">Something went wrong</p>
        <p className="mt-2 text-coral">{loadError}</p>
        <Link href="/" className="mt-6 inline-block text-copper underline">
          ← Back
        </Link>
      </Centered>
    )
  }
  if (!set) {
    return (
      <Centered>
        <div className="flex gap-1.5">
          <span className="thinking-dot h-2.5 w-2.5 rounded-full bg-copper" />
          <span className="thinking-dot h-2.5 w-2.5 rounded-full bg-copper" />
          <span className="thinking-dot h-2.5 w-2.5 rounded-full bg-copper" />
        </div>
        <p className="mt-4 text-ink-soft">Waking up your student…</p>
      </Centered>
    )
  }

  const concepts = set.concepts
  const masteredCount = Object.values(belief).filter((b) => b.status === 'mastered').length
  const taughtEnough = msgs.filter((m) => m.role === 'teacher').length >= 2

  return (
    <main className="flex-1">
      <div className="mx-auto grid h-[100dvh] max-w-6xl grid-rows-[auto_1fr] px-4 md:px-6">
        {/* header */}
        <header className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-lg">Pupil</span>
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          </Link>
          <div className="text-right">
            <p className="text-sm">
              Teaching <span className="font-medium text-copper">{studentName}</span> ·{' '}
              <span className="text-ink-soft">{set.topic_title}</span>
            </p>
          </div>
        </header>

        <div className="grid min-h-0 gap-5 pb-4 md:grid-cols-[300px_1fr]">
          {/* understanding panel */}
          <aside className="hidden min-h-0 flex-col rounded-xl border border-line bg-paper-card/70 p-5 md:flex">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg">Understanding</h2>
              <span className="text-sm text-ink-faint">
                {masteredCount}/{concepts.length}
              </span>
            </div>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              {concepts.map((c) => {
                const b = belief[c.id]
                const st = (b?.status ?? 'unknown') as Status
                const meta = STATUS_META[st]
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      <span
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
                      <div
                        className="h-full origin-left rounded-full transition-[width] duration-700 ease-out"
                        style={{ width: `${meta.fill * 100}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              onClick={giveExam}
              disabled={examining || status === 'examined'}
              className="mt-5 w-full rounded-md bg-copper px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-copper-deep disabled:opacity-40"
              title={!taughtEnough ? 'Teach a little first' : undefined}
            >
              {status === 'examined'
                ? 'Exam complete'
                : examining
                  ? 'Sitting the exam…'
                  : 'Give them the exam →'}
            </button>
            {!taughtEnough && status !== 'examined' && (
              <p className="mt-2 text-center text-xs text-ink-faint">
                You can test any time — but teach a bit first.
              </p>
            )}
          </aside>

          {/* chat */}
          <section className="flex min-h-0 flex-col rounded-xl border border-line bg-paper-card/40">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {msgs.map((m, i) => (
                <Bubble key={i} role={m.role} name={studentName}>
                  {m.content}
                </Bubble>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-ink-faint">
                  <span className="text-xs">{studentName} is thinking</span>
                  <span className="flex gap-1">
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink-faint" />
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink-faint" />
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ink-faint" />
                  </span>
                </div>
              )}
              {turnError && (
                <p className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
                  {turnError}
                </p>
              )}
            </div>

            {/* mobile exam button */}
            <div className="border-t border-line p-2 md:hidden">
              <button
                onClick={giveExam}
                disabled={examining || status === 'examined'}
                className="w-full rounded-md bg-copper px-4 py-2 text-sm font-medium text-paper disabled:opacity-40"
              >
                {status === 'examined' ? 'Exam complete' : examining ? 'Sitting the exam…' : 'Give the exam →'}
              </button>
            </div>

            {status !== 'examined' && (
              <div className="border-t border-line p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    rows={1}
                    placeholder={`Explain something to ${studentName}…`}
                    className="max-h-40 min-h-[44px] flex-1 resize-none rounded-md border border-line bg-paper px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-copper/60"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="h-11 rounded-md bg-ink px-4 text-sm font-medium text-paper transition enabled:hover:bg-copper-deep disabled:opacity-30"
                  >
                    Teach
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {exam && (
        <Scorecard
          studentName={studentName}
          set={set}
          exam={exam}
          onClose={() => setExam(null)}
        />
      )}
    </main>
  )
}

function Bubble({
  role,
  name,
  children,
}: {
  role: Msg['role']
  name: string
  children: React.ReactNode
}) {
  if (role === 'teacher') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-sm leading-relaxed text-paper">
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <span className="ml-1 text-[11px] uppercase tracking-wide text-copper">
          {role === 'system' ? name : name}
        </span>
        <div className="mt-1 rounded-2xl rounded-bl-sm border border-line bg-paper px-4 py-2.5 text-sm leading-relaxed text-ink">
          {children}
        </div>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="text-center">{children}</div>
    </main>
  )
}

function Scorecard({
  studentName,
  set,
  exam,
  onClose,
}: {
  studentName: string
  set: ConceptSet
  exam: ExamData
  onClose: () => void
}) {
  const { result, questions } = exam
  const pct = Math.round((result.score / result.max_score) * 100)
  const passed = pct >= 70
  const conceptName = (cid: string) => set.concepts.find((c) => c.id === cid)?.name ?? cid
  const weak = result.results.filter((r) => !r.correct)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
      <div className="rise my-8 w-full max-w-lg rounded-2xl border border-line bg-paper-card p-7 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">Scorecard</p>
            <h2 className="mt-1 font-display text-2xl">
              {studentName} {passed ? 'passed' : 'struggled'}
            </h2>
          </div>
          <div className="text-right">
            <p
              className="font-display text-5xl leading-none"
              style={{ color: passed ? 'var(--s-mastered)' : 'var(--s-misconceived)' }}
            >
              {pct}
              <span className="text-2xl">%</span>
            </p>
            <p className="text-xs text-ink-faint">
              {result.score}/{result.max_score} correct
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {passed
            ? `You taught well enough that ${studentName} could answer on their own. That's the real test — they only know what you actually transferred.`
            : `${studentName} only knows what you managed to transfer. The gaps below are exactly what you couldn't yet explain — that's your study list.`}
        </p>

        <div className="mt-6 space-y-2.5">
          {result.results.map((r, i) => (
            <div
              key={r.question_id}
              className="flex items-start gap-3 rounded-lg border border-line bg-paper px-3 py-2.5"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs text-paper"
                style={{ background: r.correct ? 'var(--s-mastered)' : 'var(--s-misconceived)' }}
              >
                {r.correct ? '✓' : '✕'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{conceptName(r.concept_id)}</p>
                <p className="text-xs text-ink-soft">
                  Q{i + 1}: {questions.find((q) => q.id === r.question_id)?.prompt}
                </p>
                <p
                  className="mt-0.5 text-[11px]"
                  style={{ color: r.correct ? 'var(--s-mastered)' : 'var(--s-misconceived)' }}
                >
                  {r.attribution}
                </p>
              </div>
            </div>
          ))}
        </div>

        {weak.length > 0 && (
          <div className="mt-5 rounded-lg border border-coral/30 bg-coral/5 p-4">
            <p className="text-xs uppercase tracking-wide text-coral">Your study list</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {weak.map((r) => (
                <li key={r.question_id}>
                  · <span className="text-ink">{conceptName(r.concept_id)}</span> — you never
                  fully closed this gap.
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm text-ink-soft underline hover:text-ink">
            Review the conversation
          </button>
          <Link
            href="/"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-copper-deep"
          >
            Teach again to beat your score →
          </Link>
        </div>
      </div>
    </div>
  )
}
