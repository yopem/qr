<script lang="ts">
  import { Plus } from "@lucide/svelte"
  import { goto } from "$app/navigation"
  import QrCard from "$lib/components/qr/qr-card.svelte"
  import { Button } from "$lib/components/ui/button"
  import { toast } from "svelte-sonner"

  import { deleteQrCode, getUserQrCodes } from "../qr-codes.remote.js"

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this QR code?")) {
      return
    }

    try {
      await deleteQrCode(id).updates(getUserQrCodes())
      toast.success("QR code deleted successfully")
    } catch (error) {
      toast.error("Failed to delete QR code")
      console.error(error)
    }
  }

  function handleEdit(id: string) {
    goto(`/dashboard/edit/${id}`)
  }
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">My QR Codes</h1>
        <p class="text-muted-foreground">View and manage all your QR codes</p>
      </div>
      <Button href="/" class="gap-2">
        <Plus class="h-4 w-4" />
        Create New
      </Button>
    </div>

    {#await getUserQrCodes()}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _, i (i)}
          <div class="h-80 animate-pulse rounded-lg bg-muted"></div>
        {/each}
      </div>
    {:then qrCodes}
      {#if qrCodes.length === 0}
        <div
          class="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
        >
          <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <svg
              class="h-10 w-10 text-muted-foreground"
              fill="none"
              height="24"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" x2="12" y1="22" y2="12" />
            </svg>
            <h3 class="mt-4 text-lg font-semibold">No QR codes yet</h3>
            <p class="mt-2 mb-4 text-sm text-muted-foreground">
              You haven't created any QR codes. Get started by creating your first one!
            </p>
            <Button href="/">Create QR Code</Button>
          </div>
        </div>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each qrCodes as qrCode (qrCode.id)}
            <QrCard {qrCode} onEdit={handleEdit} onDelete={handleDelete} />
          {/each}
        </div>
      {/if}
    {:catch error}
      <div class="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
        <p class="text-destructive">Failed to load QR codes: {error.message}</p>
        <Button variant="outline" onclick={() => getUserQrCodes().refresh()} class="mt-4">
          Try Again
        </Button>
      </div>
    {/await}
  </div>
</div>
