<script lang="ts">
  import { CalendarIcon, LayoutGrid, LayoutList, Plus, Search, X } from "@lucide/svelte"
  import { goto, invalidateAll } from "$app/navigation"
  import QrCard from "$lib/components/qr/qr-card.svelte"
  import QrGenerator from "$lib/components/qr/qr-generator.svelte"
  import QrListView from "$lib/components/qr/qr-list-view.svelte"
  import QrScanner from "$lib/components/qr/qr-scanner.svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover"
  import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  let { data } = $props()

  let activeTab = $state("list")
  let scannedUrl = $state<string | undefined>(undefined)

  let searchQuery = $state("")
  let sortBy = $state<"newest" | "oldest" | "name">("newest")
  let viewMode = $state<"list" | "grid">("list")
  let filterType = $state<"all" | "static" | "dynamic">("all")
  let dateRange = $state<{ start: string; end: string }>({
    start: "",
    end: "",
  })
  let isDeleting = $state(false)
  let mountKey = $state(0)

  onMount(() => {
    const saved = localStorage.getItem("dashboard-view-mode")
    if (saved === "list" || saved === "grid") {
      viewMode = saved
    }
    mountKey++
  })

  $effect(() => {
    localStorage.setItem("dashboard-view-mode", viewMode)
  })

  function toggleViewMode() {
    viewMode = viewMode === "list" ? "grid" : "list"
  }

  async function handleDelete(id: string) {
    if (isDeleting) return

    try {
      isDeleting = true
      const response = await fetch(`/api/qr/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete QR code")
      }

      await invalidateAll()
      toast.success("QR code deleted successfully")
    } catch (error) {
      toast.error("Failed to delete QR code")
      console.error(error)
    } finally {
      isDeleting = false
    }
  }

  function handleEdit(id: string) {
    goto(`/dashboard/edit/${id}`)
  }

  function handleScan(url: string) {
    scannedUrl = url
  }

  function handleGenerateQr(url: string) {
    scannedUrl = url
    activeTab = "generate"
  }

  function filterAndSortQrCodes(qrCodes: typeof data.qrCodes) {
    let filtered = qrCodes

    if (filterType !== "all") {
      filtered = filtered.filter((qr) => qr.type === filterType)
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      filtered = filtered.filter((qr) => new Date(qr.createdAt) >= startDate)
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      const endOfDay = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999,
      )
      filtered = filtered.filter((qr) => new Date(qr.createdAt) <= endOfDay)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (qr) =>
          qr.destinationUrl.toLowerCase().includes(query) ||
          qr.description?.toLowerCase().includes(query) ||
          qr.shortCode?.toLowerCase().includes(query),
      )
    }

    const sorted = [...filtered]
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sortBy === "name") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    }

    return sorted
  }

  function clearFilters() {
    searchQuery = ""
    filterType = "all"
    dateRange = { start: "", end: "" }
  }

  const hasActiveFilters = $derived(
    searchQuery.trim() !== "" ||
      filterType !== "all" ||
      dateRange.start !== "" ||
      dateRange.end !== "",
  )
</script>

<section class="space-y-8">
  <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div class="space-y-1">
      <p class="text-sm font-semibold tracking-[0.2em] text-primary uppercase">Dashboard</p>
      <h1 class="text-3xl font-bold tracking-tight">QR Code Manager</h1>
      <p class="text-muted-foreground">Create, scan, and manage all your QR codes</p>
    </div>
  </header>

  <Tabs bind:value={activeTab} class="space-y-6">
    <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <TabsList class="grid w-full grid-cols-3 md:w-auto md:grid-cols-[1fr_1fr_1fr]">
        <TabsTrigger value="list">My QR Codes</TabsTrigger>
        <TabsTrigger value="generate">Generate</TabsTrigger>
        <TabsTrigger value="scan">Scan</TabsTrigger>
      </TabsList>
      {#if activeTab === "list"}
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onclick={toggleViewMode}
            aria-label={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
          >
            {#if viewMode === "list"}
              <LayoutGrid class="h-4 w-4" />
            {:else}
              <LayoutList class="h-4 w-4" />
            {/if}
          </Button>
          <Button onclick={() => (activeTab = "generate")} class="gap-2">
            <Plus class="h-4 w-4" />
            Create New
          </Button>
        </div>
      {/if}
    </div>

    <TabsContent value="list" class="space-y-6">
      {#if data.qrCodes.length === 0}
        <div
          class="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 p-10 text-center"
        >
          <div class="mx-auto flex max-w-[460px] flex-col items-center justify-center text-center">
            <svg
              class="h-12 w-12 text-muted-foreground"
              fill="none"
              height="24"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" x2="12" y1="22" y2="12" />
            </svg>
            <h3 class="mt-5 text-xl font-semibold">No QR codes yet</h3>
            <p class="mt-3 mb-5 text-sm text-muted-foreground">
              You haven't created any QR codes. Get started by creating your first one!
            </p>
            <Button href="/">Create QR Code</Button>
          </div>
        </div>
      {:else}
        {#key mountKey}
          <div class="space-y-5">
            <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div class="relative flex-1">
                <Search
                  class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  placeholder="Search by URL, description, or short code..."
                  bind:value={searchQuery}
                  class="pl-9"
                />
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <Select
                  type="single"
                  value={filterType}
                  onValueChange={(v) => {
                    if (v) filterType = v as typeof filterType
                  }}
                >
                  <SelectTrigger class="w-full sm:w-[140px]">
                    <span
                      >Type: {filterType === "all"
                        ? "All"
                        : filterType === "static"
                          ? "Static"
                          : "Dynamic"}</span
                    >
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  type="single"
                  value={sortBy}
                  onValueChange={(v) => {
                    if (v) sortBy = v as typeof sortBy
                  }}
                >
                  <SelectTrigger class="w-full sm:w-[160px]">
                    <span
                      >Sort: {sortBy === "newest"
                        ? "Newest"
                        : sortBy === "oldest"
                          ? "Oldest"
                          : "Name"}</span
                    >
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger>
                    <Button variant="outline" class="gap-2">
                      <CalendarIcon class="h-4 w-4" />
                      {#if dateRange.start || dateRange.end}
                        {dateRange.start || "Start"} - {dateRange.end || "End"}
                      {:else}
                        Date Range
                      {/if}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-4">
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <span class="text-sm font-medium">Start Date</span>
                        <Input type="date" bind:value={dateRange.start} />
                      </div>
                      <div class="space-y-2">
                        <span class="text-sm font-medium">End Date</span>
                        <Input type="date" bind:value={dateRange.end} />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onclick={() => (dateRange = { start: "", end: "" })}
                        class="w-full"
                      >
                        Clear Dates
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                {#if hasActiveFilters}
                  <Button variant="ghost" size="sm" onclick={clearFilters}>
                    <X class="mr-1 h-4 w-4" />
                    Clear Filters
                  </Button>
                {/if}
              </div>
            </div>

            {#if filterAndSortQrCodes(data.qrCodes).length === 0}
              <div class="rounded-2xl border border-dashed bg-muted/40 p-8 text-center">
                <p class="text-sm text-muted-foreground">No QR codes match your filters.</p>
                <Button variant="ghost" onclick={clearFilters} class="mt-4">Clear Filters</Button>
              </div>
            {:else if viewMode === "list"}
              <QrListView
                qrCodes={filterAndSortQrCodes(data.qrCodes)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            {:else}
              <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {#each filterAndSortQrCodes(data.qrCodes) as qrCode (qrCode.id)}
                  <QrCard {qrCode} onEdit={handleEdit} onDelete={handleDelete} />
                {/each}
              </div>
            {/if}
          </div>
        {/key}
      {/if}
    </TabsContent>

    <TabsContent value="generate" class="space-y-6">
      <QrGenerator user={data.user} initialUrl={scannedUrl} />
    </TabsContent>

    <TabsContent value="scan" class="space-y-6">
      <QrScanner onScan={handleScan} onGenerateQr={handleGenerateQr} user={data.user} />
    </TabsContent>
  </Tabs>
</section>
