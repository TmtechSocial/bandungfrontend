import { $ as head, _ as bind_props } from "../../../chunks/index.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import { a as attr } from "../../../chunks/attributes.js";
function _page($$payload, $$props) {
  let error = $$props["error"];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Login</title>`;
  });
  $$payload.out += `<main class="flex items-center justify-center h-screen bg-myPrimary svelte-3xtr7o"><form method="POST" class="w-full max-w-md bg-gray-100 shadow-md rounded px-8 py-6"><h3 class="text-xl font-bold text-center mb-6">Login</h3> `;
  if (error) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">${escape_html(error)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mb-4"><label for="username" class="block text-gray-700 font-bold mb-2">Username</label> <input type="text" id="username" name="username" class="appearance border-2 border-gray-300 rounded vrounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required></div> <div class="mb-6"><label for="password" class="block text-gray-700 font-bold mb-2">Password</label> <div class="relative"><input${attr("type", "password")} id="password" name="password" class="appearance-none border-2 border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required> <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
  $$payload.out += `<!--]--></button></div></div> <div class="flex justify-center w-full"><button type="submit" class="w-full bg-myPrimary text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline">Sign in</button></div> <div class="flex pt-4 justify-center"><p class="text-sm">Versi 1.0.0</p></div></form></main>`;
  bind_props($$props, { error });
}
export {
  _page as default
};
