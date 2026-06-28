import { q, q1 } from './db'
import { initBeliefState, pickSeeds, applyTurnGrading } from './belief'
import { scoreExam } from './scoring'
import {
  generateConceptSet,
  generateExam,
  gradeTurn,
  seedStudent,
} from './prompts'
import type {
  BeliefState,
  ConceptSet,
  ExamQuestion,
  SessionRow,
} from './types'

export interface TopicRow {
  id: string
  slug: string
  title: string
  subject: string
  blurb: string
  concept_set: ConceptSet
  exam: { questions: ExamQuestion[] }
  is_featured: boolean
  sort_order: number
}

export async function getTopics(): Promise<TopicRow[]> {
  return q<TopicRow>(
    `select id, slug, title, subject, blurb, concept_set, exam, is_featured, sort_order
     from pupil.topics order by sort_order asc, title asc`,
  )
}

export async function getTopicBySlug(slug: string): Promise<TopicRow | null> {
  return q1<TopicRow>(
    `select id, slug, title, subject, blurb, concept_set, exam, is_featured, sort_order
     from pupil.topics where slug = $1`,
    [slug],
  )
}

export interface TurnRow {
  id: string
  role: 'teacher' | 'student' | 'system'
  content: string
  grading: unknown
  belief_delta: unknown
  created_at: string
}

/** Create a session — instant for built-in topics (no LLM), one call for custom material. */
export async function createSession(args: {
  anonOwner: string
  kind: 'builtin' | 'custom'
  topicSlug?: string
  source?: string
}): Promise<SessionRow> {
  const { anonOwner, kind } = args
  let conceptSet: ConceptSet
  let title: string
  let topicId: string | null = null
  let customSource: string | null = null

  if (kind === 'builtin') {
    if (!args.topicSlug) throw new Error('topicSlug required for builtin')
    const topic = await getTopicBySlug(args.topicSlug)
    if (!topic) throw new Error('Unknown topic')
    conceptSet = topic.concept_set
    title = topic.title
    topicId = topic.id
  } else {
    const source = (args.source ?? '').trim()
    if (source.length < 80) {
      throw new Error('Please paste at least a paragraph of material to teach.')
    }
    conceptSet = await generateConceptSet(source)
    title = conceptSet.topic_title
    customSource = source.slice(0, 20000)
  }

  const seeds = pickSeeds(conceptSet, 3)
  const belief: BeliefState = initBeliefState(conceptSet, seeds)
  const student = await seedStudent(conceptSet)

  const row = await q1<SessionRow>(
    `insert into pupil.sessions
       (anon_owner, topic_id, source_kind, title, custom_source, concept_set, student_name, belief_state, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'teaching')
     returning *`,
    [
      anonOwner,
      topicId,
      kind,
      title,
      customSource,
      JSON.stringify(conceptSet),
      student.name,
      JSON.stringify(belief),
    ],
  )
  if (!row) throw new Error('Failed to create session')

  // opening line from the student
  await q(
    `insert into pupil.turns (session_id, role, content) values ($1,'system',$2)`,
    [row.id, student.blurb],
  )
  return row
}

export async function getSession(
  id: string,
  anonOwner: string,
): Promise<{ session: SessionRow; turns: TurnRow[] } | null> {
  const session = await q1<SessionRow>(
    `select * from pupil.sessions where id = $1 and anon_owner = $2`,
    [id, anonOwner],
  )
  if (!session) return null
  const turns = await q<TurnRow>(
    `select id, role, content, grading, belief_delta, created_at
     from pupil.turns where session_id = $1 order by created_at asc`,
    [id],
  )
  return { session, turns }
}

export async function getSessionsForOwner(anonOwner: string): Promise<SessionRow[]> {
  return q<SessionRow>(
    `select * from pupil.sessions where anon_owner = $1 order by created_at desc limit 30`,
    [anonOwner],
  )
}

/** Run one teaching turn: persist teacher msg, grade, update belief, persist student reply. */
export async function runTurn(
  id: string,
  anonOwner: string,
  message: string,
): Promise<{ belief: BeliefState; studentReply: string; focus: string | null }> {
  const data = await getSession(id, anonOwner)
  if (!data) throw new Error('Session not found')
  const { session, turns } = data
  if (session.status !== 'teaching') throw new Error('Session already examined')

  const recent = turns
    .filter((t) => t.role === 'teacher' || t.role === 'student')
    .slice(-8)
    .map((t) => ({ role: t.role as 'teacher' | 'student', content: t.content }))

  await q(`insert into pupil.turns (session_id, role, content) values ($1,'teacher',$2)`, [
    id,
    message,
  ])

  const grading = await gradeTurn({
    set: session.concept_set,
    belief: session.belief_state,
    studentName: session.student_name,
    recent,
    teacherMessage: message,
  })

  const { next, delta } = applyTurnGrading(session.belief_state, grading, session.concept_set)

  await q(
    `insert into pupil.turns (session_id, role, content, grading, belief_delta)
     values ($1,'student',$2,$3,$4)`,
    [id, grading.student_reply, JSON.stringify(grading), JSON.stringify(delta)],
  )
  await q(
    `update pupil.sessions set belief_state = $1, updated_at = now() where id = $2`,
    [JSON.stringify(next), id],
  )

  return { belief: next, studentReply: grading.student_reply, focus: grading.focus_concept_id }
}

/** Take the exam: derive answers + score deterministically from the final belief-state. */
export async function runExam(
  id: string,
  anonOwner: string,
): Promise<{
  questions: ExamQuestion[]
  answers: ReturnType<typeof scoreExam>['answers']
  result: ReturnType<typeof scoreExam>['result']
}> {
  const data = await getSession(id, anonOwner)
  if (!data) throw new Error('Session not found')
  const { session } = data

  // exam: from built-in topic if present, else generate + cache on the session's topic? (custom: generate)
  let questions: ExamQuestion[]
  if (session.topic_id) {
    const topic = await q1<TopicRow>(`select exam from pupil.topics where id = $1`, [
      session.topic_id,
    ])
    questions = topic?.exam.questions ?? (await generateExam(session.concept_set))
  } else {
    questions = await generateExam(session.concept_set)
  }

  const { answers, result } = scoreExam(session.belief_state, questions)

  await q(
    `insert into pupil.exams (session_id, questions, student_answers, results, score, max_score)
     values ($1,$2,$3,$4,$5,$6)`,
    [
      id,
      JSON.stringify(questions),
      JSON.stringify(answers),
      JSON.stringify(result.results),
      result.score,
      result.max_score,
    ],
  )
  await q(`update pupil.sessions set status = 'examined', updated_at = now() where id = $1`, [id])

  return { questions, answers, result }
}
