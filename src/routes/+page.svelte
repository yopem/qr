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

<section class="mx-auto max-w-6xl space-y-10">
  <div class="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
    <div class="space-y-4">
      <div
        class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/10"
      >
        QR Generator and Scanner
      </div>
      <div class="space-y-3">
        <h1 class="text-4xl font-bold tracking-tight md:text-6xl">
          Generate, track, and share QR codes
        </h1>
        <p class="text-lg text-muted-foreground">
          Launch branded QR journeys with analytics, dynamic QR updates, and instant scanner
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a
          class="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          href={data.user ? "/dashboard" : "/auth/login"}
        >
          {data.user ? "Go to dashboard" : "Get started"}
        </a>
        <a
          class="inline-flex items-center gap-2 rounded-md border border-input px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
          href="#generator"
        >
          Try It!
        </a>
      </div>
    </div>

    <div class="relative">
      <div
        class="pointer-events-none absolute inset-6 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 blur-3xl"
      ></div>
      <div class="relative overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div class="border-b bg-muted/60 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="h-3 w-20 rounded-full bg-muted-foreground/30"></div>
            <div class="flex gap-1.5">
              <div class="h-3 w-3 rounded-full bg-red-400"></div>
              <div class="h-3 w-3 rounded-full bg-amber-400"></div>
              <div class="h-3 w-3 rounded-full bg-emerald-400"></div>
            </div>
          </div>
        </div>
        <div class="space-y-4 bg-card px-6 py-6">
          <div class="space-y-2">
            <div class="h-3 w-28 rounded-full bg-muted"></div>
            <div class="h-2.5 w-48 rounded-full bg-muted/70"></div>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div class="flex items-center justify-between text-sm font-semibold">
                <span>Dynamic QR</span>
                <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                  >Live</span
                >
              </div>
              <div class="h-2.5 w-32 rounded-full bg-muted"></div>
              <div
                class="h-40 rounded-lg bg-gradient-to-br from-primary/10 via-background to-primary/20"
              ></div>
              <div class="flex gap-2 text-xs text-muted-foreground">
                <span class="inline-flex items-center gap-1">
                  <span class="size-2 rounded-full bg-emerald-400"></span>
                  Active
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="size-2 rounded-full bg-blue-400"></span>
                  Tracked
                </span>
              </div>
            </div>
            <div class="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
              <div class="flex items-center gap-2 text-sm font-semibold">
                <div class="size-6 rounded-full bg-primary/10 text-primary"></div>
                <span>Static QR Preview</span>
              </div>
              <div class="aspect-square rounded-lg border bg-muted/30"></div>
              <div class="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span class="rounded-md bg-muted/60 px-2 py-1">PNG</span>
                <span class="rounded-md bg-muted/60 px-2 py-1">SVG</span>
                <span class="rounded-md bg-muted/60 px-2 py-1">EPS</span>
                <span class="rounded-md bg-muted/60 px-2 py-1">Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<Features />

<section id="generator" class="mt-4 space-y-6">
  <Tabs bind:value={activeTab} class="space-y-6">
    <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold tracking-tight md:text-3xl">Generate or scan instantly</h2>
      </div>
      <TabsList class="relative z-10 grid w-full grid-cols-2 md:w-auto md:grid-cols-[1fr_1fr]">
        <TabsTrigger value="generate">Generate</TabsTrigger>
        <TabsTrigger value="scan">Scan</TabsTrigger>
      </TabsList>
    </div>

    <div class="space-y-6">
      <TabsContent value="generate" class="space-y-6">
        <QrGenerator showModeTabs={!!data.user} initialUrl={scannedUrl} user={data.user} />

        {#if !data.user}
          <div class="rounded-lg border bg-muted/60 p-4 text-center">
            <p class="text-sm text-muted-foreground">
              <strong>Want to track your QR codes?</strong>
              <a href="/auth/login" class="ml-2 text-primary hover:underline">Sign in</a>
              to create dynamic QR codes and view analytics.
            </p>
          </div>
        {/if}
      </TabsContent>

      <TabsContent value="scan" class="space-y-6">
        <QrScanner onScan={handleScan} onGenerateQr={handleGenerateQr} user={data.user} />
      </TabsContent>
    </div>
  </Tabs>
</section>
