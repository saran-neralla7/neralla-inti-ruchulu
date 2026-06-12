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

  // Sort orders sequentially: oldest first (ascending order of orderNumber / createdAt)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.orderNumber && b.orderNumber) {
      return a.orderNumber.localeCompare(b.orderNumber);
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // ─── CALCULATE SUMMARY TOTALS ───
  const totalOrders = sortedOrders.length;
  
  const getOrderPaymentBreakdown = (o: Order) => {
    const itemsTotal = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = o.actualShippingCost ?? 0;
    const expectedTotal = itemsTotal + shipping;
    
    let paid = 0;
    if (o.paymentStatus === 'Paid') {
      paid = o.actualAmountPaid !== null && o.actualAmountPaid !== undefined ? o.actualAmountPaid : expectedTotal;
    } else if (o.paymentStatus === 'Partially Paid') {
      paid = o.actualAmountPaid !== null && o.actualAmountPaid !== undefined 
        ? o.actualAmountPaid 
        : ((o.advancePaid ?? 0) + (o.balancePaid ?? 0));
    } else {
      // Unpaid or other
      paid = o.actualAmountPaid !== null && o.actualAmountPaid !== undefined ? o.actualAmountPaid : 0;
    }
    
    const pending = o.status === 'Cancelled' ? 0 : Math.max(0, expectedTotal - paid);
    return { expectedTotal, paid, pending };
  };

  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalCourierCost = 0;

  sortedOrders.forEach(o => {
    const { paid, pending } = getOrderPaymentBreakdown(o);
    totalCollected += paid;
    totalOutstanding += pending;
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
  doc.text(`Rs. ${totalCollected.toFixed(0)}`, 70, metricsY + 14);
  
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text(`Rs. ${totalOutstanding.toFixed(0)}`, 115, metricsY + 14);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Rs. ${totalCourierCost.toFixed(0)}`, 160, metricsY + 14);

  // ─── ORDERS TABLE ───
  let tableY = 76;
  
  // Headers
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, tableY, 180, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text('ORDER NO', 16, tableY + 5.5);
  doc.text('DATE', 42, tableY + 5.5);
  doc.text('CUSTOMER', 62, tableY + 5.5);
  doc.text('STATUS', 105, tableY + 5.5);
  doc.text('PAID', 133, tableY + 5.5, { align: 'right' });
  doc.text('PENDING', 163, tableY + 5.5, { align: 'right' });
  doc.text('TOTAL', 194, tableY + 5.5, { align: 'right' });

  // Rows
  let curY = tableY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);

  let pageNum = 1;

  sortedOrders.forEach((o) => {
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
      doc.text('ORDER NO', 16, 43.5);
      doc.text('DATE', 42, 43.5);
      doc.text('CUSTOMER', 62, 43.5);
      doc.text('STATUS', 105, 43.5);
      doc.text('PAID', 133, 43.5, { align: 'right' });
      doc.text('PENDING', 163, 43.5, { align: 'right' });
      doc.text('TOTAL', 194, 43.5, { align: 'right' });
      
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
    doc.text(dateStr, 42, curY + 5.5);

    // Customer
    const nameStr = o.customerName.length > 20 ? o.customerName.substring(0, 18) + '...' : o.customerName;
    doc.text(nameStr, 62, curY + 5.5);
    
    // Status
    doc.text(o.status, 105, curY + 5.5);
    
    // Paid, Pending, Total calculations
    const { expectedTotal, paid, pending } = getOrderPaymentBreakdown(o);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${paid.toFixed(0)}`, 133, curY + 5.5, { align: 'right' });

    if (pending > 0.01) {
      doc.setTextColor(180, 83, 9); // Amber
    } else {
      doc.setTextColor(34, 197, 94); // Green
    }
    doc.text(`Rs. ${pending.toFixed(0)}`, 163, curY + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Rs. ${expectedTotal.toFixed(0)}`, 194, curY + 5.5, { align: 'right' });

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
