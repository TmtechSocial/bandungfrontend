<script>
  import { onMount } from "svelte";
  import { fetchUserGroups } from '../camunda/camundaUserGroups.js';
  export let data;
  const sessionData = data.sessionData;

  console.log("data User:", sessionData.user);
  console.log("Group User:", sessionData.user.groups);

  let loading = true;
  let error = null;

  const TRACKING_URL =
    "https://mirorim.ddns.net/mb/public/question/6f718cd3-1bf4-4f4c-9e67-d25daa5bd5b8";
  const TRACKING_SHOP_URL =
    "https://mirorim.ddns.net/mb/public/question/41b445b8-3ab2-4569-bb09-d2382354cbdb";
  const TRACKING_INVOICE =
    "https://mirorim.ddns.net/mb/public/question/5508adfb-f2db-4055-84f9-2de9b76f8dda";
  const TRACKING_REFILL =
    "https://mirorim.ddns.net/mb/public/question/b2560955-6250-41ca-b446-295eb0514576";
  const PRODUCT_RAW_OUT_STOCK =
    "https://mirorim.ddns.net/mb/public/question/944dbb05-4812-417e-b841-ae94b1ba70df";
  const PRODUCT_FINISHED =
    "https://mirorim.ddns.net/mb/public/question/ffe7a5f7-c90c-4627-9319-c607b67ceef6";
  const PRODUCT_FINISHED_BYNAME =
    "https://mirorim.ddns.net/mb/public/question/237d3cda-ba2e-4541-af53-1e7003325444";
  // manufacture
  const OPTIMALISASI_RESOURCE_PRODUCTION =
    "https://mirorim.ddns.net/mb/public/question/00a928c8-06a7-4ae2-a643-583926cec61c";
  const SLA_PER_REQUEST =
    "https://mirorim.ddns.net/mb/public/question/62288695-3eaf-4176-9da1-a35852af52f9";
  const PERFORMA_WORKER =
    "https://mirorim.ddns.net/mb/public/question/230944a5-7d9d-42d8-92cc-3db5333626fc";
  const REJECT =
    "https://mirorim.ddns.net/mb/public/question/029f1e7f-9a41-4003-bd81-b6b8aeaefe79";
  const DURASI_QC =
    "https://mirorim.ddns.net/mb/public/question/e20e3d27-f538-4eff-aef4-7064236cfa82";
  const ACTIVE_TASK_PRODUCTION =
    "https://mirorim.ddns.net/mb/public/question/33357758-447c-4db0-b855-70c717a5bebd";
  const SLA_PRODUCTS =
    "https://mirorim.ddns.net/mb/public/question/b060cdde-5d1a-469f-b81f-a4e959db4d09";
  // manager gudang
  const DUPLICATION_PRODUCT_IN_LOCATION =
    "https://mirorim.ddns.net/mb/public/question/558cc564-f11c-4ffd-905a-6c8d3a613640";
  const PROCESS_KPI_ACCURACY_MUTASI =
    "https://mirorim.ddns.net/mb/public/question/f7f08673-3867-4837-9ca8-6cb4a6a818e7";
  const WAREHOUSE_TASK =
    "https://mirorim.ddns.net/mb/public/question/d4da7ba6-b3ee-465e-be86-6ebf08a88df3";
  const PROCESS_KPI_COMPLETENESS_MUTASI =
    "https://mirorim.ddns.net/mb/public/question/1ca75ed5-d257-49cf-8c53-983d46135e5d";
  const PROCESS_KPI_REKOMENDATION_MUTASI =
    "https://mirorim.ddns.net/mb/public/question/670c6676-89dd-4e96-99d8-7f72987672d6";
  const PROCESS_KPI_ADJUSTMENT_FREQ_SO_WAREHOUSE =
    "https://mirorim.ddns.net/mb/public/question/249b2d6d-79ab-40f5-80d9-cc2f85018ba4";
  const PROCESS_KPI_COMPLETENESS_SO_WAREHOUSE =
    "https://mirorim.ddns.net/mb/public/question/0c0b58dc-571a-49eb-afc8-1185629fb998";
  const PROCESS_KPI_COVERAGE_SO_WAREHOUSE =
    "https://mirorim.ddns.net/mb/public/question/d901f317-764b-4099-a82c-277b7b8cd7b2";
  const PROCESS_KPI_DISCREPANCY_SO_WAREHOUSE =
    "https://mirorim.ddns.net/mb/public/question/252f8ba0-4ba0-4538-9595-d556bfd7892c";
  const ADJUSTMENT_FREQUENCY_SO_TOKO =
    "https://mirorim.ddns.net/mb/public/question/7c8810fb-3c23-473d-b7e2-67ad6ece49f0";
  const COMPLETENESS_SO_TOKO =
    "https://mirorim.ddns.net/mb/public/question/4f11f2cf-f5f9-4e9b-ac1f-5b88d55143b0";
  const DISCREPANCY_SO_TOKO =
    "https://mirorim.ddns.net/mb/public/question/a2be1b3c-b552-480d-9d5e-a079c9bdc1b2";
  const TRACKING_MUTASI = "https://mirorim.ddns.net/mb/public/question/e138674b-69b7-45c5-8ccb-57b83b442bd7";
  //   AdminMP
  const REPORT_AR_TOKOPEDIA =
    "https://mirorim.ddns.net/mb/public/question/0c97d05c-d068-4085-b7b6-cf54bec68a5a";
  const REPORT_AR_SHOPEE =
    "https://mirorim.ddns.net/mb/public/question/3e59e76e-6939-480f-b613-016694c72d60";
  const RETUR_UNFINISH =
    "https://mirorim.ddns.net/mb/public/question/ebc6cf68-a667-474f-80f2-53d1f4edc907";
  const SEARCH_RETUR =
    "https://mirorim.ddns.net/mb/public/question/76c9dce4-da07-4a53-96c2-3e69c7f4527d";
  const NOT_SETTELED_MONTH =
    "https://mirorim.ddns.net/mb/public/question/6c11f6bd-d4bb-4b65-89c8-31f6fc49da41";
  // HeadOfOperation
  const MAIN_REPORT =
    "https://mirorim.ddns.net/mb/public/question/8edcb2d3-b51e-46d0-a864-1737c40eae78";
  const QTY_ORDER_TOKO_REPORT =
    "https://mirorim.ddns.net/mb/public/question/678e4969-55e9-4dc5-b07b-3f1162c66de1";
  onMount(() => {
    // Simulasi loading untuk iframe
    setTimeout(() => {
      loading = false;
    }, 1000);
  });

  let groupIds = []
  const initiatorId = sessionData.user?.username;
