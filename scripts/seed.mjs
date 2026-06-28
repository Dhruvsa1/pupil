// Seed built-in topics. Run: node --env-file=.env.local scripts/seed.mjs
import pg from 'pg'

const opt = (key, text, kind, mkey = null) => ({ key, text, kind, misconception_key: mkey })

const TOPICS = [
  {
    slug: 'recursion',
    title: 'Recursion',
    subject: 'Computer Science',
    blurb:
      "Hi! I'm trying to wrap my head around recursion for my CS class. Honestly it kind of melts my brain — can you walk me through it?",
    is_featured: true,
    sort_order: 1,
    concept_set: {
      topic_title: 'Recursion',
      subject: 'Computer Science',
      concepts: [
        {
          id: 'rec.base-case',
          name: 'Base case',
          truth: 'A base case is the condition that stops recursion and returns a value directly, without calling itself again.',
          summary: 'The stopping condition that ends the recursion.',
          prerequisite_ids: [],
          misconceptions: [
            {
              key: 'base-case-optional',
              claim: "I think the function just stops on its own once it's done.",
              tell: 'Believes recursion halts automatically without an explicit stopping condition.',
              resolves_when: 'Explains that without a base case the calls never stop and the call stack overflows.',
            },
          ],
        },
        {
          id: 'rec.recursive-case',
          name: 'Recursive case',
          truth: 'Each recursive call must work on a smaller input that moves toward the base case.',
          summary: 'The step that reduces the problem and calls itself.',
          prerequisite_ids: ['rec.base-case'],
          misconceptions: [
            {
              key: 'no-progress',
              claim: "Can't I just call the function again with the same input?",
              tell: 'Writes recursion that does not shrink the problem toward the base case.',
              resolves_when: 'Explains each call must reduce the problem so it eventually reaches the base case.',
            },
          ],
        },
        {
          id: 'rec.call-stack',
          name: 'The call stack',
          truth: 'Each call gets its own stack frame with its own local variables; calls finish and resume in reverse order.',
          summary: 'Each call has its own independent frame.',
          prerequisite_ids: ['rec.recursive-case'],
          misconceptions: [
            {
              key: 'shared-variables',
              claim: 'Do all the calls share the same variables, like one counter?',
              tell: 'Thinks a single variable is mutated across all the recursive calls.',
              resolves_when: 'Explains each call has its own independent frame and local variables.',
            },
          ],
        },
        {
          id: 'rec.leap-of-faith',
          name: 'The recursive leap of faith',
          truth: 'Assume the recursive call correctly solves the smaller subproblem, then just combine its result.',
          summary: 'Trust the recursion on the smaller case.',
          prerequisite_ids: ['rec.call-stack'],
          misconceptions: [
            {
              key: 'trace-everything',
              claim: "Don't I have to trace every single call in my head to know it works?",
              tell: 'Gets lost trying to mentally trace deep recursion all the way down.',
              resolves_when: 'Explains you can trust the recursive call on the smaller input and only reason about one level.',
            },
          ],
        },
      ],
    },
    exam: {
      questions: [
        {
          id: 'q1',
          concept_id: 'rec.base-case',
          prompt: 'What happens if a recursive function has no base case?',
          options: [
            opt('a', 'It recurses forever until the call stack overflows', 'correct'),
            opt('b', "It stops automatically once the work is done", 'misconception', 'base-case-optional'),
            opt('c', 'It returns null', 'distractor'),
            opt('d', 'It runs exactly once', 'distractor'),
          ],
        },
        {
          id: 'q2',
          concept_id: 'rec.recursive-case',
          prompt: 'What must each recursive call do to its input?',
          options: [
            opt('a', 'Reduce it so it moves toward the base case', 'correct'),
            opt('b', 'It can pass the same input again', 'misconception', 'no-progress'),
            opt('c', 'Always double it', 'distractor'),
            opt('d', 'Ignore it entirely', 'distractor'),
          ],
        },
        {
          id: 'q3',
          concept_id: 'rec.call-stack',
          prompt: 'Do recursive calls share their local variables?',
          options: [
            opt('a', 'No — each call gets its own stack frame and locals', 'correct'),
            opt('b', "Yes — there's one shared set of variables", 'misconception', 'shared-variables'),
            opt('c', 'Only if they are declared global', 'distractor'),
          ],
        },
        {
          id: 'q4',
          concept_id: 'rec.leap-of-faith',
          prompt: 'What is the "recursive leap of faith"?',
          options: [
            opt('a', 'Trusting the recursive call solves the smaller subproblem', 'correct'),
            opt('b', 'Tracing every call by hand to be sure', 'misconception', 'trace-everything'),
            opt('c', 'Never using recursion on large inputs', 'distractor'),
          ],
        },
      ],
    },
  },

  {
    slug: 'bayes-theorem',
    title: "Bayes' Theorem",
    subject: 'Statistics',
    blurb:
      "Hey — I sort of get probability but Bayes' theorem keeps tripping me up, especially those medical-test problems. Can you teach me?",
    is_featured: true,
    sort_order: 2,
    concept_set: {
      topic_title: "Bayes' Theorem",
      subject: 'Statistics',
      concepts: [
        {
          id: 'bayes.conditional',
          name: 'Conditional probability',
          truth: 'P(A|B) is the probability of A given B occurred, and it is generally NOT equal to P(B|A).',
          summary: 'P(A|B) vs P(B|A) are different quantities.',
          prerequisite_ids: [],
          misconceptions: [
            {
              key: 'symmetry',
              claim: "Isn't P(A given B) just the same as P(B given A)?",
              tell: 'Swaps the two conditional directions freely.',
              resolves_when: 'Gives an example where they clearly differ, e.g. P(rain|clouds) vs P(clouds|rain).',
            },
          ],
        },
        {
          id: 'bayes.base-rate',
          name: 'Base rates',
          truth: 'The prior (base rate) of a hypothesis strongly affects the posterior, even when a test is very accurate.',
          summary: 'How common the thing is matters a lot.',
          prerequisite_ids: ['bayes.conditional'],
          misconceptions: [
            {
              key: 'base-rate-neglect',
              claim: "If the test is 99% accurate and I test positive, I have a 99% chance, right?",
              tell: 'Ignores how rare the condition is when interpreting a positive test.',
              resolves_when: 'Shows that for a rare condition, most positive results are false positives.',
            },
          ],
        },
        {
          id: 'bayes.update',
          name: 'Updating beliefs',
          truth: "Bayes' theorem updates a prior into a posterior by weighting it with the likelihood: P(H|E) = P(E|H)P(H)/P(E).",
          summary: 'Combine prior and evidence — not replace.',
          prerequisite_ids: ['bayes.base-rate'],
          misconceptions: [
            {
              key: 'replace-not-update',
              claim: "Doesn't the new evidence just replace whatever I believed before?",
              tell: 'Throws away the prior when new evidence arrives.',
              resolves_when: 'Explains the posterior combines the prior and the likelihood rather than discarding the prior.',
            },
          ],
        },
      ],
    },
    exam: {
      questions: [
        {
          id: 'q1',
          concept_id: 'bayes.conditional',
          prompt: 'Is P(A|B) always equal to P(B|A)?',
          options: [
            opt('a', 'No — they are generally different', 'correct'),
            opt('b', 'Yes — they are the same thing', 'misconception', 'symmetry'),
            opt('c', 'Only when A and B are independent', 'distractor'),
          ],
        },
        {
          id: 'q2',
          concept_id: 'bayes.base-rate',
          prompt: 'A 99%-accurate test is positive for a rare disease. Your chance of having it is?',
          options: [
            opt('a', 'Often far below 99% — it depends on how rare the disease is', 'correct'),
            opt('b', 'About 99%', 'misconception', 'base-rate-neglect'),
            opt('c', 'Exactly 50%', 'distractor'),
          ],
        },
        {
          id: 'q3',
          concept_id: 'bayes.update',
          prompt: "What does Bayes' theorem do with your prior belief?",
          options: [
            opt('a', 'Weights it by the likelihood to produce a posterior', 'correct'),
            opt('b', 'Discards it in favor of the new evidence', 'misconception', 'replace-not-update'),
            opt('c', 'Averages all priors together equally', 'distractor'),
          ],
        },
      ],
    },
  },

  {
    slug: 'photosynthesis',
    title: 'Photosynthesis',
    subject: 'Biology',
    blurb:
      "Hi! We're doing photosynthesis in bio and I keep mixing up the parts. I'd love it if you could explain it to me?",
    is_featured: true,
    sort_order: 3,
    concept_set: {
      topic_title: 'Photosynthesis',
      subject: 'Biology',
      concepts: [
        {
          id: 'photo.inputs',
          name: 'Inputs and mass',
          truth: 'Plants build glucose from carbon dioxide and water using light energy; most of their mass comes from CO2 in the air, not soil.',
          summary: 'Raw materials: CO2, water, light.',
          prerequisite_ids: [],
          misconceptions: [
            {
              key: 'plants-eat-soil',
              claim: 'Plants get most of their food and mass from the soil, right?',
              tell: 'Believes soil is consumed as the plant’s food.',
              resolves_when: 'Explains that most plant mass comes from carbon dioxide in the air, not from soil.',
            },
          ],
        },
        {
          id: 'photo.light-reactions',
          name: 'Light-dependent reactions',
          truth: 'In the thylakoids, light energy is converted into ATP and NADPH, and the oxygen released comes from splitting water.',
          summary: 'Light → ATP, NADPH, and O2 (from water).',
          prerequisite_ids: ['photo.inputs'],
          misconceptions: [
            {
              key: 'o2-from-co2',
              claim: 'The oxygen the plant releases comes from the carbon dioxide, doesn’t it?',
              tell: 'Says CO2 is split to release the oxygen.',
              resolves_when: 'Explains the released O2 comes from splitting water molecules, not CO2.',
            },
          ],
        },
        {
          id: 'photo.calvin',
          name: 'The Calvin cycle',
          truth: 'The Calvin cycle uses ATP and NADPH to fix CO2 into glucose; it is light-independent but still runs in daylight using the light reactions’ products.',
          summary: 'Uses ATP/NADPH to build sugar.',
          prerequisite_ids: ['photo.light-reactions'],
          misconceptions: [
            {
              key: 'dark-only-at-night',
              claim: 'The "dark reactions" happen at night, since they don’t need light?',
              tell: 'Thinks the Calvin cycle runs at night.',
              resolves_when: 'Explains "light-independent" means it doesn’t use light directly, but it runs in daylight on the products of the light reactions.',
            },
          ],
        },
      ],
    },
    exam: {
      questions: [
        {
          id: 'q1',
          concept_id: 'photo.inputs',
          prompt: "Where does most of a plant's mass come from?",
          options: [
            opt('a', 'Carbon dioxide from the air', 'correct'),
            opt('b', 'Nutrients eaten from the soil', 'misconception', 'plants-eat-soil'),
            opt('c', 'Water, and nothing else', 'distractor'),
          ],
        },
        {
          id: 'q2',
          concept_id: 'photo.light-reactions',
          prompt: 'The oxygen a plant releases comes from?',
          options: [
            opt('a', 'Splitting water molecules', 'correct'),
            opt('b', 'Splitting carbon dioxide', 'misconception', 'o2-from-co2'),
            opt('c', 'The soil', 'distractor'),
          ],
        },
        {
          id: 'q3',
          concept_id: 'photo.calvin',
          prompt: 'When does the Calvin cycle (the "dark reactions") run?',
          options: [
            opt('a', 'In daylight, using the products of the light reactions', 'correct'),
            opt('b', 'Only at night', 'misconception', 'dark-only-at-night'),
            opt('c', 'Only during winter', 'distractor'),
          ],
        },
      ],
    },
  },
]

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

for (const t of TOPICS) {
  await client.query(
    `insert into pupil.topics (slug, title, subject, blurb, concept_set, exam, is_featured, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (slug) do update set
       title=excluded.title, subject=excluded.subject, blurb=excluded.blurb,
       concept_set=excluded.concept_set, exam=excluded.exam,
       is_featured=excluded.is_featured, sort_order=excluded.sort_order`,
    [
      t.slug,
      t.title,
      t.subject,
      t.blurb,
      JSON.stringify(t.concept_set),
      JSON.stringify(t.exam),
      t.is_featured,
      t.sort_order,
    ],
  )
  console.log('seeded', t.slug)
}

await client.end()
console.log('done')
