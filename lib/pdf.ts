/**
 * lib/pdf.ts — Generación de facturas en PDF con jsPDF + jspdf-autotable
 * Se ejecuta únicamente en el servidor (API routes, webhooks).
 */

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  orderNumber: number;
  date: string; // dd/mm/yyyy
  customerName: string;
  customerEmail: string;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  couponCode?: string | null;
  total: number;
  paymentMethod: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // Importaciones dinámicas para evitar problemas con SSR / bundle del cliente
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Colores de la paleta DECKLAB
  const DARK = [7, 8, 10] as [number, number, number];
  const GRAPHITE = [17, 18, 20] as [number, number, number];
  const BORDER = [54, 55, 57] as [number, number, number];
  const SNOW = [255, 255, 255] as [number, number, number];
  const MUTED = [106, 107, 108] as [number, number, number];
  const ACCENT = [89, 212, 153] as [number, number, number];

  const pageW = doc.internal.pageSize.getWidth();

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...SNOW);
  doc.text("DECKLAB", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("SHOP", 14, 24);

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("FACTURA / RECEIPT", pageW - 14, 15, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ACCENT);
  doc.text(`#${data.orderNumber}`, pageW - 14, 23, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(data.date, pageW - 14, 30, { align: "right" });

  // ── Cliente & dirección ────────────────────────────────────────────────────
  doc.setFillColor(...GRAPHITE);
  doc.rect(0, 40, pageW, 38, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("FACTURADO A", 14, 51);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SNOW);
  doc.text(data.customerName, 14, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);

  const addressLines = [
    data.customerEmail,
    data.address.line1,
    data.address.line2 ?? null,
    `${data.address.postalCode} ${data.address.city}`,
    data.address.country,
  ].filter(Boolean) as string[];

  let addrY = 64;
  for (const line of addressLines) {
    doc.text(line, 14, addrY);
    addrY += 5;
  }

  // Método de pago (derecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("MÉTODO DE PAGO", pageW - 14, 51, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SNOW);
  doc.text(data.paymentMethod, pageW - 14, 58, { align: "right" });

  // ── Tabla de líneas ────────────────────────────────────────────────────────
  const tableStartY = 82;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Descripción", "Cant.", "Precio unit.", "Total"]],
    body: data.items.map((item) => [
      item.description,
      String(item.quantity),
      `${item.unitPrice.toFixed(2).replace(".", ",")} €`,
      `${item.total.toFixed(2).replace(".", ",")} €`,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5,
      textColor: [156, 156, 157],
      fillColor: GRAPHITE,
      lineColor: BORDER,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: DARK,
      textColor: MUTED,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [20, 21, 23],
    },
    columnStyles: {
      0: { cellWidth: "auto", textColor: SNOW },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right", textColor: SNOW, fontStyle: "bold" },
    },
  });

  // ── Totales ────────────────────────────────────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const totalLines: [string, string, boolean?][] = [
    ["Subtotal", `${data.subtotal.toFixed(2).replace(".", ",")} €`],
  ];

  if (data.discountAmount && data.discountAmount > 0) {
    const label = data.couponCode
      ? `Descuento (${data.couponCode})`
      : "Descuento";
    totalLines.push([label, `-${data.discountAmount.toFixed(2).replace(".", ",")} €`]);
  }

  if (data.shippingCost > 0) {
    totalLines.push(["Envío", `${data.shippingCost.toFixed(2).replace(".", ",")} €`]);
  } else {
    totalLines.push(["Envío", "GRATIS"]);
  }

  let totY = finalY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const [label, value] of totalLines) {
    doc.setTextColor(...MUTED);
    doc.text(label, pageW - 70, totY);
    doc.setTextColor(...SNOW);
    doc.text(value, pageW - 14, totY, { align: "right" });
    totY += 7;
  }

  // Separador antes del total
  doc.setDrawColor(...BORDER);
  doc.line(pageW - 70, totY - 3, pageW - 14, totY - 3);

  // TOTAL
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text("TOTAL", pageW - 70, totY + 4);
  doc.setTextColor(...SNOW);
  doc.text(`${data.total.toFixed(2).replace(".", ",")} €`, pageW - 14, totY + 4, { align: "right" });

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...DARK);
  doc.rect(0, pageH - 20, pageW, 20, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text("DECKLAB SHOP · Todos los productos se venden sin posibilidad de devolución.", 14, pageH - 11);
  doc.text("decklab.rayelus.com", pageW - 14, pageH - 11, { align: "right" });

  // Convertir a Buffer compatible con Node.js
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
