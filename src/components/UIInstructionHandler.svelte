<!-- UIInstructionHandler.svelte -->
<script>
  import QRModal from "./QRModal.svelte";
  import LocationModal from "./LocationModal.svelte";

  export let instruction = null;
  export let formInstance = null; // Form instance to access schema
  export let onInstructionComplete = () => {};

  let showQRModal = false;
  let showLocationModal = false;
  let validCoordinates = [];
  let maxDistanceMeters = 20; // Default max distance in meters

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

  // Check if current location is within valid range of any coordinate
  function isLocationValid(currentLat, currentLon, validCoords) {
    if (!validCoords || validCoords.length === 0) {
      console.warn("No valid coordinates to compare");
      return { valid: true, distance: 0, nearestCoord: null }; // Allow if no coordinates defined
    }

    let minDistance = Infinity;
    let nearestCoord = null;

    for (const coord of validCoords) {
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
      valid: minDistance <= maxDistanceMeters,
      distance: Math.round(minDistance),
      nearestCoord: nearestCoord,
    };
  }

  // Extract coordinates from form schema
  function extractCoordinatesFromSchema(formInstance) {
    if (!formInstance || !formInstance.schema) {
      console.warn("No form instance or schema available");
      return [];
    }

    console.log("Searching for coordinates in schema:", formInstance.schema);

    const findCoordinateComponent = (components) => {
      for (const comp of components) {
        console.log(`Checking component: ${comp.key} (type: ${comp.type})`);

        // Look for component with key 'coodinates' or 'coordinates'
        if (comp.key === "coodinates" || comp.key === "coordinates") {
          console.log(`Found coordinate component:`, comp);
          if (comp.defaultValue && Array.isArray(comp.defaultValue)) {
            console.log(`Coordinates extracted:`, comp.defaultValue);
            return comp.defaultValue;
          }
        }

        // Recursively search in nested components
        if (comp.components && Array.isArray(comp.components)) {
          const found = findCoordinateComponent(comp.components);
          if (found) return found;
        }
      }
      return null;
    };

    const result =
      findCoordinateComponent(formInstance.schema.components) || [];
    console.log("Final extracted coordinates:", result);
    return result;
  }

  // Handle different types of UI instructions
  $: if (instruction) {
    console.log("Received instruction:", instruction);
    const componentType = instruction.customType;
    console.log("Handling instruction for component:", componentType);

    // Extract valid coordinates from form schema first
    if (formInstance) {
      const coordsFromSchema = extractCoordinatesFromSchema(formInstance);
      if (coordsFromSchema.length > 0) {
        validCoordinates = coordsFromSchema;
        console.log("Valid coordinates loaded from schema:", validCoordinates);
      }
    }

    // Fallback: Extract valid coordinates from dependsOn (if not found in schema)
    if (
      validCoordinates.length === 0 &&
      instruction.dependsOn &&
      Array.isArray(instruction.dependsOn)
    ) {
      instruction.dependsOn.forEach((fieldName) => {
        if (instruction.instruction?.eventData?.[fieldName]) {
          const coords = instruction.instruction.eventData[fieldName];
          if (Array.isArray(coords)) {
            validCoordinates = coords;
            console.log(
              "Valid coordinates loaded from instruction:",
              validCoordinates
            );
          }
        }
      });
    }

    // Extract maxDistance if provided in instruction
    if (instruction.instruction?.maxDistanceMeters) {
      maxDistanceMeters = instruction.instruction.maxDistanceMeters;
    }

    switch (componentType) {
      case "modalQRComponent":
        showQRModal = true;
        break;
      case "modalLocation":
        showLocationModal = true;
        break;
      default:
        console.warn("Unknown component type:", componentType);
    }
  }

  // --- Handle QR Scan Result ---
  function handleQRScan(qrData) {
    if (instruction?.affects) {
      onInstructionComplete({
        field: instruction.affects,
        value: qrData,
      });
    }
    closeModals();
  }

  // --- Handle Location Result ---
  function handleLocationChange(position) {
    // position = { latitude, longitude }
    if (instruction?.affects) {
      const currentLat = parseFloat(position.latitude);
      const currentLon = parseFloat(position.longitude);

      // Validate location if coordinates are provided
      const validation = isLocationValid(
        currentLat,
        currentLon,
        validCoordinates
      );

      console.log("Location validation:", {
        currentLocation: position,
        validCoordinates: validCoordinates,
        isValid: validation.valid,
        distance: validation.distance,
        maxAllowed: maxDistanceMeters,
        nearestCoord: validation.nearestCoord,
      });

      onInstructionComplete({
        field: instruction.affects,
        value: `${position.latitude},${position.longitude}`,
        validation: {
          isValid: validation.valid,
          distance: validation.distance,
          maxDistance: maxDistanceMeters,
          nearestCoordinate: validation.nearestCoord,
          message: validation.valid
            ? `Lokasi valid (${validation.distance}m dari titik terdekat)`
            : `Lokasi terlalu jauh (${validation.distance}m dari titik terdekat, maksimal ${maxDistanceMeters}m)`,
        },
      });
    }

    // Auto-close location modal after getting location
    closeModals();
  }

  // --- Close all modals ---
  function closeModals() {
    showQRModal = false;
    showLocationModal = false;
  }
</script>

{#if showQRModal}
  <QRModal
    show={true}
    config={{
      title: "Scan QR Code",
      description: "Scan QR code untuk mengisi data",
      scannerType: "qr",
      autoClose: true,
    }}
    onScanSuccess={handleQRScan}
    onClose={closeModals}
  />
{/if}

{#if showLocationModal}
  <LocationModal
    show={true}
    config={{
      title: "Ambil Lokasi Realtime",
      description: "Mengambil koordinat latitude dan longitude perangkat kamu.",
      autoClose: false,
      validCoordinates: validCoordinates,
      maxDistanceMeters: maxDistanceMeters,
    }}
    onLocationChange={handleLocationChange}
    onClose={closeModals}
  />
{/if}
