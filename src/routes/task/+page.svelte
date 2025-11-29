<script>
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import axios from "axios";
  import { fetchUserGroups } from '../camunda/camundaUserGroups.js';
  // Firebase imports re-enabled for broadcasting
  import { onSnapshot, collection } from "firebase/firestore";
  import { db } from "../../lib/firebaseClient";
  import Toast from "../../lib/components/Toast.svelte";
  import { toasts, toast } from "../../lib/stores/toastStore.js";

  
  let notifications = [];
  let taskList = [];
  let lastEventTimestamp = null;
  let isRefreshing = false;
  let processedEvents = new Set(); // Track processed events

  // Firebase & FCM untuk real-time broadcasting
  onMount(() => {
    fetchAllTasks();

    // Enhanced Firestore listener for real-time updates
    const unsub = onSnapshot(
      collection(db, "taskEvents"),
      (snapshot) => {
        if (snapshot.empty) return;

        // Process only new documents for better performance
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const eventData = change.doc.data();
            const eventId = change.doc.id;

            // Skip if already processed to avoid duplicates
            if (processedEvents.has(eventId)) return;
            processedEvents.add(eventId);

            // Process real-time event immediately
            handleFirestoreTaskEvent(eventData, eventId);
          }
        });
      },
      (error) => {
        console.error("Firestore listener error:", error);
      }
    );

    return () => {
      unsub();
    };
  });

  // Enhanced handler untuk Firestore events
  function handleFirestoreTaskEvent(eventData, eventId) {
    console.log("📡 Real-time task event received:", eventData);

    const { type, processInstanceId, taskDefinitionKey, assignee, userId } =
      eventData;

    // Skip jika event dari user sendiri (untuk menghindari double update)
    if (userId === sessionData.user.username) {
      console.log("⏭️ Skipping own event to avoid duplication");
      return;
    }

    // Update specific task untuk user lain dengan instant feedback
    if (type === "CLAIMED" || type === "UNCLAIMED") {
      const updateSuccessful = updateTaskAssigneeStatus(
        processInstanceId,
        taskDefinitionKey,
        type === "CLAIMED" ? assignee : null
      );

      // Show notification untuk other users' actions
      const taskName = getTaskId(taskDefinitionKey);
      const action = type === "CLAIMED" ? "claimed" : "unclaimed";
      const user = type === "CLAIMED" ? assignee : userId;

      if (updateSuccessful) {
        // toast.info(`Task "${taskName}" ${action} by ${user}`, 4000);
        console.log(
          `✅ Real-time update: Task "${taskName}" ${action} by ${user}`
        );
      } else {
        console.warn(`⚠️ Failed to update task "${taskName}" in real-time`);
      }
    }
  }

  // Smart debounce dengan cache awareness
  let refreshTimeout;
  let lastDataFetch = 0;
  const MIN_REFRESH_INTERVAL = 5000; // 5 detik minimum antara refresh

  function debounceRefresh(delay = 1000) {
    if (refreshTimeout) clearTimeout(refreshTimeout);

    refreshTimeout = setTimeout(() => {
      if (!isRefreshing) {
        const now = Date.now();
        const timeSinceLastFetch = now - lastDataFetch;

        // Skip if we just fetched data recently
        if (timeSinceLastFetch < MIN_REFRESH_INTERVAL) {
          console.log("⏭️ Skipping refresh - too soon after last fetch");
          return;
        }

        console.log("🔄 Smart refresh triggered");
        isRefreshing = true;
        lastDataFetch = now;
        fetchAllTasks().finally(() => {
          isRefreshing = false;
        });
      }
    }, delay);
  }

  // Cleanup on component destroy
  onDestroy(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    isRefreshing = false;
  });

  const BACKEND_URL =
    import.meta.env.VITE_API_URL ||
    "https://mirorim.ddns.net:6789/backendBandung/";

  export let data;
  const sessionData = data.sessionData;
  const token = sessionData.token;
  const userId = sessionData.user.username;

let groupIds = [];
  onMount(async () => {
    try {
      const groups = await fetchUserGroups(userId);

      if (Array.isArray(groups) && groups.length > 0) {
        groupIds = groups;  // <-- Simpan full object
      } else {
        groupIds = [];
      }
    } catch (err) {
      groupIds = [];
    }
  });

  let tasks = [];
  let groupedTasks = {};
  let loading = true;
  let error = null;
  let collapsed = {};
  let selectedInstances = new Set();
  let claimLoadingStates = {};

  // Loading states
  let loadingStage = ""; // For progressive loading feedback
  let loadedGroups = 0;
  let totalGroups = 0;

  // Performance tracking
  let performanceMetrics = {
    fetchStart: 0,
    fetchEnd: 0,
    processStart: 0,
    processEnd: 0,
    renderStart: 0,
    renderEnd: 0,
  };

  // ADD MISSING: Group select all states
  let groupSelectAllStates = {};

  // Task conflict modal states
  let showTaskConflictModal = false;
  let conflictModalData = {
    newTask: null,
    existingTasks: [],
    pendingClaim: null,
  };
  // Scan QR conflict modal state: when user has claimed tasks and wants to
  // switch to scanning, offer to continue current tasks or unclaim and scan.
  let showScanConflictModal = false;
  let scanConflictTasks = []; // array of claimed task objects
  let scanTargetRoute = "";
  let scanUnclaimLoading = false;

  // Filter variables
  let showFilter = false;
  // Add processInstanceId filter option
  let filterColumns = [
    { key: "taskId", label: "Task Definition" },
    { key: "businessKey1", label: "Business Key 1" },
    { key: "businessKey2", label: "Business Key 2" },
    { key: "businessKey3", label: "Business Key 3" },
    { key: "business_key", label: "Additional" },
  ];
  let filterValues = {};
  let tempFilterValues = {};
  let isFilterActive = false;
  let filteredGroupedTasks = {};
  let showNoDataModal = false;

  // Define groups that should show handleScanQR button
  const scanQRGroups = [
    "SalesPackingStaff",
    "WarehouseOperatorRetail",
    "SalesLeader",
    "SalesHeadOf",
    "SalesOrderCoordinator",
    "SalesOrderStaff",
    "SalesPackingCoordinator",
    "SalesQCCoordinator",
    "SalesQCStaff",
    "SalesSupportCoordinator",
    "Categorizer",
    "ManagerToko",
    "WorkerOperatorQC",
    "LeaderSalesOrder",
    "OrderQCCoordinator",
    "WorkerOrderHandling",
    "WorkerOperatorPacking",
    "WorkerOperatorPicking",
    "OrderHandlingCoordinator",
    "OperatorPickingCoordinator",
    "InventoryRetailStaff",
    "InventoryRetailCoordinator",
    "SalesScanningStaff"
  ];
  // Check if user has any of the scanQR groups

    // NEW LOGIC: Show both buttons if user has both scanQRGroups and other groups
    $: hasScanQRGroup = groupIds.some((group) => scanQRGroups.includes(group.name));
    $: hasOtherGroup  = groupIds.some((group) => !scanQRGroups.includes(group.name));