onMount(async () => {
    try {
      const groups = await fetchUserGroups(initiatorId);

      if (Array.isArray(groups) && groups.length > 0) {
        groupIds = groups
      } else {
        console.log(
          `No Camunda groups found for user ${initiatorId}; using empty group list`
        );
        groupIds = [];
      }
    } catch (err) {
      console.error(`Error fetching groups for ${initiatorId}:`, err.message || err);
      groupIds = [];
    }
  });
  function isOnDuty() {
    return groupIds.some(
      (g) => g.name === "OnDuty" 
      || g.name === "InventoryRetailCoordinator"
      || g.name === "SalesOrderCoordinator"
      || g.name === "SalesOrderStaff"
      || g.name === "SalesLeader"
    );
  }
  function isHeadOfOperation() {
    return groupIds.some((g) => g.name === "HeadOfOperation");
  }
  function isManagerGudang() {
    return groupIds.some((g) => g.name === "ManagerGudang");
  }
  function isManagerProduksi() {
    return groupIds.some((g) => g.name === "ManagerProduksi");
  }
  function isManagerPrepare() {
    return groupIds.some((g) => g.name === "ManagerPrepare");
  }
  function isAdminMP() {
    return groupIds.some((g) => g.name === "AdminMP" || g.name === "SalesHeadOf");
  }
</script>

<div class="w-full">
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <p class="text-lg font-semibold text-blue-500">Loading report...</p>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-full">
      <p class="text-lg font-semibold text-red-500">Error: {error}</p>
    </div>
  {:else}
    <!-- Metabase iframe -->
    <div class="w-full space-y-8">
      <div>
        {#if isAdminMP()}
          <iframe
            src={NOT_SETTELED_MONTH}
            title="Tracking Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={RETUR_UNFINISH}
            title="Tracking Shop Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={SEARCH_RETUR}
            title="Tracking Shop Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
        {/if}
        {#if isHeadOfOperation()}
          <iframe
            src={MAIN_REPORT}
            title="Tracking Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
        {/if}
        {#if isOnDuty()}
          <iframe
            src={TRACKING_URL}
            title="Tracking Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={TRACKING_SHOP_URL}
            title="Tracking Shop Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={TRACKING_INVOICE}
            title="Invoice Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={QTY_ORDER_TOKO_REPORT}
            title="SKU Order Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
        {/if}
        {#if isOnDuty() || isManagerGudang() || isManagerPrepare()}
          <iframe
            src={TRACKING_REFILL}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
        {/if}
        {#if isManagerGudang()}
          <iframe
            src={WAREHOUSE_TASK}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          
          <iframe
            src={PRODUCT_RAW_OUT_STOCK}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PRODUCT_FINISHED}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PRODUCT_FINISHED_BYNAME}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_ACCURACY_MUTASI}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_COMPLETENESS_MUTASI}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_REKOMENDATION_MUTASI}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_ADJUSTMENT_FREQ_SO_WAREHOUSE}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_COMPLETENESS_SO_WAREHOUSE}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_COVERAGE_SO_WAREHOUSE}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PROCESS_KPI_DISCREPANCY_SO_WAREHOUSE}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={DUPLICATION_PRODUCT_IN_LOCATION}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={ADJUSTMENT_FREQUENCY_SO_TOKO}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={COMPLETENESS_SO_TOKO}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={DISCREPANCY_SO_TOKO}
            title="Refill Report"
            class="w-full h-[800px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
        {/if}
        {#if isManagerProduksi()}
          <iframe
            src={ACTIVE_TASK_PRODUCTION}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={OPTIMALISASI_RESOURCE_PRODUCTION}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={PERFORMA_WORKER}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={SLA_PER_REQUEST}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={REJECT}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={DURASI_QC}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
          <iframe
            src={SLA_PRODUCTS}
            title="Refill Report"
            class="w-full h-[600px] border-0 mb-4"
            frameborder="0"
            allowtransparency="true"
            allowfullscreen
          ></iframe>
        {/if}
      </div>
    </div>
  {/if}
</div>
