import jsPDF from 'jspdf';
import type { Order } from '@/types';

function getLogoBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = (err) => reject(err);
  });
}

interface ReportFilterSettings {
  searchQuery?: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  selectedProduct?: string;
}

export async function generateOrdersReportPDF(orders: Order[], filters: ReportFilterSettings): Promise<void> {
  let logoBase64 = '';
  try {
    logoBase64 = await getLogoBase64('/logo.png');
  } catch (err) {
    console.error('Failed to load logo for PDF:', err);
  }

  const doc = new jsPDF();
  
  // Color palette
  const primaryColor = [60, 22, 17]; // #3c1611 (maroon)
  const textColor = [51, 51, 51]; // #333333
  const secondaryTextColor = [102, 102, 102]; // #666666
  const borderColor = [229, 231, 235]; // #e5e7eb
  const lightBgColor = [250, 250, 250]; // #fafafa

  // Helper to draw watermark
  const drawWatermark = () => {
    if (logoBase64) {
      try {
        const gState = new (doc as any).GState({ opacity: 0.04 });
        (doc as any).setGState(gState);
        doc.addImage(logoBase64, 'PNG', 55, 98.5, 100, 100);
        const resetState = new (doc as any).GState({ opacity: 1.0 });
        (doc as any).setGState(resetState);
      } catch (err) {
        console.error('Watermark opacity failed:', err);
      }
    }
  };

  // Helper to draw header
  const drawHeader = (pageNum: number, totalPages: number) => {
    // Header section (Background banner)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 32, 'F');

    // Title / Branding
    doc.setTextColor(255, 255, 255);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 15, 6, 20, 20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('NERALLA INTI RUCHULU', 38, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Premium Andhra Home Foods', 38, 20);
      } catch (err) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('NERALLA INTI RUCHULU', 15, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Premium Andhra Home Foods', 15, 20);
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('NERALLA INTI RUCHULU', 15, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Premium Andhra Home Foods', 15, 20);
    }

    // Report label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('ORDERS SUMMARY REPORT', 195, 14, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Generated: ${dateStr}`, 195, 20, { align: 'right' });

    // Footer page count
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.setFontSize(8);
    doc.text(`Page ${pageNum} of ${totalPages}`, 195, 287, { align: 'right' });
  };

  // ─── CALCULATE SUMMARY TOTALS ───
  const totalOrders = orders.length;
  
  const getOrderTotal = (o: Order) => o.items.reduce((s, i) => s + i.price * i.quantity, 0);

  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalCourierCost = 0;

  orders.forEach(o => {
    const orderTotal = o.actualAmountPaid !== null && o.actualAmountPaid !== undefined ? o.actualAmountPaid : getOrderTotal(o);
    if (o.paymentStatus === 'Paid') {
      totalCollected += orderTotal;
    } else {
      totalOutstanding += orderTotal;
    }
    totalCourierCost += o.actualShippingCost ?? 0;
  });

  // ─── PAGE 1 LAYOUT ───
  drawWatermark();
  drawHeader(1, 1); // We start with page 1, will adjust total pages at the end if multi-page

  // Reset text color
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Active filters section
  let filterY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Active Filters:', 15, filterY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let filterText = `Status: ${filters.datePreset === 'all' ? 'All Time' : filters.datePreset}`;
  if (filters.datePreset === 'custom') {
    filterText += ` (${filters.startDate || 'Start'} to ${filters.endDate || 'End'})`;
  }
  if (filters.selectedProduct && filters.selectedProduct !== 'all') {
    filterText += ` | Product: ${filters.selectedProduct}`;
  }
  if (filters.searchQuery) {
    filterText += ` | Search: "${filters.searchQuery}"`;
  }
  doc.text(filterText, 39, filterY);

  // Summary Metrics Box
  let metricsY = 46;
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, metricsY, 180, 20, 'FD');

  // Summary labels and values
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text('TOTAL ORDERS', 25, metricsY + 6);
  doc.text('TOTAL COLLECTED', 70, metricsY + 6);
  doc.text('OUTSTANDING (UNPAID)', 115, metricsY + 6);
  doc.text('COURIER COST PAID', 160, metricsY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(totalOrders.toString(), 25, metricsY + 14);
  doc.text(`₹${totalCollected.toFixed(0)}`, 70, metricsY + 14);
  
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text(`₹${totalOutstanding.toFixed(0)}`, 115, metricsY + 14);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`₹${totalCourierCost.toFixed(0)}`, 160, metricsY + 14);

  // ─── ORDERS TABLE ───
  let tableY = 76;
  
  // Headers
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, tableY, 180, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text('ORDER NO', 17, tableY + 5.5);
  doc.text('DATE', 46, tableY + 5.5);
  doc.text('CUSTOMER', 70, tableY + 5.5);
  doc.text('STATUS', 115, tableY + 5.5);
  doc.text('PAYMENT', 145, tableY + 5.5);
  doc.text('AMOUNT', 193, tableY + 5.5, { align: 'right' });

  // Rows
  let curY = tableY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);

  let pageNum = 1;

  orders.forEach((o) => {
    // Check page overflow
    if (curY > 270) {
      doc.addPage();
      pageNum += 1;
      drawWatermark();
      drawHeader(pageNum, pageNum); // placeholder total pages
      
      // Redraw table headers on new page
      doc.setFillColor(243, 244, 246);
      doc.rect(15, 38, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      doc.text('ORDER NO', 17, 43.5);
      doc.text('DATE', 46, 43.5);
      doc.text('CUSTOMER', 70, 43.5);
      doc.text('STATUS', 115, 43.5);
      doc.text('PAYMENT', 145, 43.5);
      doc.text('AMOUNT', 193, 43.5, { align: 'right' });
      
      curY = 46;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    }

    // Row separator line
    doc.line(15, curY, 195, curY);

    // Order number and date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(o.orderNumber || 'Pending', 17, curY + 5.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    doc.text(dateStr, 46, curY + 5.5);

    // Customer
    doc.text(o.customerName, 70, curY + 5.5);
    
    // Status
    doc.text(o.status, 115, curY + 5.5);
    
    // Payment Status and Actual amount paid if any
    const payStatusStr = o.paymentStatus || 'Unpaid';
    doc.setFont('helvetica', payStatusStr === 'Paid' ? 'bold' : 'normal');
    if (payStatusStr === 'Paid') {
      doc.setTextColor(22, 101, 52); // green-800
      doc.text('Paid', 145, curY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      if (o.actualAmountPaid !== null && o.actualAmountPaid !== undefined) {
        doc.text(` (₹${o.actualAmountPaid})`, 152, curY + 5.5);
      }
    } else {
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text('Unpaid', 145, curY + 5.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
    
    doc.setFont('helvetica', 'bold');
    const orderTotal = o.actualAmountPaid !== null && o.actualAmountPaid !== undefined ? o.actualAmountPaid : getOrderTotal(o);
    doc.text(`₹${orderTotal.toFixed(0)}`, 193, curY + 5.5, { align: 'right' });

    curY += 8;
  });

  // End of table bottom line
  doc.line(15, curY, 195, curY);

  // Set total pages in footer for all pages retrospectively
  const totalPagesCount = pageNum;
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    drawHeader(i, totalPagesCount);
  }

  // Save report PDF
  const filterSummaryName = filters.datePreset === 'all' ? 'All-Time' : filters.datePreset;
  doc.save(`NIR-Orders-Report-${filterSummaryName}.pdf`);
}
