<script lang="ts">
  import { Copy, Download, Edit, ExternalLink, Trash2 } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button, buttonVariants } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog"
  import type { QrCode } from "$lib/server/db/schema/qr-codes"
  import { generateQrCodeSvg, generateQrFilename } from "$lib/utils/qr-generator"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  interface Props {
    qrCode: QrCode
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
  }

  let { qrCode, onEdit, onDelete }: Props = $props()

  let qrSvg = $state<string | null>(null)

  onMount(() => {
    return
  })

  $effect(() => {
    generateQrCodeSvg({
      url: qrCode.shortCode
        ? `${window.location.origin}/${qrCode.shortCode}`
        : qrCode.destinationUrl,
      size: 200,
    }).then((svg) => {
      qrSvg = svg
    })
  })

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
      toast.success("Short URL copied to clipboard")
    }
  }

  async function downloadQrCode() {
    if (!qrSvg) return

    const svg = await generateQrCodeSvg({
      url: qrCode.shortCode
        ? `${window.location.origin}/${qrCode.shortCode}`
        : qrCode.destinationUrl,
      size: 500,
    })

    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = generateQrFilename(qrCode.destinationUrl, qrCode.shortCode || undefined)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("QR code downloaded")
  }

  function handleConfirmDelete() {
    onDelete?.(qrCode.id)
  }
</script>

<Card>
  <CardHeader>
    <div class="flex items-start justify-between">
      <div class="flex-1 space-y-1">
        <CardTitle class="line-clamp-1">
          {qrCode.description || qrCode.destinationUrl}
        </CardTitle>
        <CardDescription class="flex items-center gap-2">
          <Badge variant={qrCode.type === "dynamic" ? "default" : "secondary"}>
            {qrCode.type}
          </Badge>
          <span class="text-xs">{formatDate(qrCode.createdAt)}</span>
        </CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent class="space-y-4">
    {#if qrSvg}
      <div class="flex justify-center rounded-lg border bg-white p-4">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html qrSvg}
      </div>
    {:else}
      <div class="flex h-[200px] items-center justify-center rounded-lg border bg-muted">
        <span class="text-sm text-muted-foreground">Loading QR code...</span>
      </div>
    {/if}

    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Destination:</span>
        <a
          href={qrCode.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-primary hover:underline"
        >
          <span class="max-w-[150px] truncate">{qrCode.destinationUrl}</span>
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

      {#if qrCode.lastScannedAt}
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Last Scanned:</span>
          <span class="font-medium">{formatDate(qrCode.lastScannedAt)}</span>
        </div>
      {/if}
    </div>
  </CardContent>

  <CardFooter class="flex gap-2">
    <Button variant="outline" size="sm" onclick={downloadQrCode} class="flex-1">
      <Download class="mr-2 h-4 w-4" />
      Download
    </Button>
    {#if qrCode.type === "dynamic"}
      <Button variant="outline" size="sm" onclick={() => onEdit?.(qrCode.id)} class="flex-1">
        <Edit class="mr-2 h-4 w-4" />
        Edit
      </Button>
    {/if}
    <Dialog>
      <DialogTrigger>
        <Button variant="destructive" size="sm" class="flex-1">
          <Trash2 class="mr-2 h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete QR Code</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this QR code? This action cannot be undone.
            {#if qrCode.type === "dynamic"}
              The short URL will stop working.
            {/if}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose class={buttonVariants({ variant: "outline" })}>Cancel</DialogClose>
          <Button variant="destructive" onclick={handleConfirmDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </CardFooter>
</Card>
