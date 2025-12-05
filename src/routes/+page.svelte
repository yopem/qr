<script lang="ts">
  import Features from "$lib/components/features.svelte"
  import QrGenerator from "$lib/components/qr/qr-generator.svelte"
  import QrScanner from "$lib/components/qr/qr-scanner.svelte"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs"

  let { data } = $props()

  let activeTab = $state("generate")
  let scannedUrl = $state<string | undefined>(undefined)

  function handleScan(url: string) {
    scannedUrl = url
  }

  function handleGenerateQr(url: string) {
    scannedUrl = url
    activeTab = "generate"
  }
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h1 class="text-4xl font-bold tracking-tight">QR Code Generator</h1>
      <p class="text-lg text-muted-foreground">Create, customize, and scan QR codes for free</p>
    </div>

    <Tabs bind:value={activeTab} class="w-full">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="generate">Generate</TabsTrigger>
        <TabsTrigger value="scan">Scan</TabsTrigger>
      </TabsList>

      <TabsContent value="generate" class="space-y-6">
        <QrGenerator showModeTabs={!data.user} initialUrl={scannedUrl} />

        {#if !data.user}
          <div class="rounded-lg border bg-muted p-4 text-center">
            <p class="text-sm text-muted-foreground">
              <strong>Want to track your QR codes?</strong>
              <a href="/auth/login" class="ml-2 text-primary hover:underline">Sign in</a>
              to create dynamic QR codes and view analytics.
            </p>
          </div>
        {/if}
      </TabsContent>

      <TabsContent value="scan" class="space-y-6">
        <QrScanner onScan={handleScan} onGenerateQr={handleGenerateQr} />
      </TabsContent>
    </Tabs>
  </div>
</div>

<Features />
