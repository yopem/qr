<script lang="ts">
  import { Download, LoaderCircle } from "@lucide/svelte"
  import { enhance } from "$app/forms"
  import { page } from "$app/stores"
  import { Button } from "$lib/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { generateQrFilename } from "$lib/utils/qr-generator"

  interface Props {
    /**
     * Whether to show the Dynamic QR checkbox
     * Set to true for authenticated users, false for guests
     */
    showModeTabs?: boolean
    /**
     * Initial QR type (static or dynamic)
     */
    initialType?: "static" | "dynamic"
    /**
     * Initial URL to populate the form
     * Used when scanning a QR code and switching to generate tab
     */
    initialUrl?: string
  }

  let { showModeTabs = true, initialType = "static", initialUrl = "" }: Props = $props()

  let qrType = $state<"static" | "dynamic">(initialType)
  let generatedSvg = $state<string | null>(null)
  let generatedShortCode = $state<string | null>(null)
  let destinationUrl = $state<string>(initialUrl)
  let description = $state<string>("")
  let foregroundColor = $state<string>("#000000")
  let backgroundColor = $state<string>("#FFFFFF")
  let isSubmitting = $state(false)
  let error = $state<string | null>(null)

  // Update URL when initialUrl changes
  $effect(() => {
    if (initialUrl && !destinationUrl) {
      destinationUrl = initialUrl
    }
  })

  // Handle form result from page store
  $effect(() => {
    const form = $page.form
    if (form && typeof form === "object" && "success" in form && form.success && "svg" in form) {
      generatedSvg = form.svg as string
      generatedShortCode = (form.shortCode as string | null) || null
      error = null
    }
  })

  function handleDownload() {
    if (!generatedSvg) return

    const filename = generateQrFilename(destinationUrl, qrType).replace(".svg", ".png")

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    canvas.width = 1000
    canvas.height = 1000

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = downloadUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(downloadUrl)
          }
        }, "image/png")
      }
    }

    const svgBlob = new Blob([generatedSvg], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Generate a QR</CardTitle>
    <CardDescription>
      Quickly generate static or dynamic QR codes, personalize their design, and update their
      destinations at any time.
    </CardDescription>
  </CardHeader>

  <CardContent>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Left side: Form -->
      <form
        method="POST"
        action="?/generateQrCode"
        use:enhance={() => {
          isSubmitting = true
          error = null
          return async ({ update, result }) => {
            isSubmitting = false
            await update()
            if (
              result.type === "failure" &&
              result.data &&
              typeof result.data === "object" &&
              "message" in result.data
            ) {
              error = (result.data.message as string) || "Failed to generate QR code"
            }
          }
        }}
        class="space-y-6"
      >
        <input type="hidden" name="type" value={qrType} />
        <input name="foregroundColor" value={foregroundColor} type="hidden" />
        <input name="backgroundColor" value={backgroundColor} type="hidden" />

        <div class="space-y-2">
          <Label for="url">Destination URL</Label>
          <Input
            id="url"
            name="destinationUrl"
            bind:value={destinationUrl}
            placeholder="example.com or https://example.com"
            required
          />
        </div>

        {#if showModeTabs}
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="dynamic-checkbox"
              checked={qrType === "dynamic"}
              onchange={(e) => {
                qrType = e.currentTarget.checked ? "dynamic" : "static"
              }}
              class="h-4 w-4"
            />
            <Label for="dynamic-checkbox">DynamicQR</Label>
          </div>
        {/if}

        {#if qrType === "dynamic"}
          <div class="space-y-2">
            <Label for="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              bind:value={description}
              placeholder="Brief description of this QR code"
              maxlength={500}
            />
          </div>
        {/if}

        <!-- Color customization inline -->
        <div class="space-y-4 rounded-lg border p-4">
          <div class="space-y-2">
            <Label for="foreground-color">Foreground Color</Label>
            <div class="flex gap-2">
              <Input
                id="foreground-color"
                type="color"
                bind:value={foregroundColor}
                class="h-10 w-20"
              />
              <Input
                type="text"
                bind:value={foregroundColor}
                placeholder="#000000"
                class="flex-1 font-mono text-sm"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="background-color">Background Color</Label>
            <div class="flex gap-2">
              <Input
                id="background-color"
                type="color"
                bind:value={backgroundColor}
                class="h-10 w-20"
              />
              <Input
                type="text"
                bind:value={backgroundColor}
                placeholder="#FFFFFF"
                class="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} class="w-full">
          {#if isSubmitting}
            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
            Generating...
          {:else}
            Generate
          {/if}
        </Button>

        {#if error}
          <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p class="text-sm font-medium text-destructive">Failed to generate QR code</p>
            <p class="mt-1 text-sm text-destructive/90">{error}</p>
            {#if error.includes("save") || error.includes("database")}
              <p class="mt-2 text-xs text-muted-foreground">
                There was a problem saving your QR code. Please try again.
              </p>
            {:else if error.includes("Authentication required")}
              <p class="mt-2 text-xs text-muted-foreground">
                Please <a href="/auth/login" class="underline">sign in</a> to create dynamic QR codes.
              </p>
            {:else if error.includes("Invalid")}
              <p class="mt-2 text-xs text-muted-foreground">
                Please check that your URL is valid and try again.
              </p>
            {:else}
              <p class="mt-2 text-xs text-muted-foreground">
                An unexpected error occurred. Please try again.
              </p>
            {/if}
          </div>
        {/if}
      </form>

      <!-- Right side: QR Code Preview -->
      <div class="flex flex-col items-center justify-center gap-4">
        {#if generatedSvg}
          <div class="rounded-lg border bg-white p-8">
            <div class="h-[250px] w-[250px] overflow-hidden [&_svg]:h-full [&_svg]:w-full">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html generatedSvg}
            </div>
          </div>

          <Button type="button" variant="outline" onclick={handleDownload} class="w-full max-w-xs">
            <Download class="mr-2 h-4 w-4" />
            Download
          </Button>

          {#if generatedShortCode}
            <p class="text-center text-sm text-muted-foreground">
              Short URL: <code class="rounded bg-muted px-1 py-0.5"
                >{window.location.origin}/{generatedShortCode}</code
              >
            </p>
          {/if}
        {:else}
          <div
            class="flex h-[250px] w-[250px] items-center justify-center rounded-lg border bg-muted"
          >
            <p class="text-sm text-muted-foreground">QR code will appear here</p>
          </div>
        {/if}
      </div>
    </div>
  </CardContent>
</Card>
