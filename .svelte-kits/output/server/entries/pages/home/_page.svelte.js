import { V as store_get, S as ensure_array_like, W as unsubscribe_stores, _ as bind_props, R as pop, P as push } from "../../../chunks/index.js";
import { w as writable } from "../../../chunks/index3.js";
import "../../../chunks/client.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import { a as attr } from "../../../chunks/attributes.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let data = $$props["data"];
  const sessionData = data.sessionData;
  sessionData.user;
  const groups = sessionData.groups;
  const isInBOGroup = groups.some((group) => group?.name === "ManagerToko");
  const processDefinitions = writable([]);
  const loading = writable(true);
  const error = writable(null);
  if (!isInBOGroup) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-center">You don't have access to start process definitions.</p>`;
  } else {
    $$payload.out += "<!--[!-->";
    if (store_get($$store_subs ??= {}, "$loading", loading)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-start text-xl mt-8">Loading process definitions...</p>`;
    } else {
      $$payload.out += "<!--[!-->";
      if (store_get($$store_subs ??= {}, "$error", error)) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<p class="text-start text-red-500">Error: ${escape_html(store_get($$store_subs ??= {}, "$error", error))}</p>`;
      } else {
        $$payload.out += "<!--[!-->";
        if (store_get($$store_subs ??= {}, "$processDefinitions", processDefinitions).length > 0) {
          $$payload.out += "<!--[-->";
          const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$processDefinitions", processDefinitions));
          $$payload.out += `<p class="text-md font-bold text-start"><!--[-->`;
          for (let index = 0, $$length = each_array.length; index < $$length; index++) {
            let process = each_array[index];
            if (index === 0) {
              $$payload.out += "<!--[-->";
              $$payload.out += `<span>${escape_html(process.key.split(".")[0].replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))}</span>`;
            } else {
              $$payload.out += "<!--[!-->";
            }
            $$payload.out += `<!--]-->`;
          }
          $$payload.out += `<!--]--></p>`;
        } else {
          $$payload.out += "<!--[!-->";
          $$payload.out += `<p class="text-start">No available processes.</p>`;
        }
        $$payload.out += `<!--]--> `;
        if (store_get($$store_subs ??= {}, "$processDefinitions", processDefinitions).length > 0) {
          $$payload.out += "<!--[-->";
          const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$processDefinitions", processDefinitions));
          $$payload.out += `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2"><!--[-->`;
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let process = each_array_1[$$index_1];
            $$payload.out += `<div class="flex items-center bg-slate-200 shadow-md rounded-lg p-4 hover:scale-105 transform transition-all cursor-pointer"><img${attr("src", `/images/${process.icon}.svg`)}${attr("alt", process.key.split(".")[0])} class="w-8 h-8 rounded-md mr-4"> <div>`;
            if (process.key.includes(".")) {
              $$payload.out += "<!--[-->";
              $$payload.out += `<strong class="text-lg block text-myPrimary">${escape_html(process.key.split(".")[1].replace(/_/g, " "))}</strong>`;
            } else {
              $$payload.out += "<!--[!-->";
              $$payload.out += `<strong class="text-lg">${escape_html(process.key.replace(/_/g, " "))}</strong>`;
            }
            $$payload.out += `<!--]--></div></div>`;
          }
          $$payload.out += `<!--]--></div>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]-->`;
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
