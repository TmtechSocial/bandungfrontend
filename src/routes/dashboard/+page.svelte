<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  export let data;
  const sessionData = data.sessionData;
  let key_ = "";
  let instances = writable([]);
  let performance = writable([]);
  let timeline = writable([]);
  let taskCount = writable([]);
  let procDefKeys = writable([]);
  let percentages = writable({});
  let persentase = writable({});
  let totalAmount = 0;

  let pieCanvas;
  let pieCanvasTimeline;
  let taskCanvas;
  const groupName = sessionData.groups.map(group => group.name).join(',');
  
  async function fetchProcDefKeys() {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ENDPOINT}/cockpit/process-definition`);
      if (!response.ok) throw new Error('Failed to fetch process definitions');
      const data = await response.json();
      procDefKeys.set(Array.isArray(data) ? data.map(def => def.key_) : []);
    } catch (err) {
      console.error('Error fetching process definitions:', err);
      procDefKeys.set([]);
    }
  }

  async function fetchInstances() {
    if (!key_) return;
    try {
        const response = await fetch(`${import.meta.env.VITE_APP_ENDPOINT}/cockpit/process-instance/count/group-state?proc_def_key_=${key_}&assignee_=${sessionData.user.username}&group_=${groupName}`);
        if (!response.ok) throw new Error(`Failed to fetch instances for ${key_}`);
        const data = await response.json();

        instances.set(Array.isArray(data) ? data : []);

        if (!data || data.length === 0) {
            persentase.set({});
            return;
        }

        const totalAmount = data.reduce((sum, item) => sum + parseInt(item.amount, 10), 0);

        if (totalAmount === 0) {
            persentase.set({});
            return;
        }

        let newPersentase = {};
        data.forEach(item => {
            newPersentase[item.state] = ((parseInt(item.amount, 10))).toFixed(1);
        });

        persentase.set(newPersentase);
    } catch (err) {
        console.error(`Error fetching instances for ${key_}:`, err);
        instances.set([]);
    }
}

  async function fetchTaskCount() {
    if (!key_) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ENDPOINT}/cockpit/task/dashboard-count/assignee?proc_def_key_=${key_}`);
      if (!response.ok) throw new Error(`Failed to fetch task count for ${key_}`);
      const data = await response.json();
      taskCount.set(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error fetching task count for ${key_}:`, err);
      taskCount.set([]);
    }
  }
async function fetchPerformance() {
    if (!key_) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ENDPOINT}/cockpit/task/dashboard-count?proc_def_key_=${key_}&assignee_=${sessionData.user.username}`);
      if (!response.ok) throw new Error(`Failed to fetch task count for ${key_}`);
      const data = await response.json();
      performance.set(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error fetching task count for ${key_}:`, err);
      performance.set([]);
    }
  }
  function drawPieChart(performanceData) {
  if (!pieCanvas) return;
  const ctx = pieCanvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);

  if (!performanceData || performanceData.length === 0) return;

  const data = performanceData[0]; // Karena hanya ada satu objek dalam array
  const categories = ["complete", "active"];
  const colors = ["#5a9bd5", "#ec7d32"];

  totalAmount = categories.reduce((sum, key) => sum + parseInt(data[key], 10), 0);

  if (totalAmount === 0) return;

  let startAngle = 0;
  categories.forEach((category, index) => {
    const amount = parseInt(data[category], 10);
    const percentage = (amount / totalAmount) * 100;
    
    percentages.update(p => ({ ...p, [category]: percentage.toFixed(1) }));

    const sliceAngle = (percentage / 100) * 2 * Math.PI;
    const midAngle = startAngle + sliceAngle / 2;
    const textX = 150 + Math.cos(midAngle) * 60; // Posisi teks di tengah slice
    const textY = 150 + Math.sin(midAngle) * 60;

    ctx.fillStyle = colors[index];
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Tambahkan teks persentase
    ctx.fillStyle = "black"; 
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percentage.toFixed(1)}%`, textX, textY);

    startAngle += sliceAngle;
  });
}

