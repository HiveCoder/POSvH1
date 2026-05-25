import { FrappeApp } from "frappe-js-sdk";
import { FRAPPE_BASE_URL } from './platform';

const frappe = new FrappeApp(FRAPPE_BASE_URL);

export const call = frappe.call();
export const db = frappe.db();
export const auth = frappe.auth();