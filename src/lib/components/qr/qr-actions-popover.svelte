<script lang="ts">
  import { Copy, Download, ExternalLink } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover"
  import type { QrCode } from "$lib/server/db/schema/qr-codes"
  import { generateQrCodeSvg, generateQrFilename } from "$lib/utils/qr-generator"
  import { toast } from "svelte-sonner"

  interface Props {
    qrCode: QrCode
  }

  let { qrCode }: Props = $props()

  async function handleDownload() {
    try {
      const svg = await generateQrCodeSvg({
        url: qrCode.destinationUrl,
        size: 500,
      })

      const blob = new Blob([svg], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = generateQrFilename(qrCode.title || undefined, qrCode.shortCode || undefined)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("QR code downloaded")
    } catch (error) {
      toast.error("Failed to download QR code")
      console.error(error)
    }
  }

  function copyDestinationUrl() {
    navigator.clipboard.writeText(qrCode.destinationUrl)
    toast.success("Destination URL copied")
  }

  function copyShortUrl() {
    if (qrCode.shortCode) {
      navigator.clipboard.writeText(`${window.location.origin}/${qrCode.shortCode}`)
      toast.success("Short URL copied")
    }
  }
</script>

<Popover>
  <PopoverTrigger>
    <Button variant="ghost" size="icon" class="h-8 w-8">
      <ExternalLink class="h-4 w-4" />
      <span class="sr-only">View actions</span>
    </Button>
  </PopoverTrigger>
  <PopoverContent class="w-80" align="end">
    <div class="space-y-3">
      <div>
        <p class="mb-1 text-sm font-medium">Destination URL</p>
        <div class="flex items-center gap-2">
          <p class="flex-1 truncate text-sm text-muted-foreground">{qrCode.destinationUrl}</p>
          <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" onclick={copyDestinationUrl}>
            <Copy class="h-4 w-4" />
            <span class="sr-only">Copy destination URL</span>
          </Button>
        </div>
      </div>

      {#if qrCode.shortCode}
        <div>
          <p class="mb-1 text-sm font-medium">Short URL</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 truncate text-sm text-muted-foreground">/{qrCode.shortCode}</code>
            <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" onclick={copyShortUrl}>
              <Copy class="h-4 w-4" />
              <span class="sr-only">Copy short URL</span>
            </Button>
          </div>
        </div>
      {/if}

      <div class="border-t pt-3">
        <Button variant="default" class="w-full gap-2" onclick={handleDownload}>
          <Download class="h-4 w-4" />
          Download QR Code
        </Button>
      </div>
    </div>
  </PopoverContent>
</Popover>
