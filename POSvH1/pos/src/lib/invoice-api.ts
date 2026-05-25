import { call } from './frappe-sdk';
import { OrderType } from '../data/order-types';
import { IS_WEBSITE_MODE } from './platform';
import { getWebsiteOrders, updateWebsiteOrder } from './website-mock';
import { splitVatInclusive } from './tax';

export interface POSInvoice {
  name: string;
  invoice_printed: number;
  grand_total: number;
  restaurant_table: string | null;
  cashier: string;
  waiter: string;
  net_total: number;
  posting_time: string;
  total_taxes_and_charges: number;
  customer: string;
  status: 'Draft' | 'Unbilled' | 'Recently Paid' | 'Paid' | 'Consolidated' | 'Return';
  mobile_number: string;
  posting_date: string;
  rounded_total: number;
  order_type: OrderType;
}

export interface POSInvoiceItem {
  item_name: string;
  qty: number;
  amount: number;
}

export interface POSInvoiceTax {
  description: string;
  rate: number;
}

interface GetPOSInvoicesResponse {
  message: {
    data: POSInvoice[];
    next: boolean;
  };
}

interface GetPOSInvoicesParams {
  status: POSInvoice['status'];
  limit?: number;
  limit_start?: number;
  paid_limit?: number;
}

interface GetPOSInvoiceItemsResponse {
  message: [POSInvoiceItem[], POSInvoiceTax[]];
}

export async function getPOSInvoices({ 
  status, 
  limit, 
  limit_start,
  paid_limit
}: GetPOSInvoicesParams) {
  if (IS_WEBSITE_MODE) {
    const actualLimit = status === 'Recently Paid' && paid_limit ? paid_limit : limit;
    const allOrders = getWebsiteOrders() as POSInvoice[];
    const filtered = allOrders.filter((order) => (status ? order.status === status : true));
    const start = limit_start || 0;
    const page = typeof actualLimit === 'number' ? filtered.slice(start, start + actualLimit) : filtered.slice(start);

    return {
      invoices: page,
      hasMore: typeof actualLimit === 'number' ? start + actualLimit < filtered.length : false,
    };
  }

  try {
    // Use paid_limit as the limit for Recently Paid status
    const actualLimit = status === 'Recently Paid' && paid_limit ? paid_limit : limit;
    
    const response = await call.get<GetPOSInvoicesResponse>(
      'ury.ury_pos.api.getPosInvoice',
      {
        status,
        limit: actualLimit,
        limit_start
      }
    );

    return {
      invoices: response.message.data,
      hasMore: response.message.next
    };
  } catch (error) {
    console.error('Error fetching POS invoices:', error);
    throw new Error('Failed to fetch POS invoices');
  }
}

export async function getPOSInvoiceItems(invoiceId: string) {
  if (IS_WEBSITE_MODE) {
    const order = (getWebsiteOrders() as any[]).find((entry) => entry.name === invoiceId);
    if (!order) {
      return { items: [], taxes: [] };
    }

    const subtotal = Number(order.rounded_total || order.grand_total || 0) || 0;
    const vatSplit = splitVatInclusive(subtotal);

    return {
      items: (order.items || []).map((item: any) => ({
        item_name: item.item_name || item.name || '',
        qty: Number(item.qty || 0),
        amount: Number(item.amount || 0),
      })),
      taxes: subtotal > 0 ? [{ description: 'VAT', rate: vatSplit.vatRate }] : [],
    };
  }

  try {
    const response = await call.get<GetPOSInvoiceItemsResponse>(
      'ury.ury_pos.api.getPosInvoiceItems',
      {
        invoice: invoiceId
      }
    );

    return {
      items: response.message[0],
      taxes: response.message[1]
    };
  } catch (error) {
    console.error('Error fetching POS invoice items:', error);
    throw new Error('Failed to fetch POS invoice items');
  }
}

export async function updateInvoiceStatus(
  invoice: string,
  status: POSInvoice['status']
) {
  if (IS_WEBSITE_MODE) {
    updateWebsiteOrder(invoice, { status });
    return;
  }

  try {
    await call.post('ury.ury_pos.api.updatePosInvoiceStatus', {
      invoice,
      status,
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw new Error('Failed to update invoice status');
  }
} 

export async function searchPosInvoice(query: string, status: string) {
  if (IS_WEBSITE_MODE) {
    const key = query.trim().toLowerCase();
    return (getWebsiteOrders() as POSInvoice[]).filter((order) => {
      const statusMatch = status ? order.status === status : true;
      const queryMatch = !key
        || order.name.toLowerCase().includes(key)
        || (order.customer || '').toLowerCase().includes(key)
        || (order.mobile_number || '').toLowerCase().includes(key);
      return statusMatch && queryMatch;
    });
  }

  try {
    const response = await call.get('ury.ury_pos.api.searchPosInvoice', {
      query,
      status,
    });
    return response.message;
  } catch (error) {
    console.error('Error searching POS invoices:', error);
    throw error;
  }
} 

export async function getInvoicePrintHtml(invoiceId: string, printFormat: string) {
  if (IS_WEBSITE_MODE) {
    const order = (getWebsiteOrders() as any[]).find((entry) => entry.name === invoiceId);
    if (!order) {
      throw new Error('Failed to fetch invoice print HTML');
    }

    const rows = (order.items || [])
      .map((item: any) => `<tr><td>${item.item_name}</td><td>${item.qty}</td><td>${Number(item.amount || 0).toFixed(2)}</td></tr>`)
      .join('');

    return `
      <html>
        <head><title>${invoiceId}</title></head>
        <body>
          <h1>POS Invoice ${invoiceId}</h1>
          <p>Customer: ${order.customer || 'Walk-in Customer'}</p>
          <p>Status: ${order.status}</p>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p>Grand Total: ${Number(order.grand_total || 0).toFixed(2)}</p>
          <p>Print Format: ${printFormat || 'Default'}</p>
        </body>
      </html>
    `;
  }

  try {
    const response = await call.get<{ message: { html: string } }>(
      'frappe.www.printview.get_html_and_style',
      {
        doc: 'POS Invoice',
        name: invoiceId,
        print_format: printFormat,
        _lang: 'en',
        no_letterhead: 1,
        letterhead:"No Letterhead",
        settings:{}
      }
    );
    return response.message.html;
  } catch (error) {
    console.error('Error fetching invoice print HTML:', error);
    throw new Error('Failed to fetch invoice print HTML');
  }
} 

export async function networkPrint(orderId: string, printer: string, printFormat: string) {
  if (IS_WEBSITE_MODE) {
    return;
  }

  await call.post('ury.ury.api.ury_print.network_printing', {
    doctype: 'POS Invoice',
    name: orderId,
    printer_setting: printer,
    print_format: printFormat,
  });
}

export async function selectNetworkPrinter(orderId: string, posProfile: string, printFormat?: string | null) {
  if (IS_WEBSITE_MODE) {
    return;
  }

  await call.post('ury.ury.api.ury_print.select_network_printer', {
    invoice_id: orderId,
    pos_profile: posProfile,
    print_format: printFormat,
  });
}


export async function updatePrintStatus(orderId: string) {
  if (IS_WEBSITE_MODE) {
    return;
  }

  await call.post('ury.ury.api.ury_print.qz_print_update', { invoice: orderId });
} 