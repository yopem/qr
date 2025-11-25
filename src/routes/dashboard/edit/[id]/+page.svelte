<script lang="ts">
  import { ArrowLeft, Download, Save } from "@lucide/svelte"
  import { goto } from "$app/navigation"
  import QrCustomizer from "$lib/components/qr/qr-customizer.svelte"
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

  import { getQrCode, updateQrCode } from "../../../qr-codes.remote.js"

  interface QrCodeData {
    id: string
    shortCode: string | null
    destinationUrl: string
    title: string | null
    description: string | null
    scanCount: number
    lastScannedAt: Date | null
    style?: {
      foregroundColor: string
      backgroundColor: string
      pattern: string
    }
  }

  let { data } = $props()

  let qrData = $state<QrCodeData | null>(null)
  let previewSvg = $state<string | null>(null)
  let loading = $state(false)

  $effect(() => {
    loadQrCode()
  })

  async function loadQrCode() {
    try {
      qrData = await getQrCode(data.qrCodeId)

      if (qrData) {
        updateQrCode.fields.set({
          id: qrData.id,
          destinationUrl: qrData.destinationUrl,
          title: qrData.title || "",
          description: qrData.description || "",
          foregroundColor: qrData.style?.foregroundColor || "#000000",
          backgroundColor: qrData.style?.backgroundColor || "#FFFFFF",
        })
        await updatePreview()
      }
    } catch (error) {
      toast.error("Failed to load QR code")
      console.error(error)
    }
  }

  async function updatePreview() {
    if (!qrData) return

    try {
      const fields = updateQrCode.fields.value()
      const svg = await generateQrCodeSvg({
        url: qrData.shortCode
          ? `${window.location.origin}/${qrData.shortCode}`
          : qrData.destinationUrl,
        styles: {
          foregroundColor: fields.foregroundColor,
          backgroundColor: fields.backgroundColor,
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
    if (!previewSvg || !qrData) return

    const filename = `qr-code-${qrData.title || qrData.shortCode || "download"}.png`

    // Convert SVG to PNG
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    // Set canvas size (higher resolution for better quality)
    canvas.width = 1000
    canvas.height = 1000

    img.onload = () => {
      if (ctx) {
        // Fill white background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Convert to PNG and download
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

    // Create SVG blob and convert to data URL
    const svgBlob = new Blob([previewSvg], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl
  }
</script>

<div class="container mx-auto max-w-5xl px-4 py-8">
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" onclick={() => goto("/dashboard")}>
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">Edit QR Code</h1>
        <p class="text-muted-foreground">Update your QR code details and styling</p>
      </div>
    </div>

    {#if !qrData}
      <div class="grid gap-6 md:grid-cols-2">
        <div class="h-96 animate-pulse rounded-lg bg-muted"></div>
        <div class="h-96 animate-pulse rounded-lg bg-muted"></div>
      </div>
    {:else}
      <form
        {...updateQrCode.enhance(async ({ submit }) => {
          loading = true
          try {
            await submit()
            toast.success("QR code updated successfully")
            goto("/dashboard")
          } catch (error) {
            toast.error("Failed to update QR code")
            console.error(error)
          } finally {
            loading = false
          }
        })}
      >
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Details</CardTitle>
                <CardDescription>Update the destination and metadata</CardDescription>
              </CardHeader>

              <CardContent class="space-y-4">
                <input type="hidden" name="id" value={qrData.id} />

                <div class="space-y-2">
                  <Label for="destination-url">Destination URL</Label>
                  <Input
                    {...updateQrCode.fields.destinationUrl.as("url")}
                    id="destination-url"
                    placeholder="https://example.com"
                    oninput={handleFieldChange}
                  />
                  {#each updateQrCode.fields.destinationUrl.issues() as issue (issue.message)}
                    <p class="text-sm text-destructive">{issue.message}</p>
                  {/each}
                </div>

                <div class="space-y-2">
                  <Label for="title">Title (Optional)</Label>
                  <Input
                    {...updateQrCode.fields.title.as("text")}
                    id="title"
                    placeholder="My QR Code"
                    maxlength={100}
                  />
                  {#each updateQrCode.fields.title.issues() as issue (issue.message)}
                    <p class="text-sm text-destructive">{issue.message}</p>
                  {/each}
                </div>

                <div class="space-y-2">
                  <Label for="description">Description (Optional)</Label>
                  <Textarea
                    {...updateQrCode.fields.description.as("text")}
                    id="description"
                    placeholder="Brief description"
                    maxlength={500}
                  />
                  {#each updateQrCode.fields.description.issues() as issue (issue.message)}
                    <p class="text-sm text-destructive">{issue.message}</p>
                  {/each}
                </div>

                <Button type="submit" disabled={!!updateQrCode.pending || loading} class="w-full">
                  {#if updateQrCode.pending || loading}
                    Saving...
                  {:else}
                    <Save class="mr-2 h-4 w-4" />
                    Save Changes
                  {/if}
                </Button>
              </CardContent>
            </Card>

            <QrCustomizer form={updateQrCode} />
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
                      <div
                        class="h-[200px] w-[200px] overflow-hidden [&_svg]:h-full [&_svg]:w-full"
                      >
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
                  <span class="text-2xl font-bold">{qrData.scanCount}</span>
                </div>
                {#if qrData.lastScannedAt}
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">Last Scanned:</span>
                    <span>{new Date(qrData.lastScannedAt).toLocaleDateString()}</span>
                  </div>
                {/if}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    {/if}
  </div>
</div>
