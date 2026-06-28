import { z } from 'zod'

// Zod schemas mirroring the LLM-produced shapes. Kept simple (objects/arrays/enums/
// strings) to satisfy structured-output JSON-schema limits. These validate model output.

export const zMisconception = z.object({
  key: z.string(),
  claim: z.string(),
  tell: z.string(),
  resolves_when: z.string(),
})

export const zConcept = z.object({
  id: z.string(),
  name: z.string(),
  truth: z.string(),
  summary: z.string(),
  prerequisite_ids: z.array(z.string()),
  misconceptions: z.array(zMisconception),
})

export const zConceptSet = z.object({
  topic_title: z.string(),
  subject: z.string(),
  concepts: z.array(zConcept),
})

export const zExamOption = z.object({
  key: z.string(),
  text: z.string(),
  kind: z.enum(['correct', 'misconception', 'distractor']),
  misconception_key: z.string().nullable(),
})

export const zExamQuestion = z.object({
  id: z.string(),
  concept_id: z.string(),
  prompt: z.string(),
  options: z.array(zExamOption),
})

export const zExam = z.object({
  questions: z.array(zExamQuestion),
})

// The turn engine's structured output.
export const zTurnGrading = z.object({
  addressed_concept_ids: z.array(z.string()),
  transitions: z.array(
    z.object({
      concept_id: z.string(),
      to_status: z.enum(['unknown', 'misconceived', 'partial', 'mastered']),
      to_misconception: z.string().nullable(),
      reason: z.string(),
    }),
  ),
  student_reply: z.string(),
  focus_concept_id: z.string().nullable(),
})

// Student persona seed.
export const zStudent = z.object({
  name: z.string(),
  blurb: z.string(),
})
