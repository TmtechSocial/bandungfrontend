<script>
  const camundaUrl = import.meta.env.VITE_CAMUNDA_API_URL;
  import axios from "axios";
  import { onMount } from "svelte";

  export let data;
  const sessionData = data.sessionData;
  const token = sessionData.token;

  let tasks = [];
  let rejectedTasks = [];
  let groupedTasks = {};
  let loading = true;
  let error = null;
  let collapsed = {};

  async function fetchAllTasks() {
    try {
      // Fetch active tasks
      const activeTasks = await fetchActiveTasks();
      
      // Fetch rejected history
      const rejectedHistory = await fetchRejectedHistory();
      
      // Process active tasks
      const processedActiveTasks = await Promise.all(
        activeTasks.map(async (task) => {
          const processInstance = task.taskDefinitionKey ? task : await fetchTaskDetails(task.id);
          
          if (processInstance) {
            const variables = await Promise.all([
              fetchVariable(task.id, "goals"),
              fetchVariable(task.id, "initiator_name"),
              fetchVariable(task.id, "request_category"),
              fetchVariable(task.id, "ticket"),
              fetchVariable(task.id, "unit")
            ]);

            return {
              ...task,
              businessKey: processInstance.businessKey,
              goals: variables[0],
              initiator_name: sessionData.user.fullName,
              request_category: variables[2],
              ticket: variables[3],
              unit: variables[4],
              taskDefinitionKey: processInstance.taskDefinitionKey,
              status: 'Active'
            };
          }
          return task;
        })
      );

      // Process rejected tasks
      const processedRejectedTasks = await Promise.all(
        rejectedHistory.map(async (task) => {
          const historyDetails = await fetchHistoryTaskDetails(task.id);
          
          console.log("historyDetails", historyDetails);
          if (historyDetails) {
            const variables = await Promise.all([
              fetchHistoryVariable(task.id, "goals"),
              fetchHistoryVariable(task.id, "initiator_name"),
              fetchHistoryVariable(task.id, "request_category"),
              fetchHistoryVariable(task.id, "ticket"),
              fetchHistoryVariable(task.id, "unit"),
              fetchHistoryVariable(task.id, "reason")
            ]);

            return {
              ...task,
              businessKey: historyDetails.businessKey,
              goals: variables[0],
              initiator_name: sessionData.user.fullName,
              request_category: variables[2],
              ticket: variables[3],
              unit: variables[4],
              taskDefinitionKey: historyDetails.taskDefinitionKey,
              reason: variables[5] || "No reason provided",
              status: 'Rejected'
            };
          }
          return task;
        })
      );

      // Combine all tasks
      tasks = [...processedActiveTasks, ...processedRejectedTasks];
      groupedTasks = groupTasksByKey(tasks);
    } catch (err) {
      error = err.message;
      console.error("Error fetching tasks:", err);
    } finally {
      loading = false;
    }
  }

  async function fetchActiveTasks() {
    const response = await axios.get(
      `${camundaUrl}process-instance?variables=initiator_eq_${sessionData.user.username}`
    );
    return response.data;
  }

  async function fetchRejectedHistory() {
    const response = await axios.get(
      `${camundaUrl}history/process-instance?finished=true&variables=initiator_eq_${sessionData.user.username},validate_eq_rejected&sortBy=startTime&sortOrder=desc`
    );
    return response.data;
  }

  async function fetchTaskDetails(processInstanceId) {
    try {
      const response = await axios.get(`${camundaUrl}task?processInstanceId=${processInstanceId}`);
      return response.data[0];
    } catch (err) {
      console.error(`Error fetching task details for ${processInstanceId}:`, err);
      return null;
    }
  }

  async function fetchHistoryTaskDetails(processInstanceId) {
    try {
      const response = await axios.get(`${camundaUrl}history/task?processInstanceId=${processInstanceId}`);
      return response.data[0];
    } catch (err) {
      console.error(`Error fetching history task details for ${processInstanceId}:`, err);
      return null;
    }
  }

  async function fetchVariable(processInstanceId, variableName) {
    try {
      const response = await axios.get(
        `${camundaUrl}process-instance/${processInstanceId}/variables/${variableName}`
      );
      return response.data.value;
    } catch (err) {
      console.error(
        `Error fetching variable ${variableName} for processInstanceId ${processInstanceId}:`,
        err
      );
      return null;
    }
  }

  async function fetchHistoryVariable(processInstanceId, variableName) {
    try {
      const response = await axios.get(
        `${camundaUrl}history/variable-instance?processInstanceId=${processInstanceId}&variableName=${variableName}`
      );
      return response.data[0]?.value || null;
    } catch (err) {
      console.error(
        `Error fetching history variable ${variableName} for processInstanceId ${processInstanceId}:`,
        err
      );
      return null;
    }
  }

  function getTaskId(taskDefinitionKey) {
    const parts = taskDefinitionKey.split(".");
    return parts[parts.length - 1].replace(/_/g, " ");
  }

  function groupTasksByKey(tasks) {
    const grouped = {};
    tasks.forEach((task) => {
      if (!task.taskDefinitionKey) return;
      
      const levels = task.taskDefinitionKey.split(".");
      let current = grouped;
      
      levels.forEach((level, index) => {
        if (index === levels.length - 1) {
          if (!current[level]) current[level] = [];
          if (!current[level].find(t => t.id === task.id)) {
            current[level].push(task);
          }
        } else {
          if (!current[level]) current[level] = {};
          current = current[level];
        }
      });
    });
    return groupLayer2(grouped);
  }

  function groupLayer2(grouped) {
    for (const key in grouped) {
      if (typeof grouped[key] === "object" && !Array.isArray(grouped[key])) {
        grouped[key] = groupLayer2(grouped[key]);
      } else if (Array.isArray(grouped[key])) {
        const groupedByName = {};
        grouped[key].forEach((task) => {
          const taskName = task.name || "Unnamed Task";
          if (!groupedByName[taskName]) groupedByName[taskName] = [];
          if (!groupedByName[taskName].find(t => t.id === task.id)) {
            groupedByName[taskName].push(task);
          }
        });
        grouped[key] = groupedByName;
      }
    }
    return grouped;
  }

  function toggleCollapse(key) {
    collapsed[key] = !collapsed[key];
    collapsed = collapsed;
  }

  function renderTree(key, value, level) {
    const rows = [];
    const gap = level + 1;
    const indent = gap + 1;
    
    if (Array.isArray(value)) {
      value.forEach((task) => {
        const [businessKey1 = "", businessKey2 = "", businessKey3 = ""] =
          (task.businessKey?.split(":") || []).map(key => key.trim());

        // Only include tasks that have business keys or details
        if (businessKey1 || businessKey2 || businessKey3 || task.unit || task.request_category || task.ticket || task.goals) {
          rows.push({
            id: task.id,
            taskDefinitionKey: key,
            taskId: getTaskId(task.taskDefinitionKey),
            processInstanceId: task.processInstanceId,
            goals: task.status === "Rejected" ? task.reason : task.goals,
            request_category: task.request_category,
            ticket: task.ticket,
            unit: task.unit,
            name: task.name,
            assignee: task.assignee,
            created: task.created || task.startTime,
            status: task.status,
            indent,
            businessKey1,
            businessKey2,
            businessKey3,
            initiator: task.initiator_name,
            isDetailRow: true // Flag to indicate this is a detail row
          });
        }
      });
    } else if (typeof value === "object") {
      rows.push({
        id: key,
        taskDefinitionKey: key,
        taskId: getTaskId(key),
        processInstanceId: "",
        goals: "",
        request_category: "",
        ticket: "",
        unit: "",
        name: "",
        assignee: "",
        created: "",
        status: "",
        indent,
        isGroup: true,
        isDetailRow: false // Flag to indicate this is not a detail row
      });
      
      if (!collapsed[key]) {
        Object.entries(value).forEach(([childKey, childValue]) => {
          rows.push(...renderTree(childKey, childValue, level + 1));
        });
      }
    }
    return rows;
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  onMount(() => {
    fetchAllTasks();
  });
</script>

<div class="overflow-x-auto">
  {#if loading}
    <p class="text-blue-500 text-lg font-semibold">Loading tasks...</p>
  {:else if error}
    <p class="text-red-500 text-lg font-semibold">Error: {error}</p>
  {:else}
    <table class="w-full border border-gray-300 bg-white rounded-lg shadow-lg">
      <thead class="bg-myPrimary text-white">
        <tr>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Task Definition</th>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Initiator</th>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Business key 1</th>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Business key 2</th>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Business key 3</th>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Status</th>
          <th class="text-center px-4 py-2 border-b font-medium text-white">Created</th>
        </tr>
      </thead>
      <tbody class="font-medium">
        {#each Object.entries(groupedTasks) as [key, value]}
          {#each renderTree(key, value, 0) as row (row.id)}
            <tr class="{row.status === 'Rejected' ? 'bg-red-50' : ''}">
              <td
                class="px-4 py-2 border-b text-sm text-gray-700 cursor-pointer flex items-center"
                style="margin-left: {row.indent}rem;"
                on:click={() => toggleCollapse(row.taskDefinitionKey)}
              >
                {#if row.isGroup}
                  <p class="mr-2 text-black font-bold">
                    {collapsed[row.taskDefinitionKey] ? "⇩" : "⇧"}
                  </p>
                  <span>{row.taskId}</span>
                {:else}
                  <span>{row.goals}</span>
                {/if}
              </td>
              <td class="py-2 px-3 border-b text-sm text-center text-gray-700">
                {row.initiator || ''}
              </td>
              <td class="py-2 px-3 border-b text-sm text-center text-gray-700">
                {row.businessKey1 || row.unit || ''}
              </td>
              <td class="py-2 px-3 border-b text-sm text-center text-gray-700">
                {row.businessKey2 || row.request_category || ''}
              </td>
              <td class="py-2 px-3 border-b text-sm text-center text-gray-700">
                {row.businessKey3 || row.ticket || ''}
              </td>
              <td class="py-2 px-3 border-b text-sm text-center text-gray-700">
                {#if row.isDetailRow}
                  <span class="{row.status === 'Rejected' ? 'text-red-600' : 'text-green-600'} font-medium">
                    {row.status || 'Active'}
                  </span>
                {/if}
              </td>
              <td class="py-2 px-3 border-b text-sm text-center text-gray-700">
                {row.isDetailRow ? formatDate(row.created) : ''}
              </td>
            </tr>
          {/each}
        {/each}
      </tbody>
    </table>
  {/if}
</div>