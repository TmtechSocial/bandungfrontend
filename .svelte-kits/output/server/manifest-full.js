export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg","images/arrowIcon.svg","images/arrowSideBar.svg","images/arrowSideBarHoverIcon.svg","images/cancel.svg","images/dashboardHoverIcon.svg","images/dashboardIcon.svg","images/download.svg","images/homeHoverIcon.svg","images/homeIcon.svg","images/izinIcon.svg","images/logoutHoverIcon.svg","images/logoutIcon.svg","images/mirorimIcon.svg","images/notifHoverIcon.svg","images/notifIcon.svg","images/print.svg","images/refill.svg","images/reportHoverIcon.svg","images/reportIcon.svg","images/requestIcon.svg","images/searchIcon.svg","images/settingHoverIcon.svg","images/settingIcon.svg","images/stockOpnameIcon.svg","images/taskHoverIcon.svg","images/taskIcon.svg","telkomsel.jpg","telkomsel.webp"]),
	mimeTypes: {".svg":"image/svg+xml",".jpg":"image/jpeg",".webp":"image/webp"},
	_: {
		client: {"start":"_app/immutable/entry/start.jCNbyx9r.js","app":"_app/immutable/entry/app.BAga1eB9.js","imports":["_app/immutable/entry/start.jCNbyx9r.js","_app/immutable/chunks/entry.5jB7-C9M.js","_app/immutable/chunks/runtime.BSmbwTO6.js","_app/immutable/chunks/index.CTR4v_7E.js","_app/immutable/entry/app.BAga1eB9.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/runtime.BSmbwTO6.js","_app/immutable/chunks/render.HfxUQ0XJ.js","_app/immutable/chunks/disclose-version.Dn5hEEI8.js","_app/immutable/chunks/if.TDHDj_M1.js","_app/immutable/chunks/props.BPxQsXGJ.js","_app/immutable/chunks/store.DFH-Lgon.js","_app/immutable/chunks/this.Dg3kES1T.js","_app/immutable/chunks/index-client.BN0nCyjC.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/logout",
				pattern: /^\/api\/logout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/logout/_server.js'))
			},
			{
				id: "/chart",
				pattern: /^\/chart\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/form",
				pattern: /^\/form\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/home",
				pattern: /^\/home\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/report",
				pattern: /^\/report\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/setting",
				pattern: /^\/setting\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/task",
				pattern: /^\/task\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
