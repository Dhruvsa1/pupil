import { createSession } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { anonOwner, kind, topicSlug, source } = body ?? {}
    if (!anonOwner || typeof anonOwner !== 'string') {
      return Response.json({ error: 'Missing anonOwner' }, { status: 400 })
    }
    if (kind !== 'builtin' && kind !== 'custom') {
      return Response.json({ error: 'Invalid kind' }, { status: 400 })
    }
    const session = await createSession({ anonOwner, kind, topicSlug, source })
    return Response.json({ id: session.id })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
