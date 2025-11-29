<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import { goto } from "$app/navigation";
  import axios from "axios";
  import { onSnapshot, collection } from "firebase/firestore";
  import { db } from "../../lib/firebaseClient";
  import { registerFcmToken } from "../../lib/registerFcm";

  export let data: any;
  const sessionData = data.sessionData;
  const user = sessionData.user;
  const groups = sessionData.groups;

  interface ProcessDefinition {
    id: string;
    key: string;
    name: string;
    static_name?: string;
    icon?: string;
    userGroups?: string[];
  }

  const processDefinitions: Writable<ProcessDefinition[]> = writable([]);
  const loading: Writable<boolean> = writable(true);
  const error: Writable<string | null> = writable(null);

  let fcmRegistered = false;
  const camundaUrl = import.meta.env.VITE_CAMUNDA_API_URL;

  async function fetchAndSetProcesses() {
    try {
      const userProcessResponse = await axios.get(
        `${camundaUrl}process-definition?startableBy=${user.username}&latestVersion=true`
      );

      // ❗ Perbaikan DI SINI — jangan return
      if (userProcessResponse.data.length === 0) {
        // tetap lanjut supaya static button tetap muncul
        userProcessResponse.data = [];
      }

      const [dynamicHomeResponse] = await Promise.allSettled([
        axios.get("https://mirorim.ddns.net:6789/backendBandung/dynamicHome"),
      ]);

      let dynamicHomeData: any[] = [];
      if (dynamicHomeResponse.status === "fulfilled") {
        dynamicHomeData = dynamicHomeResponse.value.data.data ?? [];
      }

      const filteredProcesses = userProcessResponse.data
        .filter((process: any) => {
          if (dynamicHomeData.length === 0) return true;
          return dynamicHomeData.some((item) => item.process === process.key);
        })
        .map((process: any) => {
          const matched = dynamicHomeData.find(
            (item) => item.process === process.key
          );
          return {
            ...process,
            icon: matched?.icon || "defaultIcon",
            userGroups: groups.map((g: any) => g.name || g.id),
          };
        });

      // 1️⃣ Static button always present
      const staticButtons: ProcessDefinition[] = [
        {
          id: "HR_Management.Absensi_New",
          key: "HR_Management.Absensi_New",
          static_name: "Clock Out",
          name: "Clock Out",
          icon: "clockOut",
          userGroups: groups.map((g: any) => g.name || g.id),
        },
      ];

      // 2️⃣ Combine static + dynamic
      const finalProcesses = [...staticButtons, ...filteredProcesses];

      // 3️⃣ Set to Svelte store
      processDefinitions.set(finalProcesses);

    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        error.set(err.response?.data || err.message);
      } else {
        error.set(String(err));
      }
    } finally {
      loading.set(false);
    }
  }

  onMount(() => {
    if (typeof window !== "undefined" && !fcmRegistered && sessionData?.token) {
      registerFcmToken({
        token: sessionData.token,
        apiUrl: import.meta.env.VITE_API_URL,
        userId: user.username,
      })
        .then((success) => {
          if (success) fcmRegistered = true;
        })
        .catch((e) => console.warn("❌ FCM registration error:", e));
    }

    fetchAndSetProcesses();

    const unsub = onSnapshot(collection(db, "taskEvents"), () => {
      console.log("📡 Received Firestore event in home page");
    });

    onDestroy(() => unsub());
  });

  const handleProcessClick = (process: ProcessDefinition) => {
    goto(`/form?process=${process.key}`);
  };

  // reactive values
  $: hasAccess = $processDefinitions.length > 0;

  // grouping function
  function groupProcesses(processes: ProcessDefinition[]) {
    const groups: Record<string, Record<string, ProcessDefinition[]>> = {};

    processes.forEach((p) => {
      const parts = p.key.split(".");
      const groupName = parts[0];
      const subParts = parts[1]?.split("_") || [];
      const subGroupName = subParts.slice(0, 3).join("_");

      if (!groups[groupName]) {
        groups[groupName] = {};
      }
      if (!groups[groupName][subGroupName]) {
        groups[groupName][subGroupName] = [];
      }
      groups[groupName][subGroupName].push(p);
    });

    return groups;
  }

  $: groupedProcesses = groupProcesses($processDefinitions);

  function formatGroupName(name: string): string {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatProcessName(key: string): string {
    return key.includes(".")
      ? key.split(".")[1].replace(/_/g, " ")
      : key.replace(/_/g, " ");
  }
</script>

<!-- Template -->
{#if !hasAccess && !$loading}
  <p class="text-center">You don't have access to start process definitions.</p>
{:else if $loading}
  <p class="text-start text-xl mt-8">Loading process definitions...</p>
{:else if $error}
  <p class="text-start text-red-500">Error: {$error}</p>
{:else if Object.keys(groupedProcesses).length > 0}
  {#each Object.entries(groupedProcesses) as [groupName, subGroups]}
    <div class="mb-8">
      <p class="text-md font-bold text-start mb-2">
        {formatGroupName(groupName)}
      </p>

      <div class="flex flex-col gap-6 sm:flex-row sm:flex-wrap sm:gap-6">
        {#each Object.entries(subGroups) as [subGroupName, processes]}
          {#if processes.length === 1}
            {#each processes as process}
              <div
                class="flex flex-col items-center sm:flex-row bg-slate-200 shadow-md rounded-lg p-4 sm:p-6 w-full sm:w-80 hover:scale-105 transform transition-all cursor-pointer"
                on:click={() => handleProcessClick(process)}
              >
                <img
                  src={`/images/${process.icon}.svg`}
                  alt={process.key}
                  class="w-8 h-9 rounded-md mb-2 sm:mb-0 sm:mr-3"
                />
                <div class="text-center sm:text-left">
                  <strong class="text-sm sm:text-lg block text-myPrimary">
{process.static_name || formatProcessName(process.key)}
                  </strong>
                </div>
              </div>
            {/each}
          {:else}
            <div class="flex flex-col w-full">
              <p class="text-sm font-semibold mb-2">
                {formatGroupName(subGroupName)}
              </p>

              <div class="flex flex-col sm:flex-row sm:flex-wrap gap-4">
                {#each processes as process}
                  <div
                    class="flex flex-col items-center bg-slate-200 shadow-md rounded-lg p-3 w-full sm:w-60 hover:scale-105 transform transition-all cursor-pointer"
                    on:click={() => handleProcessClick(process)}
                  >
                    <img
                      src={`/images/${process.icon}.svg`}
                      alt={process.key}
                      class="w-7 h-8 rounded-md mb-2"
                    />
                    <div class="text-center w-full">
                      <strong class="text-xs sm:text-sm block text-myPrimary">
                        {formatProcessName(process.key)}
                      </strong>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
{:else}
  <p class="text-start">No available processes.</p>
{/if}
