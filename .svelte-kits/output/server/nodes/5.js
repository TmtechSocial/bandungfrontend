import * as server from '../entries/pages/dashboard/_page.server.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+page.server.js";
export const imports = ["_app/immutable/nodes/5.DPKUVn20.js","_app/immutable/chunks/disclose-version.Dn5hEEI8.js","_app/immutable/chunks/runtime.BSmbwTO6.js","_app/immutable/chunks/legacy.BVXV1PcS.js","_app/immutable/chunks/render.HfxUQ0XJ.js","_app/immutable/chunks/if.TDHDj_M1.js","_app/immutable/chunks/each.CGJ7N1wZ.js","_app/immutable/chunks/attributes.CLawN9la.js","_app/immutable/chunks/props.BPxQsXGJ.js","_app/immutable/chunks/store.DFH-Lgon.js","_app/immutable/chunks/this.Dg3kES1T.js","_app/immutable/chunks/lifecycle.DrWjBZNL.js","_app/immutable/chunks/index-client.BN0nCyjC.js","_app/immutable/chunks/index.CTR4v_7E.js"];
export const stylesheets = [];
export const fonts = [];
