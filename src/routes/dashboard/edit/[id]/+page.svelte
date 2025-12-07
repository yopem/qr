<script lang="ts">
  import { ArrowLeft, ChevronRight, Download, Save } from "@lucide/svelte"
  import { enhance } from "$app/forms"
  import { goto } from "$app/navigation"
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
  import { generateQrCodeSvg } from "$lib/utils/qr-generator"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  let destinationUrl = $state(data.qrCode.destinationUrl)
  let description = $state(data.qrCode.description || "")
  let foregroundColor = $state(data.qrCode.style?.foregroundColor || "#000000")
  let backgroundColor = $state(data.qrCode.style?.backgroundColor || "#FFFFFF")
  let previewSvg = $state<string | null>(null)
  let loading = $state(false)

  $effect(() => {
    updatePreview()
  })

  async function updatePreview() {
    try {
      const svg = await generateQrCodeSvg({
        url: data.qrCode.shortCode
          ? `${window.location.origin}/${data.qrCode.shortCode}`
          : destinationUrl,
        styles: {
          foregroundColor,
          backgroundColor,
        },
      })
      previewSvg = svg
    } catch (error) {
      console.error("Failed to update preview:", error)
    }
  }

  function handleFieldChange() {
    updatePreview()
  }

  function handleDownload() {
    if (!previewSvg) return

    const filename = `qr-code-${data.qrCode.title || data.qrCode.shortCode || "download"}.png`

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

    const svgBlob = new Blob([previewSvg], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl
  }
</script>

<div class="container mx-auto max-w-5xl px-4 py-8">
  <div class="space-y-6">
    <nav class="flex items-center gap-2 text-sm text-muted-foreground">
      <a href="/" class="hover:text-foreground">Home</a>
      <ChevronRight class="h-4 w-4" />
      <a href="/dashboard" class="hover:text-foreground">Dashboard</a>
      <ChevronRight class="h-4 w-4" />
      <span class="text-foreground">Edit</span>
    </nav>

    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" onclick={() => goto("/dashboard")}>
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">Edit QR Code</h1>
        <p class="text-muted-foreground">Update your QR code details and styling</p>
      </div>
    </div>

    <form
      method="POST"
      action="?/updateQrCode"
      use:enhance={() => {
        loading = true
        return async ({ update, result }) => {
          loading = false
          await update()
          if (result.type === "success") {
            toast.success("QR code updated successfully")
            setTimeout(() => goto("/dashboard"), 500)
          } else {
            toast.error("Failed to update QR code")
          }
        }
      }}
    >
      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Details</CardTitle>
              <CardDescription>Update the destination and metadata</CardDescription>
            </CardHeader>

            <CardContent class="space-y-4">
              <input type="hidden" name="id" value={data.qrCode.id} />

              <div class="space-y-2">
                <Label for="destination-url">Destination URL</Label>
                <Input
                  id="destination-url"
                  name="destinationUrl"
                  type="url"
                  bind:value={destinationUrl}
                  placeholder="https://example.com"
                  oninput={handleFieldChange}
                  disabled={data.qrCode.type === "static"}
                />
                {#if data.qrCode.type === "static"}
                  <p class="text-sm text-muted-foreground">
                    Static QR codes cannot have their URL changed
                  </p>
                {/if}
              </div>

              <div class="space-y-2">
                <Label for="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  bind:value={description}
                  placeholder="Brief description"
                  maxlength={500}
                />
              </div>

              <div class="space-y-4 rounded-lg border p-4">
                <div class="space-y-2">
                  <Label for="foreground-color">Foreground Color</Label>
                  <div class="flex gap-2">
                    <Input
                      id="foreground-color"
                      name="foregroundColor"
                      type="color"
                      bind:value={foregroundColor}
                      oninput={handleFieldChange}
                      class="h-10 w-20"
                    />
                    <Input
                      type="text"
                      bind:value={foregroundColor}
                      oninput={handleFieldChange}
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
                      name="backgroundColor"
                      type="color"
                      bind:value={backgroundColor}
                      oninput={handleFieldChange}
                      class="h-10 w-20"
                    />
                    <Input
                      type="text"
                      bind:value={backgroundColor}
                      oninput={handleFieldChange}
                      placeholder="#FFFFFF"
                      class="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} class="w-full">
                {#if loading}
                  Saving...
                {:else}
                  <Save class="mr-2 h-4 w-4" />
                  Save Changes
                {/if}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Live preview of your QR code</CardDescription>
            </CardHeader>

            <CardContent class="space-y-4">
              <div class="flex justify-center">
                {#if previewSvg}
                  <div class="rounded-lg border bg-white p-8">
                    <div class="h-[200px] w-[200px] overflow-hidden [&_svg]:h-full [&_svg]:w-full">
                      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                      {@html previewSvg}
                    </div>
                  </div>
                {:else}
                  <div class="h-64 w-64 animate-pulse rounded-lg bg-muted"></div>
                {/if}
              </div>

              {#if previewSvg}
                <div class="flex justify-center">
                  <Button type="button" variant="outline" onclick={handleDownload}>
                    <Download class="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              {/if}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>QR code analytics</CardDescription>
            </CardHeader>

            <CardContent class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Total Scans:</span>
                <span class="text-2xl font-bold">{data.qrCode.scanCount}</span>
              </div>
              {#if data.qrCode.lastScannedAt}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">Last Scanned:</span>
                  <span>{new Date(data.qrCode.lastScannedAt).toLocaleDateString()}</span>
                </div>
              {/if}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  </div>
</div>
