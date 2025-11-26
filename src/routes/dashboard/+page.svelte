<script lang="ts">
  import { CalendarIcon, LayoutGrid, LayoutList, Plus, Search, X } from "@lucide/svelte"
  import { goto } from "$app/navigation"
  import BulkActionsBar from "$lib/components/qr/bulk-actions-bar.svelte"
  import QrCard from "$lib/components/qr/qr-card.svelte"
  import QrListView from "$lib/components/qr/qr-list-view.svelte"
  import { Button } from "$lib/components/ui/button"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog"
  import { Input } from "$lib/components/ui/input"
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover"
  import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select"
  import { Slider } from "$lib/components/ui/slider"
  import { generateQrCodeSvg, generateQrFilename } from "$lib/utils/qr-generator"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  import { bulkDeleteQrCodes, deleteQrCode, getUserQrCodes } from "../qr-codes.remote.js"

  let searchQuery = $state("")
  let sortBy = $state<"newest" | "oldest" | "name">("newest")
  let viewMode = $state<"list" | "grid">("list")
  let filterType = $state<"all" | "static" | "dynamic">("all")
  let dateRange = $state<{ start: string; end: string }>({
    start: "",
    end: "",
  })
  let minScans = $state(0)
  let selectedIds = $state<Set<string>>(new Set())
  let deleteDialogOpen = $state(false)
  let qrCodesData = $state<Awaited<ReturnType<typeof getUserQrCodes>>>([])

  const maxScans = $derived(
    qrCodesData.length > 0 ? Math.max(...qrCodesData.map((qr) => qr.scanCount || 0), 10) : 10,
  )

  onMount(() => {
    const saved = localStorage.getItem("dashboard-view-mode")
    if (saved === "list" || saved === "grid") {
      viewMode = saved
    }
  })

  $effect(() => {
    localStorage.setItem("dashboard-view-mode", viewMode)
  })

  // Keyboard shortcuts
  $effect(() => {
    function handleKeydown(e: KeyboardEvent) {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Ctrl/Cmd+A: Select all visible QR codes
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        const filteredQrCodes = filterAndSortQrCodes(qrCodesData)
        if (filteredQrCodes.length > 0) {
          toggleSelectAll()
        }
      }

      // Delete key: Open bulk delete confirmation (only when items selected)
      if (e.key === "Delete" && selectedIds.size > 0) {
        e.preventDefault()
        handleBulkDelete()
      }

      // Escape: Clear selection
      if (e.key === "Escape" && selectedIds.size > 0) {
        e.preventDefault()
        clearSelection()
      }
    }

    window.addEventListener("keydown", handleKeydown)

    return () => {
      window.removeEventListener("keydown", handleKeydown)
    }
  })

  function toggleViewMode() {
    viewMode = viewMode === "list" ? "grid" : "list"
  }

  function toggleSelect(id: string) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id)
    } else {
      selectedIds.add(id)
    }
    selectedIds = selectedIds
  }

  function toggleSelectAll() {
    const filteredQrCodes = filterAndSortQrCodes(qrCodesData)
    if (filteredQrCodes.every((qr) => selectedIds.has(qr.id))) {
      filteredQrCodes.forEach((qr) => selectedIds.delete(qr.id))
    } else {
      filteredQrCodes.forEach((qr) => selectedIds.add(qr.id))
    }
    selectedIds = selectedIds
  }

  function clearSelection() {
    selectedIds.clear()
    selectedIds = selectedIds
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    deleteDialogOpen = true
  }

  async function confirmBulkDelete() {
    try {
      const ids = Array.from(selectedIds)
      const result = await bulkDeleteQrCodes(ids).updates(getUserQrCodes())

      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} QR code${result.succeeded > 1 ? "s" : ""} deleted`)
      }
      if (result.failed > 0) {
        toast.error(`Failed to delete ${result.failed} QR code${result.failed > 1 ? "s" : ""}`)
      }

      clearSelection()
      deleteDialogOpen = false
    } catch (error) {
      toast.error("Failed to delete QR codes")
      console.error(error)
    }
  }

  async function handleBulkExport() {
    if (selectedIds.size === 0) return

    const selectedQrCodes = qrCodesData.filter((qr) => selectedIds.has(qr.id))

    if (selectedQrCodes.length > 20) {
      if (
        !confirm(
          `You are about to download ${selectedQrCodes.length} files. This may take a while. Continue?`,
        )
      ) {
        return
      }
    }

    toast.info(`Downloading ${selectedQrCodes.length} QR codes...`)

    let succeeded = 0
    let failed = 0

    for (const qrCode of selectedQrCodes) {
      try {
        const svg = await generateQrCodeSvg({
          url: qrCode.destinationUrl,
          size: 500,
        })

        const blob = new Blob([svg], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = generateQrFilename(qrCode.title || undefined, qrCode.shortCode || undefined)
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        succeeded++
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Failed to export QR code ${qrCode.id}:`, error)
        failed++
      }
    }

    if (succeeded > 0) {
      toast.success(`${succeeded} QR code${succeeded > 1 ? "s" : ""} downloaded`)
    }
    if (failed > 0) {
      toast.error(`Failed to download ${failed} QR code${failed > 1 ? "s" : ""}`)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this QR code?")) {
      return
    }

    try {
      await deleteQrCode(id).updates(getUserQrCodes())
      toast.success("QR code deleted successfully")
      selectedIds.delete(id)
      selectedIds = selectedIds
    } catch (error) {
      toast.error("Failed to delete QR code")
      console.error(error)
    }
  }

  function handleEdit(id: string) {
    goto(`/dashboard/edit/${id}`)
  }

  function filterAndSortQrCodes(qrCodes: Awaited<ReturnType<typeof getUserQrCodes>>) {
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

    if (minScans > 0) {
      filtered = filtered.filter((qr) => (qr.scanCount || 0) >= minScans)
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
    minScans = 0
  }

  const hasActiveFilters = $derived(
    searchQuery.trim() !== "" ||
      filterType !== "all" ||
      dateRange.start !== "" ||
      dateRange.end !== "" ||
      minScans > 0,
  )
</script>

<div class="container mx-auto max-w-7xl px-4 py-8">
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold tracking-tight">My QR Codes</h1>
        <p class="text-muted-foreground">View and manage all your QR codes</p>
      </div>
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
        <Button href="/" class="gap-2">
          <Plus class="h-4 w-4" />
          Create New
        </Button>
      </div>
    </div>

    {#await getUserQrCodes()}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each Array(6) as _, i (i)}
          <div class="h-80 animate-pulse rounded-lg bg-muted"></div>
        {/each}
      </div>
    {:then qrCodes}
      {#if qrCodes.length === 0}
        <div
          class="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
        >
          <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <svg
              class="h-10 w-10 text-muted-foreground"
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
            <h3 class="mt-4 text-lg font-semibold">No QR codes yet</h3>
            <p class="mt-2 mb-4 text-sm text-muted-foreground">
              You haven't created any QR codes. Get started by creating your first one!
            </p>
            <Button href="/">Create QR Code</Button>
          </div>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="relative max-w-sm flex-1">
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
            <div class="flex gap-2">
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
                <SelectTrigger class="w-full sm:w-[180px]">
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
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4">
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

            <div class="flex items-center gap-3">
              <span class="text-sm font-medium">Min Scans: {minScans}</span>
              <Slider
                type="single"
                bind:value={minScans}
                max={maxScans}
                step={1}
                class="w-[200px]"
              />
            </div>

            {#if hasActiveFilters}
              <Button variant="ghost" size="sm" onclick={clearFilters}>
                <X class="mr-1 h-4 w-4" />
                Clear Filters
              </Button>
            {/if}
          </div>
        </div>

        {@const filteredQrCodes = filterAndSortQrCodes(qrCodes)}
        {((qrCodesData = qrCodes), "")}

        <BulkActionsBar
          selectedCount={selectedIds.size}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={clearSelection}
        />

        {#if filteredQrCodes.length === 0}
          <div class="rounded-lg border border-dashed p-8 text-center">
            <p class="text-muted-foreground">No QR codes match your filters.</p>
            <Button variant="ghost" onclick={clearFilters} class="mt-4">Clear Filters</Button>
          </div>
        {:else if viewMode === "list"}
          <QrListView
            qrCodes={filteredQrCodes}
            {selectedIds}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        {:else}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredQrCodes as qrCode (qrCode.id)}
              <QrCard {qrCode} onEdit={handleEdit} onDelete={handleDelete} />
            {/each}
          </div>
        {/if}
      {/if}
    {:catch error}
      <div class="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
        <p class="text-destructive">Failed to load QR codes: {error.message}</p>
        <Button variant="outline" onclick={() => getUserQrCodes().refresh()} class="mt-4">
          Try Again
        </Button>
      </div>
    {/await}
  </div>
</div>

<Dialog bind:open={deleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete {selectedIds.size} QR Code{selectedIds.size > 1 ? "s" : ""}?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete the selected QR code{selectedIds.size >
        1
          ? "s"
          : ""} and remove {selectedIds.size > 1 ? "their" : "its"} data from the server.
        {#if Array.from(selectedIds).some((id) => qrCodesData.find((qr) => qr.id === id)?.type === "dynamic")}
          <span class="mt-2 block font-medium text-destructive">
            Warning: Some selected QR codes are dynamic. Their short URLs will stop working.
          </span>
        {/if}
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
      <Button variant="destructive" onclick={confirmBulkDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
