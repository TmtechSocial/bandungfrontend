<script>
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import MobileBar from "$lib/components/Mobilebar.svelte";
  import { isCollapsed } from "$lib/stores/sidebarStore";
  import { page } from "$app/stores";

  $: isPrintKurir = false;
  $: isFormPage = false;

  $: {
    const params = new URLSearchParams($page.url.search);
    const processParam = params.get("process");
    isPrintKurir = processParam === "Mirorim_Operasional.Print.Print_Kurir";

    const path = $page.url.pathname;
    isFormPage = path === "/form"; // ubah sesuai path kamu
  }
</script>

<div class="flex min-h-screen bg-gray-100">
  <!-- Sidebar -->
  <div class="max-md:hidden md:block z-10">
    <Sidebar />
  </div>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col transition-all duration-500" class:md:ml-20={$isCollapsed} class:md:ml-44={!$isCollapsed}>
    {#if !isPrintKurir}
      <Navbar />
    {/if}

    <!-- Content Area -->
    <main class="flex-1 md:ml-12 md:mr-7 mx-6 mt-2 overflow-auto mb-24 md:mb-0">
      <div class="bg-white rounded-3xl p-4 min-h-full">
        <slot />
      </div>
    </main>
  </div>

  <!-- Mobile Bottom Bar -->
  {#if !isPrintKurir && !isFormPage}
    <div class="md:hidden fixed bottom-0 w-full">
      <MobileBar />
    </div>
  {/if}
</div>

