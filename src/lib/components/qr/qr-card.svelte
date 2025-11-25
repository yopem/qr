<script lang="ts">
  import { Copy, Edit, ExternalLink, Trash2 } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import type { QrCode } from "$lib/server/db/schema/qr-codes"

  interface Props {
    qrCode: QrCode
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
  }

  let { qrCode, onEdit, onDelete }: Props = $props()

  function formatDate(date: Date | null): string {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }

  function copyShortUrl() {
    if (qrCode.shortCode) {
      navigator.clipboard.writeText(`${window.location.origin}/${qrCode.shortCode}`)
    }
  }
</script>

<Card>
  <CardHeader>
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <CardTitle class="line-clamp-1">
          {qrCode.title || "Untitled QR Code"}
        </CardTitle>
        <CardDescription class="line-clamp-2">
          {qrCode.description || qrCode.destinationUrl}
        </CardDescription>
      </div>
      <Badge variant={qrCode.type === "dynamic" ? "default" : "secondary"}>
        {qrCode.type}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-4">
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Destination:</span>
        <a
          href={qrCode.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-primary hover:underline"
        >
          <span class="max-w-[200px] truncate">{qrCode.destinationUrl}</span>
          <ExternalLink class="h-3 w-3" />
        </a>
      </div>

      {#if qrCode.shortCode}
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Short URL:</span>
          <button
            onclick={copyShortUrl}
            class="flex items-center gap-1 text-primary hover:underline"
          >
            <code class="text-xs">/{qrCode.shortCode}</code>
            <Copy class="h-3 w-3" />
          </button>
        </div>
      {/if}

      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Scans:</span>
        <span class="font-medium">{qrCode.scanCount}</span>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Created:</span>
        <span class="font-medium">{formatDate(qrCode.createdAt)}</span>
      </div>

      {#if qrCode.lastScannedAt}
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Last Scanned:</span>
          <span class="font-medium">{formatDate(qrCode.lastScannedAt)}</span>
        </div>
      {/if}
    </div>
  </CardContent>

  <CardFooter class="flex gap-2">
    {#if qrCode.type === "dynamic"}
      <Button variant="outline" size="sm" onclick={() => onEdit?.(qrCode.id)} class="flex-1">
        <Edit class="mr-2 h-4 w-4" />
        Edit
      </Button>
    {/if}
    <Button variant="destructive" size="sm" onclick={() => onDelete?.(qrCode.id)} class="flex-1">
      <Trash2 class="mr-2 h-4 w-4" />
      Delete
    </Button>
  </CardFooter>
</Card>
