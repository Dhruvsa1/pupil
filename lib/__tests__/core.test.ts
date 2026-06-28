import { describe, it, expect } from 'vitest'
import {
  initBeliefState,
  pickSeeds,
  applyTurnGrading,
  masteryFraction,
  understandingScore,
} from '../belief'
import { deriveStudentAnswers, scoreExam } from '../scoring'
import type { ConceptSet, ExamQuestion, TurnGrading } from '../types'

const SET: ConceptSet = {
  topic_title: 'Recursion',
  subject: 'Computer Science',
  concepts: [
    {
      id: 'rec.base-case',
      name: 'Base case',
      truth: 'A base case stops the recursion.',
      summary: 'The condition that ends recursion.',
      prerequisite_ids: [],
      misconceptions: [
        {
          key: 'base-case-optional',
          claim: 'You can skip the base case.',
          tell: 'Says recursion just stops on its own.',
          resolves_when: 'Explains infinite recursion without a base case.',
        },
      ],
    },
    {
      id: 'rec.recursive-case',
      name: 'Recursive case',
      truth: 'Each call moves toward the base case.',
      summary: 'The step that reduces the problem.',
      prerequisite_ids: ['rec.base-case'],
      misconceptions: [
        {
          key: 'shared-variable',
          claim: 'All calls share one variable.',
          tell: 'Thinks one counter is mutated across calls.',
          resolves_when: 'Explains each call has its own stack frame.',
        },
      ],
    },
    {
      id: 'rec.trust',
      name: 'Recursive leap of faith',
      truth: 'Assume the recursive call works for smaller input.',
      summary: 'Trust the recursion on subproblems.',
      prerequisite_ids: ['rec.recursive-case'],
      misconceptions: [],
    },
  ],
}

const EXAM: ExamQuestion[] = [
  {
    id: 'q1',
    concept_id: 'rec.base-case',
    prompt: 'What happens without a base case?',
    options: [
      { key: 'a', text: 'Infinite recursion / stack overflow', kind: 'correct', misconception_key: null },
      {
        key: 'b',
        text: 'It stops on its own',
        kind: 'misconception',
        misconception_key: 'base-case-optional',
      },
      { key: 'c', text: 'It returns 0', kind: 'distractor', misconception_key: null },
    ],
  },
  {
    id: 'q2',
    concept_id: 'rec.recursive-case',
    prompt: 'Do recursive calls share one variable?',
    options: [
      { key: 'a', text: 'No — each has its own frame', kind: 'correct', misconception_key: null },
      {
        key: 'b',
        text: 'Yes — one shared counter',
        kind: 'misconception',
        misconception_key: 'shared-variable',
      },
      { key: 'c', text: 'Only globals', kind: 'distractor', misconception_key: null },
    ],
  },
  {
    id: 'q3',
    concept_id: 'rec.trust',
    prompt: 'What is the recursive leap of faith?',
    options: [
      { key: 'a', text: 'Assume the smaller call works', kind: 'correct', misconception_key: null },
      { key: 'b', text: 'Never trust recursion', kind: 'distractor', misconception_key: null },
    ],
  },
]

describe('initBeliefState + pickSeeds', () => {
  it('seeds misconceptions and marks the rest unknown', () => {
    const seeds = { 'rec.base-case': 'base-case-optional' }
    const state = initBeliefState(SET, seeds)
    expect(state['rec.base-case'].status).toBe('misconceived')
    expect(state['rec.base-case'].held_misconception).toBe('base-case-optional')
    expect(state['rec.recursive-case'].status).toBe('unknown')
    expect(state['rec.trust'].status).toBe('unknown')
  })

  it('pickSeeds only seeds concepts that have misconceptions', () => {
    const seeds = pickSeeds(SET, 3)
    for (const id of Object.keys(seeds)) {
      const c = SET.concepts.find((x) => x.id === id)!
      expect(c.misconceptions.length).toBeGreaterThan(0)
    }
    expect(Object.keys(seeds)).not.toContain('rec.trust')
  })
})