async function fetchTimeline() {
    if (!key_) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_ENDPOINT}/cockpit/task/dashboard-count/timeline?proc_def_key_=${key_}&assignee_=${sessionData.user.username}`);
      if (!response.ok) throw new Error(`Failed to fetch task count for ${key_}`);
      const data = await response.json();
      timeline.set(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Error fetching task count for ${key_}:`, err);
      timeline.set([]);
    }
  }
  function drawPieChartTimeline(performanceData) {
  if (!pieCanvasTimeline) return;
  const ctx = pieCanvasTimeline.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, pieCanvasTimeline.width, pieCanvasTimeline.height);

  if (!performanceData || performanceData.length === 0) return;

  const data = performanceData[0]; // Karena hanya ada satu objek dalam array
  const categories = ["acieve", "overdue"];
  const colors = ["#00d26a", "#ff0000"];

  totalAmount = categories.reduce((sum, key) => sum + parseInt(data[key], 10), 0);

  if (totalAmount === 0) return;

  let startAngle = 0;
  categories.forEach((category, index) => {
    const amount = parseInt(data[category], 10);
    const percentage = (amount / totalAmount) * 100;
    
    percentages.update(p => ({ ...p, [category]: percentage.toFixed(1) }));

    const sliceAngle = (percentage / 100) * 2 * Math.PI;
    const midAngle = startAngle + sliceAngle / 2;
    const textX = 150 + Math.cos(midAngle) * 60; // Posisi teks di tengah slice
    const textY = 150 + Math.sin(midAngle) * 60;

    ctx.fillStyle = colors[index];
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 100, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Tambahkan teks persentase
    ctx.fillStyle = "white"; 
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percentage.toFixed(1)}%`, textX, textY);

    startAngle += sliceAngle;
  });
}



const colors = {
  acieve: "#5a9bd5",   // blue
  overdue: "#a5a5a5",  // gray
  inprogress: "#ec7d32" // orange
};
function drawTaskChart(taskData) {
  if (!taskCanvas) return;
  const ctx = taskCanvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, taskCanvas.width, taskCanvas.height);

  const barWidth = 40;
  const gap = 20;
  const baseX = 50;
  const baseY = taskCanvas.height - 30;
  const totalBars = taskData.length * 3; // Setiap task punya 3 batang
  const totalWidth = baseX + totalBars * (barWidth + gap);

  // Sesuaikan ukuran canvas agar cukup untuk semua data, tetapi tetap bisa discroll
  taskCanvas.width = totalWidth;

  const maxHeight = Math.max(...taskData.map(t => Math.max(t.acieve, t.overdue, t.inprogress)), 1);
  const scale = (taskCanvas.height - 60) / maxHeight;

  taskData.forEach((task, index) => {
    const x = baseX + index * (barWidth * 3 + gap);

    ctx.fillStyle = colors.acieve;
    ctx.fillRect(x, baseY - task.acieve * scale, barWidth, task.acieve * scale);
    
    ctx.fillStyle = colors.overdue;
    ctx.fillRect(x + barWidth, baseY - task.overdue * scale, barWidth, task.overdue * scale);
    
    ctx.fillStyle = colors.inprogress;
    ctx.fillRect(x + barWidth * 2, baseY - task.inprogress * scale, barWidth, task.inprogress * scale);

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(task.assignee_, x + barWidth, baseY + 15);
    ctx.fillText(task.acieve, x + barWidth / 2, baseY - task.acieve * scale - 5);
    ctx.fillText(task.overdue, x + barWidth + barWidth / 2, baseY - task.overdue * scale - 5);
    ctx.fillText(task.inprogress, x + barWidth * 2 + barWidth / 2, baseY - task.inprogress * scale - 5);
  });
}


  onMount(() => {
    fetchProcDefKeys();
    fetchInstances();
    fetchTaskCount();
    fetchTimeline();
    fetchPerformance()
    performance.subscribe(drawPieChart);
    timeline.subscribe(drawPieChartTimeline)
    taskCount.subscribe(drawTaskChart);
  });
</script>

<main>
  <h1>Dashboards</h1>
  <select bind:value={key_} on:change={() => { fetchInstances(); fetchTaskCount(); fetchPerformance(); fetchTimeline();}}>
    <option value="">Select a key</option>
    {#each $procDefKeys as key}
      <option value={key}>{key}</option>
    {/each}
  </select>

  {#if key_}
  <div class="grid grid-cols-4 gap-4 mt-3">
  {#each Object.keys($persentase) as state}
    <div class="border p-1 rounded-lg shadow-md" style="background-color: {({
      "In Progres": '#ffc000',
      Done: '#90d14f',
      SUSPENDED: '#bbbbbb',
      EXTERNALLY_TERMINATED: '#f70400'
    }[state] || '#ffffff')}">
      <h3 class="font-bold text-center">{state}</h3>
      <p class="text-center">{$persentase[state]}</p>
    </div>
  {/each}
</div>


<div class="flex flex-wrap justify-center gap-6 mt-3">
  <!-- Bagian Pie Chart -->
  <div class="flex flex-col items-center">
    <h2 class="bg-gray-100 border border-gray-300 p-2 rounded-md text-center w-full">
      Compliance
    </h2>
    <canvas bind:this={pieCanvas} width="300" height="300" class="border mt-1"></canvas>
    <div class="flex flex-wrap justify-center gap-6 mt-3">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-blue-400"></div>
          <span>Complete</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-orange-400"></div>
          <span>Active</span>
        </div>
      </div>
  </div>
  <div class="flex flex-col items-center">
    <h2 class="bg-gray-100 border border-gray-300 p-2 rounded-md text-center w-full">
      Timeline
    </h2>
    <canvas bind:this={pieCanvasTimeline} width="300" height="300" class="border mt-1"></canvas>
    <div class="flex flex-wrap justify-center gap-6 mt-3">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-green-500"></div>
          <span>Achieve</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-red-500"></div>
          <span>Overdue</span>
        </div>
      </div>
  </div>
  <!-- Bagian Task Chart -->
  <div class="flex flex-col items-center">
    <h2 class="bg-gray-100 border border-gray-300 p-2 rounded-md text-center w-full">
      Task Performance per Person
    </h2>
    <div class="flex items-center gap-4 overflow-x-auto max-w-[1000px] border border-gray-300 mt-1">
      <div class="overflow-x-auto max-w-[500px]">
        <canvas bind:this={taskCanvas} height="400"></canvas>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-blue-400"></div>
          <span>Achieve</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-gray-400"></div>
          <span>Overdue</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 bg-orange-400"></div>
          <span>In Progress</span>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}


</main>

