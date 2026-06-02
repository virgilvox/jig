import { fileURLToPath } from "node:url"
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { beforeAll, describe, expect, it } from "vitest"
import { fetch, setup } from "@nuxt/test-utils/e2e"

const databaseUrl = process.env.DATABASE_URL

// Unique per run so reruns against a persistent database do not collide.
const stamp = Date.now()
const email = (tag: string): string => `e2e-${stamp}-${tag}@jig.local`
const PASSWORD = "supersecret12"
const ORIGIN = "http://localhost:3000"

function cookieHeader(res: Response): string {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] }
  const all = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : []
  return all
    .map((c) => c.split(";")[0] ?? "")
    .filter(Boolean)
    .join("; ")
}

async function signUp(tag: string): Promise<string> {
  const res = await fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: tag, email: email(tag), password: PASSWORD }),
  })
  expect(res.status).toBe(200)
  return cookieHeader(res)
}

if (!databaseUrl) {
  // Skip rather than fail when no database is wired. Run with:
  // docker compose up -d db && npm run db:migrate && npm run test:e2e
  describe.skip("auth and notes e2e (set DATABASE_URL to run)", () => {
    it("skipped", () => {
      expect(true).toBe(true)
    })
  })
} else {
  describe("auth and notes e2e", async () => {
    await setup({
      rootDir: fileURLToPath(new URL("../..", import.meta.url)),
      server: true,
      build: true,
    })

    beforeAll(async () => {
      const pool = new Pool({ connectionString: databaseUrl })
      await migrate(drizzle(pool), { migrationsFolder: "server/db/migrations" })
      await pool.end()
    })

    it("signs up and exposes the user through /api/me without the session token", async () => {
      const cookie = await signUp("me")
      const res = await fetch("/api/me", { headers: { cookie } })
      const text = await res.text()
      expect(text).not.toContain('"token"')
      const body = JSON.parse(text) as { user: { email: string } | null }
      expect(body.user?.email).toBe(email("me"))
    })

    it("rejects unauthenticated note creation with 401", async () => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "nope" }),
      })
      expect(res.status).toBe(401)
    })

    it("creates a note for the owner and isolates it from other users", async () => {
      const cookieA = await signUp("owner")
      const created = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({ title: "Owner note" }),
      })
      expect(created.status).toBe(201)

      const ownerList = (await (
        await fetch("/api/notes", { headers: { cookie: cookieA } })
      ).json()) as Array<{ title: string }>
      expect(ownerList.map((n) => n.title)).toContain("Owner note")

      const cookieB = await signUp("other")
      const otherList = (await (
        await fetch("/api/notes", { headers: { cookie: cookieB } })
      ).json()) as unknown[]
      expect(otherList).toHaveLength(0)
    })

    it("rejects a note pointed at a category the user does not own", async () => {
      const cookie = await signUp("cat")
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ title: "x", categoryId: "not-a-real-category" }),
      })
      expect(res.status).toBe(400)
    })

    it("creates an organization when the Origin header is present", async () => {
      const cookie = await signUp("org")
      const res = await fetch("/api/auth/organization/create", {
        method: "POST",
        headers: { "content-type": "application/json", cookie, origin: ORIGIN },
        body: JSON.stringify({ name: "Acme QA", slug: `acme-${stamp}` }),
      })
      expect(res.status).toBe(200)
      const org = (await res.json()) as { slug: string }
      expect(org.slug).toBe(`acme-${stamp}`)
    })
  })
}
