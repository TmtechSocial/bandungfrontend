<script>
  import { onMount, onDestroy } from "svelte";

  export let show = false;
  export let config = {
    title: "Cek Lokasi Realtime",
    description: "Mengambil data latitude dan longitude secara real-time",
    autoClose: false,
    validCoordinates: [], // Array of valid coordinates to compare
    maxDistanceMeters: 20, // Maximum allowed distance in meters
  };

  export let onLocationChange = (pos) => console.log("Location:", pos);
  export let onClose = () => {};

  let watchId = null;
  let latitude = null;
  let longitude = null;
  let errorMessage = null;
  let distanceInfo = null;

  // Haversine formula to calculate distance between two coordinates in meters
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Check distance to nearest valid coordinate
  function checkDistance(currentLat, currentLon) {
    if (!config.validCoordinates || config.validCoordinates.length === 0) {
      return null;
    }

    let minDistance = Infinity;
    let nearestCoord = null;

    for (const coord of config.validCoordinates) {
      const targetLat = parseFloat(coord.latitude);
      const targetLon = parseFloat(coord.longitude);

      const distance = calculateDistance(
        currentLat,
        currentLon,
        targetLat,
        targetLon
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCoord = coord;
      }
    }

    return {
      distance: Math.round(minDistance),
      isValid: minDistance <= config.maxDistanceMeters,
      nearestCoord: nearestCoord,
    };
  }

  // Fungsi untuk memulai pemantauan lokasi
  function startLocationWatch() {
    if (!navigator.geolocation) {
      errorMessage = "Geolocation tidak didukung oleh browser ini.";
      return;
    }

    // Mulai memantau posisi pengguna
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        latitude = position.coords.latitude.toFixed(6);
        longitude = position.coords.longitude.toFixed(6);
        errorMessage = null;

        // Check distance if valid coordinates are provided
        distanceInfo = checkDistance(
          parseFloat(latitude),
          parseFloat(longitude)
        );

        onLocationChange({ latitude, longitude });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak oleh pengguna.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMessage = "Waktu permintaan lokasi habis.";
            break;
          default:
            errorMessage = "Terjadi kesalahan dalam mendapatkan lokasi.";
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }

  // Hentikan pemantauan lokasi
  function stopLocationWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function handleClose() {
    stopLocationWatch();
    onClose();
  }

  // Jalankan otomatis saat modal dibuka
  $: if (show) {
    setTimeout(() => {
      startLocationWatch();
    }, 300);
  }

  onDestroy(() => {
    stopLocationWatch();
  });
</script>

{#if show}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
      <div class="mb-4 text-center">
        <h3 class="text-lg font-medium text-gray-900">{config.title}</h3>
        <p class="mt-1 text-sm text-gray-500">{config.description}</p>
      </div>

      <div class="p-4 text-center bg-gray-100 rounded-lg">
        {#if errorMessage}
          <p class="text-red-600">{errorMessage}</p>
        {:else if latitude && longitude}
          <p class="text-gray-700">
            <strong>Latitude:</strong>
            {latitude}<br />
            <strong>Longitude:</strong>
            {longitude}
          </p>

          {#if distanceInfo}
            <div
              class="mt-3 p-2 rounded {distanceInfo.isValid
                ? 'bg-green-100'
                : 'bg-red-100'}"
            >
              <p
                class="{distanceInfo.isValid
                  ? 'text-green-700'
                  : 'text-red-700'} text-sm font-semibold"
              >
                {#if distanceInfo.isValid}
                  ✓ Lokasi Valid
                {:else}
                  ✗ Lokasi Terlalu Jauh
                {/if}
              </p>
              <p class="mt-1 text-xs text-gray-600">
                Jarak: {distanceInfo.distance}m dari titik terdekat<br />
                Maksimal: {config.maxDistanceMeters}m
              </p>
            </div>
          {/if}
        {:else}
          <p class="text-gray-500">Mengambil lokasi...</p>
        {/if}
      </div>

      <div class="flex justify-center mt-4">
        <button
          type="button"
          class="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
          on:click={handleClose}
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
