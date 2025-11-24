export const load = async ({ url }: { url: { origin: string } }) => {
  return {
    title: "Yopem",
    description: "Welcome to Yopem",
    keywords: "yopem, welcome",
    siteName: "Yopem",
    name: "Yopem",
    siteUrl: url.origin,
  }
}
