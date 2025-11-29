<script>
  import { onMount } from 'svelte';
  import { goto } from "$app/navigation";
  
  export let data; // menerima sessionData dari +page.server.js
  let qrScanner = null;
  let scannerInitialized = false;
  let scanResult = null;
  let isScanning = false;
  
  // Modal state variables (using form page style)
  let showModal = false;
  let modalType = 'error'; // 'error', 'success', 'warning', 'loading'
  let modalTitle = '';
  let modalMessage = '';
  let modalColor = '';
  let isProcessing = false;

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://mirorim.ddns.net:6789/backendBandung/';

  const groups = data?.sessionData?.groups || [];
  const userId = data?.sessionData?.user?.username;

  // Modal control functions
  function showPopup(type, title, message) {
    modalType = type;
    modalTitle = title;
    modalMessage = message;
    
    // Set appropriate color based on type
    switch(type) {
      case 'success':
        modalColor = 'green';
        break;
      case 'warning':
        modalColor = 'yellow';
        break;
      case 'loading':
        modalColor = 'blue';
        break;
      case 'error':
      default:
        modalColor = 'red';
        break;
    }
    
    showModal = true;
  }

  async function closeModal() {
    showModal = false;
    modalType = 'error';
    modalTitle = '';
    modalMessage = '';
    modalColor = '';
    isProcessing = false;
    scanResult = null; // Reset scan result
    
    // Wait a bit before restarting scanner
    setTimeout(async () => {
      try {
        await restartScanner();
      } catch (error) {
        console.error("Error restarting scanner:", error);
      }
    }, 500);
  }

  async function stopScanner() {
    if (qrScanner && isScanning) {
      try {
        await qrScanner.pause(true);
        isScanning = false;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  }

  async function clearScanner() {
    if (qrScanner) {
      try {
        await qrScanner.clear();
        qrScanner = null;
        scannerInitialized = false;
        isScanning = false;
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
    }
  }

  async function restartScanner() {
    try {
      // Completely clear the old scanner
      await clearScanner();
      
      // Wait a bit for camera to be fully released
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reinitialize scanner
      await initializeScanner();
    } catch (error) {
      console.error("Error restarting scanner:", error);
      showPopup('error', 'Camera Error', 'Tidak dapat memulai ulang scanner. Silakan refresh halaman.');
    }
  }

  onMount(async () => {
    await initializeScanner();

    // Add keyboard event listener for modal
    const handleKeydown = (event) => {
      if (event.key === 'Escape' && showModal) {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleKeydown);

    // Cleanup on component unmount
    return () => {
      if (qrScanner) {
        try {
          clearScanner();
        } catch (e) {
          console.log("Error cleaning up scanner:", e);
        }
      }
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  async function initializeScanner() {
    if (scannerInitialized) return;
    
    try {
      const module = await import('html5-qrcode');
      const Html5QrcodeScanner = module.Html5QrcodeScanner;
      const Html5QrcodeScanType = module.Html5QrcodeScanType;
      
      qrScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
          fps: 15, 
          qrbox: { width: 400, height: 400 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        false
      );
      
      scannerInitialized = true;
      await startQrScanner();
      console.log("QR Scanner initialized successfully");
    } catch (error) {
      console.error("Failed to initialize QR scanner:", error);
      showPopup('error', 'Scanner Error', 'Gagal menginisialisasi QR scanner. Pastikan kamera tersedia.');
    }
  }

  async function startQrScanner() {
    if (!qrScanner || isScanning) {
      console.error("Scanner not initialized or already scanning");
      return;
    }

    try {
      isScanning = true;
      await qrScanner.render(
        // Success callback
        async (decodedText) => {
          console.log("QR Code detected:", decodedText);
          scanResult = decodedText;

          // Completely stop and clear scanner after successful scan
          await clearScanner();

          // Show loading modal
          isProcessing = true;
          showPopup('loading', 'Memproses QR...', 'Mohon tunggu, sedang memeriksa QR Code...');

          try {
            const response = await fetch(`${BACKEND_URL}dynamicQR`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ resi: decodedText, groups, userId })
            });

            const responseData = await response.json();

            if (response.status === 200 && responseData.url) {
              // showPopup('success', 'QR Berhasil!', 'Mengarahkan ke form...');
              setTimeout(() => {
                window.location.href = responseData.url;
              }, 1500);
            } else if (response.status === 300) {
              // Task sudah di-claim oleh user lain atau akses ditolak
              showPopup('warning', 'Warning!!!', responseData.message || "Task tidak dapat diakses");
            } else if (response.status === 404) {
              // Resi tidak ditemukan
              showPopup('error', 'Resi Tidak Ditemukan', responseData.message || "QR Code tidak valid atau resi tidak ada dalam sistem");
            } else {
              showPopup('error', 'Terjadi Kesalahan', responseData.message || "Mohon coba lagi");
            }
          } catch (error) {
            console.error("Fetch error:", error);
            showPopup('error', 'Kesalahan Koneksi', 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
          } finally {
            isProcessing = false;
          }
        },
        // Error callback
        (errorMessage) => {
          if (!errorMessage.includes("NotFoundException")) {
            console.log("QR scan error:", errorMessage);
          }
        }
      );
    } catch (error) {
      console.error("Error starting QR scanner:", error);
      isScanning = false;
      showPopup('error', 'Scanner Error', 'Gagal memulai QR scanner. Pastikan kamera dapat diakses.');
    }
  }
</script>

<div class="flex flex-col items-center bg-gray-100 min-h-screen">
  <div class="bg-white w-full max-w-md shadow-lg p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold text-gray-800">Scan QR Code</h1>
      <button 
        class="text-gray-500 hover:text-gray-700 p-2"
        on:click={() => goto('/task')}
        aria-label="Close scanner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="mb-4">
      <div id="qr-reader" class="w-full max-h-[60vh] border rounded-lg"></div>
    </div>

    {#if scanResult}
      <div class="p-4 bg-green-100 border border-green-300 rounded-lg">
        <p class="text-green-800 font-medium">QR Code detected!</p>
        <p class="text-sm text-green-700 break-all">{scanResult}</p>
      </div>
    {/if}

    {#if !scannerInitialized && !showModal}
      <div class="p-4 bg-blue-100 border border-blue-300 rounded-lg">
        <p class="text-blue-800 font-medium">Initializing scanner...</p>
        <p class="text-sm text-blue-700">Please wait while we set up the QR scanner.</p>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Popup (using form page style) -->
{#if showModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click|self={closeModal}>
    <div class="bg-white p-8 rounded-lg shadow-lg w-96 max-w-md mx-4">
      <div class="text-center">
        <!-- Icon based on modal type -->
        {#if modalColor === "green"}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        {:else if modalColor === "yellow"}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
        {:else if modalColor === "blue"}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg class="h-6 w-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
        {:else}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        {/if}
        
        <h3 class="text-lg font-medium text-gray-900 mb-4">{modalTitle}</h3>
        
        <p class="text-sm text-gray-500 mb-6" 
           class:text-green-600={modalColor === "green"} 
           class:text-yellow-600={modalColor === "yellow"} 
           class:text-blue-600={modalColor === "blue"} 
           class:text-red-600={modalColor === "red"}>
          {modalMessage}
        </p>

        <div class="flex justify-center">
          {#if modalType !== 'loading'}
            <div class="flex space-x-3">
              <button
                type="button"
                class="px-6 py-2 rounded-lg text-white transition-colors bg-blue-600 hover:bg-blue-700"
                on:click={closeModal}
              >
                OK
              </button>
              {#if modalType === 'success'}
                <button
                  type="button"
                  class="px-6 py-2 rounded-lg text-white transition-colors bg-gray-600 hover:bg-gray-700"
                  on:click={() => goto('/task')}
                >
                  Kembali ke Task
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}