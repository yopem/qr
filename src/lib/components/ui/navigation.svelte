<script lang="ts">
  import { Moon, Sun } from "@lucide/svelte"
  import logo from "$lib/assets/logo.png"
  import LoginButton from "$lib/components/auth/login-button.svelte"
  import LogoutButton from "$lib/components/auth/logout-button.svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    user?: {
      id: string
      email: string
      name: string | null
      username: string
      image: string | null
      role: "user" | "member" | "admin"
    } | null
  }

  let { user = null }: Props = $props()
  let darkMode = $state(false)

  // Initialize dark mode from localStorage and system preference
  $effect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("darkMode")
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

      darkMode = stored ? stored === "true" : prefersDark

      if (darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  })

  function toggleDarkMode() {
    darkMode = !darkMode
    localStorage.setItem("darkMode", String(darkMode))

    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
</script>

<header
  class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <a href="https://yopem.com" class="flex items-center">
          <img src={logo} alt="Yopem Logo" class="size-8" />
        </a>
        <span class="text-xl font-bold">/</span>
        <a href="/" class="flex items-center">
          <span class="gap-1 text-xl font-bold hover:text-foreground/80">QR</span>
        </a>
      </div>
      <nav class="hidden items-center gap-6 md:flex">
        <a
          href="/"
          class="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
        >
          Home
        </a>
        {#if user}
          <a
            href="/dashboard"
            class="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            Dashboard
          </a>
        {/if}
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" onclick={toggleDarkMode} aria-label="Toggle dark mode">
        {#if darkMode}
          <Sun class="h-5 w-5" />
        {:else}
          <Moon class="h-5 w-5" />
        {/if}
      </Button>

      {#if user}
        <LogoutButton />
      {:else}
        <LoginButton />
      {/if}
    </div>
  </div>
</header>
