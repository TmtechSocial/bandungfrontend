import { V as store_get, W as unsubscribe_stores, _ as bind_props, R as pop, P as push } from "../../../chunks/index.js";
import { w as writable } from "../../../chunks/index3.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let data = $$props["data"];
  const sessionData = data?.sessionData || {};
  const userSession = writable({
    fid: sessionData.user?.fullName,
    tid: sessionData.user?.lastName,
    uid: sessionData.user?.username,
    gid: sessionData.groups?.[0]?.name,
    saldo_cuti: sessionData.user?.saldo_cuti || 0
  });
  $$payload.out += `<div class="container mx-auto p-1"><div class="rounded-lg w-full h-auto bg-myPrimary text-white p-4 mb-4 shadow-md"><div class="flex items-center mb-2"><p class="w-32 text-lg font-bold">ID</p> <p Class="text-lg font-bold">: ${escape_html(store_get($$store_subs ??= {}, "$userSession", userSession).uid)}</p></div> <div class="flex items-center mb-2"><p class="w-32 text-lg font-bold">Username</p> <p Class="text-lg font-bold">: ${escape_html(store_get($$store_subs ??= {}, "$userSession", userSession).fid)}</p></div> <div class="flex items-center mb-2"><p class="w-32 text-lg font-bold">No Telp</p> <p Class="text-lg font-bold">: ${escape_html(store_get($$store_subs ??= {}, "$userSession", userSession).tid)}</p></div> <div class="flex items-center mb-2"><p class="w-32 text-lg font-bold">Role</p> <p Class="text-lg font-bold">: ${escape_html(store_get($$store_subs ??= {}, "$userSession", userSession).gid)}</p></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
