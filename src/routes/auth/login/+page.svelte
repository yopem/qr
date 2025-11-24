<script>
  import LoginButton from "$lib/components/auth/login-button.svelte"
</script>

<div class="flex min-h-screen flex-col">
  <main class="flex flex-1 flex-col">
    <div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div class="mx-auto flex w-full flex-col justify-center sm:w-[350px]">
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-3xl font-extrabold">Welcome</h1>
        </div>
        <p class="p-5 text-center">Use your google account to continue</p>
        <div class="flex items-center justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  </main>
</div>
