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
  import { Tabs, TabsList, TabsTrigger } from "$lib/components/ui/tabs"
  import { Textarea } from "$lib/components/ui/textarea"
  import { generateQrFilename } from "$lib/utils/qr-generator"

  import { generateQrCode } from "../../../routes/qr-codes.remote.js"
  import QrCustomizer from "./qr-customizer.svelte"

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
  }

  let { showModeTabs = true, initialType = "static" }: Props = $props()

  let qrType = $state<"static" | "dynamic">(initialType)
  let generatedSvg = $state<string | null>(null)
  let generatedShortCode = $state<string | null>(null)

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

  function handleTypeChange(type: "static" | "dynamic") {
    qrType = type
    generateQrCode.fields.type.set(type)
  }

  // Initialize the type field on mount
  $effect(() => {
    generateQrCode.fields.type.set(qrType)
  })

  $effect(() => {
    if (generateQrCode.result?.success) {
      generatedSvg = generateQrCode.result.svg
      generatedShortCode = generateQrCode.result.shortCode || null
    }
  })
</script>

<div class="qr-generator">
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Generate QR Code</CardTitle>
          <CardDescription>
            Create a QR code for any URL. {qrType === "dynamic"
              ? "Dynamic QR codes can be edited after creation."
              : "Static QR codes are permanent."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form {...generateQrCode} class="space-y-6">
            <input type="hidden" name="type" value={qrType} />

            {#if showModeTabs}
              <Tabs
                value={qrType}
                onValueChange={(v) => handleTypeChange(v as "static" | "dynamic")}
              >
                <TabsList class="grid w-full grid-cols-2">
                  <TabsTrigger value="static">Static</TabsTrigger>
                  <TabsTrigger value="dynamic">Dynamic (Login Required)</TabsTrigger>
                </TabsList>
              </Tabs>
            {/if}

            <div class="space-y-2">
              <Label for="url">Destination URL</Label>
              <Input
                {...generateQrCode.fields.destinationUrl.as("url")}
                id="url"
                placeholder="https://example.com"
                required
              />
              {#each generateQrCode.fields.destinationUrl.issues() as issue (issue.message)}
                <p class="text-sm text-destructive">{issue.message}</p>
              {/each}
            </div>

            {#if qrType === "dynamic"}
              <div class="space-y-2">
                <Label for="title">Title (Optional)</Label>
                <Input
                  {...generateQrCode.fields.title.as("text")}
                  id="title"
                  placeholder="My QR Code"
                  maxlength={100}
                />
                {#each generateQrCode.fields.title.issues() as issue (issue.message)}
                  <p class="text-sm text-destructive">{issue.message}</p>
                {/each}
              </div>

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

            <div class="flex gap-4">
              <Button type="submit" disabled={!!generateQrCode.pending} class="flex-1">
                {#if generateQrCode.pending}
                  <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                {:else}
                  Generate QR Code
                {/if}
              </Button>

              {#if generatedSvg}
                <Button type="button" variant="outline" onclick={handleDownload}>
                  <Download class="mr-2 h-4 w-4" />
                  Download
                </Button>
              {/if}
            </div>

            {#each generateQrCode.fields.allIssues() as issue (issue.message)}
              <p class="text-sm text-destructive">{issue.message}</p>
            {/each}
          </form>
        </CardContent>
      </Card>
    </div>

    <div class="space-y-6">
      <QrCustomizer form={generateQrCode} />

      {#if generatedSvg}
        <Card>
          <CardHeader>
            <CardTitle>Your QR Code</CardTitle>
            {#if generatedShortCode}
              <CardDescription>
                Short URL: <code class="rounded bg-muted px-1 py-0.5"
                  >{window.location.origin}/{generatedShortCode}</code
                >
              </CardDescription>
            {/if}
          </CardHeader>

          <CardContent class="space-y-4">
            <div class="flex justify-center">
              <div class="rounded-lg border bg-white p-8">
                <div class="h-[200px] w-[200px] overflow-hidden [&_svg]:h-full [&_svg]:w-full">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html generatedSvg}
                </div>
              </div>
            </div>

            <div class="flex justify-center">
              <Button type="button" variant="outline" onclick={handleDownload}>
                <Download class="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      {/if}
    </div>
  </div>
</div>
