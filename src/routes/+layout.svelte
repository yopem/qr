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
</svelte:head>

<div class="flex min-h-screen flex-col">
  <Navigation user={data?.user} />

  <main class="flex-1">
    {@render children()}
  </main>

  <Footer />
</div>
