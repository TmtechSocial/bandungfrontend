import * as server from '../entries/pages/home/_page.server.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/home/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/home/+page.server.js";
export const imports = ["_app/immutable/nodes/7.G0eLZNdD.js","_app/immutable/chunks/disclose-version.Dn5hEEI8.js","_app/immutable/chunks/runtime.BSmbwTO6.js","_app/immutable/chunks/legacy.BVXV1PcS.js","_app/immutable/chunks/render.HfxUQ0XJ.js","_app/immutable/chunks/if.TDHDj_M1.js","_app/immutable/chunks/each.CGJ7N1wZ.js","_app/immutable/chunks/attributes.CLawN9la.js","_app/immutable/chunks/lifecycle.DrWjBZNL.js","_app/immutable/chunks/props.BPxQsXGJ.js","_app/immutable/chunks/store.DFH-Lgon.js","_app/immutable/chunks/index-client.BN0nCyjC.js","_app/immutable/chunks/axios.upsvKRUO.js","_app/immutable/chunks/index.CTR4v_7E.js","_app/immutable/chunks/entry.5jB7-C9M.js"];
export const stylesheets = ["_app/immutable/assets/7.tn0RQdqM.css"];
export const fonts = [];
