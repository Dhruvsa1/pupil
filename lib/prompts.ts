import { generateJSON } from './anthropic'
import {
  zConceptSet,
  zExam,
  zTurnGrading,
  zStudent,
} from './schemas'
import type {
  BeliefState,
  ConceptSet,
  ExamQuestion,
  TurnGrading,
} from './types'

/** Build a concept set (belief-graph) from arbitrary pasted material. */
export async function generateConceptSet(source: string): Promise<ConceptSet> {
  const system = `You are a learning-science engine that turns study material into a
"concept set" used to simulate a confused student. For the given material, identify the
4–7 LOAD-BEARING concepts a learner must actually understand (not trivia). Order them
roughly by dependency (prerequisites first).

For EACH concept provide:
- id: short stable slug (e.g. "recursion.base-case")
- name: short human name
- truth: the correct mental model in ONE clear sentence
- summary: a one-line learner-facing description
- prerequisite_ids: ids of concepts in THIS set that must come first (only ids you define)
- misconceptions: 1–2 SPECIFIC, COMMON wrong-models real beginners hold. Each has:
    - key: short slug (e.g. "base-case-optional")
    - claim: the wrong belief in the student's own voice
    - tell: how a student behaves/answers while holding it
    - resolves_when: what an explanation must establish to dislodge it

Make misconceptions realistic and structured (the kind a real confused person holds),
never random. Keep everything faithful to the material.`

  return generateJSON<ConceptSet>({
    schema: zConceptSet,
    system,
    prompt: `Build the concept set for this material:\n\n"""\n${source.slice(0, 12000)}\n"""`,
    maxTokens: 8000,
    effort: 'high',
  })
}

/** Generate a tagged multiple-choice exam from a concept set. */
export async function generateExam(set: ConceptSet): Promise<ExamQuestion[]> {
  const system = `You write a short diagnostic exam for a concept set. Produce ONE
multiple-choice question per concept (so N questions for N concepts). Each question has
3–4 options. Exactly one option is the truth (kind:"correct"). For every misconception the
concept defines, include one option that encodes THAT wrong-model (kind:"misconception",
misconception_key set to the concept's misconception key). Fill remaining slots with
plausible generic wrong answers (kind:"distractor", misconception_key:null).

Question id: "q1","q2",... concept_id MUST match a concept id in the set. Options keyed
"a","b","c","d". Make the misconception options genuinely tempting, not obviously wrong.`

  const { questions } = await generateJSON<{ questions: ExamQuestion[] }>({
    schema: zExam,
    system,
    prompt: `Concept set:\n${JSON.stringify(set)}`,
    maxTokens: 8000,
    effort: 'high',
  })
  return questions
}

/** Seed a student persona (name + one-line personality). */
export async function seedStudent(set: ConceptSet): Promise<{ name: string; blurb: string }> {
  return generateJSON<{ name: string; blurb: string }>({
    schema: zStudent,
    prompt: `Invent a believable student learning "${set.topic_title}" (${set.subject}).
Give a first name and a one-line personality (curious, a little anxious, asks "wait, but…"
questions). Keep it warm and human. No surnames.`,
    maxTokens: 1000,
    effort: 'low',
    thinking: false,
  })
}

/** Grade one teaching turn and produce the student's in-character reply. */
export async function gradeTurn(args: {
  set: ConceptSet
  belief: BeliefState
  studentName: string
  recent: { role: 'teacher' | 'student'; content: string }[]
  teacherMessage: string
}): Promise<TurnGrading> {
  const { set, belief, studentName, recent, teacherMessage } = args

  const system = `You simulate ${studentName}, a student being TAUGHT a topic by the user.
You are given the concept set (the truths and the specific misconceptions ${studentName}
may hold) and ${studentName}'s CURRENT belief-state. Your job each turn:

1. GRADE the teacher's latest explanation against the belief-state. Decide which concept(s)
   it addressed. For each, set the new status:
   - "mastered": the explanation clearly established the truth AND (if a misconception was
     held) satisfied that misconception's resolves_when.
   - "partial": partially correct / incomplete / a bit hand-wavy.
   - "misconceived": the explanation left (or introduced) a specific misconception — set
     to_misconception to that concept's misconception key.
   - "unknown": not yet taught.
   Only move a concept toward mastery if the explanation genuinely earns it. Do NOT be
   generous: a vague or out-of-order explanation should NOT master a concept. If the teacher
   skips a prerequisite, ${studentName} stays confused on the dependent concept.

2. REPLY in character as ${studentName}, conditioned on the RESULTING belief-state:
   - If a concept is still misconceived, reveal that misconception naturally ("wait, so
     does that mean…?") — let the held wrong-model show.
   - If something just clicked, show a genuine "ohh" and maybe restate it (sometimes
     slightly imperfectly).
   - Then ask the confused-beginner question implied by the next thing ${studentName} is
     stuck on. Be authentic, a little informal. 1–4 sentences.
   - NEVER reveal knowledge beyond the belief-state. You are not a teacher; you are learning.

Rules: only use concept ids that exist in the set. Only use misconception keys that the
relevant concept defines. Output strictly per the schema.`

  const prompt = `CONCEPT SET:
${JSON.stringify(set)}

CURRENT BELIEF STATE:
${JSON.stringify(belief)}

RECENT CONVERSATION (oldest→newest):
${recent.map((t) => `${t.role === 'teacher' ? 'TEACHER' : studentName.toUpperCase()}: ${t.content}`).join('\n')}

TEACHER'S NEW EXPLANATION:
"${teacherMessage}"

Grade it and respond as ${studentName}.`

  return generateJSON<TurnGrading>({
    schema: zTurnGrading,
    system,
    prompt,
    maxTokens: 6000,
    effort: 'medium',
  })
}
