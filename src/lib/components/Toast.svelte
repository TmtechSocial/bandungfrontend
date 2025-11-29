<!-- Toast.svelte -->
<script>
  import { fade, fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";

  export let message = "";
  export let type = "info"; // 'success', 'error', 'warning', 'info'
  export let duration = 3000;

  const dispatch = createEventDispatcher();

  let visible = true;

  // Auto hide after duration
  setTimeout(() => {
    visible = false;
    setTimeout(() => dispatch("close"), 300);
  }, duration);

  function close() {
    visible = false;
    setTimeout(() => dispatch("close"), 300);
  }

  $: toastClass = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white", 
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-500 text-white"
  }[type] || "bg-gray-500 text-white";
</script>

{#if visible}
  <div
    class="fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg {toastClass} min-w-[300px]"
    transition:fly="{{ x: 300, duration: 300 }}"
  >
    <div class="flex-1 mr-3">
      {message}
    </div>
    <button 
      on:click={close}
      class="text-white hover:text-gray-200 font-bold text-lg"
    >
      ×
    </button>
  </div>
{/if}

<style>
  /* Additional styles if needed */
</style>
