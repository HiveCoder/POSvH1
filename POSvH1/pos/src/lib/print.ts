import { printWithQz } from './print-qz';
import {
  getInvoicePrintHtml,
  networkPrint,
  selectNetworkPrinter,
  updatePrintStatus
} from './invoice-api';
import { PosProfileCombined } from './pos-profile-api';
import { IS_WEBSITE_MODE } from './platform';
import { getWebsiteOrder, updateWebsiteOrder } from './website-mock';
import { formatCurrency } from './utils';
import { splitVatInclusive } from './tax';

interface PrintOrderParams {
  orderId: string;
  posProfile: PosProfileCombined
}

export async function printOrder({ orderId, posProfile }: PrintOrderParams): Promise<'qz' | 'network' | 'socket'> {
  if (IS_WEBSITE_MODE) {
    const order = getWebsiteOrder(orderId);
    const title = order?.name || orderId;
    const grossTotal = Number(order?.rounded_total ?? order?.grand_total ?? 0) || 0;
    const vatSplit = splitVatInclusive(grossTotal);
    const postingDate = order?.posting_date || new Date().toISOString().slice(0, 10);
    const postingTime = order?.posting_time || new Date().toTimeString().slice(0, 8);

    const itemsHtml = (order?.items || [])
      .map((item: any, index: number) => {
        const lineAmount = Number(item.amount || 0);
        const lineSplit = splitVatInclusive(lineAmount);
        return `<tr>
          <td class="num">${index + 1}</td>
          <td>${item.item_name}</td>
          <td class="num">${item.qty}</td>
          <td class="num">${formatCurrency(lineSplit.vatableSales)}</td>
          <td class="num">${formatCurrency(lineSplit.vatAmount)}</td>
          <td class="num">${formatCurrency(lineSplit.grossAmount)}</td>
        </tr>`;
      })
      .join('');

    const summaryRows = `
      <div class="summary-row"><span>VATable Sales</span><strong>${formatCurrency(vatSplit.vatableSales)}</strong></div>
      <div class="summary-row"><span>VAT (12%)</span><strong>${formatCurrency(vatSplit.vatAmount)}</strong></div>
      <div class="summary-row total"><span>Grand Total</span><strong>${formatCurrency(vatSplit.grossAmount)}</strong></div>
    `;

    const companyName = 'URY RESTAURANT GROUP';
    const companyTin = 'TIN: [ENTER TIN NUMBER]';
    const companyAddress = 'Address: [ENTER COMPLETE BUSINESS ADDRESS]';
    const orNumber = 'OR No.: [ENTER OFFICIAL RECEIPT NUMBER]';

    const receiptFooter = `
      <div class="receipt-footer">
        <span>Receipt No.: ${title}</span>
        <span>${orNumber}</span>
        <span>Printed: ${postingDate} ${postingTime}</span>
      </div>
    `;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    :root {
      --ink: #0f172a;
      --muted: #475569;
      --line: #cbd5e1;
      --accent: #0f766e;
      --bg: #f8fafc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: var(--ink);
      background: var(--bg);
      padding: 20px;
    }
    .sheet {
      max-width: 900px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }
    .copy {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .brand {
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 0.5px;
      color: var(--accent);
      margin: 0;
    }
    .meta, .sub-meta {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.55;
      margin: 2px 0;
    }
    .company-block {
      margin-top: 6px;
      background: #f1f5f9;
      border: 1px solid #dbe4ef;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .company-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
      letter-spacing: 0.3px;
    }
    .company-line {
      font-size: 11px;
      color: #334155;
      margin: 1px 0;
    }
    .copy-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--muted);
      font-weight: 700;
      text-align: right;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 12px;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 6px;
      text-align: left;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #334155;
      background: #f8fafc;
    }
    .num { text-align: right; white-space: nowrap; }
    .summary {
      margin-top: 12px;
      margin-left: auto;
      width: min(340px, 100%);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      background: #fcfffe;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin: 6px 0;
    }
    .summary-row.total {
      border-top: 1px dashed var(--line);
      margin-top: 8px;
      padding-top: 8px;
      font-size: 16px;
    }
    .owner-note {
      margin-top: 10px;
      border-top: 1px dashed var(--line);
      padding-top: 10px;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.6;
    }
    .receipt-footer {
      margin-top: 12px;
      border-top: 1px dashed var(--line);
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 11px;
      color: #475569;
    }
    .signature-grid {
      margin-top: 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .signature-box {
      border-top: 1px solid #64748b;
      padding-top: 5px;
      font-size: 11px;
      color: #334155;
      text-align: center;
      min-height: 24px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .copy { break-inside: avoid; border-radius: 0; border-color: #999; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <section class="copy">
      <div class="header">
        <div>
          <p class="brand">URY POS</p>
          <p class="meta">Invoice: ${title}</p>
          <p class="meta">Date: ${postingDate} ${postingTime}</p>
          <p class="sub-meta">Customer: ${order?.customer || 'Walk-in Customer'}</p>
          <p class="sub-meta">Order Type: ${order?.order_type || 'Take Away'} | Table: ${order?.restaurant_table || '-'}</p>
          <div class="company-block">
            <p class="company-name">${companyName}</p>
            <p class="company-line">${companyTin}</p>
            <p class="company-line">${companyAddress}</p>
            <p class="company-line">${orNumber}</p>
          </div>
        </div>
        <div>
          <p class="copy-title">Customer Copy</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="num" style="width:32px">#</th>
            <th>Item</th>
            <th class="num" style="width:58px">Qty</th>
            <th class="num">VATable</th>
            <th class="num">VAT</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="summary">${summaryRows}</div>
      ${receiptFooter}
    </section>

    <section class="copy">
      <div class="header">
        <div>
          <p class="brand">URY POS</p>
          <p class="meta">Invoice: ${title}</p>
          <p class="meta">Date: ${postingDate} ${postingTime}</p>
          <p class="sub-meta">Cashier: ${order?.cashier || '-'}</p>
          <p class="sub-meta">Waiter: ${order?.waiter || '-'}</p>
          <div class="company-block">
            <p class="company-name">${companyName}</p>
            <p class="company-line">${companyTin}</p>
            <p class="company-line">${companyAddress}</p>
            <p class="company-line">${orNumber}</p>
          </div>
        </div>
        <div>
          <p class="copy-title">Owner Copy</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="num" style="width:32px">#</th>
            <th>Item</th>
            <th class="num" style="width:58px">Qty</th>
            <th class="num">VATable</th>
            <th class="num">VAT</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="summary">${summaryRows}</div>

      <div class="owner-note">
        Gross Sales: ${formatCurrency(vatSplit.grossAmount)}<br/>
        VAT Liability (12%): ${formatCurrency(vatSplit.vatAmount)}<br/>
        Net Revenue (Ex-VAT): ${formatCurrency(vatSplit.vatableSales)}
      </div>

      <div class="signature-grid">
        <div class="signature-box">Prepared By (Cashier Signature)</div>
        <div class="signature-box">Approved By (Owner/Manager Signature)</div>
      </div>

      ${receiptFooter}
    </section>
  </div>
  <script>window.print();</script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    updateWebsiteOrder(orderId, { invoice_printed: 1 });
    return 'socket';
  }

  const { print_type, qz_host, print_format, printer, name, cashier, multiple_cashier } = posProfile;

  if (print_type === 'qz') {
    if (!qz_host) {
      throw new Error('QZ host is not set');
    }
    const html = await getInvoicePrintHtml(orderId, print_format as string);
    await printWithQz(qz_host, html);
    await updatePrintStatus(orderId);
    return 'qz';
  } else if (print_type === 'network') {
    if (cashier && !multiple_cashier) {
      await networkPrint(orderId, printer as string, print_format as string);
    } else {
      await selectNetworkPrinter(orderId, name, print_format);
    }
    await updatePrintStatus(orderId);
    return 'network';
  } else {
    // Redirect to printview page
    const url = `/printview?doctype=POS Invoice&name=${orderId}&format=${print_format}&no_letterhead=1&settings={}&letterhead=No Letterhead&trigger_print=1&_lang=en`;
    window.open(url, '_blank', 'noopener,noreferrer');
    await updatePrintStatus(orderId);
    return 'socket';
  }
}