import { _ as bind_props, R as pop, P as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  const sessionData = data.sessionData;
  sessionData.token;
  sessionData.user.username;
  $$payload.out += `<div class="overflow-x-auto">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-blue-500 text-lg font-semibold">Loading tasks...</p>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
