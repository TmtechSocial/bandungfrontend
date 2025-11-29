<script>
  let hoveredItem = null;
  let activeItem = null;
  let isVisible = false; // State untuk mengontrol visibility

  // Data menu
  const menuItems = [
    { label: 'Dashboard', iconPath: '/images/dashboardIcon.svg', iconHoverPath: '/images/dashboardHoverIcon.svg', url: '/dashboard' },
    { label: 'Task', iconPath: '/images/taskIcon.svg', iconHoverPath: '/images/taskHoverIcon.svg', url: '/task' },
    { label: 'Report', iconPath: '/images/reportIcon.svg', iconHoverPath: '/images/reportHoverIcon.svg', url: '/report' },
    { label: 'Request', iconPath: '/images/homeIcon.svg', iconHoverPath: '/images/homeHoverIcon.svg', url: '/home' },
  ];

  // Check active route on mount
  const updateActiveItem = () => {
    const currentPath = window.location.pathname;
    activeItem = menuItems.findIndex(item => item.url === currentPath);
  };

  // Toggle function untuk show/hide mobile bar
  const toggleMobileBar = () => {
    isVisible = !isVisible;
  };

  // Update active item when route changes
  if (typeof window !== 'undefined') {
    updateActiveItem();
  }
</script>

<!-- Toggle Button dengan posisi dinamis -->
<div class="fixed right-4 z-50 transition-all duration-300" class:bottom-5={!isVisible} class:bottom-24={isVisible}>
  <button
    on:click={toggleMobileBar}
    class="bg-myPrimary text-white p-3 rounded-full shadow-lg hover:bg-myPrimaryDark transition-all duration-300 flex items-center justify-center"
    aria-label="Toggle Mobile Menu"
  >
    {#if isVisible}
      <!-- Close Icon (X) -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    {:else}
      <!-- Menu Icon -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    {/if}
  </button>
</div>

<!-- Mobile Bar dengan animasi slide -->
<div 
  class="fixed bottom-0 left-0 w-full z-40 transition-transform duration-300 ease-in-out {isVisible ? 'translate-y-0' : 'translate-y-full'}"
>
  <!-- Container utama MobileBar -->
  <div class="p-3">
    <div class="bg-myPrimary h-auto rounded-2xl flex justify-center p-2 shadow-xl">
      <div class="px-3 flex justify-between w-full max-w-md">
        {#each menuItems as item, index}
          <!-- Elemen link dengan navigasi -->
          <a
            href={item.url}
            class="flex flex-col items-center justify-center text-xs font-semibold w-16 h-16 cursor-pointer rounded-md transition-all"
            class:text-white={index !== activeItem}
            class:text-myPrimary={index === activeItem}
            class:bg-white={index === activeItem}
            on:mouseenter={() => (hoveredItem = index)}
            on:mouseleave={() => (hoveredItem = null)}
            on:click={() => {
              activeItem = index;
              // Optional: hide mobile bar after selection
              // isVisible = false;
            }}
          >
            <!-- Ikon menu -->
            <img
              src={index === activeItem || hoveredItem === index ? item.iconHoverPath : item.iconPath}
              alt="{item.label.toLowerCase()}"
              width="25"
              height="25"
            />
            <!-- Label menu -->
            <p 
              class="pt-2 transition-colors"
              class:text-myPrimary={index === activeItem || hoveredItem === index}
              class:text-white={index !== activeItem && hoveredItem !== index}
            >
              {item.label}
            </p>
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Backdrop untuk menutup mobile bar ketika di-click -->
{#if isVisible}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
    on:click={toggleMobileBar}
  ></div>
{/if}

<style>
  .bg-myPrimary {
    background-color: #002962;
  }
  
  .bg-myPrimaryDark {
    background-color: #001845;
  }
  
  .text-myPrimary {
    color: #002962;
  }
  
  .transition-all {
    transition: all 0.3s ease-in-out;
  }
  
  a:hover {
    background-color: white;
  }
  
  a:hover p {
    color: #002962;
  }
  
  /* Animasi slide up/down */
  .translate-y-0 {
    transform: translateY(0);
  }
  
  .translate-y-full {
    transform: translateY(100%);
  }
  
  /* Posisi bottom dinamis */
  .bottom-10 {
    bottom: 2.5rem;
  }
  
  .bottom-24 {
    bottom: 6rem;
  }
</style>
