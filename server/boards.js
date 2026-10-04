// Board storage API, keyed by profile email (X-User-Email header). No auth: whoever types an
// email gets that profile's boards. Client: frontend/src/persistence/httpRepo.ts.
// Shared by Express (server/index.js, prod) and Vite dev middleware (frontend/vite.config.js).
// No deps on purpose (see extract.js): the Neon `sql` client is injected by each host.
//
// Routes (mounted at /api/boards):
//   GET    /      -> { boards: BoardSummary[] }
//   GET    /:id   -> { board } | 404
//   PUT    /:id   -> { ok: true }   body = Board (upsert)
//   DELETE /:id   -> { ok: true }

import { toSummary } from '../frontend/src/model/index.ts';

const MAX_EMAIL = 254;

/** Neon-backed store. `sql` = neon(DATABASE_URL) tagged template. Table created on first use. */
export function neonBoardsDb(sql) {
  let ready = null;
  const migrate = () =>
    (ready ??= sql`
      create table if not exists boards (
        email      text        not null,
        id         text        not null,
        data       jsonb       not null,
        summary    jsonb       not null,
        updated_at timestamptz not null default now(),
        primary key (email, id)
      )`.catch((err) => {
      ready = null; // retry on next request
      throw err;
    }));

  return {
    async list(email) {
      await migrate();
      const rows = await sql`select summary from boards where email = ${email} order by updated_at`;
      return rows.map((r) => r.summary);
    },
    async load(email, id) {
      await migrate();
      const rows = await sql`select data from boards where email = ${email} and id = ${id}`;
      return rows[0]?.data ?? null;
    },
    async save(email, board, summary) {
      await migrate();
      await sql`
        insert into boards (email, id, data, summary)
        values (${email}, ${board.id}, ${JSON.stringify(board)}::jsonb, ${JSON.stringify(summary)}::jsonb)
        on conflict (email, id) do update
          set data = excluded.data, summary = excluded.summary, updated_at = now()`;
    },
    async remove(email, id) {
      await migrate();
      await sql`delete from boards where email = ${email} and id = ${id}`;
    },
  };
}

/**
 * Host-agnostic handler. `db` = neonBoardsDb(...) or a fake in tests; null → not configured.
 * `path` is relative to the mount point ('/' or '/<id>').
 */
export function createBoardsApi(db) {
  /** @param {{ method: string, path: string, email?: string | null, body?: any }} req */
  return async function handle({ method, path, email, body }) {
    if (!db) return { status: 500, json: { ok: false, error: 'DATABASE_URL not set on the server' } };

    email = String(email ?? '').trim().toLowerCase();
    if (!email.includes('@') || email.length > MAX_EMAIL) {
      return { status: 400, json: { ok: false, error: 'Missing or invalid profile email' } };
    }

    const id = decodeURIComponent(String(path ?? '').replace(/^\/+|\/+$/g, ''));

    if (!id) {
      if (method !== 'GET') return { status: 405, json: { ok: false, error: 'Method not allowed' } };
      return { status: 200, json: { boards: await db.list(email) } };
    }

    switch (method) {
      case 'GET': {
        const board = await db.load(email, id);
        return board
          ? { status: 200, json: { board } }
          : { status: 404, json: { ok: false, error: `Board not found: ${id}` } };
      }
      case 'PUT': {
        if (!body || typeof body !== 'object' || body.id !== id || !Array.isArray(body.items)) {
          return { status: 400, json: { ok: false, error: 'Body must be a board whose id matches the URL' } };
        }
        await db.save(email, body, toSummary(body));
        return { status: 200, json: { ok: true } };
      }
      case 'DELETE':
        await db.remove(email, id);
        return { status: 200, json: { ok: true } };
      default:
        return { status: 405, json: { ok: false, error: 'Method not allowed' } };
    }
  };
}
