<script>
  import { onMount, onDestroy } from "svelte";
  import {
    Html5Qrcode,
    Html5QrcodeScannerState,
  } from "html5-qrcode";

  export let show = false;
  export let config = {
    title: "Scan QR/Barcode",
    description: "Arahkan kamera ke QR code atau barcode",
    autoClose: true,
  };
  export let onScanSuccess = (data) => console.log("Scanned:", data);
  export let onClose = () => {};

  let html5QrCode;
  const scannerContainerId = "qr-reader";

  async function startScanner() {
    html5QrCode = new Html5Qrcode(scannerContainerId);

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
          // Tidak perlu specify formatsToSupport, biarkan default html5-qrcode
          // yang akan menggunakan semua format yang didukung
        },
        (decodedText) => {
          console.log("Scanned:", decodedText);
          onScanSuccess(decodedText);
          if (config.autoClose) {
            stopScanner();
            handleClose();
          }
        },
        (error) => {
          // console.log("Scanning error", error); // optional debug
        }
      );
    } catch (err) {
      console.error("Gagal memulai scanner:", err);
    }
  }

  async function stopScanner() {
    if (
      html5QrCode &&
      html5QrCode.getState() === Html5QrcodeScannerState.SCANNING
    ) {
      try {
        await html5QrCode.stop();
        await html5QrCode.clear();
      } catch (err) {
        console.error("Gagal menghentikan scanner:", err);
      }
    }
  }

  function handleClose() {
    stopScanner();
    onClose();
  }

  $: if (show) {
    setTimeout(() => {
      startScanner();
    }, 300); // jeda agar modal muncul dulu sebelum kamera aktif
  }

  onDestroy(() => {
    stopScanner();
  });
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
      <div class="mb-4 text-center">
        <h3 class="text-lg font-medium text-gray-900">{config.title}</h3>
        <p class="text-sm text-gray-500 mt-1">{config.description}</p>
      </div>

      <div id={scannerContainerId} class="qr-scanner-container"></div>

      <div class="mt-4 flex justify-center">
        <button
          type="button"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          on:click={handleClose}
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .qr-scanner-container {
    width: 100%;
    height: 300px;
    margin: 0 auto;
  }

  :global(#qr-reader) {
    border: none !important;
    padding: 0 !important;
  }
</style>
