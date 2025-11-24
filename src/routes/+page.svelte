<script lang="ts">
  import LogoutButton from "$lib/components/auth/logout-button.svelte"
  import { Button } from "$lib/components/ui/button"

  const { data } = $props()
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4">
  <h1 class="text-2xl font-bold">Welcome</h1>
  <h2>Hello {data?.user?.name ?? "Guest"}</h2>
  <div>
    {#if data?.user}
      <LogoutButton />
    {:else}
      <Button href="/auth/login">Login</Button>
    {/if}
  </div>
</div>