console.log('groupsId: ',groupIds);

    $: showScanQRButton         = hasScanQRGroup;
    $: showScanQRInternalButton = hasOtherGroup;


  // Derived list of unique taskIds for filter dropdown
  $: uniqueTaskIds = (() => {
    const allTasks = flattenTasks(
      isFilterActive ? filteredGroupedTasks : groupedTasks
    );
    const taskIdSet = new Set();

    allTasks.forEach((task) => {
      const taskId = getTaskId(task.taskDefinitionKey);
      if (taskId && taskId.trim()) {
        taskIdSet.add(taskId.trim());
      }
    });

    return Array.from(taskIdSet).sort();
  })();

  // Initialize temp filter values on component mount
  onMount(async () => {
    // Load cached filter values from localStorage
    const cachedFilters = localStorage.getItem("taskFilterValues");
    if (cachedFilters) {
      try {
        filterValues = JSON.parse(cachedFilters);
        tempFilterValues = { ...filterValues };
        isFilterActive = Object.values(filterValues).some(
          (val) => val && val.length > 0
        );
      } catch (e) {
        console.warn("Failed to parse cached filter values", e);
      }
    } else {
      tempFilterValues = { ...filterValues };
    }

    // Preload critical data in background
    console.log("🚀 Starting optimized data preload...");

    // Start immediate data fetch with priority loading
    const preloadStart = performance.now();
    await fetchAllTasks();
    const preloadEnd = performance.now();

    console.log(
      `✅ Initial data loaded in ${(preloadEnd - preloadStart).toFixed(2)}ms`
    );

    // Preload additional data that might be needed soon
    setTimeout(() => {
      console.log("🔄 Background preload for secondary data...");
      // Preload any secondary data here if needed
    }, 2000);
  });

  // ADD MISSING: Modal functions
  function showNoDataPopup() {
    showNoDataModal = true;
  }

  function closeNoDataModal() {
    showNoDataModal = false;
  }

  // ADD MISSING: Scan QR placeholder
  function handleScanQR() {
    initiateScan("/scan");
  }

  function handleScanQRInternal() {
    initiateScan("/scanInternal");
  }

  // Called when user clicks a Scan button. If user has claimed tasks, show modal.
  function initiateScan(targetRoute) {
    // Find tasks currently claimed by current user
    const claimed = tasks.filter((t) => t.assignee === userId);
    if (!claimed || claimed.length === 0) {
      // No claimed tasks — proceed
      goto(targetRoute);
      return;
    }

    // Otherwise show modal asking user what to do
    scanConflictTasks = claimed;
    scanTargetRoute = targetRoute;
    showScanConflictModal = true;
  }

  // Unclaim all user's claimed tasks (best-effort) and then navigate to scan
  async function performUnclaimAndNavigate() {
    if (!scanConflictTasks || scanConflictTasks.length === 0) return;
    scanUnclaimLoading = true;

    // Build unique pairs of processInstanceId+taskDefinitionKey to unclaim
    const pairs = new Map();
    scanConflictTasks.forEach((t) => {
      const key = `${t.processInstanceId}::${t.taskDefinitionKey}`;
      if (!pairs.has(key)) pairs.set(key, t);
    });

    const promises = [];
    for (const [k, t] of pairs.entries()) {
      promises.push(
        // call existing handler to unclaim (claim=false)
        handleClaimUnclaimTask(t.processInstanceId, t.taskDefinitionKey, false)
      );
    }

    // Await all attempts (allow failures to proceed)
    try {
      await Promise.allSettled(promises);

      // Remove any of these instances from selectedInstances set
      const remaining = Array.from(selectedInstances).filter((sel) => {
        return !pairs.has(`${sel.processInstanceId}::${sel.taskDefinitionKey}`) && !pairs.has(`${sel.processInstanceId}::${sel.taskDefinitionKey}`);
      });
      selectedInstances = new Set(remaining);

      // Close modal and navigate
      showScanConflictModal = false;
      goto(scanTargetRoute);
    } catch (e) {
      console.error("Error unclaiming tasks before scan:", e);
      // still try navigate
      showScanConflictModal = false;
      goto(scanTargetRoute);
    } finally {
      scanUnclaimLoading = false;
      scanConflictTasks = [];
      scanTargetRoute = "";
    }
  }

  // ADD MISSING: renderTree function
  // Modifikasi fungsi renderTree untuk menampilkan delegated yang sesuai dengan level task
  function renderTree(key, value, level) {
    const rows = [];
    const indent = level + 1;

    if (typeof value === "object" && !Array.isArray(value)) {
      // Group header
      rows.push({
        id: `group-${key}-${level}`,
        taskDefinitionKey: key,
        taskId: getTaskId(key),
        name: "",
        processInstanceId: "",
        initiator_name: "",
        businessKey1: "",
        businessKey2: "",
        businessKey3: "",
        business_key: "",
        delegated: "", // Kosong untuk group header
        indent,
        isGroup: true,
        isDetailRow: false,
      });

      if (!collapsed[key]) {
        Object.entries(value).forEach(([childKey, childValue]) => {
          rows.push(...renderTree(childKey, childValue, level + 1));
        });
      }
    } else if (Array.isArray(value)) {
      // Task group header dengan delegated yang sesuai
      const groupDelegated = getGroupDelegatedInfo(value, key);

      rows.push({
        id: `taskgroup-${key}-${level}`,
        taskDefinitionKey: key,
        taskId: getTaskId(key),
        name: "",
        processInstanceId: "",
        initiator_name: "",
        businessKey1: "",
        businessKey2: "",
        businessKey3: "",
        business_key: "",
        delegated: groupDelegated, // Tampilkan delegated untuk group
        indent,
        isGroup: true,
        isDetailRow: false,
        hasSelectAll: true,
        groupTasks: value,
      });

      if (!collapsed[key]) {
        value.forEach((task, index) => {
          // Create a truly unique key by combining multiple identifiers
          const uniqueKey = `task-${task.processInstanceId}-${task.taskDefinitionKey}-${index}`;
          rows.push({
            ...task,
            id: uniqueKey,
            taskId: getTaskId(task.taskDefinitionKey),
            delegated: task.delegated || "", // Gunakan delegated dari task individual
            indent: indent + 1,
            isDetailRow: true,
          });
        });
      }
    }

    return rows;
  }

  function isHighPriority(task) {
    return (
      task.businessKey2 === "instant" || task.businessKey3 === "Prioritas" ||
      (task.business_key &&
        task.business_key.toLowerCase().includes("prioritas"))
    );
  }

  // Fungsi helper untuk mendapatkan informasi delegated untuk group
  function getGroupDelegatedInfo(tasks, taskDefinitionKey) {
    if (!tasks || tasks.length === 0) {
      return "";
    }

    // Ambil delegated dari task pertama dalam group
    const firstTask = tasks[0];
    if (firstTask && firstTask.delegated) {
      return firstTask.delegated;
    }

    // Jika tidak ada delegated di task pertama, cari di task lain
    const taskWithDelegated = tasks.find((task) => task.delegated);
    if (taskWithDelegated) {
      return taskWithDelegated.delegated;
    }

    // Jika masih tidak ada, kembalikan string kosong
    return "";
  }

  // Alternatif: Jika Anda ingin menampilkan delegated berdasarkan task definition tertentu
  function getSpecificDelegatedInfo(tasks, targetTaskDefinition) {
    const targetTask = tasks.find(
      (task) =>
        task.taskDefinitionKey === targetTaskDefinition ||
        getTaskId(task.taskDefinitionKey).toLowerCase().includes("qc refill")
    );

    return targetTask?.delegated || "";
  }

  // Modifikasi untuk kasus spesifik QC Refill
  function renderTreeWithQCRefillDelegated(key, value, level) {
    const rows = [];
    const indent = level + 1;

    if (typeof value === "object" && !Array.isArray(value)) {
      // Group header
      rows.push({
        id: `group-${key}-${level}`,
        taskDefinitionKey: key,
        taskId: getTaskId(key),
        name: "",
        processInstanceId: "",
        initiator_name: "",
        businessKey1: "",
        businessKey2: "",
        businessKey3: "",
        business_key: "",
        delegated: "",
        indent,
        isGroup: true,
        isDetailRow: false,
      });

      if (!collapsed[key]) {
        Object.entries(value).forEach(([childKey, childValue]) => {
          rows.push(
            ...renderTreeWithQCRefillDelegated(childKey, childValue, level + 1)
          );
        });
      }
    } else if (Array.isArray(value)) {
      // Cari QC Refill task dalam group ini
      const qcRefillTask = value.find(
        (task) =>
          getTaskId(task.taskDefinitionKey)
            .toLowerCase()
            .includes("qc refill") ||
          task.taskDefinitionKey.toLowerCase().includes("qc") ||
          task.taskDefinitionKey.toLowerCase().includes("refill")
      );

      const groupDelegated =
        qcRefillTask?.delegated || getGroupDelegatedInfo(value, key);

      rows.push({
        id: `taskgroup-${key}-${level}`,
        taskDefinitionKey: key,
        taskId: getTaskId(key),
        name: "",
        processInstanceId: "",
        initiator_name: "",
        businessKey1: "",
        businessKey2: "",
        businessKey3: "",
        business_key: "",
        delegated: groupDelegated,
        indent,
        isGroup: true,
        isDetailRow: false,
        hasSelectAll: true,
        groupTasks: value,
      });

      if (!collapsed[key]) {
        value.forEach((task, index) => {
          // Create a truly unique key by combining multiple identifiers
          const uniqueKey = `task-${task.processInstanceId}-${task.taskDefinitionKey}-${index}`;
          rows.push({
            ...task,
            id: uniqueKey,
            taskId: getTaskId(task.taskDefinitionKey),
            delegated: task.delegated || "",
            indent: indent + 1,
            isDetailRow: true,
          });
        });
      }
    }

    return rows;
  }

  function formatDateTime(dateString) {
    if (!dateString) return "";
    return dateString.split(".")[0].replace("T", " ");
  }

  function sortTasksByHighPriority(tasks) {
    return tasks.sort((a, b) => {
      const aIsHighPriority = isHighPriority(a);
      const bIsHighPriority = isHighPriority(b);

      if (aIsHighPriority && !bIsHighPriority) return -1;
      if (!aIsHighPriority && bIsHighPriority) return 1;
      return 0;
    });
  }

  function countHighPriorityTasks(value) {
    if (Array.isArray(value)) {
      return value.filter((task) => isHighPriority(task)).length;
    } else if (typeof value === "object" && value !== null) {
      return Object.values(value).reduce(
        (total, subValue) => total + countHighPriorityTasks(subValue),
        0
      );
    }
    return 0;
  }

  function sortGroupedTasksByHighPriority(groupedTasks) {
    const entries = Object.entries(groupedTasks);

    const sortedEntries = entries.sort(([keyA, valueA], [keyB, valueB]) => {
      const aHighPriorityCount = countHighPriorityTasks(valueA);
      const bHighPriorityCount = countHighPriorityTasks(valueB);

      if (aHighPriorityCount !== bHighPriorityCount) {
        return bHighPriorityCount - aHighPriorityCount;
      }
      return 0;
    });

    const sortedGroupedTasks = {};
    sortedEntries.forEach(([key, value]) => {
      if (Array.isArray(value)) {
        sortedGroupedTasks[key] = sortTasksByHighPriority(value);
      } else if (typeof value === "object" && value !== null) {
        sortedGroupedTasks[key] = sortGroupedTasksByHighPriority(value);
      } else {
        sortedGroupedTasks[key] = value;
      }
    });

    return sortedGroupedTasks;
  }

  // Cache for tasks to avoid repeated fetching
  let tasksCache = null;
  let cacheTimestamp = 0;
  const CACHE_DURATION = 10000; // 10 seconds cache

  async function fetchAllTasks() {
    if (isRefreshing) {
      console.log("Already refreshing, skipping fetch");
      return;
    }

    // Performance tracking
    performanceMetrics.fetchStart = performance.now();

    // Check cache first
    const now = Date.now();
    if (tasksCache && now - cacheTimestamp < CACHE_DURATION) {
      console.log("⚡ Using cached tasks data");
      loadingStage = "Loading from cache...";
      groupedTasks = tasksCache.groupedTasks;
      tasks = tasksCache.tasks;
      loadingStage = "";
      return;
    }

    try {
      console.time("fetchAllTasks");
      console.log("🚀 Starting optimized fetchAllTasks...");
      loading = true;
      isRefreshing = true;
      loadingStage = "Initializing...";

      // Optimize: Use Promise.allSettled for better error handling and speed
      totalGroups = sessionData.groups.length;
      loadedGroups = 0;
      loadingStage = `Fetching tasks from ${totalGroups} groups...`;

      const groupPromises = sessionData.groups.map((group, index) =>
        axios
          .get(
            `${BACKEND_URL}api/task?initiator=${sessionData.user.username}&group=${group.name}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 15000, // 15 second timeout
            }
          )
          .catch((err) => {
            console.warn(
              `Failed to fetch tasks for group ${group.name}:`,
              err.message
            );
            return { data: { groupedTasks: {} } }; // Return empty data on error
          })
      );

      loadingStage = "Fetching data from server...";
      const responses = await Promise.all(groupPromises);

      performanceMetrics.fetchEnd = performance.now();
      performanceMetrics.processStart = performance.now();
      loadingStage = "Processing task data...";

      // Optimize: Use Set for better performance with large datasets
      const uniqueTasksSet = new Set();
      const mergedGroupedTasks = {};
      const allTasks = [];

      // Process responses from all groups with optimized algorithm and deduplication
      let processedGroups = 0;
      const processedTaskKeys = new Set(); // Track processed tasks to prevent duplicates
      
      responses.forEach((response) => {
        if (!response.data?.groupedTasks) return;

        processedGroups++;
        loadingStage = `Processing group ${processedGroups}/${totalGroups}...`;

        const { groupedTasks: fetchedGroupedTasks } = response.data;
        
        // Add deduplication check for tasks
        const dedupTasks = (tasks) => {
          if (Array.isArray(tasks)) {
            return tasks.filter(task => {
              const taskKey = `${task.processInstanceId}-${task.taskDefinitionKey}`;
              if (processedTaskKeys.has(taskKey)) {
                return false;
              }
              processedTaskKeys.add(taskKey);
              return true;
            });
          }
          return tasks;
        };

        Object.entries(fetchedGroupedTasks).forEach(([key, value]) => {
          if (!mergedGroupedTasks[key]) {
            mergedGroupedTasks[key] = Array.isArray(value) ? [] : {};
          }

          if (Array.isArray(value)) {
            // Apply deduplication before processing with enhanced uniqueness check
            const dedupedValue = value.filter(task => {
              // Create a more specific unique key that includes all relevant identifiers
              const uniqueKey = `${task.processInstanceId}-${task.taskDefinitionKey}-${task.assignee || 'unassigned'}`;
              if (uniqueTasksSet.has(uniqueKey)) {
                return false;
              }
              uniqueTasksSet.add(uniqueKey);
              return true;
            });

            // Process deduped tasks
            dedupedValue.forEach((task) => {
              allTasks.push(task);
              if (!mergedGroupedTasks[key]) {
                mergedGroupedTasks[key] = [];
              }
              mergedGroupedTasks[key].push(task);
            });
          } else if (typeof value === "object" && value !== null) {
            // Optimized: Handle nested structure with flattened processing
            const flattenTasks = (obj, target) => {
              if (Array.isArray(obj)) {
                obj.forEach((task) => {
                  const taskKey = `${task.processInstanceId}-${task.taskDefinitionKey}`;
                  if (!uniqueTasksSet.has(taskKey)) {
                    uniqueTasksSet.add(taskKey);
                    allTasks.push(task);
                    target.push(task);
                  }
                });
              } else if (typeof obj === "object" && obj !== null) {
                Object.entries(obj).forEach(([nestedKey, nestedValue]) => {
                  if (!target[nestedKey]) {
                    target[nestedKey] = Array.isArray(nestedValue) ? [] : {};
                  }
                  flattenTasks(nestedValue, target[nestedKey]);
                });
              }
            };

            flattenTasks(value, mergedGroupedTasks[key]);
          }
        });
      });

      loadingStage = "Sorting and organizing tasks...";
      // Sort merged tasks by instant priority
      groupedTasks = sortGroupedTasksByHighPriority(mergedGroupedTasks);
      tasks = allTasks; // Use the collected unique tasks array

      // Performance tracking
      performanceMetrics.processEnd = performance.now();
      performanceMetrics.renderStart = performance.now();

      console.log("✅ Fetched unique tasks:", tasks.length);
      console.log("📊 Grouped tasks:", Object.keys(groupedTasks));

      // Performance metrics
      const fetchTime = (
        performanceMetrics.fetchEnd - performanceMetrics.fetchStart
      ).toFixed(2);
      const processTime = (
        performanceMetrics.processEnd - performanceMetrics.processStart
      ).toFixed(2);
      console.log(
        `⚡ Performance: Fetch ${fetchTime}ms, Process ${processTime}ms`
      );

      // Cache the results
      tasksCache = { groupedTasks, tasks };
      cacheTimestamp = Date.now();

      loadingStage = "Finalizing...";

      if (Object.keys(groupedTasks).length === 0 || tasks.length === 0) {
        showNoDataPopup();
      } else {
        if (showNoDataModal) {
          closeNoDataModal();
        }
      }
    } catch (err) {
      error = err.message;
      console.error("❌ Error fetching tasks:", err);
    } finally {
      loading = false;
      isRefreshing = false;
      loadingStage = "";
      performanceMetrics.renderEnd = performance.now();
      console.log("fetchAllTasks completed");
    }
  }

  function flattenTasks(groupedTasks) {
    // Optimized flattening with single loop and concat
    const flattened = [];

    const processValue = (value) => {
      if (Array.isArray(value)) {
        // Use push.apply for better performance than spread
        flattened.push(...value);
      } else if (value && typeof value === "object") {
        const values = Object.values(value);
        for (let i = 0; i < values.length; i++) {
          processValue(values[i]);
        }
      }
    };

    const rootValues = Object.values(groupedTasks);
    for (let i = 0; i < rootValues.length; i++) {
      processValue(rootValues[i]);
    }

    return flattened;
  }

  // Cache for task ID processing
  const taskIdCache = new Map();

  function getTaskId(taskDefinitionKey) {
    if (!taskDefinitionKey || typeof taskDefinitionKey !== "string") {
      return "";
    }

    // Check cache first
    if (taskIdCache.has(taskDefinitionKey)) {
      return taskIdCache.get(taskDefinitionKey);
    }

    try {
      const parts = taskDefinitionKey.split(".");
      const result = parts[parts.length - 1].replace(/_/g, " ");
      taskIdCache.set(taskDefinitionKey, result);
      return result;
    } catch (e) {
      console.warn("Error processing taskDefinitionKey:", taskDefinitionKey, e);
      taskIdCache.set(taskDefinitionKey, "");
      return "";
    }
  }

  // NEW: Helper function to get user's existing tasks with same taskDefinitionKey
  function getUserExistingTasksOfType(taskDefinitionKey) {
    return tasks.filter(
      (t) => t.taskDefinitionKey === taskDefinitionKey && t.assignee === userId
    );
  }

  // NEW: Task conflict modal functions
  function closeTaskConflictModal() {
    showTaskConflictModal = false;
    conflictModalData = {
      newTask: null,
      existingTasks: [],
      pendingClaim: null,
    };
  }

  async function handleUnclaimExistingTasks() {
    try {
      // Unclaim all existing tasks
      for (const existingTask of conflictModalData.existingTasks) {
        await handleClaimUnclaimTask(
          existingTask.processInstanceId,
          existingTask.taskDefinitionKey,
          false // unclaim
        );
      }

      // Now proceed with claiming the new task directly
      if (conflictModalData.pendingClaim) {
        const { processInstanceId, taskDefinitionKey, name } =
          conflictModalData.pendingClaim;

        // FIX #2: Clear checkbox BEFORE closing modal
        const taskId = getTaskId(taskDefinitionKey);

        // Remove from selectedInstances first
        const currentSelections = Array.from(selectedInstances);
        const filteredSelections = currentSelections.filter(
          (instance) =>
            !(
              instance.processInstanceId === processInstanceId &&
              instance.taskId === taskId
            )
        );
        selectedInstances = new Set(filteredSelections);
        
        console.log('🔄 Checkbox removed during switch for:', { processInstanceId, taskId });
        console.log('🔄 Remaining selections after switch:', Array.from(selectedInstances));

        // Close modal
        closeTaskConflictModal();

        // Claim the new task directly without going through toggleInstanceSelection
        const loadingKey = `${processInstanceId}-${taskDefinitionKey}`;
        claimLoadingStates[loadingKey] = true;
        claimLoadingStates = { ...claimLoadingStates };

        try {
          await handleClaimUnclaimTask(
            processInstanceId,
            taskDefinitionKey,
            true
          );

          // Update UI selection state after successful claim
          selectedInstances = new Set([
            ...Array.from(selectedInstances),
            { processInstanceId, taskId },
          ]);

          toast.success("Switched to new task successfully", 3000);
        } catch (error) {
          console.error("Error claiming new task:", error);
          toast.error("Failed to claim new task", 3000);
        } finally {
          delete claimLoadingStates[loadingKey];
          claimLoadingStates = { ...claimLoadingStates };
        }
      } else {
        closeTaskConflictModal();
        toast.success("Previous tasks unclaimed successfully", 3000);
      }
    } catch (error) {
      console.error("Error unclaiming existing tasks:", error);
      toast.error("Failed to unclaim existing tasks", 3000);
      closeTaskConflictModal();
    }
  }

  function cancelNewTaskClaim() {
    // FIXED: Remove checkbox state when cancelling
    if (conflictModalData.pendingClaim) {
      const { processInstanceId, taskDefinitionKey } =
        conflictModalData.pendingClaim;
      const taskId = getTaskId(taskDefinitionKey);

      // Remove from selectedInstances if it was temporarily selected
      const currentSelections = Array.from(selectedInstances);
      const filteredSelections = currentSelections.filter(
        (instance) =>
          !(
            instance.processInstanceId === processInstanceId &&
            instance.taskId === taskId
          )
      );
      selectedInstances = new Set(filteredSelections);
      
      console.log('🔄 Checkbox removed for:', { processInstanceId, taskId });
      console.log('🔄 Remaining selections:', Array.from(selectedInstances));
    }

    toast.info("Continued with current task", 2000);
    closeTaskConflictModal();
  }

  // FIX #1 & #3: Updated canUserClaimTask function
  function canUserClaimTask(task) {
    // ADDED: Validate task object
    if (!task || !task.processInstanceId || !task.taskDefinitionKey) {
      console.error("❌ Invalid task object passed to canUserClaimTask:", task);
      return {
        canClaim: false,
        reason: "Invalid task data",
        showInModal: false,
      };
    }

    // If task is already assigned to someone else, can't claim
    if (task.assignee && task.assignee !== userId) {
      return {
        canClaim: false,
        reason: `Already claimed by ${task.assignee}`,
        showInModal: false,
      };
    }

    // If task is already assigned to current user, can't claim again
    if (task.assignee === userId) {
      return {
        canClaim: false,
        reason: "Already claimed by you",
        showInModal: false,
      };
    }

    // Get all tasks currently claimed by this user
    const userClaimedTasks = tasks.filter((t) => t.assignee === userId);

    // If user has no claimed tasks, can claim any task
    if (userClaimedTasks.length === 0) {
      return {
        canClaim: true,
        reason: "No tasks currently claimed",
        showInModal: false,
      };
    }

    // Check if this task supports multi-claim
    const isMultiClaim = task.multiClaim || task.multiClaimEnabled || false;

    // Extract process definition key for comparison
    const getProcessDefKey = (taskDefKey) => {
      const parts = taskDefKey.split(".");
      return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : taskDefKey;
    };

    const currentProcessDefKey = getProcessDefKey(task.taskDefinitionKey);
    const currentTaskDefKey = task.taskDefinitionKey;

    // CRITICAL FIX: Check if user has tasks with SAME taskDefinitionKey in SAME processInstanceId
    const sameInstanceSameTask = userClaimedTasks.filter(
      (t) => 
        t.processInstanceId === task.processInstanceId && 
        t.taskDefinitionKey === currentTaskDefKey
    );

    if (sameInstanceSameTask.length > 0) {
      return {
        canClaim: false,
        reason: "Already claimed this specific task in this instance",
        showInModal: false,
      };
    }

    // Check if user has OTHER tasks in the SAME process instance (different taskDefinitionKey)
    const sameInstanceDifferentTask = userClaimedTasks.filter(
      (t) => 
        t.processInstanceId === task.processInstanceId && 
        t.taskDefinitionKey !== currentTaskDefKey
    );

    if (sameInstanceDifferentTask.length > 0) {
      // User has different task in same instance - allow without modal (parallel tasks scenario)
      return {
        canClaim: true,
        reason: "Parallel tasks in same instance - allowed",
        showInModal: false,
      };
    }

    // Check if any other user already has a task in this process instance
    const otherUserTasksInSameInstance = tasks.filter(
      (t) => 
        t.processInstanceId === task.processInstanceId && 
        t.assignee && 
        t.assignee !== userId
    );

    if (otherUserTasksInSameInstance.length > 0) {
      return {
        canClaim: false,
        reason: `This instance already has tasks claimed by ${otherUserTasksInSameInstance[0].assignee}`,
        showInModal: false,
      };
    }

    // Check if user has tasks with SAME taskDefinitionKey but DIFFERENT processInstanceId
    const sameTaskDifferentInstance = userClaimedTasks.filter(
      (t) => 
        t.taskDefinitionKey === currentTaskDefKey && 
        t.processInstanceId !== task.processInstanceId
    );

    if (sameTaskDifferentInstance.length > 0) {
      if (isMultiClaim) {
        return {
          canClaim: true,
          reason: "Multi-claim enabled - can claim multiple instances",
          showInModal: false,
        };
      } else {
        return {
          canClaim: false,
          reason: "You already have a task of this type in another instance",
          showInModal: false,
        };
      }
    }

    // Check if user has tasks in the same process (DIVISI.PROCESS level) but different task type
    const userTasksInSameProcess = userClaimedTasks.filter(
      (t) => 
        getProcessDefKey(t.taskDefinitionKey) === currentProcessDefKey &&
        t.taskDefinitionKey !== currentTaskDefKey
    );

    if (userTasksInSameProcess.length > 0) {
      // Different task type in same process - show modal for confirmation
      return {
        canClaim: true,
        reason: "Different task type in same process - confirmation required",
        showInModal: true,
        existingTasks: userTasksInSameProcess,
      };
    }

    // User has tasks in different process - show modal for confirmation
    const tasksInDifferentProcess = userClaimedTasks.filter(
      (t) => getProcessDefKey(t.taskDefinitionKey) !== currentProcessDefKey
    );

    if (tasksInDifferentProcess.length > 0) {
      return {
        canClaim: true, // Allow claim but show modal
        reason: "Task in different process - confirmation required",
        showInModal: true,
        existingTasks: tasksInDifferentProcess,
      };
    }

    return {
      canClaim: true,
      reason: "Available to claim",
      showInModal: false,
    };
  }

  function toggleCollapse(key) {
    collapsed[key] = !collapsed[key];
    collapsed = { ...collapsed };
  }

  function resetCheckbox() {
    selectedInstances.clear();
    selectedInstances = new Set(selectedInstances);
    groupSelectAllStates = {};
  }

  function handleSubmit() {
    if (selectedInstances.size === 0) {
      alert("Please select at least one instance to continue!");
      return;
    }

    // Get the selected tasks with full details
    const selectedTasks = Array.from(selectedInstances)
      .map(({ processInstanceId, taskId }) => {
        const task = tasks.find((t) => 
          t.processInstanceId === processInstanceId && 
          getTaskId(t.taskDefinitionKey) === taskId
        );
        return task;
      })
      .filter(task => task !== undefined);

    if (selectedTasks.length === 0) {
      alert("No tasks found matching the selected instances!");
      return;
    }

    // Take only the first selected task since we're simplifying
    const firstTask = selectedTasks[0];
    
    // Create simplified query parameters
    const processQuery = firstTask.taskDefinitionKey;
    const instanceQuery = firstTask.processInstanceId;

    // Log for debugging
    console.log('Selected Task:', firstTask);
    console.log('Process Query:', processQuery);
    console.log('Instance Query:', instanceQuery);

    goto(`/form?process=${processQuery}&instance=${instanceQuery}`);
  }

  async function handleClaimUnclaimTask(
    processInstanceId,
    taskDefinitionKey,
    claim
  ) {
    const loadingKey = `${processInstanceId}-${taskDefinitionKey}`;
    try {
      claimLoadingStates[loadingKey] = true;
      claimLoadingStates = { ...claimLoadingStates };

      const response = await axios.post(
        `${BACKEND_URL}api/task`,
        {
          instance: processInstanceId,
          taskDefinitionKey,
          userId,
          status: claim ? 1 : 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        `Task ${claim ? "claimed" : "unclaimed"} successfully:`,
        response.data
      );

      // Update local state immediately for instant UI feedback
      const updateSuccessful = updateTaskAssigneeStatus(
        processInstanceId,
        taskDefinitionKey,
        claim ? userId : null
      );

      // Show success notification for immediate feedback
      const taskName = getTaskId(taskDefinitionKey);
      const action = claim ? "claimed" : "unclaimed";
      toast.success(`Task "${taskName}" ${action} successfully`, 3000);

      // No need for setTimeout refresh - real-time updates handle this
    } catch (err) {
      console.error(`Error ${claim ? "claiming" : "unclaiming"} task:`, err);

      // Enhanced error handling for different claim scenarios
      const taskName = getTaskId(taskDefinitionKey);
      const action = claim ? "claim" : "unclaim";
      let errorMsg = err.response?.data?.error || err.message;

      // Handle specific multi-claim errors
      if (err.response?.status === 409 && err.response?.data?.existingTasks) {
        const existingTasks = err.response.data.existingTasks;
        const instanceList = existingTasks
          .map((t) => t.processInstanceId)
          .join(", ");
        errorMsg = `Cannot claim: This task type does not support multi-claim. You already have claimed task(s) in instance(s): ${instanceList}`;
      }

      toast.error(`Failed to ${action} task "${taskName}": ${errorMsg}`, 6000);

      // Revert checkbox state on error
      if (claim) {
        selectedInstances = new Set(
          Array.from(selectedInstances).filter(
            (instance) =>
              !(
                instance.processInstanceId === processInstanceId &&
                instance.taskId === getTaskId(taskDefinitionKey)
              )
          )
        );
      } else {
        selectedInstances.add({
          processInstanceId,
          taskId: getTaskId(taskDefinitionKey),
        });
      }
    } finally {
      delete claimLoadingStates[loadingKey];
      claimLoadingStates = { ...claimLoadingStates };
    }
  }

  // OPTIMIZED: Fast task assignee status update
  function updateTaskAssigneeStatus(
    processInstanceId,
    taskDefinitionKey,
    assignee
  ) {
    console.log(
      `⚡ Fast updating task: ${processInstanceId} - ${taskDefinitionKey} - ${assignee}`
    );

    let taskUpdated = false;
    let updatedCount = 0;

    // Optimized: Update in tasks array with early exit
    for (let i = 0; i < tasks.length; i++) {
      if (
        tasks[i].processInstanceId === processInstanceId &&
        tasks[i].taskDefinitionKey === taskDefinitionKey
      ) {
        tasks[i] = { ...tasks[i], assignee: assignee };
        taskUpdated = true;
        updatedCount++;
        console.log(`✅ Fast update in tasks array:`, {
          processInstanceId: tasks[i].processInstanceId,
          taskDefinitionKey: tasks[i].taskDefinitionKey,
          oldAssignee: tasks[i].assignee,
          newAssignee: assignee,
        });
        break; // Early exit for performance
      }
    }

    // Optimized: Update in groupedTasks with improved performance
    function updateNestedTasks(obj) {
      if (Array.isArray(obj)) {
        let found = false;
        const updated = obj.map((task) => {
          if (
            !found &&
            task.processInstanceId === processInstanceId &&
            task.taskDefinitionKey === taskDefinitionKey
          ) {
            found = true;
            updatedCount++;
            console.log(`✅ Fast update in grouped tasks:`, {
              processInstanceId: task.processInstanceId,
              taskDefinitionKey: task.taskDefinitionKey,
              oldAssignee: task.assignee,
              newAssignee: assignee,
            });
            return { ...task, assignee: assignee };
          }
          return task;
        });
        return updated;
      } else if (typeof obj === "object" && obj !== null) {
        const updated = {};
        Object.entries(obj).forEach(([key, value]) => {
          updated[key] = updateNestedTasks(value);
        });
        return updated;
      }
      return obj;
    }

    groupedTasks = updateNestedTasks(groupedTasks);

    // Optimized: Force Svelte reactivity with minimal operations
    groupedTasks = { ...groupedTasks };
    tasks = [...tasks]; // Trigger reactivity for tasks array

    // Fast filter re-application if active
    if (isFilterActive) {
      applyFilter();
      filteredGroupedTasks = { ...filteredGroupedTasks };
    }

    // Optimized selection state update
    if (assignee === null) {
      // Task unclaimed - remove from selection if selected
      const taskId = getTaskId(taskDefinitionKey);
      const currentSelections = Array.from(selectedInstances);
      const filteredSelections = currentSelections.filter(
        (instance) =>
          !(
            instance.processInstanceId === processInstanceId &&
            instance.taskId === taskId
          )
      );
      if (filteredSelections.length !== currentSelections.length) {
        selectedInstances = new Set(filteredSelections);
      }
    }

    console.log(
      `✅ Task update completed. Updated ${updatedCount} instances. Task found: ${taskUpdated}, Total tasks: ${tasks.length}`
    );

    if (!taskUpdated || updatedCount === 0) {
      console.warn(
        "⚠️ Task not found for real-time update, will use fallback refresh"
      );
      return false; // Indicate update failed
    }

    return true; // Indicate update successful
  }

  // OPTIMIZED: Fast toggleInstanceSelection with immediate UI feedback and conflict handling
  async function toggleInstanceSelection(
    processInstanceId,
    taskDefinitionKey,
    name
  ) {
    console.log(
      "⚡ Fast toggling instance:",
      processInstanceId,
      taskDefinitionKey,
      name
    );

    const taskId = getTaskId(taskDefinitionKey);
    const task = tasks.find(
      (t) =>
        t.processInstanceId === processInstanceId &&
        getTaskId(t.taskDefinitionKey) === taskId
    );

    if (!task) {
      console.warn("❌ Task not found:", processInstanceId, taskId);
      toast.error("Task not found", 2000);
      return;
    }

    // Quick check: if task is claimed by others, show immediate feedback
    if (isTaskClaimedByOthers(task)) {
      toast.warning(`Task is already claimed by ${task.assignee}`, 3000);
      return;
    }

    const shouldClaim = !isTaskClaimedByCurrentUser(task);
    console.log(
      `⚡ ${shouldClaim ? "Claiming" : "Unclaiming"} task immediately`
    );

    // If claiming, check for conflicts
    if (shouldClaim) {
      const claimValidation = canUserClaimTask(task);
      if (!claimValidation.canClaim && !claimValidation.showInModal) {
        // Show regular error message for tasks that cannot be claimed
        const taskName = getTaskId(taskDefinitionKey);
        toast.error(
          `Cannot claim task "${taskName}": ${claimValidation.reason}`,
          4000
        );
        return;
      } else if (claimValidation.showInModal) {
        // Show conflict modal for tasks that need confirmation
        conflictModalData = {
          newTask: task,
          existingTasks: claimValidation.existingTasks,
          pendingClaim: { processInstanceId, taskDefinitionKey, name },
        };
        
        // FIXED: Add to selectedInstances temporarily so checkbox appears checked during modal
        selectedInstances.add({
          processInstanceId,
          taskId: taskId
        });
        selectedInstances = new Set(selectedInstances); // Trigger reactivity
        
        showTaskConflictModal = true;
        return; // Exit and wait for user decision
      }
    }

    // Show loading state immediately
    const loadingKey = `${processInstanceId}-${taskDefinitionKey}`;
    claimLoadingStates[loadingKey] = true;
    claimLoadingStates = { ...claimLoadingStates };

    try {
      // Call optimized claim/unclaim API
      await handleClaimUnclaimTask(
        processInstanceId,
        taskDefinitionKey,
        shouldClaim
      );

      // Update UI selection state immediately after successful API call
      if (shouldClaim) {
        // Task was claimed - add to selection if not already selected
        const isCurrentlySelected = Array.from(selectedInstances).some(
          (instance) =>
            instance.processInstanceId === processInstanceId &&
            instance.taskId === taskId
        );

        if (!isCurrentlySelected) {
          // Check if task supports multi-claim
          const isMultiClaimEnabled = task.multiClaimEnabled || false;

          if (!isMultiClaimEnabled) {
            // Check for different task definition keys instead of names
            const currentTaskDefKey = taskDefinitionKey;
            const hasDifferentTaskTypeSelected = Array.from(
              selectedInstances
            ).some((instance) => {
              const selectedTask = tasks.find(
                (t) =>
                  t.processInstanceId === instance.processInstanceId &&
                  getTaskId(t.taskDefinitionKey) === instance.taskId
              );
              return (
                selectedTask &&
                selectedTask.taskDefinitionKey !== currentTaskDefKey
              );
            });

            if (hasDifferentTaskTypeSelected) {
              console.log(
                "Different task type selected and multi-claim disabled, clearing previous selections"
              );
              // Clear all previous selections and unclaim them
              const previousSelections = Array.from(selectedInstances);
              selectedInstances.clear();

              // Reset all group select states
              groupSelectAllStates = {};

              // Background unclaim for better UX (don't wait)
              for (const prevInstance of previousSelections) {
                const prevTask = tasks.find(
                  (t) => t.processInstanceId === prevInstance.processInstanceId
                );
                if (prevTask && isTaskClaimedByCurrentUser(prevTask)) {
                  // Non-blocking background unclaim
                  handleClaimUnclaimTask(
                    prevInstance.processInstanceId,
                    prevTask.taskDefinitionKey,
                    false
                  );
                }
              }
            }
          } else {
            console.log(
              "Multi-claim enabled for this task - allowing multiple selections"
            );
          }

          // Add current selection immediately
          selectedInstances = new Set([
            ...Array.from(selectedInstances),
            { processInstanceId, taskId },
          ]);
        }
      } else {
        // Task was unclaimed - remove from selection immediately
        const currentSelections = Array.from(selectedInstances);
        const filteredSelections = currentSelections.filter(
          (instance) =>
            !(
              instance.processInstanceId === processInstanceId &&
              instance.taskId === taskId
            )
        );
        selectedInstances = new Set(filteredSelections);
      }

      // Force reactivity and update group states
      selectedInstances = new Set(selectedInstances);
      updateGroupSelectAllState(taskDefinitionKey);

      console.log(
        "✅ Fast selection update completed:",
        Array.from(selectedInstances)
      );
    } catch (error) {
      console.error("❌ Error in toggle selection:", error);
      toast.error("Failed to update task", 3000);
    } finally {
      // Remove loading state
      delete claimLoadingStates[loadingKey];
      claimLoadingStates = { ...claimLoadingStates };
    }
  }

  // NEW: Function to handle group select all
  async function toggleGroupSelectAll(taskDefinitionKey, groupTasks) {
    console.log("Toggling group select all for:", taskDefinitionKey);

    const visibleTasks = groupTasks; // Semua task yang tampil di group ini
    if (visibleTasks.length === 0) {
      alert("No tasks in this group.");
      return;
    }

    const isGroupSelected = groupSelectAllStates[taskDefinitionKey];
    const taskId = getTaskId(taskDefinitionKey);

    if (isGroupSelected) {
      // Unselect all tasks in this group (hanya yang di-claim oleh user sendiri)
      for (const task of visibleTasks) {
        const isSelected = Array.from(selectedInstances).some(
          (instance) =>
            instance.processInstanceId === task.processInstanceId &&
            instance.taskId === taskId
        );
        if (isSelected && isTaskClaimedByCurrentUser(task)) {
          await handleClaimUnclaimTask(
            task.processInstanceId,
            task.taskDefinitionKey,
            false
          );
          selectedInstances = new Set(
            Array.from(selectedInstances).filter(
              (instance) =>
                !(
                  instance.processInstanceId === task.processInstanceId &&
                  instance.taskId === taskId
                )
            )
          );
        }
      }
      groupSelectAllStates[taskDefinitionKey] = false;
    } else {
      // Select all tasks in this group (claim semua yang bisa di-claim)
      for (const task of visibleTasks) {
        const isSelected = Array.from(selectedInstances).some(
          (instance) =>
            instance.processInstanceId === task.processInstanceId &&
            instance.taskId === taskId
        );
        if (!isSelected && !isTaskClaimedByOthers(task)) {
          await handleClaimUnclaimTask(
            task.processInstanceId,
            task.taskDefinitionKey,
            true
          );
          selectedInstances.add({
            processInstanceId: task.processInstanceId,
            taskId: taskId,
          });
        }
      }
      groupSelectAllStates[taskDefinitionKey] = true;
    }

    selectedInstances = new Set(selectedInstances);
    groupSelectAllStates = { ...groupSelectAllStates };

    console.log("Group select all completed:", groupSelectAllStates);
  }

  // NEW: Function to update group select all state
  function updateGroupSelectAllState(taskDefinitionKey) {
    const taskId = getTaskId(taskDefinitionKey);
    const groupTasks = getTasksForGroup(taskDefinitionKey);
    const availableTasks = groupTasks.filter(
      (task) => !isTaskClaimedByOthers(task)
    );

    if (availableTasks.length === 0) {
      groupSelectAllStates[taskDefinitionKey] = false;
      return;
    }

    const selectedTasksInGroup = availableTasks.filter((task) =>
      Array.from(selectedInstances).some(
        (instance) =>
          instance.processInstanceId === task.processInstanceId &&
          instance.taskId === taskId
      )
    );

    groupSelectAllStates[taskDefinitionKey] =
      selectedTasksInGroup.length === availableTasks.length;
    groupSelectAllStates = { ...groupSelectAllStates };
  }

  // NEW: Function to get tasks for a specific group
  function getTasksForGroup(taskDefinitionKey) {
    const currentData = isFilterActive ? filteredGroupedTasks : groupedTasks;
    const groupData = currentData[taskDefinitionKey];

    if (Array.isArray(groupData)) {
      return groupData;
    } else if (typeof groupData === "object" && groupData !== null) {
      // Handle nested structure
      let tasks = [];
      function collectTasks(value) {
        if (Array.isArray(value)) {
          tasks = [...tasks, ...value];
        } else if (typeof value === "object" && value !== null) {
          Object.values(value).forEach(collectTasks);
        }
      }
      collectTasks(groupData);
      return tasks;
    }

    return [];
  }

  // State untuk sorting
  let sortField = null;
  let sortDirection = "asc";

  // Fungsi untuk mengubah arah sort
  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }

    // Urutkan tasks
    sortTasks();
  }
  // Fungsi untuk mengurutkan tasks di dalam masing-masing process definition
  function sortTasks() {
    if (!sortField) return;

    const currentData = isFilterActive ? filteredGroupedTasks : groupedTasks;

    // Fungsi rekursif untuk mengurutkan tasks dalam struktur nested
    function sortNestedTasks(data) {
      if (Array.isArray(data)) {
        // Sort array of tasks
        return data.sort((a, b) => {
          // First, sort by priority (high priority items first)
          const aIsHighPriority = isHighPriority(a);
          const bIsHighPriority = isHighPriority(b);

          if (aIsHighPriority && !bIsHighPriority) return -1;
          if (!aIsHighPriority && bIsHighPriority) return 1;

          // If both have same priority level, sort by the selected field
          const aValue = (a[sortField] || "").toString().toLowerCase();
          const bValue = (b[sortField] || "").toString().toLowerCase();

          if (sortDirection === "asc") {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        });
      } else if (typeof data === "object" && data !== null) {
        // Recursively sort nested objects
        const sortedObj = {};
        Object.entries(data).forEach(([key, value]) => {
          sortedObj[key] = sortNestedTasks(value);
        });
        return sortedObj;
      }
      return data;
    }

    // Urutkan setiap process definition group
    Object.keys(currentData).forEach((key) => {
      currentData[key] = sortNestedTasks(currentData[key]);
    });

    // Memaksa Svelte untuk merender ulang
    groupedTasks = { ...groupedTasks };
    if (isFilterActive) {
      filteredGroupedTasks = { ...filteredGroupedTasks };
    }
  }

  // Filter functions
  function applyFilter() {
    console.log("Applying filter. isFilterActive:", isFilterActive);
    console.log("Filter values:", filterValues);

    if (!isFilterActive) {
      filteredGroupedTasks = groupedTasks;
      console.log("No filter active, showing all tasks");
      return;
    }

    filteredGroupedTasks = {};

    Object.entries(groupedTasks).forEach(([key, value]) => {
      const filteredValue = filterNestedTasks(value);
      if (filteredValue !== null) {
        filteredGroupedTasks[key] = filteredValue;
      }
    });

    const filteredTaskCount = countFilteredTasks(filteredGroupedTasks);
    console.log("Filtered tasks count:", filteredTaskCount);
    console.log("Filtered grouped tasks:", Object.keys(filteredGroupedTasks));

    if (filteredTaskCount === 0) {
      showNoDataPopup();
    }
  }

  function countFilteredTasks(groupedTasks) {
    let count = 0;

    function countNestedTasks(value) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === "object" && value !== null) {
        Object.values(value).forEach(countNestedTasks);
      }
    }

    Object.values(groupedTasks).forEach(countNestedTasks);
    return count;
  }

  function filterNestedTasks(value) {
    if (Array.isArray(value)) {
      const filtered = value.filter((task) => {
        return filterColumns.every((col) => {
          let val = "";
          try {
            if (col.key === "taskId") {
              val = getTaskId(task.taskDefinitionKey);
            } else if (col.key === "processInstanceId") {
              val = task.processInstanceId || "";
            } else {
              val = task[col.key] || "";
            }
            val = val.toString().toLowerCase().trim();
          } catch (e) {
            val = "";
          }

          const filterVal = (filterValues[col.key] || "")
            .toString()
            .toLowerCase()
            .trim();

          return !filterVal || val.includes(filterVal);
        });
      });
      return filtered.length > 0 ? filtered : null;
    } else if (typeof value === "object" && value !== null) {
      const filteredObject = {};
      let hasValidContent = false;

      Object.entries(value).forEach(([childKey, childValue]) => {
        const filteredChild = filterNestedTasks(childValue);
        if (filteredChild !== null) {
          filteredObject[childKey] = filteredChild;
          hasValidContent = true;
        }
      });

      return hasValidContent ? filteredObject : null;
    }
    return value;
  }

  function submitFilter() {
    const cleanedValues = {};
    Object.entries(tempFilterValues).forEach(([key, value]) => {
      if (value && typeof value === "string") {
        cleanedValues[key] = value.trim();
      } else if (value) {
        cleanedValues[key] = String(value).trim();
      }
    });

    filterValues = cleanedValues;
    isFilterActive = Object.values(filterValues).some(
      (val) => val && val.length > 0
    );

    // Save filter values to localStorage for caching
    try {
      localStorage.setItem("taskFilterValues", JSON.stringify(filterValues));
    } catch (e) {
      console.warn("Failed to save filter values to localStorage", e);
    }

    applyFilter();
    showFilter = false;

    if (showNoDataModal && Object.keys(filteredGroupedTasks).length > 0) {
      closeNoDataModal();
    }
  }

  function resetFilter() {
    tempFilterValues = {};
    filterValues = {};
    isFilterActive = false;
    applyFilter();
    showFilter = false;

    if (showNoDataModal && Object.keys(groupedTasks).length > 0) {
      closeNoDataModal();
    }
  }

  function cancelFilter() {
    tempFilterValues = { ...filterValues };
    showFilter = false;
  }

  // Apply filter when groupedTasks changes
  $: if (groupedTasks) applyFilter();

  function isTaskClaimedByCurrentUser(task) {
    return task.assignee === userId;
  }

  function isTaskClaimedByOthers(task) {
    return task.assignee && task.assignee !== userId;
  }

  function isTaskAvailable(task) {
    return !task.assignee;
  }

  // Update group select all states when data changes
  $: {
    if (
      typeof window !== "undefined" &&
      (groupedTasks || filteredGroupedTasks)
    ) {
      const currentData = isFilterActive ? filteredGroupedTasks : groupedTasks;
      Object.keys(currentData).forEach((taskDefKey) => {
        updateGroupSelectAllState(taskDefKey);
      });
    }
  }

  // Debugging reactive statement
  $: {
    if (typeof window !== "undefined") {
      console.log(
        "Reactive update - groupedTasks keys:",
        Object.keys(groupedTasks)
      );
      console.log("Reactive update - tasks count:", tasks.length);
      console.log("Reactive update - isFilterActive:", isFilterActive);
      console.log(
        "Reactive update - filteredGroupedTasks keys:",
        Object.keys(filteredGroupedTasks)
      );
    }
  }

  // Fungsi untuk mendeteksi apakah group ini layak diberi total (jika ada task dengan nama sama lebih dari 1 di seluruh data)
  function shouldShowTotalForGroup(taskId) {
    if (!taskId) return false;
    const normalized = taskId.trim().toLowerCase().replace(/_/g, " ");
    const allTasks = flattenTasks(
      isFilterActive ? filteredGroupedTasks : groupedTasks
    );
    const count = allTasks.filter(
      (t) =>
        getTaskId(t.taskDefinitionKey)
          .trim()
          .toLowerCase()
          .replace(/_/g, " ") === normalized
    ).length;
    // Tampilkan total hanya jika ada lebih dari 1 task dengan nama yang sama
    return count > 0;
  }
</script>

<div class="w-full px-4 md:px-0 pb-[160px]">
  {#if loading}
    <div
      class="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"
      ></div>

      {#if loadingStage}
        <p class="text-blue-600 text-lg font-semibold">{loadingStage}</p>
      {:else}
        <p class="text-blue-500 text-lg font-semibold">Loading tasks...</p>
      {/if}

      {#if totalGroups > 0}
        <div class="w-full max-w-xs mt-4">
          <div class="bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style="width: {(loadedGroups / totalGroups) * 100}%"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-2 text-center">
            Processing {loadedGroups}/{totalGroups} groups
          </p>
        </div>
      {/if}
    </div>
  {:else if error}
    <p class="text-red-500 text-lg font-semibold p-4">Error: {error}</p>
  {:else}
    <!-- Action buttons -->
    <div class="mb-4 flex flex-wrap gap-2">
      <button
        class="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded hover:bg-gray-600"
        on:click={resetCheckbox}
      >
        Reset
      </button>
      <button
        class="px-4 py-2 bg-myPrimary text-white text-sm font-semibold rounded hover:bg-blue-950"
        on:click={handleSubmit}
      >
        Process
      </button>
      <!-- Dynamic QR Scan Buttons based on user groups -->
      {#if showScanQRButton}
        <button
          class="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 flex items-center justify-center gap-2"
          on:click={handleScanQR}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          Scan QR
        </button>
      {/if}

      {#if showScanQRInternalButton}
        <button
          class="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 flex items-center justify-center gap-2"
          on:click={handleScanQRInternal}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          Scan QR Internal
        </button>
      {/if}

      <!-- Filter Button -->
      <button
        class="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 flex items-center gap-2"
        on:click={() => (showFilter = !showFilter)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 007 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        Filter
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto -mx-4 md:mx-0">
      <table
        class="w-full border border-gray-300 bg-white rounded-lg shadow-lg text-sm md:text-base"
      >
        <thead class="bg-myPrimary text-white">
          <tr>
            <th class="text-left px-3 py-2 font-medium text-white"
              >Task Definition</th
            >
            <th class="text-center w-16 px-2 py-2 font-medium text-white"
              >Action</th
            >
            <th class="text-left px-3 py-2 font-medium text-white">Status</th>
            <th
              class="text-left px-3 py-2 font-medium text-white cursor-pointer"
              on:click={() => toggleSort("businessKey1")}
            >
              <div class="flex items-center">
                Business Key 1
                {#if sortField === "businessKey1"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </div>
            </th>
            <th
              class="text-left px-3 py-2 font-medium text-white cursor-pointer"
              on:click={() => toggleSort("businessKey2")}
            >
              <div class="flex items-center">
                Business Key 2
                {#if sortField === "businessKey2"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </div>
            </th>
            <th
              class="text-left px-3 py-2 font-medium text-white cursor-pointer"
              on:click={() => toggleSort("businessKey3")}
            >
              <div class="flex items-center">
                Business Key 3
                {#if sortField === "businessKey3"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </div>
            </th>
            <th
              class="text-left px-3 py-2 font-medium text-white cursor-pointer"
              on:click={() => toggleSort("business_key")}
            >
              <div class="flex items-center">
                Additional
                {#if sortField === "business_key"}
                  <span class="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span
                  >
                {/if}
              </div>
            </th>
            <th class="text-center w-16 px-2 py-2 font-medium text-white"
              >Delegated</th
            >
          </tr>
        </thead>
        <tbody class="font-medium">
          {#each Object.entries(isFilterActive ? filteredGroupedTasks : groupedTasks) as [key, value]}
            {#each renderTree(key, value, 0) as row (row.id)}
              <tr
                class="border-b border-gray-200 {isHighPriority(row)
                  ? 'bg-red-100'
                  : ''} {!row.isGroup && isTaskClaimedByOthers(row)
                  ? 'bg-gray-100'
                  : ''}"
              >
                <td
                  class="px-3 py-2 text-xs md:text-sm text-gray-700 cursor-pointer flex items-center"
                  style="margin-left: {row.indent * 1}rem;"
                  on:click={() => toggleCollapse(row.taskDefinitionKey)}
                >
                  {#if row.isGroup}
                    <p class="mr-2 text-black font-bold text-xs">
                      {collapsed[row.taskDefinitionKey] ? "⇩" : "⇧"}
                    </p>
                    <span class="truncate"
                      >{row.taskId}
                      {#if row.isGroup && row.taskId && shouldShowTotalForGroup(row.taskId)}
                        <span class="ml-1 text-xs text-blue-600 font-bold">
                          ({flattenTasks(
                            isFilterActive ? filteredGroupedTasks : groupedTasks
                          ).filter(
                            (t) =>
                              getTaskId(t.taskDefinitionKey)
                                .trim()
                                .toLowerCase()
                                .replace(/_/g, " ") ===
                              row.taskId.trim().toLowerCase().replace(/_/g, " ")
                          ).length})
                        </span>
                      {/if}
                    </span>
                    {#if countHighPriorityTasks((isFilterActive ? filteredGroupedTasks : groupedTasks)[row.taskDefinitionKey]) > 0}
                      <span
                        class="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full"
                      >
                        {countHighPriorityTasks(
                          (isFilterActive
                            ? filteredGroupedTasks
                            : groupedTasks)[row.taskDefinitionKey]
                        )} instant
                      </span>
                    {/if}
                  {/if}
                </td>
                <td class="px-2 py-2 text-center">
                  {#if row.isGroup && row.hasSelectAll}
                    <!-- Select All Checkbox for Groups -->
                    <div class="flex items-center justify-center">
                      <!-- <input
                        type="checkbox"
                        class="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                        checked={groupSelectAllStates[row.taskDefinitionKey] || false}
                        on:change={() =>
                          toggleGroupSelectAll(
                            row.taskDefinitionKey,
                            row.groupTasks
                          )}
                        title="Select/Unselect all tasks in this group"
                      />
                      <span class="ml-1 text-xs text-gray-600 hidden sm:inline">
                        All
                      </span> -->
                    </div>
                  {:else if !row.isGroup && row.processInstanceId}
                    <!-- Individual Task Checkbox -->
                    {#if claimLoadingStates[`${row.processInstanceId}-${row.taskDefinitionKey}`]}
                      <div
                        class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-myPrimary"
                      ></div>
                    {:else if isTaskClaimedByOthers(row)}
                      <input
                        type="checkbox"
                        class="w-4 h-4 opacity-50 cursor-not-allowed"
                        disabled
                        checked={false}
                      />
                    {:else if !canUserClaimTask(row).canClaim && !canUserClaimTask(row).showInModal && !isTaskClaimedByCurrentUser(row)}
                      <!-- Task cannot be claimed and no modal option -->
                      <input
                        type="checkbox"
                        class="w-4 h-4 opacity-50 cursor-not-allowed"
                        disabled
                        checked={false}
                        title={canUserClaimTask(row).reason}
                      />
                    {:else}
                      <!-- Task can be claimed, needs modal confirmation, or already claimed by current user -->
                      <input
                        type="checkbox"
                        class="w-4 h-4"
                        checked={Array.from(selectedInstances).some(
                          (instance) =>
                            instance.processInstanceId ===
                              row.processInstanceId &&
                            instance.taskId === row.taskId
                        )}
                        on:change={() =>
                          toggleInstanceSelection(
                            row.processInstanceId,
                            row.taskDefinitionKey,
                            row.name
                          )}
                      />
                    {/if}
                  {/if}
                </td>
                <td class="px-2 py-2 text-xs md:text-sm text-center">
  {#if !row.isGroup && row.processInstanceId}
    <div class="flex flex-col items-center justify-center gap-1">
      {#if isTaskClaimedByCurrentUser(row)}
        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Claimed by You
        </span>
      {:else if isTaskClaimedByOthers(row)}
        <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          Claimed by {row.assignee}
        </span>
      {:else}
        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Available
        </span>
      {/if}
    </div>
  {/if}
</td>

                <td
                  class="px-2 py-2 text-xs md:text-sm text-gray-700 text-wrap max-w-[150px]"
                >
                  {row.businessKey1}
                </td>
                <td
                  class="px-3 py-2 text-xs md:text-sm text-gray-700 text-wrap max-w-[150px]"
                >
                  {row.businessKey2}
                </td>
                <td
                  class="px-3 py-2 text-xs md:text-sm text-gray-700 text-wrap max-w-[150px]"
                >
                  {row.businessKey3}
                </td>
                <td
                    class="px-3 py-2 text-xs md:text-sm text-gray-700 max-w-[250px] business-key-content"
                  >
                    {#if row.business_key}
                      {#if row.business_key.includes(":")}
                        {#each row.business_key.split(":") as line}
                          <div>{line}</div>
                        {/each}
                      {:else}
                        <div>{row.business_key}</div>
                      {/if}
                    {/if}
                </td>
                <td
                  class="px-3 py-2 text-xs md:text-sm text-gray-700 text-wrap break-words max-w-[250px] delegated-content"
                >
                  {#if row.isGroup}
                    <div>{row.delegated}</div>
                  {:else}
                    <!-- Kosong untuk task individual -->
                  {/if}
                </td>
              </tr>
            {/each}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Task Conflict Modal -->
{#if showTaskConflictModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    style="z-index: 20;"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl relative"
      style="z-index: 21;"
    >
      <div class="text-center">
        <svg
          class="mx-auto mb-4 w-12 h-12 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
          ></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Task Conflict Detected
        </h3>
        {#if conflictModalData.newTask && conflictModalData.existingTasks.length > 0}
          {@const getProcessDefKey = (taskDefKey) => {
            const parts = taskDefKey.split(".");
            return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : taskDefKey;
          }}
          {@const newTaskProcess = getProcessDefKey(
            conflictModalData.newTask.taskDefinitionKey
          )}
          {@const existingTaskProcess = getProcessDefKey(
            conflictModalData.existingTasks[0].taskDefinitionKey
          )}
          {@const isSameProcess = newTaskProcess === existingTaskProcess}

          {#if isSameProcess}
            <p class="text-sm text-gray-600 mb-4">
              You already have claimed task(s) in the same process. Only one
              task per process is allowed for non-multi-claim tasks.
            </p>
          {:else}
            <p class="text-sm text-gray-600 mb-4">
              You already have claimed task(s) in a different process. Do you
              want to switch to this new task?
            </p>
          {/if}
        {:else}
          <p class="text-sm text-gray-600 mb-4">
            You already have claimed task(s). Do you want to switch to this new
            task?
          </p>
        {/if}

        <!-- Current task info -->
        {#if conflictModalData.newTask}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p class="text-sm font-medium text-blue-800 mb-1">
              New Task to Claim:
            </p>
            <p class="text-sm text-blue-700">
              {getTaskId(conflictModalData.newTask.taskDefinitionKey)}
            </p>
            <p class="text-xs text-blue-600">
              Instance: {conflictModalData.newTask.processInstanceId}
            </p>
          </div>
        {/if}

        <!-- Existing tasks info -->
        {#if conflictModalData.existingTasks.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p class="text-sm font-medium text-red-800 mb-2">
              Currently Claimed Tasks:
            </p>
            {#each conflictModalData.existingTasks as existingTask}
              <div class="text-sm text-red-700 mb-1">
                • {getTaskId(existingTask.taskDefinitionKey)}
                <span class="text-xs text-red-600 block ml-2"
                  >Instance: {existingTask.processInstanceId}</span
                >
              </div>
            {/each}
          </div>
        {/if}

        <p class="text-sm text-gray-600 mb-6">
          Choose your action: unclaim current task(s) and claim the new one, or
          continue with your current task(s).
        </p>

        <div class="flex gap-3 justify-center">
          <button
            class="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
            on:click={handleUnclaimExistingTasks}
          >
            Switch to New Task
          </button>
          <button
            class="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded hover:bg-gray-600 transition-colors"
            on:click={cancelNewTaskClaim}
          >
            Continue Current Task
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Scan Conflict Modal: shown when user tries to scan but has claimed tasks -->
{#if showScanConflictModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    style="z-index: 20;"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl relative"
      style="z-index: 21;"
    >
      <div class="text-center">
        <h3 class="text-lg font-bold mb-2 text-gray-900">You have active claimed task(s)</h3>
        <p class="text-sm text-gray-700 mb-4">You currently have <strong>{scanConflictTasks.length}</strong> claimed task(s). You can continue working on them, or unclaim them and switch to the scanner.</p>

        <div class="mb-4 max-h-40 overflow-auto text-left text-sm text-gray-700 border rounded p-2">
          <ul>
            {#each scanConflictTasks as t (t.processInstanceId + '::' + t.taskDefinitionKey)}
              <li class="py-1 border-b last:border-b-0">
                <strong>{getTaskId(t.taskDefinitionKey)}</strong>
                <div class="text-xs text-gray-500">Instance: {t.processInstanceId} · Assignee: {t.assignee}</div>
              </li>
            {/each}
          </ul>
        </div>

        <div class="flex gap-2 justify-end">
          <button
            class="px-4 py-2 rounded bg-gray-200 text-gray-800"
            on:click={() => { showScanConflictModal = false; scanConflictTasks = []; scanTargetRoute = ''; }}
          >
            Continue current tasks
          </button>
          <button
            class="px-4 py-2 rounded bg-blue-600 text-white"
            on:click={performUnclaimAndNavigate}
            disabled={scanUnclaimLoading}
          >
            {#if scanUnclaimLoading}
              Switching...
            {:else}
              Unclaim & Switch to Scanner
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Filter Modal -->
{#if showFilter}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    style="z-index: 50;"
    role="dialog"
    aria-modal="true"
    aria-label="Filter Tasks Modal"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl relative"
      style="z-index: 51;"
      role="document"
    >
      <!-- Close Button -->
      <button
        type="button"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Close filter modal"
        on:click={() => (showFilter = false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h3 class="text-lg font-bold mb-4 text-gray-900">Filter Tasks</h3>
      
      <div class="space-y-4">
        {#each filterColumns as col, i}
          <div>
            <label
              class="block text-sm font-semibold mb-2 text-gray-700"
              for="filter-{col.key}">{col.label}</label
            >
            {#if col.key === "taskId"}
              <!-- For taskId, show a select dropdown with all unique taskIds -->
              <select
                id="filter-{col.key}"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                bind:value={tempFilterValues[col.key]}
              >
                <option value="">All Task Definitions</option>
                {#each uniqueTaskIds as taskId}
                  <option value={taskId}>{taskId}</option>
                {/each}
              </select>
            {:else}
              <input
                id="filter-{col.key}"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="text"
                bind:value={tempFilterValues[col.key]}
                placeholder="Filter by {col.label}"
              />
            {/if}
          </div>
        {/each}
      </div>

      {#if isFilterActive}
        <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
          Filter active
        </div>
      {/if}

      <div class="flex gap-2 mt-6">
        <button
          type="button"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition-colors"
          on:click={submitFilter}
        >
          Apply Filter
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400 transition-colors"
          on:click={resetFilter}
        >
          Reset
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-red-400 text-white rounded font-semibold hover:bg-red-500 transition-colors"
          on:click={cancelFilter}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- No Data Modal -->
{#if showNoDataModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    style="z-index: 9;"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-2xl relative"
      style="z-index: 10;"
    >
      <div class="text-center">
        <svg
          class="mx-auto mb-4 w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 5"
          ></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Data Tidak Ditemukan
        </h3>
        <p class="text-sm text-gray-600 mb-4">
          {#if isFilterActive}
            Tidak ada task yang sesuai dengan filter yang diterapkan.
          {:else}
            Tidak ada task yang tersedia untuk grup Anda saat ini.
          {/if}
        </p>
        <div class="flex gap-2 justify-center">
          <button
            class="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            on:click={closeNoDataModal}
          >
            OK
          </button>
          {#if isFilterActive}
            <button
              class="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              on:click={() => {
                resetFilter();
                closeNoDataModal();
              }}
            >
              Clear Filters
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notifications -->
<!-- {#each $toasts as toastItem (toastItem.id)}
  <Toast 
    message={toastItem.message} 
    type={toastItem.type}
    duration={toastItem.duration}
    on:close={() => toasts.update(list => list.filter(t => t.id !== toastItem.id))}
  />
{/each} -->

<style>
  /* Ensure business_key content always wraps to next line and long content wraps down */
  .business-key-content {
    display: block;
    white-space: pre-line;
    word-break: break-word;
    overflow-wrap: anywhere;
    text-wrap: wrap;
    min-width: 120px;
    max-width: 350px;
  }
  .overflow-x-auto {
    overflow-x: auto;
    white-space: nowrap;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }

  th,
  td {
    white-space: nowrap;
  }

  .w-full {
    overflow: hidden;
    position: relative;
  }
</style>
