<!-- UIInstructionHandler.svelte -->
<script>
  import QRModal from './QRModal.svelte';
  
  export let instruction = null;
  export let onInstructionComplete = () => {};

  let showQRModal = false;
  
  // Handle different types of UI instructions
  $: if (instruction) {
    const { componentType, targetField, eventData } = instruction.instruction;
    
    switch (componentType) {
      case 'modalQRComponent':
        showQRModal = true;
        break;
      // Add more component types here
      default:
        console.warn('Unknown component type:', componentType);
    }
  }

  // Handle QR scan result
  function handleQRScan(qrData) {
    // Update the target field with scanned data
    if (instruction?.instruction?.targetField) {
      onInstructionComplete({
        field: instruction.instruction.targetField,
        value: qrData
      });
    }
    showQRModal = false;
  }
</script>

{#if showQRModal}
  <QRModal
    show={true}
    config={{
      title: 'Scan QR Code',
      description: 'Scan QR code untuk mengisi data',
      scannerType: 'qr',
      autoClose: true
    }}
    onScanSuccess={handleQRScan}
    onClose={() => showQRModal = false}
  />
{/if}
