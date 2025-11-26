<script lang="ts">
  import { Pencil, Trash2 } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "$lib/components/ui/table"
  import type { QrCode } from "$lib/server/db/schema/qr-codes"
  import { generateQrCodeSvg } from "$lib/utils/qr-generator"

  import QrActionsPopover from "./qr-actions-popover.svelte"

  interface Props {
    qrCodes: QrCode[]
    selectedIds: Set<string>
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
    onToggleSelect?: (id: string) => void
    onToggleSelectAll?: () => void
  }

  let { qrCodes, selectedIds, onEdit, onDelete, onToggleSelect, onToggleSelectAll }: Props =
    $props()

  let qrSvgCache = $state<Record<string, string>>({})

  const isAllSelected = $derived(
    qrCodes.length > 0 && qrCodes.every((qr) => selectedIds.has(qr.id)),
  )

  const isSomeSelected = $derived(qrCodes.some((qr) => selectedIds.has(qr.id)) && !isAllSelected)

  $effect(() => {
    qrCodes.forEach((qrCode) => {
      if (!qrSvgCache[qrCode.id]) {
        generateQrCodeSvg({
          url: qrCode.shortCode
            ? `${window.location.origin}/${qrCode.shortCode}`
            : qrCode.destinationUrl,
          size: 64,
        }).then((svg) => {
          qrSvgCache[qrCode.id] = svg
        })
      }
    })
  })

  function formatDate(date: Date | null): string {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }
</script>

<div class="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-12">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isSomeSelected}
            onchange={onToggleSelectAll}
            aria-label="Select all"
          />
        </TableHead>
        <TableHead class="w-24">QR Code</TableHead>
        <TableHead>URL</TableHead>
        <TableHead class="hidden md:table-cell">Type</TableHead>
        <TableHead class="hidden lg:table-cell">Created</TableHead>
        <TableHead class="text-right">Scans</TableHead>
        <TableHead class="w-24 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each qrCodes as qrCode (qrCode.id)}
        <TableRow class={selectedIds.has(qrCode.id) ? "bg-muted/50" : ""}>
          <TableCell>
            <Checkbox
              checked={selectedIds.has(qrCode.id)}
              onchange={() => onToggleSelect?.(qrCode.id)}
              aria-label="Select QR code"
            />
          </TableCell>
          <TableCell>
            <div class="flex h-16 w-16 items-center justify-center rounded border bg-white p-2">
              {#if qrSvgCache[qrCode.id]}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html qrSvgCache[qrCode.id]}
              {:else}
                <div class="h-full w-full animate-pulse rounded bg-muted"></div>
              {/if}
            </div>
          </TableCell>
          <TableCell>
            <div class="max-w-[300px]">
              <p class="truncate font-medium">{qrCode.destinationUrl}</p>
              {#if qrCode.description}
                <p class="truncate text-sm text-muted-foreground">{qrCode.description}</p>
              {/if}
            </div>
          </TableCell>
          <TableCell class="hidden md:table-cell">
            <Badge variant={qrCode.type === "dynamic" ? "default" : "secondary"}>
              {qrCode.type}
            </Badge>
          </TableCell>
          <TableCell class="hidden text-sm text-muted-foreground lg:table-cell">
            {formatDate(qrCode.createdAt)}
          </TableCell>
          <TableCell class="text-right font-medium">
            {qrCode.scanCount}
          </TableCell>
          <TableCell class="text-right">
            <div class="flex items-center justify-end gap-1">
              <QrActionsPopover {qrCode} />
              {#if qrCode.type === "dynamic"}
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  onclick={() => onEdit?.(qrCode.id)}
                >
                  <Pencil class="h-4 w-4" />
                  <span class="sr-only">Edit</span>
                </Button>
              {/if}
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-destructive hover:bg-destructive/10"
                onclick={() => onDelete?.(qrCode.id)}
              >
                <Trash2 class="h-4 w-4" />
                <span class="sr-only">Delete</span>
              </Button>
            </div>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
