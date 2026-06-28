import { runExam } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const { anonOwner } = (await req.json()) ?? {}
    if (!anonOwner) return Response.json({ error: 'Missing anonOwner' }, { status: 400 })
    const result = await runExam(id, anonOwner)
    return Response.json(result)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
