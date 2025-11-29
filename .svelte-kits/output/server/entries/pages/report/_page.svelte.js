import { _ as bind_props, R as pop, P as push } from "../../../chunks/index.js";
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  const sessionData = data.sessionData;
  console.log("data User:", sessionData.user);
  $$payload.out += `<div class="overflow-x-auto">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-blue-500 text-lg font-semibold">Loading report...</p>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
