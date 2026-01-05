<script lang="ts">
  import { Menu } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu"

  const services = [
    { name: "Search", url: "https://search.yopem.com" },
    { name: "Read", url: "https://read.yopem.com" },
    { name: "QR", url: "https://qr.yopem.com" },
  ] as const
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost" size="icon">
      <Menu class="size-4" />
      <span class="sr-only">Yopem Services</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {#each services as service (service.name)}
      <a href={service.url} target="_blank" rel="noopener noreferrer">
        <DropdownMenuItem>
          {service.name}
        </DropdownMenuItem>
      </a>
    {/each}
  </DropdownMenuContent>
</DropdownMenu>
