import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDisplay } from './dateUtils';

const KES = (n) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function buildDailyReportPdf(date, data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = margin;

  doc.setFontSize(18);
  doc.text('DAILY SALES REPORT', margin, y);
  y += 24;

  doc.setFontSize(11);
  doc.text(`Date:       ${date}`, margin, y);
  y += 16;
  doc.text(`Generated:  ${formatDisplay(new Date())}`, margin, y);
  y += 24;

  const s = data.summary;
  doc.setFontSize(13);
  doc.text('Summary', margin, y);
  y += 16;
  doc.setFontSize(11);
  const summaryLines = [
    `Transactions:        ${s.totalTransactions}`,
    `Counter (cash):      ${s.counterCount}    ${KES(s.counterTotal)}`,
    `Credit sales:        ${s.creditCount}    ${KES(s.creditTotal)}`,
    `Total revenue:                     ${KES(s.totalRevenue)}`,
    `Tax collected:                     ${KES(s.totalTax)}`,
    `Discount given:                    ${KES(s.totalDiscount)}`,
    `Paid on account:                   ${KES(s.accountPayments)}`
  ];
  summaryLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 14;
  });
  y += 8;

  doc.setFontSize(13);
  doc.text('Transactions', margin, y);
  y += 8;
  autoTable(doc, {
    startY: y + 4,
    head: [['TXN#', 'Time', 'Type', 'Customer', 'Items', 'Total']],
    body: data.transactions.map((t) => [
      `T${String(t.id).padStart(4, '0')}`,
      formatTime(t.created_at),
      t.sales_type,
      t.customer_name || '-',
      String(t.items_count || 0),
      KES(t.net_amount)
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [63, 81, 181] },
    margin: { left: margin, right: margin }
  });
  y = doc.lastAutoTable.finalY + 16;

  doc.setFontSize(13);
  doc.text('Top Products Sold', margin, y);
  y += 8;
  autoTable(doc, {
    startY: y + 4,
    head: [['Product', 'Qty', 'Revenue']],
    body: data.topProducts.map((p) => [
      p.name,
      String(p.qty_sold || 0),
      KES(p.revenue)
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [63, 81, 181] },
    margin: { left: margin, right: margin }
  });
  y = doc.lastAutoTable.finalY + 16;

  doc.setFontSize(13);
  doc.text('Expenses Today', margin, y);
  y += 8;
  autoTable(doc, {
    startY: y + 4,
    head: [['Type', 'Amount']],
    body: [
      ...data.expenses.map((e) => [e.type, KES(e.amount)]),
      ['Total', KES(data.expensesTotal)]
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [63, 81, 181] },
    margin: { left: margin, right: margin }
  });
  y = doc.lastAutoTable.finalY + 24;

  doc.setFontSize(13);
  doc.text(`Net for the day:  ${KES(data.netForDay)}`, margin, y);

  return new Uint8Array(doc.output('arraybuffer'));
}
