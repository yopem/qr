<script lang="ts">
  import { Download, Loader2 } from "@lucide/svelte"
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

  import { generateQrCode } from "../../../routes/qr-codes.remote.js"

  interface Props {
    /**
     * Whether to show the guest/user mode tabs
     * Set to false on dashboard where user is always authenticated
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

  let { showModeTabs = true, initialType = "static", initialUrl }: Props = $props()

  let qrType = $state<"static" | "dynamic">(initialType)
  let generatedSvg = $state<string | null>(null)
  let generatedShortCode = $state<string | null>(null)

  // Derive reactive values for hidden inputs
  let foregroundColor = $derived(generateQrCode.fields.foregroundColor.value() || "#000000")
  let backgroundColor = $derived(generateQrCode.fields.backgroundColor.value() || "#FFFFFF")

  function handleDownload() {
    if (!generatedSvg) return

    const url = generateQrCode.fields.destinationUrl.value()
    const filename = generateQrFilename(url, qrType).replace(".svg", ".png")

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

  // Initialize the type field on mount
  $effect(() => {
    generateQrCode.fields.type.set(qrType)
  })

  // Populate URL field when initialUrl is provided
  $effect(() => {
    if (initialUrl && !generateQrCode.fields.destinationUrl.value()) {
      generateQrCode.fields.destinationUrl.set(initialUrl)
    }
  })

  // Auto-add https:// to URLs that don't have a protocol
  $effect(() => {
    const url = generateQrCode.fields.destinationUrl.value()
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      generateQrCode.fields.destinationUrl.set(`https://${url}`)
    }
  })

  $effect(() => {
    if (generateQrCode.result?.success) {
      generatedSvg = generateQrCode.result.svg
      generatedShortCode = generateQrCode.result.shortCode || null
    }
  })
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
      <form {...generateQrCode} class="space-y-6">
        <input type="hidden" name="type" value={qrType} />
        <input name="foregroundColor" value={foregroundColor} type="hidden" />
        <input name="backgroundColor" value={backgroundColor} type="hidden" />

        <div class="space-y-2">
          <Label for="url">Destination URL</Label>
          <Input
            {...generateQrCode.fields.destinationUrl.as("url")}
            id="url"
            placeholder="example.com or https://example.com"
            required
          />
          {#each generateQrCode.fields.destinationUrl.issues() as issue (issue.message)}
            <p class="text-sm text-destructive">{issue.message}</p>
          {/each}
        </div>

        {#if showModeTabs}
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="dynamic-checkbox"
              checked={qrType === "dynamic"}
              onchange={(e) => {
                qrType = e.currentTarget.checked ? "dynamic" : "static"
                generateQrCode.fields.type.set(qrType)
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
              {...generateQrCode.fields.description.as("text")}
              id="description"
              placeholder="Brief description of this QR code"
              maxlength={500}
            />
            {#each generateQrCode.fields.description.issues() as issue (issue.message)}
              <p class="text-sm text-destructive">{issue.message}</p>
            {/each}
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
                value={foregroundColor}
                oninput={(e) => generateQrCode.fields.foregroundColor.set(e.currentTarget.value)}
                class="h-10 w-20"
              />
              <Input
                type="text"
                value={foregroundColor}
                oninput={(e) => generateQrCode.fields.foregroundColor.set(e.currentTarget.value)}
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
                value={backgroundColor}
                oninput={(e) => generateQrCode.fields.backgroundColor.set(e.currentTarget.value)}
                class="h-10 w-20"
              />
              <Input
                type="text"
                value={backgroundColor}
                oninput={(e) => generateQrCode.fields.backgroundColor.set(e.currentTarget.value)}
                placeholder="#FFFFFF"
                class="flex-1 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={!!generateQrCode.pending} class="w-full">
          {#if generateQrCode.pending}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Generating...
          {:else}
            Generate
          {/if}
        </Button>

        {#each generateQrCode.fields.allIssues() as issue (issue.message)}
          <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p class="text-sm font-medium text-destructive">Failed to generate QR code</p>
            <p class="mt-1 text-sm text-destructive/90">{issue.message}</p>
            {#if issue.message.includes("save") || issue.message.includes("database")}
              <p class="mt-2 text-xs text-muted-foreground">
                There was a problem saving your QR code. Please try again.
              </p>
            {:else if issue.message.includes("Authentication required")}
              <p class="mt-2 text-xs text-muted-foreground">
                Please <a href="/auth/login" class="underline">sign in</a> to create dynamic QR codes.
              </p>
            {:else if issue.message.includes("Invalid")}
              <p class="mt-2 text-xs text-muted-foreground">
                Please check that your URL is valid and try again.
              </p>
            {:else}
              <p class="mt-2 text-xs text-muted-foreground">
                An unexpected error occurred. Please try again.
              </p>
            {/if}
          </div>
        {/each}
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
