import { S as ensure_array_like, T as stringify, R as pop, P as push } from "../../../chunks/index.js";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let tasks = [];
  let startDate = /* @__PURE__ */ new Date();
  let endDate = /* @__PURE__ */ new Date();
  function getDates(start, end) {
    const dates2 = [];
    let current = new Date(start);
    const endTime = new Date(end);
    while (current <= endTime) {
      dates2.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates2;
  }
  function isToday(date) {
    const today = /* @__PURE__ */ new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }
  let dates = getDates(startDate, endDate);
  function getTaskStyle(task) {
    const start = new Date(task.start);
    const end = new Date(task.end);
    console.log("endDate", endDate);
    const totalDays = (endDate - startDate) / (1e3 * 60 * 60 * 24);
    const leftPos = (start - startDate) / (1e3 * 60 * 60 * 24);
    const width = (end - start) / (1e3 * 60 * 60 * 24);
    return `
    left: ${leftPos / totalDays * 100}%;
    width: ${width / totalDays * 100}%;
  `;
  }
  function getStatusColor(status) {
    const colors = {
      Backlog: "#e2e8f0",
      // Warna default (abu-abu)
      "Assigned to PIC": "#fbd8b9",
      // Kuning cerah
      "Worker Finished": "#FBF3B9",
      // Kuning cerah
      Finished: "#AEEA94",
      // Hijau cerah
      "Task Completed": "#AEEA94",
      // Hijau cerah
      Rejected: "#FDAB9E"
      // Merah cerah
    };
    return colors[status] || colors["Backlog"];
  }
  function getPriorityColor(category) {
    const colors = {
      Others: "#a4a9b0",
      // Hijau
      "Request Data": "#F59E0B",
      // Biru Muda
      Development: "#8B5CF6",
      // Ungu
      Incident: "#EF4444"
      // Merah
    };
    return colors[category] || "#a4a9b0";
  }
  function truncateText(text, maxLength = 30) {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  }
  const each_array = ensure_array_like([
    {
      status: "Incident",
      color: getPriorityColor("Incident")
    },
    {
      status: "Development",
      color: getPriorityColor("Development")
    },
    {
      status: "Request Data",
      color: getPriorityColor("Request Data")
    },
    {
      status: "Others",
      color: getPriorityColor("Others")
    }
  ]);
  const each_array_1 = ensure_array_like([
    {
      status: "Backlog",
      color: getStatusColor("Backlog")
    },
    {
      status: "Assigned to PIC",
      color: getStatusColor("Assigned to PIC")
    },
    {
      status: "Finished",
      color: getStatusColor("Finished")
    },
    {
      status: "Rejected",
      color: getStatusColor("Rejected")
    },
    {
      status: "Worker Finished",
      color: getStatusColor("Worker Finished")
    }
  ]);
  const each_array_2 = ensure_array_like(tasks);
  const each_array_3 = ensure_array_like(dates);
  const each_array_4 = ensure_array_like(tasks);
  const each_array_5 = ensure_array_like(tasks);
  $$payload.out += `<div class="gantt-container svelte-ibpn0s"><div class="status-info-container svelte-ibpn0s"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let priorityInfo = each_array[$$index];
    $$payload.out += `<div class="status-info-item svelte-ibpn0s"><div class="status-color-box svelte-ibpn0s"${attr("style", `background-color: ${stringify(priorityInfo.color)}`)}></div> <span class="status-label svelte-ibpn0s">${escape_html(priorityInfo.status)}</span></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="status-info-container svelte-ibpn0s"><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let statusInfo = each_array_1[$$index_1];
    $$payload.out += `<div class="status-info-item svelte-ibpn0s"><div class="status-color-box svelte-ibpn0s"${attr("style", `background-color: ${stringify(statusInfo.color)}`)}></div> <span class="status-label svelte-ibpn0s">${escape_html(statusInfo.status)}</span></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="gantt-with-sidebar svelte-ibpn0s"><div class="task-sidebar svelte-ibpn0s"><div class="sidebar-header svelte-ibpn0s"><div class="sidebar-issue svelte-ibpn0s">Issue</div> <div class="sidebar-goals svelte-ibpn0s">Goals</div> <div class="sidebar-priority svelte-ibpn0s">Priority</div></div> <!--[-->`;
  for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
    let task = each_array_2[$$index_2];
    $$payload.out += `<div class="sidebar-task svelte-ibpn0s"><div class="sidebar-issue svelte-ibpn0s"${attr("title", task.issue)}>${escape_html(truncateText(task.issue, 15))}</div> <div class="sidebar-goals svelte-ibpn0s"${attr("title", task.name)}>${escape_html(truncateText(task.name, 20))}</div> <div class="sidebar-priority svelte-ibpn0s"><div class="priority-indicator svelte-ibpn0s"${attr("style", `background-color: ${stringify(getPriorityColor(task.category))}`)}${attr("title", task.category)}></div> <span>${escape_html(task.priority)}</span></div></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="gantt-chart svelte-ibpn0s"><div class="gantt-header svelte-ibpn0s"><!--[-->`;
  for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
    let date = each_array_3[$$index_3];
    $$payload.out += `<div${attr("class", `date-header svelte-ibpn0s ${stringify([isToday(date) ? "today" : ""].filter(Boolean).join(" "))}`)}><span class="date-day">${escape_html(date.getDate())}</span> <span class="date-month">${escape_html(date.toLocaleDateString("id-ID", { month: "short" }))}</span></div>`;
  }
  $$payload.out += `<!--]--></div> <div class="task-list svelte-ibpn0s"><!--[-->`;
  for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
    let task = each_array_4[$$index_4];
    $$payload.out += `<div class="task-row svelte-ibpn0s"><div class="task-bar svelte-ibpn0s"${attr("style", `${stringify(getTaskStyle(task))}; background-color: ${stringify(getStatusColor(task.status))};`)} draggable="true" role="button" tabindex="0"><div class="task-content svelte-ibpn0s"><div class="priority-indicator svelte-ibpn0s"${attr("style", `background-color: ${stringify(getPriorityColor(task.category))}`)}></div></div></div></div>`;
  }
  $$payload.out += `<!--]--></div></div> <div class="sidebar-right svelte-ibpn0s"><div class="sidebar-header svelte-ibpn0s"><div class="sidebar-progress svelte-ibpn0s">Progress</div></div> <!--[-->`;
  for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
    let task = each_array_5[$$index_5];
    $$payload.out += `<div class="sidebar-task svelte-ibpn0s"><div class="sidebar-progress svelte-ibpn0s">${escape_html(task.progress || "0%")}</div></div>`;
  }
  $$payload.out += `<!--]--></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
