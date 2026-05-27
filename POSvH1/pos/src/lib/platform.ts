const rawPlatform = String(import.meta.env.VITE_POS_PLATFORM || 'frappe').toLowerCase();

export const POS_PLATFORM: 'frappe' | 'website' = rawPlatform === 'website' ? 'website' : 'frappe';
export const IS_WEBSITE_MODE = POS_PLATFORM === 'website';

const defaultBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

export const FRAPPE_BASE_URL = import.meta.env.VITE_FRAPPE_BASE_URL || defaultBase;
export const ROUTER_BASENAME = import.meta.env.VITE_POS_ROUTER_BASENAME || (IS_WEBSITE_MODE ? '/' : '/pos');

export const WEBSITE_USER = {
  id: import.meta.env.VITE_POS_WEBSITE_USER || 'web-cashier@example.com',
  fullName: import.meta.env.VITE_POS_WEBSITE_FULL_NAME || 'Website Cashier',
  roles: String(import.meta.env.VITE_POS_WEBSITE_ROLES || 'Cashier,HLR Cashier')
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean),
};