describe('applyTurnGrading', () => {
  const base = initBeliefState(SET, { 'rec.base-case': 'base-case-optional' })

  it('applies a valid transition and records the delta', () => {
    const grading: TurnGrading = {
      addressed_concept_ids: ['rec.base-case'],
      transitions: [
        {
          concept_id: 'rec.base-case',
          to_status: 'mastered',
          to_misconception: null,
          reason: 'Explained infinite recursion.',
        },
      ],
      student_reply: 'Oh! So without it, it never stops.',
      focus_concept_id: null,
    }
    const { next, delta } = applyTurnGrading(base, grading, SET)
    expect(next['rec.base-case'].status).toBe('mastered')
    expect(next['rec.base-case'].held_misconception).toBeNull()
    expect(delta).toHaveLength(1)
    expect(delta[0]).toMatchObject({ concept_id: 'rec.base-case', to: 'mastered' })
  })

  it('ignores hallucinated concept ids', () => {
    const grading: TurnGrading = {
      addressed_concept_ids: ['nope'],
      transitions: [
        { concept_id: 'totally.made.up', to_status: 'mastered', to_misconception: null, reason: 'x' },
      ],
      student_reply: '...',
      focus_concept_id: null,
    }
    const { next, delta } = applyTurnGrading(base, grading, SET)
    expect(delta).toHaveLength(0)
    expect(next).toEqual(base)
  })

  it('falls back when given an invalid misconception key', () => {
    const grading: TurnGrading = {
      addressed_concept_ids: ['rec.recursive-case'],
      transitions: [
        { concept_id: 'rec.recursive-case', to_status: 'misconceived', to_misconception: 'bogus', reason: 'x' },
      ],
      student_reply: '...',
      focus_concept_id: null,
    }
    const { next } = applyTurnGrading(base, grading, SET)
    expect(next['rec.recursive-case'].status).toBe('misconceived')
    expect(next['rec.recursive-case'].held_misconception).toBe('shared-variable') // first valid key
  })

  it('downgrades to partial if a concept has no misconceptions but model says misconceived', () => {
    const grading: TurnGrading = {
      addressed_concept_ids: ['rec.trust'],
      transitions: [
        { concept_id: 'rec.trust', to_status: 'misconceived', to_misconception: 'anything', reason: 'x' },
      ],
      student_reply: '...',
      focus_concept_id: null,
    }
    const { next } = applyTurnGrading(base, grading, SET)
    expect(next['rec.trust'].status).toBe('partial')
    expect(next['rec.trust'].held_misconception).toBeNull()
  })
})

describe('mastery metrics', () => {
  it('computes mastery fraction and understanding score', () => {
    let state = initBeliefState(SET, {})
    expect(masteryFraction(state)).toBe(0)
    expect(understandingScore(state)).toBe(0)
    state['rec.base-case'].status = 'mastered'
    state['rec.recursive-case'].status = 'partial'
    expect(masteryFraction(state)).toBeCloseTo(1 / 3)
    // (1 + 0.5 + 0) / 3 = 0.5 -> 50
    expect(understandingScore(state)).toBe(50)
  })
})

describe('exam taking + scoring (deterministic from belief)', () => {
  it('a perfectly-taught student aces it', () => {
    const state = initBeliefState(SET, {})
    for (const id of Object.keys(state)) state[id].status = 'mastered'
    const { result } = scoreExam(state, EXAM)
    expect(result.score).toBe(3)
    expect(result.max_score).toBe(3)
  })

  it('a misconceived student picks the wrong-model option and fails that question', () => {
    const state = initBeliefState(SET, { 'rec.base-case': 'base-case-optional' })
    for (const id of Object.keys(state)) {
      if (id !== 'rec.base-case') state[id].status = 'mastered'
    }
    const answers = deriveStudentAnswers(state, EXAM)
    const q1 = answers.find((a) => a.question_id === 'q1')!
    expect(q1.chosen_key).toBe('b') // the misconception option
    const { result } = scoreExam(state, EXAM)
    expect(result.score).toBe(2) // missed q1 only
    const q1res = result.results.find((r) => r.question_id === 'q1')!
    expect(q1res.correct).toBe(false)
    expect(q1res.attribution).toContain('base-case-optional')
  })

  it('an untaught (unknown) concept yields a wrong distractor answer', () => {
    const state = initBeliefState(SET, {}) // all unknown
    const answers = deriveStudentAnswers(state, EXAM)
    const q3 = answers.find((a) => a.question_id === 'q3')!
    expect(q3.chosen_key).toBe('b') // the only distractor
    const { result } = scoreExam(state, EXAM)
    expect(result.score).toBe(0)
  })
})
