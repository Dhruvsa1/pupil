# Pupil

**You don't study — you teach.** Pupil gives you a believably-confused AI student who holds the exact misconceptions real beginners hold. You teach them; then they sit an exam built from what you taught. **Their score is yours.** There's no "show answer" — the only way to win is to actually understand.

🔗 **Live:** https://pupil.dhruvsa1.org

## The problem

Studying with an AI chatbot produces an *illusion of understanding* — you feel fluent because the bot is fluent, then you bomb the test. The most powerful counter-lever in learning science is the **protégé effect**: you learn material markedly better when you have to teach it. Pupil operationalizes that, and makes the result objective and un-gameable.

## What makes it work

- **Authored, deterministic misconceptions.** Each concept carries a named belief-graph with specific common wrong-models. The student *acts out* a fixed wrong belief until your explanation provably dislodges it — so it's consistently (not randomly) confused, never leaks the answer, and the grade is *defensible*.
- **Mechanical exam.** Exam questions are multiple-choice with each option tagged to the belief it encodes. The student answers **deterministically from its final belief-state** (no LLM in the exam) — so a gap you never closed always shows up, traced to the exact misconception.
- **Zero setup.** Pick a built-in student (instant — no LLM at start) or paste your own material. No account; sessions live in your browser.
- **The scorecard is a study guide** — not "you got a B" but "you never corrected the 'shared-variable' misconception — that's your gap."

## Stack

- **Next.js 16** (App Router, TypeScript) on **Vercel**
- **Postgres** (Supabase) via a schema-scoped role, accessed only through server routes
- **Anthropic Claude (Opus 4.8)** for concept-set generation + the turn-grading engine, using structured outputs (Zod) + adaptive thinking
- Pure, unit-tested core: the belief-state reducer and the deterministic exam scorer

## Develop

```bash
npm install
# .env.local needs DATABASE_URL (scoped Postgres role) and ANTHROPIC_API_KEY
npm run dev      # http://localhost:3000
npm test         # belief reducer + scorer tests
node --env-file=.env.local scripts/seed.mjs   # seed built-in topics
```

Built by [Dhruvsai Dhulipudi](https://dhruvsa1.org).
