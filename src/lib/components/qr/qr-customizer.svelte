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

  interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any
  }

  let { form }: Props = $props()

  let foregroundColor = $state(form.fields.foregroundColor.value() || "#000000")
  let backgroundColor = $state(form.fields.backgroundColor.value() || "#FFFFFF")

  $effect(() => {
    if (!form.fields.foregroundColor.value()) {
      form.fields.foregroundColor.set("#000000")
    }
    if (!form.fields.backgroundColor.value()) {
      form.fields.backgroundColor.set("#FFFFFF")
    }
  })

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
</script>

<Card>
  <CardHeader>
    <CardTitle>Customize Colors</CardTitle>
    <CardDescription>Choose colors for your QR code</CardDescription>
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

    <div class="rounded-lg border p-4">
      <p class="text-sm text-muted-foreground">
        <strong>Tip:</strong> Ensure sufficient contrast between foreground and background colors for
        best scanability.
      </p>
    </div>
  </CardContent>
</Card>
