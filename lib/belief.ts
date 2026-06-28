import type {
  BeliefState,
  ConceptBelief,
  ConceptSet,
  TurnGrading,
} from './types'

/**
 * Build the student's initial belief-state for a concept set.
 * `seeds` maps concept_id -> misconception key the student starts out holding.
 * Every other concept starts `unknown`.
 */
export function initBeliefState(
  set: ConceptSet,
  seeds: Record<string, string>,
): BeliefState {
  const state: BeliefState = {}
  for (const c of set.concepts) {
    const seededKey = seeds[c.id]
    if (seededKey && c.misconceptions.some((m) => m.key === seededKey)) {
      const m = c.misconceptions.find((mm) => mm.key === seededKey)!
      state[c.id] = {
        concept_id: c.id,
        status: 'misconceived',
        held_misconception: seededKey,
        note: m.claim,
      }
    } else {
      state[c.id] = {
        concept_id: c.id,
        status: 'unknown',
        held_misconception: null,
        note: '',
      }
    }
  }
  return state
}

/**
 * Deterministically choose which concepts the student starts out *misconceiving*.
 * Picks up to `n` concepts that have at least one misconception, spread across the
 * set, each seeded with its first listed (most common) misconception.
 * Authors/LLM can override; this is the safe default.
 */
export function pickSeeds(set: ConceptSet, n = 3): Record<string, string> {
  const withMis = set.concepts.filter((c) => c.misconceptions.length > 0)
  if (withMis.length === 0) return {}
  const count = Math.min(n, withMis.length)
  // spread: take evenly-spaced indices so seeds aren't all clustered at the top
  const seeds: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    const idx = Math.floor((i * withMis.length) / count)
    const c = withMis[idx]
    seeds[c.id] = c.misconceptions[0].key
  }
  return seeds
}

export interface BeliefDeltaEntry {
  concept_id: string
  from: ConceptBelief['status'] | null
  to: ConceptBelief['status']
  to_misconception: string | null
}

/**
 * Apply one graded teaching turn to the belief-state. Pure: returns a new state
 * plus the list of changes. Invalid concept ids and invalid misconception keys are
 * defended against so a hallucinated grading can never corrupt the state.
 */
export function applyTurnGrading(
  state: BeliefState,
  grading: TurnGrading,
  set: ConceptSet,
): { next: BeliefState; delta: BeliefDeltaEntry[] } {
  const conceptById = new Map(set.concepts.map((c) => [c.id, c]))
  const next: BeliefState = structuredClone(state)
  const delta: BeliefDeltaEntry[] = []

  for (const t of grading.transitions ?? []) {
    const concept = conceptById.get(t.concept_id)
    if (!concept) continue // ignore hallucinated concept ids

    let toStatus = t.to_status
    let toMis: string | null = null

    if (toStatus === 'misconceived') {
      const keys = concept.misconceptions.map((m) => m.key)
      if (t.to_misconception && keys.includes(t.to_misconception)) {
        toMis = t.to_misconception
      } else if (keys.length > 0) {
        // model said "misconceived" but gave an unknown key; keep prior key if valid, else first
        const prior = state[t.concept_id]?.held_misconception
        toMis = prior && keys.includes(prior) ? prior : keys[0]
      } else {
        // a concept with no defined misconceptions can't be "misconceived" — downgrade to partial
        toStatus = 'partial'
        toMis = null
      }
    }

    const prev = next[t.concept_id] ?? null
    const newBelief: ConceptBelief = {
      concept_id: t.concept_id,
      status: toStatus,
      held_misconception: toStatus === 'misconceived' ? toMis : null,
      note: t.reason || prev?.note || '',
    }

    const changed =
      !prev ||
      prev.status !== newBelief.status ||
      prev.held_misconception !== newBelief.held_misconception

    if (changed) {
      delta.push({
        concept_id: t.concept_id,
        from: prev?.status ?? null,
        to: newBelief.status,
        to_misconception: newBelief.held_misconception,
      })
    }
    next[t.concept_id] = newBelief
  }

  return { next, delta }
}

/** Fraction of concepts the student has mastered (0..1) — drives the "understanding meter". */
export function masteryFraction(state: BeliefState): number {
  const vals = Object.values(state)
  if (vals.length === 0) return 0
  const mastered = vals.filter((b) => b.status === 'mastered').length
  return mastered / vals.length
}

/** A coarse "understanding score" 0..100 that gives partial credit. */
export function understandingScore(state: BeliefState): number {
  const vals = Object.values(state)
  if (vals.length === 0) return 0
  const weight: Record<ConceptBelief['status'], number> = {
    unknown: 0,
    misconceived: 0,
    partial: 0.5,
    mastered: 1,
  }
  const total = vals.reduce((s, b) => s + weight[b.status], 0)
  return Math.round((total / vals.length) * 100)
}
