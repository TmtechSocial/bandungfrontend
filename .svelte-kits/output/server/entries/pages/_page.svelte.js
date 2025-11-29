import { Z as fallback, _ as bind_props } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/escaping.js";
function _page($$payload, $$props) {
  let name = fallback($$props["name"], "Home");
  document.title = "Judul Baru";
  $$payload.out += `<section><h1 class="text-2xl font-bold">Welcome to the ${escape_html(name)} Page</h1> <p class="mt-4">This is the content of your homepage.</p></section>`;
  bind_props($$props, { name });
}
export {
  _page as default
};
