<script lang="ts">
  import { Download, Trash2, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    selectedCount: number
    onDelete?: () => void
    onExport?: () => void
    onClearSelection?: () => void
  }

  let { selectedCount, onDelete, onExport, onClearSelection }: Props = $props()
</script>

{#if selectedCount > 0}
  <div
    class="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4 backdrop-blur-sm"
  >
    <div class="flex items-center gap-2">
      <p class="text-sm font-medium">
        {selectedCount}
        {selectedCount === 1 ? "item" : "items"} selected
      </p>
      <Button variant="ghost" size="sm" onclick={onClearSelection}>
        <X class="h-4 w-4" />
        Clear
      </Button>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" class="gap-2" onclick={onExport}>
        <Download class="h-4 w-4" />
        Export
      </Button>
      <Button variant="destructive" size="sm" class="gap-2" onclick={onDelete}>
        <Trash2 class="h-4 w-4" />
        Delete
      </Button>
    </div>
  </div>
{/if}
