// Pupil domain types — the contract the whole app is built on.
// A "concept set" is the authored/generated belief-graph for a topic.
// A "belief state" is what the simulated student currently (mis)believes.

export type BeliefStatus = 'unknown' | 'misconceived' | 'partial' | 'mastered'

/** A named, common wrong-model the student can hold for a concept. */
export interface Misconception {
  /** stable key, e.g. "base-case-optional" */
  key: string
  /** the wrong belief, stated in the student's voice/world */
  claim: string
  /** how the student behaves/answers while holding it (the "tell") */
  tell: string
  /** what an explanation must establish to dislodge it */
  resolves_when: string
}

export interface Concept {
  /** stable id within the set, e.g. "recursion.base-case" */
  id: string
  name: string
  /** one-sentence correct mental model */
  truth: string
  /** short learner-facing summary used in UI */
  summary: string
  /** ids of concepts that must be understood first */
  prerequisite_ids: string[]
  /** common wrong-models for this concept */
  misconceptions: Misconception[]
}

export interface ConceptSet {
  topic_title: string
  subject: string
  /** ordered roughly by dependency (roots first) */
  concepts: Concept[]
}

/** Per-concept student belief during a session. */
export interface ConceptBelief {
  concept_id: string
  status: BeliefStatus
  /** if status === 'misconceived', which misconception.key is held */
  held_misconception: string | null
  /** short human-readable note on why it's in this state (for the trace) */
  note: string
}

export type BeliefState = Record<string, ConceptBelief>

/** A multiple-choice option, tagged by which belief it encodes. */
export interface ExamOption {
  key: string // 'a' | 'b' | 'c' | 'd'
  text: string
  /** 'correct' = the truth; 'misconception' = encodes a specific wrong-model; 'distractor' = generic wrong */
  kind: 'correct' | 'misconception' | 'distractor'
  /** set iff kind === 'misconception', else null */
  misconception_key: string | null
}

/** One MC exam question, generated from the concept set (options tagged). */
export interface ExamQuestion {
  id: string
  /** which concept this question primarily probes */
  concept_id: string
  prompt: string
  options: ExamOption[]
}

export interface StudentAnswer {
  question_id: string
  /** the option key the student picked (deterministic from belief-state) */
  chosen_key: string
  /** which belief drove this answer, for the trace */
  driven_by: { status: BeliefStatus; misconception: string | null }
  /** optional in-character rationale (LLM flavor; never affects scoring) */
  rationale?: string
}

export interface QuestionResult {
  question_id: string
  concept_id: string
  correct: boolean
  /** belief atom responsible for the outcome */
  attribution: string
}

export interface ExamResult {
  results: QuestionResult[]
  score: number
  max_score: number
}

// ---- LLM turn-engine I/O ----

/** What the grader returns for a single teaching turn. */
export interface TurnGrading {
  /** concepts the explanation addressed */
  addressed_concept_ids: string[]
  /** per concept, the decided transition + justification */
  transitions: Array<{
    concept_id: string
    /** the new status to set */
    to_status: BeliefStatus
    /** if moving to misconceived, the key; else null */
    to_misconception: string | null
    reason: string
  }>
  /** the student's next in-character utterance */
  student_reply: string
  /** optional: a concept the student is now visibly stuck on (drives UI focus) */
  focus_concept_id: string | null
}

export type SourceKind = 'builtin' | 'custom'
export type SessionStatus = 'teaching' | 'examined'

export interface SessionRow {
  id: string
  anon_owner: string
  topic_id: string | null
  source_kind: SourceKind
  title: string
  custom_source: string | null
  concept_set: ConceptSet
  student_name: string
  belief_state: BeliefState
  status: SessionStatus
  created_at: string
  updated_at: string
}
