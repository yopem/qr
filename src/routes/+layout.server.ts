import { env } from "$env/dynamic/public"

export const load = async ({ url, locals }: { url: { origin: string }; locals: App.Locals }) => {
  return {
    title: env.PUBLIC_SITE_TITLE || "Yopem",
    description: env.PUBLIC_SITE_DESCRIPTION || "Welcome to Yopem!",
    keywords: "yopem, qr",
    siteName: env.PUBLIC_SITE_NAME || "Yopem",
    name: env.PUBLIC_SITE_NAME || "Yopem",
    siteUrl: url.origin,
    user: locals.session || null,
  }
}
