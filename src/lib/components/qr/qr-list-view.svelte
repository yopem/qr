<script lang="ts">
  import { Pencil, Trash2 } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog"
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
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
  }

  let { qrCodes, onEdit, onDelete }: Props = $props()

  let qrSvgCache = $state<Record<string, string>>({})
  let deleteDialogOpen = $state<string | null>(null)

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

  function handleConfirmDelete(qrCode: QrCode) {
    onDelete?.(qrCode.id)
    deleteDialogOpen = null
  }
</script>

<div class="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
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
        <TableRow>
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
              <Dialog
                open={deleteDialogOpen === qrCode.id}
                onOpenChange={(open) => {
                  if (!open) {
                    deleteDialogOpen = null
                  }
                }}
              >
                <DialogTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onclick={() => (deleteDialogOpen = qrCode.id)}
                  >
                    <Trash2 class="h-4 w-4" />
                    <span class="sr-only">Delete</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete QR Code</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this QR code? This action cannot be undone.
                      {#if qrCode.type === "dynamic"}
                        The short URL will stop working.
                      {/if}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onclick={() => (deleteDialogOpen = null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onclick={() => handleConfirmDelete(qrCode)}>
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
