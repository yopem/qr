<script lang="ts">
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle"
  import HomeIcon from "@lucide/svelte/icons/home"
  import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard"
  import Button from "$lib/components/ui/button/button.svelte"

  interface Props {
    data?: {
      user?: {
        id: string
        email: string
        name: string | null
        username: string
        image: string | null
        role: "user" | "member" | "admin"
      }
    }
    errors?: {
      status?: number
      message?: string
    }
  }

  let { data, errors }: Props = $props()

  let user = $derived(data?.user)
  let isNotFound = $derived(errors?.status === 404)
</script>

<div class="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
  <div class="flex max-w-md flex-col items-center space-y-6 text-center">
    <div class="rounded-full bg-destructive/10 p-6">
      <AlertCircleIcon class="size-16 text-destructive" />
    </div>

    {#if isNotFound}
      <div class="space-y-2">
        <h1 class="text-4xl font-bold tracking-tight">404</h1>
        <h2 class="text-2xl font-semibold">Page Not Found</h2>
        <p class="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
    {:else}
      <div class="space-y-2">
        <h1 class="text-4xl font-bold tracking-tight">{errors?.status || "Error"}</h1>
        <h2 class="text-2xl font-semibold">Something went wrong</h2>
        <p class="text-muted-foreground">
          {errors?.message || "An unexpected error occurred. Please try again later."}
        </p>
      </div>
    {/if}

    <div class="flex flex-col gap-3 sm:flex-row">
      <Button href="/" variant="default">
        <HomeIcon />
        Go Home
      </Button>
      {#if user}
        <Button href="/dashboard" variant="outline">
          <LayoutDashboardIcon />
          Go to Dashboard
        </Button>
      {/if}
    </div>
  </div>
</div>
