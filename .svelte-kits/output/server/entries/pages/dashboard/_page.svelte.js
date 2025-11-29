import { S as ensure_array_like, V as store_get, W as unsubscribe_stores, _ as bind_props, R as pop, P as push } from "../../../chunks/index.js";
import { w as writable } from "../../../chunks/index3.js";
import { a as attr } from "../../../chunks/attributes.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let data = $$props["data"];
  const sessionData = data.sessionData;
  let procDefKeys = writable([]);
  sessionData.groups.map((group) => group.name).join(",");
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$procDefKeys", procDefKeys));
  $$payload.out += `<main><h1>Dashboards</h1> <select><option value="">Select a key</option><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let key = each_array[$$index];
    $$payload.out += `<option${attr("value", key)}>${escape_html(key)}</option>`;
  }
  $$payload.out += `<!--]--></select> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></main>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
