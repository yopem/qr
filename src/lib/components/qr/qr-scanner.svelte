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
  import {
    canScan,
    getRemainingScans,
    getScanCount,
    GUEST_SCAN_LIMIT,
    incrementScan,
  } from "$lib/utils/usage-tracker"
  import { toast } from "svelte-sonner"

  interface Props {
    onScan?: (url: string) => void
    onGenerateQr?: (url: string) => void
    user?: { id: string } | null
  }

  let { onScan, onGenerateQr, user = null }: Props = $props()

  let fileInput: HTMLInputElement | null = $state(null)
  let scanning = $state(false)
  let scannedUrl = $state<string | null>(null)
  let error = $state<string | null>(null)
  let isDragging = $state(false)
  let imagePreviewUrl = $state<string | null>(null)
  let usageCount = $state(0)

  const isGuest = $derived(!user)
  const hasReachedLimit = $derived(isGuest && !canScan())

  $effect(() => {
    if (typeof window !== "undefined" && isGuest) {
      usageCount = getScanCount()
    }
  })

  let isPasteAvailable = $derived(
    typeof window !== "undefined" &&
      (typeof navigator.clipboard !== "undefined" || typeof ClipboardEvent !== "undefined"),
  )

  function cleanupPreview() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
      imagePreviewUrl = null
    }
  }

  function generatePreview(file: File) {
    try {
      cleanupPreview()
      imagePreviewUrl = URL.createObjectURL(file)
    } catch (err) {
      console.error("Failed to generate preview:", err)
    }
  }

  $effect(() => {
    return () => {
      cleanupPreview()
    }
  })

  async function handlePaste(event: ClipboardEvent) {
    if (scanning) return

    const items = event.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          event.preventDefault()
          await processFile(file)
          break
        }
      }
    }
  }

  $effect(() => {
    if (typeof window === "undefined") return

    const handleGlobalPaste = (e: ClipboardEvent) => handlePaste(e)
    window.addEventListener("paste", handleGlobalPaste)

    return () => {
      window.removeEventListener("paste", handleGlobalPaste)
    }
  })

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      error = "Please upload an image file"
      return
    }

    if (isGuest && !canScan()) {
      error = "You've reached your free scan limit. Sign in to continue scanning."
      return
    }

    generatePreview(file)

    scanning = true
    error = null
    scannedUrl = null

    try {
      const result = await scanQrCode(file)

      if (result.success && result.data) {
        scannedUrl = result.data
        onScan?.(result.data)

        if (isGuest) {
          incrementScan()
          usageCount = getScanCount()

          if (usageCount === Math.floor(GUEST_SCAN_LIMIT / 2)) {
            toast.info("You've used half your free scans", {
              description: "Sign in for unlimited QR scanning and analytics",
            })
          }
        }
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
    cleanupPreview()
    if (fileInput) {
      fileInput.value = ""
    }
  }
</script>

<Card>
  <CardHeader>
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>Upload an image to extract the QR code URL</CardDescription>
      </div>
      {#if isGuest && !hasReachedLimit}
        <div class="flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm">
          <span class="font-medium">{getRemainingScans()}/{GUEST_SCAN_LIMIT}</span>
          <span class="text-muted-foreground">remaining</span>
        </div>
      {/if}
    </div>
  </CardHeader>

  <CardContent>
    {#if hasReachedLimit}
      <div class="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Free scan limit reached</h3>
          <p class="text-sm text-muted-foreground">
            You've used all {GUEST_SCAN_LIMIT} free QR scans. Sign in with Google to unlock:
          </p>
        </div>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2">
            <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span>Unlimited QR code scanning</span>
          </li>
          <li class="flex items-center gap-2">
            <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span>Save and manage scanned QR codes</span>
          </li>
          <li class="flex items-center gap-2">
            <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span>Analytics for your dynamic QR codes</span>
          </li>
          <li class="flex items-center gap-2">
            <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
            <span>Create unlimited QR codes</span>
          </li>
        </ul>
        <Button href="/auth/login" class="w-full">Sign in with Google</Button>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Left side: Upload Area -->
        <div>
          <input
            bind:this={fileInput}
            type="file"
            accept="image/*"
            onchange={handleFileChange}
            class="hidden"
            aria-label="Upload QR code image"
          />

          <div
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            class="relative flex min-h-[320px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none {isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'}"
            onclick={handleUploadClick}
            role="button"
            tabindex="0"
            aria-label="Upload QR code image or paste from clipboard"
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleUploadClick()
              }
            }}
          >
            {#if scanning}
              <div class="flex flex-col items-center gap-4">
                {#if imagePreviewUrl}
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded QR code"
                    class="max-h-[200px] max-w-[200px] rounded-lg border object-contain shadow-sm"
                  />
                {/if}
                <div class="flex flex-col items-center gap-3">
                  <svg
                    class="h-10 w-10 animate-spin text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p
                    class="text-sm font-medium text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    Scanning QR code...
                  </p>
                </div>
              </div>
            {:else}
              <div class="flex flex-col items-center gap-4">
                <div
                  class="flex h-16 w-16 items-center justify-center rounded-full bg-muted ring-8 ring-muted/50"
                >
                  <Upload class="h-8 w-8 text-muted-foreground" />
                </div>
                <div class="space-y-2">
                  <p class="text-base font-medium text-foreground">
                    {isDragging
                      ? "Drop image here"
                      : isPasteAvailable
                        ? "Drag & drop, click to upload, or paste (Ctrl+V)"
                        : "Drag and drop or click to upload"}
                  </p>
                  <p class="text-sm text-muted-foreground">PNG, JPEG, GIF, WEBP</p>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Right side: Results / Placeholder -->
        <div class="flex flex-col justify-center">
          {#if scannedUrl}
            <div
              class="space-y-4 rounded-lg border bg-muted/50 p-6"
              role="region"
              aria-live="polite"
            >
              {#if imagePreviewUrl}
                <div class="flex justify-center">
                  <img
                    src={imagePreviewUrl}
                    alt="Scanned QR code"
                    class="max-h-[200px] max-w-[200px] rounded-lg border bg-background object-contain shadow-sm"
                  />
                </div>
              {/if}
              <div class="space-y-2">
                <Label class="text-sm font-semibold">Scanned URL:</Label>
                <div class="rounded-md bg-background p-3">
                  <p class="font-mono text-sm break-all">{scannedUrl}</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onclick={() => onGenerateQr?.(scannedUrl || "")}
                >
                  Generate QR
                </Button>
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
          {:else if error}
            <div
              class="space-y-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6"
              role="alert"
              aria-live="assertive"
            >
              <p class="text-sm font-medium text-destructive">{error}</p>
              <Button type="button" variant="outline" size="sm" onclick={handleReset}
                >Try Again</Button
              >
            </div>
          {:else}
            <div
              class="flex h-full min-h-[320px] items-center justify-center rounded-lg border bg-muted"
            >
              <p class="text-sm text-muted-foreground">Scan results will appear here</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </CardContent>
</Card>
