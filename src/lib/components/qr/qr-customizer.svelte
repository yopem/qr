<script lang="ts">
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select"

  interface QrFormField {
    value: () => string | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (value: any) => void
    issues: () => Array<{ message: string }> | undefined
  }

  interface Props {
    /**
     * The form object from generateQrCode or updateQrCode remote function
     */
    form: {
      fields: {
        foregroundColor: QrFormField
        backgroundColor: QrFormField
        pattern: QrFormField
      }
    }
  }

  let { form }: Props = $props()

  let foregroundColor = $state(form.fields.foregroundColor.value() || "#000000")
  let backgroundColor = $state(form.fields.backgroundColor.value() || "#FFFFFF")
  let selectedPattern = $state<string>(form.fields.pattern.value() || "square")

  function updateForeground(e: Event) {
    const target = e.target as HTMLInputElement
    foregroundColor = target.value
    form.fields.foregroundColor.set(target.value)
  }

  function updateBackground(e: Event) {
    const target = e.target as HTMLInputElement
    backgroundColor = target.value
    form.fields.backgroundColor.set(target.value)
  }

  function updatePattern(value: string) {
    selectedPattern = value
    form.fields.pattern.set(value)
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Customize Style</CardTitle>
    <CardDescription>Adjust the appearance of your QR code</CardDescription>
  </CardHeader>

  <CardContent class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label for="foreground-color">Foreground Color</Label>
        <div class="flex gap-2">
          <Input
            id="foreground-color"
            type="color"
            value={foregroundColor}
            oninput={updateForeground}
            class="h-10 w-20"
          />
          <Input
            type="text"
            value={foregroundColor}
            oninput={updateForeground}
            placeholder="#000000"
            class="flex-1 font-mono"
          />
        </div>
        {#each form.fields.foregroundColor.issues() || [] as issue (issue.message)}
          <p class="text-sm text-destructive">{issue.message}</p>
        {/each}
      </div>

      <div class="space-y-2">
        <Label for="background-color">Background Color</Label>
        <div class="flex gap-2">
          <Input
            id="background-color"
            type="color"
            value={backgroundColor}
            oninput={updateBackground}
            class="h-10 w-20"
          />
          <Input
            type="text"
            value={backgroundColor}
            oninput={updateBackground}
            placeholder="#FFFFFF"
            class="flex-1 font-mono"
          />
        </div>
        {#each form.fields.backgroundColor.issues() || [] as issue (issue.message)}
          <p class="text-sm text-destructive">{issue.message}</p>
        {/each}
      </div>
    </div>

    <div class="space-y-2">
      <Label for="pattern">Pattern Style</Label>
      <Select type="single" value={selectedPattern} onValueChange={updatePattern}>
        <SelectTrigger id="pattern" class="w-full">
          <span class="capitalize">{selectedPattern}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="dot">Dots</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      {#each form.fields.pattern.issues() || [] as issue (issue.message)}
        <p class="text-sm text-destructive">{issue.message}</p>
      {/each}
    </div>

    <div class="rounded-lg border p-4">
      <p class="text-sm text-muted-foreground">
        <strong>Tip:</strong> Ensure sufficient contrast between foreground and background colors for
        best scanability.
      </p>
    </div>
  </CardContent>
</Card>
