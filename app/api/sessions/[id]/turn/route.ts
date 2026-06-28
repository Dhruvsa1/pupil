import { runTurn } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const { anonOwner, message } = (await req.json()) ?? {}
    if (!anonOwner) return Response.json({ error: 'Missing anonOwner' }, { status: 400 })
    if (!message || typeof message !== 'string' || !message.trim()) {
      return Response.json({ error: 'Empty message' }, { status: 400 })
    }
    const result = await runTurn(id, anonOwner, message.trim())
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
