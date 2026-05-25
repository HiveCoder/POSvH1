import { splitVatInclusive } from './tax';

type ReportOrder = {
  name: string;
  posting_date?: string;
  posting_time?: string;
  customer?: string;
  order_type?: string;
  restaurant_table?: string | null;
  status?: string;
  rounded_total?: number;
  grand_total?: number;
  net_total?: number;
  total_taxes_and_charges?: number;
};

type ReportRow = {
  invoice: string;
  posting_date: string;
  posting_time: string;
  customer: string;
  order_type: string;
  table: string;
  gross_sales: string;
  vat_12: string;
  net_revenue: string;
  status: string;
};

function escapeCsv(value: string | number | null | undefined): string {
  const str = `${value ?? ''}`;
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadOwnerDailyReportCsv(orders: ReportOrder[], dateLabel?: string) {
  const { rows, totals } = buildOwnerReportRows(orders);

  const header = [
    'Invoice',
    'Date',
    'Time',
    'Customer',
    'Order Type',
    'Table',
    'Gross Sales',
    'VAT 12%',
    'Net Revenue',
    'Status',
  ];

  const lines = [header.map(escapeCsv).join(',')];

  rows.forEach((row) => {
    lines.push(
      [
        row.invoice,
        row.posting_date,
        row.posting_time,
        row.customer,
        row.order_type,
        row.table,
        row.gross_sales,
        row.vat_12,
        row.net_revenue,
        row.status,
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  lines.push(
    [
      'TOTAL',
      dateLabel || '',
      '',
      '',
      '',
      '',
      totals.gross.toFixed(2),
      totals.vat.toFixed(2),
      totals.net.toFixed(2),
      '',
    ]
      .map(escapeCsv)
      .join(',')
  );

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const suffix = (dateLabel || new Date().toISOString().slice(0, 10)).replace(/[^0-9A-Za-z_-]/g, '_');
  anchor.href = url;
  anchor.download = `owner_daily_report_${suffix}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildOwnerReportRows(orders: ReportOrder[]): { rows: ReportRow[]; totals: { gross: number; vat: number; net: number } } {
  const paidOrders = orders.filter((order) => order.status === 'Paid' || order.status === 'Recently Paid');

  const rows = paidOrders.map((order) => {
    const gross = Number(order.rounded_total ?? order.grand_total ?? 0) || 0;
    const vat = Number(order.total_taxes_and_charges || 0) || splitVatInclusive(gross).vatAmount;
    const net = Number(order.net_total || 0) || splitVatInclusive(gross).vatableSales;

    return {
      invoice: order.name,
      posting_date: order.posting_date || '',
      posting_time: order.posting_time || '',
      customer: order.customer || '',
      order_type: order.order_type || '',
      table: order.restaurant_table || '-',
      gross_sales: gross.toFixed(2),
      vat_12: vat.toFixed(2),
      net_revenue: net.toFixed(2),
      status: order.status || '',
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.gross += Number(row.gross_sales);
      acc.vat += Number(row.vat_12);
      acc.net += Number(row.net_revenue);
      return acc;
    },
    { gross: 0, vat: 0, net: 0 }
  );

  return { rows, totals };
}

export function downloadOwnerDailyReportXls(orders: ReportOrder[], dateLabel?: string) {
  const { rows, totals } = buildOwnerReportRows(orders);
  const reportDate = dateLabel || new Date().toISOString().slice(0, 10);

  const rowsHtml = rows
    .map(
      (row) => `
      <tr>
        <td>${row.invoice}</td>
        <td>${row.posting_date}</td>
        <td>${row.posting_time}</td>
        <td>${row.customer}</td>
        <td>${row.order_type}</td>
        <td>${row.table}</td>
        <td style="mso-number-format:'0.00';text-align:right;">${row.gross_sales}</td>
        <td style="mso-number-format:'0.00';text-align:right;">${row.vat_12}</td>
        <td style="mso-number-format:'0.00';text-align:right;">${row.net_revenue}</td>
        <td>${row.status}</td>
      </tr>
    `
    )
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #bfc8d4; padding: 6px; font-size: 12px; }
    th { background: #0f766e; color: #fff; text-transform: uppercase; letter-spacing: 0.2px; }
    .title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .meta { font-size: 12px; color: #334155; margin-bottom: 10px; }
    .total-row td { font-weight: 700; background: #e6f4f1; }
  </style>
</head>
<body>
  <div class="title">URY POS Owner Daily Report</div>
  <div class="meta">Report Date: ${reportDate}</div>
  <table>
    <thead>
      <tr>
        <th>Invoice</th>
        <th>Date</th>
        <th>Time</th>
        <th>Customer</th>
        <th>Order Type</th>
        <th>Table</th>
        <th>Gross Sales</th>
        <th>VAT 12%</th>
        <th>Net Revenue</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="total-row">
        <td>TOTAL</td>
        <td>${reportDate}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td style="mso-number-format:'0.00';text-align:right;">${totals.gross.toFixed(2)}</td>
        <td style="mso-number-format:'0.00';text-align:right;">${totals.vat.toFixed(2)}</td>
        <td style="mso-number-format:'0.00';text-align:right;">${totals.net.toFixed(2)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const suffix = reportDate.replace(/[^0-9A-Za-z_-]/g, '_');
  anchor.href = url;
  anchor.download = `owner_daily_report_${suffix}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
