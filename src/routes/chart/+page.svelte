<!-- App.svelte -->
<script>
  import { onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  const apiUrl = import.meta.env.VITE_API_URL;

  // State Management
  let tasks = [];
  let categories = ["Development", "Incident", "Request Data", "Other"];
  let priorities = ["Low", "Medium", "High", "Critical"];
  let showModal = false;
  let selectedTask = null;

  // Set specific date range
  let startDate = new Date();
  let endDate = new Date();

  // New Task Template
  let newTask = {
    id: "",
    name: "",
    description: "",
    start: "",
    end: "",
    category: "Development",
    priority: "Medium",
    status: "Backlog", // Backlog, In Progress, Finished, Blocked
  };

  let sidebar;
  let ganttChart;
  let sidebarRight;

  // Load tasks from API
  onMount(async () => {
    try {
      const response = await fetch(`${apiUrl}api/chart?group=Consultant`);
      const data = await response.json();

      console.log("data", data);

      // Transform data from API to match the app's structure
      tasks = data.map((item) => ({
        id: item.proc_inst_id,
        issue: item.case,
        name: item.goals,
        channel: item.channel,
        description: "",
        start: item.submission_date ? item.submission_date.split(" ")[0] : null, // Extract date part
        end: item.target_date ? item.target_date.split("T")[0] : null, // Extract date part
        category: item.request_category,
        priority: "0", // Convert score to string for priority
        status: item.status_submission, // Default status
      }));

      // Filter out tasks with invalid dates
      tasks = tasks.filter((task) => task.start && task.end);

      // Sort tasks by priority (score) in descending order
      tasks.sort((a, b) => b.priority - a.priority);

      // Hitung startDate dan endDate berdasarkan task yang ada
      if (tasks.length > 0) {
        // Cari tanggal mulai yang paling lama
        const minStartDate = tasks.reduce((min, task) => {
          const taskStart = new Date(task.start);
          return taskStart < min ? taskStart : min;
        }, new Date(tasks[0].start));

        // Cari tanggal selesai yang paling baru
        const maxEndDate = tasks.reduce((max, task) => {
          const taskEnd = new Date(task.end);
          return taskEnd > max ? taskEnd : max;
        }, new Date(tasks[0].end));

        // Set startDate dan endDate
        startDate = minStartDate;
        endDate = maxEndDate;
      }

      sidebar = document.querySelector(".task-sidebar");
      ganttChart = document.querySelector(".gantt-chart");
      sidebarRight = document.querySelector(".sidebar-right");

      // Sinkronkan scroll vertikal
      sidebar.addEventListener("scroll", () => {
        ganttChart.scrollTop = sidebar.scrollTop;
      });

      ganttChart.addEventListener("scroll", () => {
        sidebar.scrollTop = ganttChart.scrollTop;
      });

      sidebarRight.addEventListener("scroll", () => {
      ganttChart.scrollTop = sidebarRight.scrollTop;
      sidebar.scrollTop = sidebarRight.scrollTop;
    });

      // Generate dates based on the new startDate and endDate
      dates = getDates(startDate, endDate);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  });

  // Date Utilities
  function getDates(start, end) {
    const dates = [];
    let current = new Date(start);
    const endTime = new Date(end);

    while (current <= endTime) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function isToday(date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function updateDateRange() {
    if (tasks.length > 0) {
      // Cari tanggal mulai yang paling lama
      const minStartDate = tasks.reduce((min, task) => {
        const taskStart = new Date(task.start);
        return taskStart < min ? taskStart : min;
      }, new Date(tasks[0].start));

      // Cari tanggal selesai yang paling baru
      const maxEndDate = tasks.reduce((max, task) => {
        const taskEnd = new Date(task.end);
        return taskEnd > max ? taskEnd : max;
      }, new Date(tasks[0].end));

      // Set startDate dan endDate
      startDate = minStartDate;
      endDate = maxEndDate;

      // Generate dates based on the new startDate and endDate
      dates = getDates(startDate, endDate);
    }
  }

  let dates = getDates(startDate, endDate);

  // Task Styling and Positioning
  function getTaskStyle(task) {
    const start = new Date(task.start);
    const end = new Date(task.end);
    console.log("endDate", endDate);
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const leftPos = (start - startDate) / (1000 * 60 * 60 * 24);
    const width = (end - start) / (1000 * 60 * 60 * 24);

    return `
    left: ${(leftPos / totalDays) * 100}%;
    width: ${(width / totalDays) * 100}%;
  `;
  }

  function getStatusColor(status) {
    const colors = {
      Backlog: "#e2e8f0", // Warna default (abu-abu)
      "Assigned to PIC": "#fbd8b9", // Kuning cerah
      "Worker Finished": "#FBF3B9", // Kuning cerah
      Finished: "#AEEA94", // Hijau cerah
      "Task Completed": "#AEEA94", // Hijau cerah
      Rejected: "#FDAB9E", // Merah cerah
    };
    return colors[status] || colors["Backlog"]; // Default ke abu-abu jika status tidak ditemukan
  }

  function getPriorityColor(category) {
    const colors = {
      Others: "#a4a9b0", // Hijau
      "Request Data": "#F59E0B", // Biru Muda
      Development: "#8B5CF6", // Ungu
      Incident: "#EF4444", // Merah
    };
    return colors[category] || "#a4a9b0"; // Default ke abu-abu jika kategori tidak ditemukan
  }

  // Form Validation
  function validateDates(start, end) {
    const startDateTime = new Date(start);
    const endDateTime = new Date(end);

    if (startDateTime < startDate || endDateTime > endDate) {
      alert("Task dates must be within the project timeline");
      return false;
    }

    if (startDateTime > endDateTime) {
      alert("Start date must be before end date");
      return false;
    }

    return true;
  }

  // CRUD Operations
  function addTask() {
    if (!newTask.name || !newTask.start || !newTask.end) {
      alert("Please fill in all required fields");
      return;
    }

    if (!validateDates(newTask.start, newTask.end)) {
      return;
    }

    const task = {
      ...newTask,
      id: uuidv4(),
      created: new Date().toISOString(),
    };

    tasks = [...tasks, task];
    resetNewTask();
    updateDateRange(); // Perbarui date range
  }

  function resetNewTask() {
    newTask = {
      id: "",
      name: "",
      description: "",
      start: "",
      end: "",
      category: "Development",
      priority: "Medium",
      status: "Backlog",
    };
  }

  function deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter((t) => t.id !== taskId); // Hapus task dari array
      tasks = [...tasks]; // Pastikan state diupdate
      updateDateRange(); // Perbarui date range
      closeModal(); // Tutup modal setelah menghapus
    }
  }

  // New update task function
  async function updateTask() {
    if (!selectedTask.name || !selectedTask.start || !selectedTask.end) {
      alert("Please fill in all required fields");
      return;
    }

    if (!validateDates(selectedTask.start, selectedTask.end)) {
      return;
    }

    try {
      // Kirim data ke endpoint
      const response = await fetch(`${apiUrl}chartSubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedTask.id,
          start: selectedTask.start,
          end: selectedTask.end,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      console.log("response", response);

      // Update task di lokal
      const index = tasks.findIndex((t) => t.id === selectedTask.id);
      if (index !== -1) {
        tasks[index] = { ...selectedTask };
        tasks = [...tasks];
      }

      console.log("Task updated successfully");
      updateDateRange(); // Perbarui date range
      closeModal();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }
  }

  function openModal(task) {
    selectedTask = { ...task };
    console.log("selectedTask", selectedTask);
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    selectedTask = null;
  }

  // Drag and Drop
  let draggedTask = null;
  let dragStartX = 0;
  let originalStart = null;
  let originalEnd = null;

  function handleDragStart(event, task) {
    draggedTask = task;
    dragStartX = event.clientX;
    originalStart = new Date(task.start);
    originalEnd = new Date(task.end);
    event.dataTransfer.setData("text/plain", "");
  }

  function handleDrag(event) {
    if (!draggedTask || !event.clientX) return;

    const deltaX = event.clientX - dragStartX;
    const dayWidth = event.target.parentElement.offsetWidth / dates.length;
    const daysDelta = Math.round(deltaX / dayWidth);

    const newStart = new Date(originalStart);
    newStart.setDate(newStart.getDate() + daysDelta);
    const newEnd = new Date(originalEnd);
    newEnd.setDate(newEnd.getDate() + daysDelta);

    if (newStart >= startDate && newEnd <= endDate) {
      const index = tasks.findIndex((t) => t.id === draggedTask.id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          start: newStart.toISOString().split("T")[0],
          end: newEnd.toISOString().split("T")[0],
        };
        tasks = [...tasks];

        // Perbarui draggedTask dengan tanggal yang baru
        draggedTask = tasks[index];
      }
    }
  }

  async function handleDragEnd() {
    if (!draggedTask) return;

    try {
      // Kirim data ke endpoint
      const response = await fetch(`${apiUrl}chartSubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: draggedTask.id,
          start: draggedTask.start,
          end: draggedTask.end,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      console.log("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      // Jika gagal, kembalikan task ke posisi semula
      const index = tasks.findIndex((t) => t.id === draggedTask.id);
      if (index !== -1) {
        tasks[index] = {
          ...tasks[index],
          start: originalStart.toISOString().split("T")[0],
          end: originalEnd.toISOString().split("T")[0],
        };
        tasks = [...tasks];
      }
    } finally {
      draggedTask = null;
      dragStartX = 0;
      originalStart = null;
      originalEnd = null;
    }
  }

  // Function to truncate text if it's too long
  function truncateText(text, maxLength = 30) {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  }
</script>

<div class="gantt-container">
  <div class="status-info-container">
    {#each [{ status: "Incident", color: getPriorityColor("Incident") }, { status: "Development", color: getPriorityColor("Development") }, { status: "Request Data", color: getPriorityColor("Request Data") }, { status: "Others", color: getPriorityColor("Others") }] as priorityInfo}
      <div class="status-info-item">
        <div
          class="status-color-box"
          style="background-color: {priorityInfo.color}"
        ></div>
        <span class="status-label">{priorityInfo.status}</span>
      </div>
    {/each}
  </div>
  <div class="status-info-container">
    {#each [{ status: "Backlog", color: getStatusColor("Backlog") }, { status: "Assigned to PIC", color: getStatusColor("Assigned to PIC") }, { status: "Finished", color: getStatusColor("Finished") }, { status: "Rejected", color: getStatusColor("Rejected") }, { status: "Worker Finished", color: getStatusColor("Worker Finished") }] as statusInfo}
      <div class="status-info-item">
        <div
          class="status-color-box"
          style="background-color: {statusInfo.color}"
        ></div>
        <span class="status-label">{statusInfo.status}</span>
      </div>
    {/each}
  </div>

  <div class="gantt-with-sidebar">
    <!-- Sidebar -->
    <div class="task-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-issue">Issue</div>
        <div class="sidebar-goals">Goals</div>
        <div class="sidebar-priority">Priority</div>
      </div>
      {#each tasks as task}
        <div class="sidebar-task" on:click={() => openModal(task)}>
          <div class="sidebar-issue" title={task.issue}>
            {truncateText(task.issue, 15)}
          </div>
          <div class="sidebar-goals" title={task.name}>
            {truncateText(task.name, 20)}
          </div>
          <div class="sidebar-priority">
            <div
              class="priority-indicator"
              style="background-color: {getPriorityColor(task.category)}"
              title={task.category}
            ></div>
            <span>{task.priority}</span>
          </div>
        </div>
      {/each}
    </div>

    <!-- Gantt Chart -->
    <div class="gantt-chart">
      <!-- Gantt header -->
      <div class="gantt-header">
        {#each dates as date}
          <div class="date-header" class:today={isToday(date)}>
            <span class="date-day">{date.getDate()}</span>
            <span class="date-month"
              >{date.toLocaleDateString("id-ID", { month: "short" })}</span
            >
          </div>
        {/each}
      </div>

      <!-- Task bars -->
      <div class="task-list">
        {#each tasks as task}
          <div class="task-row">
            <div
              class="task-bar"
              style="{getTaskStyle(task)}; background-color: {getStatusColor(
                task.status
              )};"
              draggable="true"
              role="button"
              tabindex="0"
              on:dragstart={(e) => handleDragStart(e, task)}
              on:drag={handleDrag}
              on:dragend={handleDragEnd}
              on:keydown={(e) => e.key === "Enter" && openModal(task)}
              on:click={() => openModal(task)}
            >
              <div class="task-content">
                <div
                  class="priority-indicator"
                  style="background-color: {getPriorityColor(task.category)}"
                ></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="sidebar-right">
      <div class="sidebar-header">
        <div class="sidebar-progress">Progress</div>
      </div>
      {#each tasks as task}
        <div class="sidebar-task">
          <div class="sidebar-progress">
            <!-- Tambahkan logika untuk menampilkan progress -->
            {task.progress || "0%"}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Modal untuk edit task -->
  {#if showModal}
    <div class="modal-overlay" on:click={closeModal}>
      <div class="modal-content" on:click|stopPropagation>
        <h2>Edit Task</h2>
        {#if selectedTask}
          <!-- Task Name (Read-only) -->
          <div class="input-group">
            <label class="input-label" for="modal-task-issue">Issue</label>
            <textarea
              type="text"
              id="modal-task-issue"
              bind:value={selectedTask.issue}
              placeholder="Enter task name"
              readonly
            />
          </div>
          <div class="input-group">
            <label class="input-label" for="modal-task-goals">Goals</label>
            <textarea
              type="text"
              id="modal-task-goals"
              bind:value={selectedTask.name}
              placeholder="Enter task name"
              readonly
            />
          </div>
          <div class="input-group">
            <label class="input-label" for="modal-channel">Channel</label>
            <input
              type="text"
              id="modal-channel"
              bind:value={selectedTask.channel}
              placeholder="Enter task name"
              readonly
            />
          </div>

          <!-- Start Date (Editable) -->
          <div class="input-group">
            <label class="input-label" for="modal-start-date">Start Date</label>
            <input
              type="date"
              id="modal-start-date"
              bind:value={selectedTask.start}
              min={startDate.toISOString().split("T")[0]}
              max={endDate.toISOString().split("T")[0]}
            />
          </div>

          <!-- End Date (Editable) -->
          <div class="input-group">
            <label class="input-label" for="modal-end-date">End Date</label>
            <input
              type="date"
              id="modal-end-date"
              bind:value={selectedTask.end}
              min={startDate.toISOString().split("T")[0]}
              max={endDate.toISOString().split("T")[0]}
            />
          </div>

          <!-- Category (Read-only) -->
          <div class="input-group">
            <label class="input-label" for="modal-category">Category</label>
            <input
              type="text"
              id="modal-category"
              bind:value={selectedTask.category}
              placeholder="Enter task name"
              readonly
            />
          </div>

          <!-- Priority (Read-only) -->
          <div class="input-group">
            <label class="input-label" for="modal-priority">Priority</label>
            <input
              type="text"
              id="modal-priority"
              bind:value={selectedTask.priority}
              placeholder="Enter task name"
              readonly
            />
          </div>

          <!-- Status (Read-only) -->
          <div class="input-group">
            <label class="input-label" for="modal-status">Status</label>
            <input
              type="text"
              id="modal-status"
              bind:value={selectedTask.status}
              placeholder="Enter task name"
              readonly
            />
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button class="cancel-button" on:click={closeModal}>Cancel</button>
            <button class="update-button" on:click={updateTask}>Update</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .gantt-container {
    margin: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden; /* Tambahkan overflow hidden pada container utama */
  }

  /* Sidebar and Gantt Chart Layout */
  .gantt-with-sidebar {
    display: flex;
    height: calc(100vh - 160px); /* Sesuaikan tinggi */
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-top: 20px;
    overflow: auto; /* Ubah overflow menjadi auto untuk scrollbar */
  }

  /* Sidebar Styles */
  .task-sidebar {
    width: 300px;
    min-width: 300px;
    border-right: 1px solid #e2e8f0;
    background-color: #f8fafc;
    padding: 0;
    overflow-y: auto; /* Scroll vertikal */
  }

  .sidebar-header {
    display: flex;
    padding: 10px;
    background-color: #e2e8f0;
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 5;
    height: 60px;
    align-items: center;
  }

  .sidebar-task {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    transition: background-color 0.2s;
    height: 50px;
    align-items: center;
  }

  .sidebar-task:hover {
    background-color: #edf2f7;
  }

  .sidebar-issue {
    flex: 1;
    font-size: 0.8rem;
    padding-right: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-goals {
    flex: 2;
    font-size: 0.8rem;
    padding-right: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-priority {
    flex: 0.8;
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    gap: 5px;
  }

  /* Sidebar Kanan */
  .sidebar-right {
    width: 150px; /* Sesuaikan lebar sesuai kebutuhan */
    min-width: 150px;
    border-left: 1px solid #e2e8f0;
    background-color: #f8fafc;
    padding: 0;
    overflow-y: auto; /* Scroll vertikal */
  }

  .sidebar-right .sidebar-header {
    display: flex;
    padding: 10px;
    background-color: #e2e8f0;
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 5;
    height: 60px;
    align-items: center;
  }

  .sidebar-right .sidebar-task {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    transition: background-color 0.2s;
    height: 50px;
    align-items: center;
  }

  .sidebar-right .sidebar-task:hover {
    background-color: #edf2f7;
  }

  .sidebar-right .sidebar-progress {
    flex: 1;
    font-size: 0.8rem;
    padding-right: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center; /* Pusatkan teks progress */
  }

  /* Gantt Chart Styles */
  /* Gantt Chart Styles */
  .gantt-chart {
    flex: 1;
    overflow-x: auto; /* Pastikan ini ada */
    background-color: white;
    min-width: 800px; /* Sesuaikan dengan kebutuhan */
  }

  .gantt-header {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(40px, 1fr);
    border-bottom: 2px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 8px 8px 0 0;
    position: sticky;
    top: 0;
    z-index: 5;
    height: 60px;
    align-items: center;
  }

  .date-header {
    padding: 12px 4px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 500;
    color: #4a5568;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    position: sticky;
    top: 60px;
    z-index: 5;
    background-color: #f8fafc;
  }

  .date-header.today {
    background-color: #4299e1; /* Warna biru */
    color: white; /* Warna teks putih agar kontras */
    border-radius: 4px; /* Tambahkan border radius untuk efek yang lebih baik */
  }

  .status-info-container {
    display: flex;
    gap: 16px;
    padding: 10px;
    margin-bottom: 20px;
    background: #f8fafc;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 8;
  }

  .status-info-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-color-box {
    width: 16px;
    height: 16px;
    border-radius: 100%;
  }

  .status-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
  }

  .task-list {
    position: relative;
    margin-top: 1px;
    background: repeating-linear-gradient(
      to right,
      #f7fafc 0px,
      #f7fafc 39px,
      #fff 39px,
      #fff 40px
    );
    min-width: auto; /* Sesuaikan dengan kebutuhan */
  }

  .task-row {
    height: 50px;
    border-bottom: 1px solid #e2e8f0;
    position: relative;
    width: auto;
  }

  /* Task Bar Styles */
  .task-bar {
    position: absolute;
    height: 36px;
    top: 7px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    z-index: 4;
    overflow: hidden;
    min-width: 50px; /* Sesuaikan dengan kebutuhan */
  }

  .task-bar:hover {
    filter: brightness(0.9);
  }

  .task-content {
    position: relative;
    z-index: 1;
    color: #2d3748;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .priority-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Form Styling */
  .form-container {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    align-items: end;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
  }

  input,
  textarea,
  select {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    width: 100%;
  }

  input[readonly],
  textarea[readonly],
  select:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
    border-color: #d1d5db;
  }

  input[readonly]:hover,
  textarea[readonly]:hover,
  select:disabled:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }

  /* Modal Styling */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }

  .modal-content {
    background: white;
    padding: 24px;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-content h2 {
    margin: 0 0 20px 0;
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: flex-end;
  }

  .update-button {
    background: #4299e1;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }

  .update-button:hover {
    background: #3182ce;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }

  .cancel-button {
    background: #718096;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }

  .cancel-button:hover {
    background: #4a5568;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }

  .delete-button {
    background: #e53e3e;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }

  .delete-button:hover {
    background: #c53030;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }
</style>
