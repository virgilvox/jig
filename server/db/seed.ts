import { db } from "./client"
import { categories, notes, user } from "./schema"

// Sample data so the example CRUD page has something to show. Creates one demo
// user plus a couple categories and notes. The demo user has no password; sign
// in with your own account through the UI, or attach this data to it by id.
const DEMO_USER_ID = "usr_demo"

async function seed(): Promise<void> {
  await db
    .insert(user)
    .values({
      id: DEMO_USER_ID,
      name: "Demo",
      email: "demo@jig.local",
      emailVerified: true,
    })
    .onConflictDoNothing()

  const [work, ideas] = await db
    .insert(categories)
    .values([
      { userId: DEMO_USER_ID, name: "Work" },
      { userId: DEMO_USER_ID, name: "Ideas" },
    ])
    .onConflictDoNothing()
    .returning()

  await db.insert(notes).values([
    {
      userId: DEMO_USER_ID,
      categoryId: work?.id ?? null,
      title: "Rename the clone",
      body: "Swap jig for the real product name.",
    },
    {
      userId: DEMO_USER_ID,
      categoryId: work?.id ?? null,
      title: "Wire OAuth keys",
      body: "Drop GitHub client id and secret into .env.",
    },
    {
      userId: DEMO_USER_ID,
      categoryId: ideas?.id ?? null,
      title: "Try a new theme",
      body: "Add one file under assets/design/themes.",
      done: true,
    },
  ])

  console.log("Seeded demo user, categories, and notes.")
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
