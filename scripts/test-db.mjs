import pg from 'pg'

const conn = `postgresql://pupil_app.vkryjsadoprvmfeucypa:HYeKwp4VnzsbalCyARmciuW3EOSdTDZq@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 })

await client.connect()
const who = await client.query('select current_user, current_schema()')
console.log('connected as', who.rows[0])

// DML round-trip on a real table
const ins = await client.query(
  `insert into pupil.sessions (anon_owner, source_kind, title, concept_set, student_name, belief_state)
   values (gen_random_uuid(), 'custom', '__conntest__', '[]'::jsonb, 'Test', '{}'::jsonb) returning id`
)
const id = ins.rows[0].id
const sel = await client.query('select count(*) from pupil.sessions where id = $1', [id])
await client.query('delete from pupil.sessions where id = $1', [id])
console.log('DML ok — insert/select/delete worked, found rows:', sel.rows[0].count)

// Confirm isolation: cannot read buddy's public tables
try {
  const t = await client.query("select table_name from information_schema.tables where table_schema='public' limit 1")
  if (t.rows.length) {
    try {
      await client.query(`select * from public."${t.rows[0].table_name}" limit 1`)
      console.log('⚠️ ISOLATION HOLE: read public.' + t.rows[0].table_name)
    } catch {
      console.log('✅ isolation ok — denied reading buddy public.' + t.rows[0].table_name)
    }
  } else {
    console.log('(buddy has no public tables to test)')
  }
} catch (e) { console.log('public introspection blocked:', e.message) }

await client.end()
