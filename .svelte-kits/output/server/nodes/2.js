import * as universal from '../entries/pages/form/_layout.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/form/+layout.js";
export const imports = ["_app/immutable/nodes/2.BlGdiZZR.js","_app/immutable/chunks/disclose-version.Dn5hEEI8.js","_app/immutable/chunks/runtime.BSmbwTO6.js"];
export const stylesheets = [];
export const fonts = [];
