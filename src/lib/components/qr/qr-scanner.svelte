<script lang="ts">
  import { Upload } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import { Label } from "$lib/components/ui/label"
  import { scanQrCode } from "$lib/utils/qr-scanner"

  interface Props {
    /**
     * Callback when QR code is successfully scanned
     */
    onScan?: (url: string) => void
  }

  let { onScan }: Props = $props()

  let fileInput: HTMLInputElement | null = $state(null)
  let dropZone: HTMLDivElement | null = $state(null)
  let scanning = $state(false)
  let scannedUrl = $state<string | null>(null)
  let error = $state<string | null>(null)
  let isDragging = $state(false)

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      error = "Please upload an image file"
      return
    }

    scanning = true
    error = null
    scannedUrl = null

    try {
      const result = await scanQrCode(file)

      if (result.success && result.data) {
        scannedUrl = result.data
        onScan?.(result.data)
      } else {
        error = result.error || "Could not read QR code from image"
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to scan QR code"
    } finally {
      scanning = false
    }
  }

  async function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    await processFile(file)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragging = true
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragging = false
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDragging = false

    const file = e.dataTransfer?.files[0]
    if (file) {
      await processFile(file)
    }
  }

  function handleUploadClick() {
    fileInput?.click()
  }

  function handleReset() {
    scannedUrl = null
    error = null
    if (fileInput) {
      fileInput.value = ""
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Scan QR Code</CardTitle>
    <CardDescription>Upload an image to extract the QR code URL</CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    <div class="flex flex-col items-center justify-center space-y-4">
      <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        onchange={handleFileChange}
        class="hidden"
        aria-label="Upload QR code image"
      />

      <div
        bind:this={dropZone}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        class="w-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors {isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'}"
        onclick={handleUploadClick}
        role="button"
        tabindex="0"
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleUploadClick()
          }
        }}
      >
        {#if scanning}
          <svg
            class="mx-auto h-12 w-12 animate-spin text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="mt-4 text-sm text-muted-foreground">Scanning QR code...</p>
        {:else}
          <Upload class="mx-auto h-12 w-12 text-muted-foreground" />
          <p class="mt-4 text-sm font-medium">
            {isDragging ? "Drop image here" : "Drag and drop or click to upload"}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">PNG, JPEG, GIF, WEBP</p>
        {/if}
      </div>

      {#if scannedUrl}
        <div class="w-full space-y-2 rounded-lg border bg-muted p-4">
          <Label class="text-sm font-medium">Scanned URL:</Label>
          <p class="font-mono text-sm break-all">{scannedUrl}</p>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={() => navigator.clipboard.writeText(scannedUrl || "")}
            >
              Copy URL
            </Button>
            <Button type="button" variant="ghost" size="sm" onclick={handleReset}>
              Scan Another
            </Button>
          </div>
        </div>
      {/if}

      {#if error}
        <div class="w-full rounded-lg border border-destructive bg-destructive/10 p-4">
          <p class="text-sm text-destructive">{error}</p>
          <Button type="button" variant="ghost" size="sm" onclick={handleReset} class="mt-2">
            Try Again
          </Button>
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
