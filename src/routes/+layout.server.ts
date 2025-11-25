export const load = async ({ url, locals }: { url: { origin: string }; locals: App.Locals }) => {
  return {
    title: "Yopem",
    description: "Welcome to Yopem",
    keywords: "yopem, welcome",
    siteName: "Yopem",
    name: "Yopem",
    siteUrl: url.origin,
    user: locals.session || null,
  }
}
