<script lang="ts">
  import "./layout.css"

  import favicon from "$lib/assets/favicon.svg"
  import Footer from "$lib/components/footer.svelte"
  import Navigation from "$lib/components/navigation.svelte"
  import Seo from "sk-seo"

  let { children, data } = $props()
</script>

<Seo />
<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="color-scheme" content="light dark" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script
    defer
    src="https://analytics.yopem.com/script.js"
    data-website-id="6ca1bda3-6852-48c5-9df5-0b3bca2ff5ce"
  ></script>
</svelte:head>

<div class="min-h-screen bg-linear-to-b from-background via-background to-muted/40">
  <div class="flex min-h-screen flex-col">
    <Navigation user={data?.user} />

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {@render children()}
      </div>
    </main>

    <Footer />
  </div>
</div>
