<script lang="ts">
  import BarChartIcon from "@lucide/svelte/icons/bar-chart"
  import DownloadIcon from "@lucide/svelte/icons/download"
  import LinkIcon from "@lucide/svelte/icons/link"
  import PaletteIcon from "@lucide/svelte/icons/palette"
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw"
  import ShieldCheckIcon from "@lucide/svelte/icons/shield-check"
  import { Card, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card"

  const features = [
    {
      icon: RefreshCwIcon,
      title: "Dynamic QR Codes",
      description:
        "Update your QR destination anytime without reprinting. Perfect for marketing campaigns.",
    },
    {
      icon: BarChartIcon,
      title: "Track Analytics",
      description: "See how many people scan your QR codes and when. Make data-driven decisions.",
    },
    {
      icon: PaletteIcon,
      title: "Custom Branding",
      description:
        "Match your brand colors and style. Stand out with professional-looking QR codes.",
    },
    {
      icon: LinkIcon,
      title: "Multiple URL Formats",
      description:
        "Support for URLs, emails (mailto:), phone calls (tel:), SMS, WiFi networks, and more. Create QR codes for any purpose.",
    },
    {
      icon: DownloadIcon,
      title: "High Quality Export",
      description: "Download in PNG format at high resolution. Ready for print or digital use.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Reliable",
      description: "Your QR codes work forever. No expiration dates or hidden fees.",
    },
  ]
</script>

<section class="w-full bg-linear-to-b from-background to-muted/30 py-16 md:py-24">
  <div class="container mx-auto max-w-7xl px-4">
    <div class="mb-12 text-center">
      <p class="mx-auto max-w-2xl text-xl font-semibold">
        Create professional QR codes in seconds. Track performance, update destinations, and
        customize designs—all in one place.
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each features as feature (feature.title)}
        <Card class="transition-all hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <div
              class="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <svelte:component this={feature.icon} class="h-7 w-7" />
            </div>
            <CardTitle class="text-xl">{feature.title}</CardTitle>
            <CardDescription class="text-base">{feature.description}</CardDescription>
          </CardHeader>
        </Card>
      {/each}
    </div>
  </div>
</section>
