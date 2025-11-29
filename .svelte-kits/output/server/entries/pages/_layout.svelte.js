import { S as ensure_array_like, T as stringify, V as store_get, W as unsubscribe_stores, R as pop, P as push, X as slot } from "../../chunks/index.js";
import { p as page } from "../../chunks/stores.js";
import { w as writable } from "../../chunks/index3.js";
import "../../chunks/client.js";
import { a as attr } from "../../chunks/attributes.js";
import { e as escape_html } from "../../chunks/escaping.js";
const isCollapsed = writable(false);
function Sidebar($$payload, $$props) {
  push();
  var $$store_subs;
  let hoveredItem = null;
  let isLoggingOut = false;
  const menuItems = [
    {
      label: "Dashboard",
      iconPath: "/images/dashboardIcon.svg",
      iconHoverPath: "/images/dashboardHoverIcon.svg",
      url: "/dashboard"
    },
    {
      label: "Task",
      iconPath: "/images/taskIcon.svg",
      iconHoverPath: "/images/taskHoverIcon.svg",
      url: "/task"
    },
    {
      label: "Report",
      iconPath: "/images/reportIcon.svg",
      iconHoverPath: "/images/reportHoverIcon.svg",
      url: "/report"
    },
    {
      label: "Request",
      iconPath: "/images/homeIcon.svg",
      iconHoverPath: "/images/homeHoverIcon.svg",
      url: "/home"
    }
  ];
  const each_array = ensure_array_like(menuItems);
  $$payload.out += `<div class="fixed left-0 top-0 h-screen"><div class="pl-4 pt-3 pb-4 h-full"><div class="bg-myPrimary h-full rounded-3xl flex flex-col justify-between transition-[width] duration-500 ease-in-out"${attr("style", `width: ${stringify(store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "5rem" : "11rem")}`)}><div><div${attr("class", `pt-5 flex items-center relative ${stringify([
    !store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "pl-4" : ""
  ].filter(Boolean).join(" "))}`)}><div class="flex items-center absolute left-0 right-0 px-4"><div class="overflow-hidden transition-[width,opacity] duration-300 ease-in-out opacity-100 flex-shrink-0 ps-1"${attr("style", `width: ${stringify(store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "0" : "89px")}; opacity: ${stringify(store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "0" : "1")}`)}><img src="/favicon.svg" alt="mirorim" width="100" height="50" class="object-contain"></div> <button type="button"${attr("class", `border-2 border-third rounded-lg p-1 cursor-pointer hover:bg-third transition-all duration-500 flex-shrink-0 ml-auto w-[30px] h-[30px] flex items-center justify-center ${stringify([
    store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "rotate-180" : ""
  ].filter(Boolean).join(" "))}`)} aria-label="Toggle Sidebar"><img${attr("src", "/images/arrowSideBar.svg")} alt="sidebar toggle" class="w-5 h-5"></button></div></div> <div class="pt-10"><ul class="px-3 font-semibold uppercase text-xs text-third space-y-2"><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let item = each_array[index];
    $$payload.out += `<li${attr("class", `flex items-center cursor-pointer transition-all hover:bg-third hover:text-myPrimary hover:font-bold hover:rounded-lg p-3 ${stringify([
      store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "justify-center" : "",
      hoveredItem === index ? "text-myPrimary" : "",
      item.isLogout && isLoggingOut ? "pointer-events-none" : ""
    ].filter(Boolean).join(" "))}`)}><div class="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0"><img${attr("src", hoveredItem === index ? item.iconHoverPath : item.iconPath)}${attr("alt", item.label.toLowerCase())} class="w-full h-full object-contain"></div> <div class="overflow-hidden transition-[width,opacity] duration-300 ease-in-out"${attr("style", `width: ${stringify(store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "0" : "100%")}; opacity: ${stringify(store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "0" : "1")}`)}><span class="ml-3 whitespace-nowrap">${escape_html(item.label)}</span></div></li>`;
  }
  $$payload.out += `<!--]--></ul></div></div></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Navbar($$payload, $$props) {
  push();
  var $$store_subs;
  let searchQuery = "";
  $$payload.out += `<div${attr("class", `pt-3 px-3 pb-2 transition-all duration-300 svelte-1uiw413 ${stringify([
    store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "md:ml-4" : "",
    !store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "md:ml-5" : ""
  ].filter(Boolean).join(" "))}`)}><div class="w-full md:h-16 h-20 rounded-3xl bg-myPrimary flex items-center md:px-10 px-4 svelte-1uiw413"><p class="text-white font-semibold mr-auto svelte-1uiw413">Mirorim Operasional</p> <div class="flex justify-center flex-1 svelte-1uiw413"><div class="relative md:w-3/6 w-5/6 max-w-md svelte-1uiw413"><input type="text"${attr("value", searchQuery)} class="px-10 py-2 md:text-md text-xs w-full h-9 rounded-md focus:outline-none svelte-1uiw413" placeholder="Search anything" aria-label="Search"> <img src="/images/searchIcon.svg" alt="Search" class="absolute left-3 top-1/2 transform -translate-y-1/2 svelte-1uiw413" width="20" height="20"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="flex md:gap-2 svelte-1uiw413"><div${attr("class", `p-1 cursor-pointer svelte-1uiw413 ${stringify([
    "",
    ""
  ].filter(Boolean).join(" "))}`)}><img${attr("src", "/images/settingIcon.svg")} alt="Settings" width="24" height="24" class="svelte-1uiw413"></div> <div${attr("class", `p-1 cursor-pointer svelte-1uiw413 ${stringify([
    "",
    "",
    ""
  ].filter(Boolean).join(" "))}`)}><img${attr("src", "/images/logoutIcon.svg")} alt="Logout" width="22" height="22" class="svelte-1uiw413"></div></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Mobilebar($$payload) {
  let hoveredItem = null;
  let activeItem = null;
  const menuItems = [
    {
      label: "Dashboard",
      iconPath: "/images/dashboardIcon.svg",
      iconHoverPath: "/images/dashboardHoverIcon.svg",
      url: "/dashboard"
    },
    {
      label: "Task",
      iconPath: "/images/taskIcon.svg",
      iconHoverPath: "/images/taskHoverIcon.svg",
      url: "/task"
    },
    {
      label: "Report",
      iconPath: "/images/reportIcon.svg",
      iconHoverPath: "/images/reportHoverIcon.svg",
      url: "/report"
    },
    {
      label: "Request",
      iconPath: "/images/homeIcon.svg",
      iconHoverPath: "/images/homeHoverIcon.svg",
      url: "/home"
    }
  ];
  const updateActiveItem = () => {
    const currentPath = window.location.pathname;
    activeItem = menuItems.findIndex((item) => item.url === currentPath);
  };
  if (typeof window !== "undefined") {
    updateActiveItem();
  }
  const each_array = ensure_array_like(menuItems);
  $$payload.out += `<div class="p-3"><div class="bg-myPrimary h-auto rounded-2xl flex justify-center p-2 svelte-1qdu2hp"><div class="px-3 flex justify-between w-full max-w-md"><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let item = each_array[index];
    $$payload.out += `<a${attr("href", item.url)}${attr("class", `flex flex-col items-center justify-center text-xs font-semibold w-16 h-16 cursor-pointer rounded-md transition-all svelte-1qdu2hp ${stringify([
      index !== activeItem ? "text-white" : "",
      index === activeItem ? "text-myPrimary" : "",
      index === activeItem ? "bg-white" : ""
    ].filter(Boolean).join(" "))}`)}><img${attr("src", index === activeItem || hoveredItem === index ? item.iconHoverPath : item.iconPath)}${attr("alt", item.label.toLowerCase())} width="25" height="25"> <p${attr("class", `pt-2 transition-colors svelte-1qdu2hp ${stringify([
      index === activeItem || hoveredItem === index ? "text-myPrimary" : "",
      index !== activeItem && hoveredItem !== index ? "text-white" : ""
    ].filter(Boolean).join(" "))}`)}>${escape_html(item.label)}</p></a>`;
  }
  $$payload.out += `<!--]--></div></div></div>`;
}
function AppShell($$payload, $$props) {
  var $$store_subs;
  $$payload.out += `<div class="flex min-h-screen bg-gray-100"><div class="max-md:hidden md:block z-10">`;
  Sidebar($$payload);
  $$payload.out += `<!----></div> <div${attr("class", `flex-1 flex flex-col transition-all duration-500 ${stringify([
    store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "md:ml-20" : "",
    !store_get($$store_subs ??= {}, "$isCollapsed", isCollapsed) ? "md:ml-44" : ""
  ].filter(Boolean).join(" "))}`)}>`;
  Navbar($$payload);
  $$payload.out += `<!----> <main class="flex-1 md:ml-12 md:mr-7 mx-6 mt-2 overflow-auto mb-24 md:mb-0"><div class="bg-white rounded-3xl p-4 min-h-full"><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></div></main></div> <div class="md:hidden fixed bottom-0 w-full">`;
  Mobilebar($$payload);
  $$payload.out += `<!----></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
}
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  const authPages = ["/login"];
  let isAuthPage = false;
  {
    isAuthPage = authPages.includes(store_get($$store_subs ??= {}, "$page", page).url.pathname);
  }
  if (!isAuthPage) {
    $$payload.out += "<!--[-->";
    AppShell($$payload, {
      children: ($$payload2) => {
        $$payload2.out += `<!---->`;
        slot($$payload2, $$props, "default", {});
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    });
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<!---->`;
    slot($$payload, $$props, "default", {});
    $$payload.out += `<!---->`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
