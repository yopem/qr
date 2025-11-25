<script lang="ts">
  import "./layout.css"

  import favicon from "$lib/assets/favicon.png"
  import Footer from "$lib/components/ui/footer.svelte"
  import Navigation from "$lib/components/ui/navigation.svelte"

  let { children, data } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
  <Navigation user={data?.user} />

  <main class="flex-1">
    {@render children()}
  </main>

  <Footer />
</div>
