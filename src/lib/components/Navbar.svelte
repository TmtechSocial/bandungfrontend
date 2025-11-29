<script>
  import { isCollapsed } from '$lib/stores/sidebarStore';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  // Import komponen QR Scanner modal Anda
  import QRScannerModal from '../../components/QRModal.svelte';

  let isSettingsHovered = false;
  let isLogoutHovered = false;
  let searchQuery = '';
  let searchResults = [];
  let isSearchActive = false;
  let searchDropdown;
  let highlightedElements = [];
  let isLoggingOut = false;
  let showQRScanner = false;

  // Store untuk menyimpan highlight state
  let previousHighlights = new Map();
  let searchTimeout;

  const navigateToSettings = () => {
    goto('/setting');
  };

  const handleLogout = async () => {
    try {
      isLoggingOut = true;

      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      isLoggingOut = false;
    }
  };

  // Fungsi untuk handle hasil scan QR
  function handleQRScanSuccess(decodedText) {
    console.log('QR Scanned:', decodedText);
    searchQuery = decodedText;
    showQRScanner = false;
    // Reactive statement akan otomatis trigger search
  }

  function handleQRClose() {
    showQRScanner = false;
  }

  function openQRScanner() {
    showQRScanner = true;
  }

  // Fungsi untuk mencari teks dalam DOM
  function searchInDOM(query) {
    if (query.length < 2) {
      clearHighlights();
      return [];
    }

    const results = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement?.closest('.search-dropdown, script, style')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const content = node.textContent.toLowerCase();
      if (content.includes(query.toLowerCase())) {
        const parent = node.parentElement;
        if (parent) {
          results.push({
            text: node.textContent,
            element: parent,
            preview: getPreviewText(node.textContent, query)
          });
        }
      }
    }
    return results;
  }

  function getPreviewText(text, query) {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + query.length + 20);
    let preview = text.slice(start, end);
    
    if (start > 0) preview = '...' + preview;
    if (end < text.length) preview = preview + '...';
    
    return preview;
  }

  function highlightResults(results) {
    clearHighlights();
    
    results.forEach(result => {
      const element = result.element;
      if (element) {
        previousHighlights.set(element, {
          originalBackground: element.style.backgroundColor,
          originalOutline: element.style.outline
        });
        
        element.style.backgroundColor = '#fef08a';
        element.style.outline = '2px solid #fde047';
        highlightedElements = [...highlightedElements, element];
      }
    });
  }

  function clearHighlights() {
    previousHighlights.forEach((styles, element) => {
      element.style.backgroundColor = styles.originalBackground;
      element.style.outline = styles.originalOutline;
    });
    previousHighlights.clear();
    highlightedElements = [];
  }

  // ✅ Reactive statement - otomatis trigger saat searchQuery berubah
  $: {
    clearTimeout(searchTimeout);
    
    if (searchQuery.length >= 2) {
      searchTimeout = setTimeout(() => {
        isSearchActive = true;
        searchResults = searchInDOM(searchQuery);
        if (searchResults.length > 0) {
          highlightResults(searchResults);
        } else {
          clearHighlights();
        }
      }, 300);
    } else {
      isSearchActive = false;
      clearHighlights();
      searchResults = [];
    }
  }

  function handleClickOutside(event) {
    if (searchDropdown && !searchDropdown.contains(event.target) && 
        !event.target.matches('input[type="text"]') &&
        !highlightedElements.some(el => el.contains(event.target))) {
      isSearchActive = false;
      clearHighlights();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearHighlights();
      clearTimeout(searchTimeout);
    };
  });
</script>

<div class="pt-3 px-3 pb-2 transition-all duration-300" class:md:ml-4={$isCollapsed} class:md:ml-5={!$isCollapsed}>
  <div class="w-full md:h-16 h-20 rounded-3xl bg-myPrimary flex items-center md:px-10 px-4">
    <p class="text-white font-semibold mr-auto">Mirorim</p>

    <div class="flex justify-center flex-1">
      <div class="relative md:w-3/6 w-5/6 max-w-md">
        <input
          type="text"
          bind:value={searchQuery}
          on:focus={() => isSearchActive = searchQuery.length >= 2}
          class="px-10 py-2 md:text-md text-xs w-full h-9 rounded-md focus:outline-none pr-20"
          placeholder="Search anything"
          aria-label="Search"
        />
        <img
          src="/images/searchIcon.svg"
          alt="Search"
          class="absolute left-3 top-1/2 transform -translate-y-1/2"
          width="20"
          height="20"
        />
        
        <!-- Tombol Clear (hanya muncul jika ada text) -->
        {#if searchQuery.length > 0}
          <button
            type="button"
            on:click={() => {
              searchQuery = '';
              isSearchActive = false;
              clearHighlights();
            }}
            class="absolute right-10 top-1/2 transform -translate-y-1/2 hover:bg-gray-200 p-1 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
            title="Clear"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        {/if}
        
        <!-- Tombol QR Scanner -->
        <button
          type="button"
          on:click={openQRScanner}
          class="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 p-1 rounded transition-colors"
          aria-label="Scan QR Code"
          title="Scan QR Code"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        
        {#if searchQuery.length >= 2}
          <div
            bind:this={searchDropdown}
            class="search-dropdown absolute w-full mt-2 bg-white rounded-md shadow-lg max-h-96 overflow-y-auto z-50"
          >
            {#if searchResults.length > 0}
              <div class="p-2">
                <p class="text-sm text-gray-500 mb-2">Found {searchResults.length} results</p>
                {#each searchResults as result}
                  <div
                    class="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    on:click={() => {
                      result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      isSearchActive = false;
                      // Keep searchQuery and highlights visible
                    }}
                  >
                    <p class="text-sm text-gray-800">{result.preview}</p>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="p-4 text-center text-gray-500">
                No results found
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="flex md:gap-2">
      <div
        class="p-1 cursor-pointer"
        class:bg-white={isSettingsHovered}
        class:rounded-md={isSettingsHovered}
        on:click={navigateToSettings}
      >
        <img
          src={isSettingsHovered ? "/images/settingHoverIcon.svg" : "/images/settingIcon.svg"}
          alt="Settings"
          width="24"
          height="24"
          on:mouseenter={() => isSettingsHovered = true}
          on:mouseleave={() => isSettingsHovered = false}
        />
      </div>
      <div
        class="p-1 cursor-pointer"
        class:bg-white={isLogoutHovered}
        class:rounded-md={isLogoutHovered}
        class:pointer-events-none={isLoggingOut}
        on:click={handleLogout}
      >
        <img
          src={isLogoutHovered ? "/images/logoutHoverIcon.svg" : "/images/logoutIcon.svg"}
          alt="Logout"
          width="22"
          height="22"
          on:mouseenter={() => !isLoggingOut && (isLogoutHovered = true)}
          on:mouseleave={() => !isLoggingOut && (isLogoutHovered = false)}
        />
      </div>
    </div>
  </div>
</div>

<!-- QR Scanner Modal -->
<QRScannerModal
  show={showQRScanner}
  config={{
    title: "Scan QR/Barcode",
    description: "Arahkan kamera ke QR code atau barcode untuk mencari",
    autoClose: true
  }}
  onScanSuccess={handleQRScanSuccess}
  onClose={handleQRClose}
/>

<style>
  .search-dropdown {
    border: 1px solid #e2e8f0;
  }
  
  @keyframes highlight-pulse {
    0% { outline-color: #fde047; }
    50% { outline-color: #fef08a; }
    100% { outline-color: #fde047; }
  }
</style>
