# JIG

An opinionated full-stack template you clone, rename, and ship. Auth, data, components, and a swappable design system are already solved. One Nuxt app, plain TypeScript, your own Postgres.

## What is in the box

- Nuxt 4 (Vue 3, TypeScript strict), server and client as one Node deployable.
- Postgres through Drizzle. Schema as code, readable migrations, a typed client.
- better-auth on a Nitro route: email and password, GitHub OAuth, passkeys, password reset and email verification through Resend, organization and multi-tenant primitives, server sessions, route guard.
- A base component set on Reka UI primitives, every value pulled from design tokens.
- A token-based design system with three themes. Swap the look with one attribute.
- One Dockerfile and one docker-compose for app and database.

## Quick start

```bash
cp .env.example .env          # fill in BETTER_AUTH_SECRET, OAuth keys
npm install
docker compose up -d db       # local Postgres on :5432
npm run db:generate           # build the first migration from the schema
npm run db:migrate            # apply it
npm run db:seed               # optional sample data
npm run dev                   # http://localhost:3000
```

Sign up, and you land on the dashboard looking at your own notes. That is the whole point.

## Rename it

1. Change `name` in `package.json`.
2. Pick a default theme in `nuxt.config.ts` (`appConfig.theme`).
3. Swap the example tables in `server/db/schema.ts` for your own, then `npm run db:generate`.

## Layout

```
app/
  components/ui/   components on Reka UI, every value from tokens
  pages/           landing, auth flow, protected dashboard and account
  layouts/         default shell and centered auth shell
  middleware/      auth route guard
  composables/     session, theme, toasts
  assets/design/   tokens, themes, fonts, tailwind entry
server/
  db/              Drizzle schema, client, migrations, seed
  auth/            better-auth config
  api/             Nitro routes, including the auth handler and notes CRUD
```

## Design system

The token contract is a flat set of CSS custom properties in `app/assets/design/tokens.css`: color roles (`--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, ...), typography (`--font-display`, `--font-body`, `--font-mono`), `--radius-block`, and `--shadow-block`. Tailwind reads these and generates token-backed utilities (`bg-surface`, `text-text`, `font-display`, `shadow-block`).

Each aesthetic is one file under `app/assets/design/themes/` that redefines those same names. Switch with one attribute:

```html
<html data-theme="punk-zine"></html>
```

Three ship pre-built: `punk-zine`, `industrial`, `paper-teal`. Adding a fourth is one new file plus its name in `app/composables/useTheme.ts`. No component changes.

## Scripts

| Command                             | Does                                 |
| ----------------------------------- | ------------------------------------ |
| `npm run dev`                       | Dev server                           |
| `npm run build` / `npm run preview` | Production build and run             |
| `npm run db:generate`               | Generate a migration from the schema |
| `npm run db:migrate`                | Apply migrations                     |
| `npm run db:studio`                 | Drizzle Studio                       |
| `npm run db:seed`                   | Insert sample data                   |
| `npm run lint` / `npm run format`   | Lint and format                      |
| `npm run typecheck`                 | Type check                           |
| `npm run test`                      | Run tests                            |

## Deploy

`npm run build` emits a plain Node server at `.output/server/index.mjs`. The Dockerfile builds it; `docker compose --profile full up` runs app and database together. See [docs/deploy.md](docs/deploy.md) for the full recipe: env, migrations as a release step, and a checklist.

## License

MIT.
