import { getTopics } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const topics = await getTopics()
    // Don't leak the answer key (exam) to the client list view.
    const safe = topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      subject: t.subject,
      blurb: t.blurb,
      is_featured: t.is_featured,
      concept_count: t.concept_set.concepts.length,
    }))
    return Response.json({ topics: safe })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
