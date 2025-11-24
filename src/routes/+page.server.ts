import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async (event) => {
  return {
    title: "Home",
    description: "Welcome to the home page.",
    keywords: "home, welcome",
    user: event.locals.session,
  }
}
