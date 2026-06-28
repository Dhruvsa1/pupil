import type {
  BeliefState,
  ExamQuestion,
  ExamResult,
  QuestionResult,
  StudentAnswer,
} from './types'

/**
 * Deterministically derive how the student answers each exam question, given ONLY
 * its final belief-state. This is the mechanical link that makes the grade honest:
 *   - mastered / partial  -> picks the correct option
 *   - misconceived(key)   -> picks the option that encodes that exact wrong-model
 *                            (falls back to a distractor if the question doesn't
 *                             have an option for that misconception)
 *   - unknown             -> picks a distractor (an untaught concept = a wrong guess)
 * No LLM is involved in *taking* the exam, so a gap you never closed always shows up.
 */
export function deriveStudentAnswers(
  belief: BeliefState,
  questions: ExamQuestion[],
): StudentAnswer[] {
  return questions.map((q) => {
    const b = belief[q.concept_id]
    const status = b?.status ?? 'unknown'
    const held = b?.held_misconception ?? null

    const correct = q.options.find((o) => o.kind === 'correct')
    const firstWrong =
      q.options.find((o) => o.kind === 'distractor') ??
      q.options.find((o) => o.kind !== 'correct') ??
      q.options[0]

    let chosen = firstWrong
    if (status === 'mastered' || status === 'partial') {
      chosen = correct ?? firstWrong
    } else if (status === 'misconceived' && held) {
      chosen =
        q.options.find(
          (o) => o.kind === 'misconception' && o.misconception_key === held,
        ) ?? firstWrong
    } else {
      // unknown
      chosen = firstWrong
    }

    return {
      question_id: q.id,
      chosen_key: chosen.key,
      driven_by: { status, misconception: held },
    }
  })
}

function attributionFor(a: StudentAnswer): string {
  const { status, misconception } = a.driven_by
  switch (status) {
    case 'mastered':
      return 'mastered — you taught this well'
    case 'partial':
      return 'partial — got there, a bit shaky'
    case 'misconceived':
      return `held misconception "${misconception}" — never corrected`
    default:
      return 'unknown — you never taught this'
  }
}

/** Grade an exam from the student's final belief-state. */
export function scoreExam(
  belief: BeliefState,
  questions: ExamQuestion[],
): { answers: StudentAnswer[]; result: ExamResult } {
  const answers = deriveStudentAnswers(belief, questions)
  const byId = new Map(questions.map((q) => [q.id, q]))

  const results: QuestionResult[] = answers.map((a) => {
    const q = byId.get(a.question_id)!
    const chosen = q.options.find((o) => o.key === a.chosen_key)
    const correct = chosen?.kind === 'correct'
    return {
      question_id: a.question_id,
      concept_id: q.concept_id,
      correct,
      attribution: attributionFor(a),
    }
  })

  const score = results.filter((r) => r.correct).length
  return {
    answers,
    result: { results, score, max_score: questions.length },
  }
}
