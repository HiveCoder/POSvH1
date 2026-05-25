/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_FRAPPE_BASE_URL?: string;
	readonly VITE_POS_PLATFORM?: 'frappe' | 'website';
	readonly VITE_POS_ROUTER_BASENAME?: string;
	readonly VITE_POS_WEBSITE_USER?: string;
	readonly VITE_POS_WEBSITE_FULL_NAME?: string;
	readonly VITE_POS_WEBSITE_ROLES?: string;
	readonly VITE_POS_WEBSITE_PROFILE_NAME?: string;
	readonly VITE_POS_WEBSITE_COMPANY?: string;
	readonly VITE_POS_WEBSITE_COUNTRY?: string;
	readonly VITE_POS_WEBSITE_WAREHOUSE?: string;
	readonly VITE_POS_WEBSITE_RESTAURANT?: string;
	readonly VITE_POS_WEBSITE_BRANCH?: string;
	readonly VITE_POS_WEBSITE_CURRENCY?: string;
	readonly VITE_POS_WEBSITE_WAITER?: string;
	readonly VITE_POS_WEBSITE_CASHIER?: string;
	readonly VITE_AI_ENABLED?: string;
	readonly VITE_AI_API_URL?: string;
	readonly VITE_AI_API_KEY?: string;
	readonly VITE_AI_MODEL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
