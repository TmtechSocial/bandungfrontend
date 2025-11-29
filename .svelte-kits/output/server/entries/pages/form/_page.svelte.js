import { Z as fallback, _ as bind_props, R as pop, P as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import "@formio/js";
function _page($$payload, $$props) {
  push();
  let dynamicParams = fallback($$props["dynamicParams"], () => ({}), true);
  let process = "";
  let data = $$props["data"];
  const sessionData = data.sessionData;
  sessionData.token;
  const users = sessionData.user;
  sessionData.groups;
  const cmisAuth = sessionData.cmisAuth;
  function parseCookies() {
    if (typeof document === "undefined") return {};
    const cookieObj = {};
    try {
      const cookies = typeof document.cookie === "string" ? document.cookie : "";
      cookies.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=");
        try {
          cookieObj[name.trim()] = decodeURIComponent(value || "");
        } catch (e) {
          console.error("Error parsing cookie:", name);
        }
      });
    } catch (error) {
      console.error("Error in parseCookies:", error);
    }
    return cookieObj;
  }
  function load() {
    const cookies = parseCookies();
    let user = null;
    let baseDn = null;
    try {
      const userCookie = cookies["user"];
      user = userCookie ? JSON.parse(userCookie) : null;
      const baseDnCookie = cookies["baseDn"];
      if (baseDnCookie) {
        baseDn = baseDnCookie.replace(/^"|"$/g, "");
      }
    } catch (error) {
      console.error("Error parsing cookies:", error);
    }
    const session = user ? {
      fid: users.fullName,
      uid: users.username,
      gid: user.groups?.[0]?.name || "default-group",
      baseDn,
      // Menggunakan baseDn dari cookies
      cmisAuth
    } : null;
    return session;
  }
  $$payload.out += `<h1 class="h4 font-bold text-center svelte-jj8mgt">${escape_html((() => {
    const parts = process.split(".");
    if (parts.length === 2) {
      return parts.join(" ").replace(/[._]/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    } else if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];
      return lastPart.replace(/_/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    } else {
      return process.replace(/[._]/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }
  })())}</h1> <div class="svelte-jj8mgt"></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { dynamicParams, data, load });
  pop();
}
export {
  _page as default
};
