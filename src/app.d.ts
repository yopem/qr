// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      status?: number
      message?: string
    }
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
    interface Locals {
      session?: {
        id: string
        email: string
        name: string | null
        username: string
        image: string | null
        role: "user" | "member" | "admin"
      }
    }
  }
}

export {}
