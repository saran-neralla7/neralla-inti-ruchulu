import jsPDF from 'jspdf';

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

export async function generateOrderPDF(order: any): Promise<void> {
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

  // Header section (Background banner)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Title / Branding (with logo if loaded)
  doc.setTextColor(255, 255, 255);
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', 15, 11, 18, 18);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('NERALLA INTI RUCHULU', 38, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Premium Andhra Home Foods', 38, 27);
    } catch (err) {
      console.error('Failed to add logo image to PDF:', err);
      // Fallback
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('NERALLA INTI RUCHULU', 15, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Premium Andhra Home Foods', 15, 25);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('NERALLA INTI RUCHULU', 15, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Premium Andhra Home Foods', 15, 25);
  }

  // Invoice label on the right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ORDER INVOICE', 195, 18, { align: 'right' });

  // Reset text color
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Watermark logo in background (very subtle opacity)
  if (logoBase64) {
    try {
      const gState = new (doc as any).GState({ opacity: 0.05 });
      (doc as any).setGState(gState);
      doc.addImage(logoBase64, 'PNG', 55, 98.5, 100, 100);
      // Restore opacity to normal
      const resetState = new (doc as any).GState({ opacity: 1.0 });
      (doc as any).setGState(resetState);
    } catch (err) {
      console.error('Watermark opacity failed:', err);
    }
  }

  // Order Info Column 1 (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Order Details', 15, 52);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text(`Order Number:`, 15, 59);
  doc.text(`Status:`, 15, 65);
  doc.text(`Date Placed:`, 15, 71);
  if (order.approvedAt) {
    doc.text(`Date Approved:`, 15, 77);
  }

  // Values Column 1
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(order.orderNumber || 'PENDING APPROVAL', 45, 59);
  doc.text(order.status, 45, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }), 45, 71);
  if (order.approvedAt) {
    doc.text(new Date(order.approvedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }), 45, 77);
  }

  // Order Info Column 2 (Right - Customer Info)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Customer Information', 115, 52);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text(`Name:`, 115, 59);
  doc.text(`Phone:`, 115, 65);
  doc.text(`Delivery Address:`, 115, 71);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(order.customerName || 'N/A', 148, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerPhone || 'N/A', 148, 65);
  
  // Address wrap logic
  const addressLines = doc.splitTextToSize(order.customerAddress || 'N/A', 50);
  doc.text(addressLines, 148, 71);

  // Determine starting Y for table after address wrap
  const addressHeight = addressLines.length * 6;
  const tableStartY = Math.max(71 + addressHeight + 8, 90);

  // Table Headers
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, tableStartY, 180, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', 18, tableStartY + 5.5);
  doc.text('Item Description', 28, tableStartY + 5.5);
  doc.text('Size', 98, tableStartY + 5.5);
  doc.text('Pkg', 123, tableStartY + 5.5);
  doc.text('Qty', 143, tableStartY + 5.5);
  doc.text('Price', 160, tableStartY + 5.5);
  doc.text('Total', 180, tableStartY + 5.5);

  let currentY = tableStartY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Table rows
  (order.items || []).forEach((item: any, idx: number) => {
    // Alternate backgrounds
    if (idx % 2 === 1) {
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.rect(15, currentY, 180, 8, 'F');
    }
    
    // Borders
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(15, currentY + 8, 195, currentY + 8);

    doc.text((idx + 1).toString(), 18, currentY + 5.5);
    
    const prodName = item.productName_en || 'Product';
    const displayName = prodName.length > 32 ? prodName.substring(0, 30) + '...' : prodName;
    doc.text(displayName, 28, currentY + 5.5);
    doc.text(item.variantSize || '-', 98, currentY + 5.5);
    doc.text(item.variantPackaging || '-', 123, currentY + 5.5);
    doc.text(item.quantity.toString(), 143, currentY + 5.5);
    doc.text(`INR ${item.price}`, 160, currentY + 5.5);
    doc.text(`INR ${(item.price * item.quantity)}`, 180, currentY + 5.5);
    
    currentY += 8;
  });

  // Totals calculations
  const subtotal = (order.items || []).reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = order.actualShippingCost ?? order.deliveryCharge ?? 0;
  const discount = order.discount ?? 0;
  const grandTotal = subtotal + deliveryCharge - discount;
  
  let advancePaid = order.advancePaid ?? 0;
  let balancePaid = order.balancePaid ?? 0;
  let totalPaid = 0;
  if (order.paymentStatus === 'Paid') {
    totalPaid = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : grandTotal;
    if (advancePaid === 0 && balancePaid === 0) {
      balancePaid = totalPaid;
    }
  } else if (order.paymentStatus === 'Partially Paid') {
    totalPaid = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : (advancePaid + balancePaid);
  } else {
    totalPaid = order.actualAmountPaid !== null && order.actualAmountPaid !== undefined ? order.actualAmountPaid : 0;
  }
  const pendingBalance = Math.max(0, grandTotal - totalPaid);

  currentY += 6;

  // Add notes if present
  if (order.adminNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Admin Notes:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(order.adminNotes, 100);
    doc.text(noteLines, 15, currentY + 5);
  }

  // Totals table (right side)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  
  doc.text('Subtotal:', 150, currentY, { align: 'right' });
  doc.text(`INR ${subtotal.toFixed(2)}`, 195, currentY, { align: 'right' });
  
  currentY += 6;
  doc.text('Shipping / Delivery:', 150, currentY, { align: 'right' });
  doc.text(`INR ${deliveryCharge.toFixed(2)}`, 195, currentY, { align: 'right' });
  
  if (discount > 0) {
    currentY += 6;
    doc.text('Discount:', 150, currentY, { align: 'right' });
    doc.text(`-INR ${discount.toFixed(2)}`, 195, currentY, { align: 'right' });
  }

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Grand Total:', 150, currentY, { align: 'right' });
  doc.text(`INR ${grandTotal.toFixed(2)}`, 195, currentY, { align: 'right' });

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text('Advance Paid:', 150, currentY, { align: 'right' });
  doc.text(`-INR ${advancePaid.toFixed(2)}`, 195, currentY, { align: 'right' });

  currentY += 6;
  doc.text('Balance Paid:', 150, currentY, { align: 'right' });
  doc.text(`-INR ${balancePaid.toFixed(2)}`, 195, currentY, { align: 'right' });

  currentY += 8;
  // Border line for total
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(130, currentY - 5, 195, currentY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (pendingBalance > 0.01) {
    doc.setTextColor(200, 0, 0); // red
  } else {
    doc.setTextColor(0, 128, 0); // green
  }
  doc.text('Pending Balance:', 150, currentY, { align: 'right' });
  doc.text(`INR ${pendingBalance.toFixed(2)}`, 195, currentY, { align: 'right' });

  // Reset line width
  doc.setLineWidth(0.2);

  // Bottom Branding / Footer
  const footerY = 280;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(15, footerY - 5, 195, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Thank you for ordering with us!', 105, footerY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text('Neralla Inti Ruchulu | Homemade Andhra Pickles & Foods | WhatsApp: +91 8247843466', 105, footerY + 4, { align: 'center' });

  // Save the document
  const fileName = `NIR-Order-${order.orderNumber || 'Pending'}.pdf`;
  doc.save(fileName);
}
