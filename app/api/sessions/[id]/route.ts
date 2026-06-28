import { getSession } from '@/lib/sessions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const owner = new URL(req.url).searchParams.get('owner') ?? ''
    if (!owner) return Response.json({ error: 'Missing owner' }, { status: 400 })
    const data = await getSession(id, owner)
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
