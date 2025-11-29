<script>
  import { page } from '$app/stores';
  import "../app.css";
  import AppShell from "$lib/components/AppShell.svelte";
  import { onMount } from "svelte";
  let title = "Mirorim Operasional";

   onMount(() => {
       document.title = title;
   });

  // Daftar halaman yang tidak membutuhkan AppShell
  const authPages = ['/login'];

  let isAuthPage = false;

  $: {
    isAuthPage = authPages.includes($page.url.pathname);
  }
</script>

{#if !isAuthPage}
  <AppShell>
    <slot />
  </AppShell>
{:else}
  <slot />
{/if}
