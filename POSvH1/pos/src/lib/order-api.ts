import { call } from './frappe-sdk';
import { IS_WEBSITE_MODE } from './platform';
import { getWebsiteOrders, saveWebsiteOrder } from './website-mock';
import { splitVatInclusive } from './tax';

export interface POSInvoiceItem {
  name: string;
  item_code: string;
  item_name: string;
  description: string;
  item_group: string;
  image: string;
  qty: number;
  comment: string;
  rate: number;
  amount: number;
  discount_percentage: number;
  discount_amount: number;
}

export interface POSInvoice {
  name: string;
  title: string;
  customer: string;
  customer_name: string;
  mobile_number: string;
  customer_group: string;
  territory: string;
  posting_date: string;
  posting_time: string;
  order_type: string;
  restaurant_table: string;
  custom_restaurant_room: string;
  status: string;
  total: number;
  grand_total: number;
  items: POSInvoiceItem[];
}

export interface TableOrder {
  message: POSInvoice | null;
}

/**
 * Fetches the current active order/invoice for a table if any exists
 * @param table_no The table number to fetch the order for
 * @returns The order details and customer information if an active order exists
 */
export async function getTableOrder(table_no: string): Promise<TableOrder> {
  if (IS_WEBSITE_MODE) {
    const existing = getWebsiteOrders().find((order) => order.restaurant_table === table_no && order.status === 'Draft');
    return { message: existing || null } as TableOrder;
  }

  const { call } = await import('./frappe-sdk');
  try {
    const res = await call.get('ury.ury.doctype.ury_order.ury_order.get_order_invoice', { 
      table: table_no
    });
    return res as TableOrder;
  } catch (error) {
    console.error('Error fetching table order:', error);
    return { message: null };
  }
} 

export interface SyncOrderRequest {
  table?: string;
  customer?: string;
  items: Array<{
    item: string;
    item_name: string;
    rate: number;
    qty: number;
  }>;
  no_of_pax: number;
  mode_of_payment?: string;
  cashier?: string;
  owner?: string;
  waiter?: string;
  pos_profile: string;
  invoice: string | null;
  aggregator_id?: string | null;
  order_type: string;
  last_invoice: string | null;
  comments?: string | null;
  room?: string;
}

export const syncOrder = async (data: SyncOrderRequest) => {
  if (IS_WEBSITE_MODE) {
    const now = new Date();
    const postingDate = now.toISOString().slice(0, 10);
    const postingTime = now.toTimeString().slice(0, 8);
    const grossTotal = data.items.reduce((sum, item) => sum + (item.rate * item.qty), 0);
    const vatSplit = splitVatInclusive(grossTotal);

    const order = {
      name: data.invoice || `WEB-INV-${Date.now()}`,
      title: data.customer || 'Walk-in Customer',
      customer: data.customer || 'Walk-in Customer',
      customer_name: data.customer || 'Walk-in Customer',
      mobile_number: '',
      customer_group: 'Individual',
      territory: 'All Territories',
      posting_date: postingDate,
      posting_time: postingTime,
      order_type: data.order_type,
      restaurant_table: data.table || '',
      custom_restaurant_room: data.room || '',
      status: 'Draft',
      total: grossTotal,
      grand_total: grossTotal,
      rounded_total: Math.round(grossTotal),
      net_total: vatSplit.vatableSales,
      total_taxes_and_charges: vatSplit.vatAmount,
      custom_vat_rate: vatSplit.vatRate,
      items: data.items.map((item, idx) => ({
        name: `${item.item}-${idx}`,
        item_code: item.item,
        item_name: item.item_name,
        description: '',
        item_group: '',
        image: '',
        qty: item.qty,
        comment: '',
        rate: item.rate,
        amount: item.rate * item.qty,
        discount_percentage: 0,
        discount_amount: 0,
      })),
      invoice_printed: 0,
    };

    saveWebsiteOrder(order);
    return { message: { status: 'success', order_id: order.name } };
  }

  return call.post( 'ury.ury.doctype.ury_order.ury_order.sync_order',data);
}; 