import { auth } from "../auth"

// Server-rendered session read. Route middleware calls this so a protected
// page knows on the server whether to redirect before any client JS runs.
export default defineEventHandler(async (event) => {
  return auth.api.getSession({ headers: event.headers })
})
