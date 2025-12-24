import { Invoice, Customer, InvoiceItem } from '../../types/index';

// Extended invoice item type for discounts and quick add
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
}

// ============================================================
// A5 PRINT DESIGN (148mm × 210mm) - COMMENTED OUT FOR LATER USE
// ============================================================
/*
const generatePrintContentA5 = (invoice: Invoice, customer?: Customer | null): string => {
  const isPaid = invoice.status === 'paid';
  
  // Calculate discount
  const discType = (invoice as any).discountType;
  const discValue = (invoice as any).discountValue;
  let discountLabel = 'Discount';
  let discountAmount = invoice.discount;

  if (discType === 'percentage') {
    const perc = typeof discValue === 'number' ? discValue : invoice.discount;
    discountLabel = `Discount (${perc}%)`;
    discountAmount = Math.round((invoice.subtotal * (perc || 0)) / 100);
  } else if (discType === 'fixed') {
    const val = typeof discValue === 'number' ? discValue : invoice.discount;
    discountLabel = 'Discount';
    discountAmount = val;
  }

  // Generate items rows
  const itemsHtml = invoice.items.map((item, idx) => {
    const extItem = item as ExtendedInvoiceItem;
    const discountBadge = extItem.discountType ? 
      `<span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-left: 4px; border: 1px solid #666; background: white; color: #000;">${extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : `${extItem.discountValue}`} off</span>` : '';
    const quickBadge = extItem.isQuickAdd ? 
      `<span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-left: 4px; border: 1px solid #666; background: white; color: #000;">Quick</span>` : '';
    
    return `
      <tr style="border-bottom: 1px solid #ccc; background: ${idx % 2 === 1 ? '#f5f5f5' : 'white'};">
        <td style="padding: 8px 10px; text-align: center; color: #666; font-weight: 500; font-size: 14px;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-size: 14px;">
          <span style="font-weight: 500; color: #000;">${item.productName}</span>${discountBadge}${quickBadge}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 8px 10px; text-align: right; font-family: 'SF Mono', Consolas, monospace; color: #333; font-size: 14px;">${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 8px 10px; text-align: right; font-family: 'SF Mono', Consolas, monospace; font-weight: 600; color: #000; font-size: 14px;">${item.total.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  // Discount row HTML
  const discountHtml = invoice.discount > 0 ? `
    <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
      <span style="color: #333;">${discountLabel}</span>
      <span style="font-family: 'SF Mono', Consolas, monospace; color: #000;">- ${Number(discountAmount).toLocaleString()}</span>
    </div>
  ` : '';

  // Notes HTML
  const notesHtml = invoice.notes ? `
    <div style="background: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; padding: 12px 14px; margin-bottom: 12px;">
      <p style="font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Notes</p>
      <p style="font-size: 13px; color: #333; line-height: 1.5;">${invoice.notes}</p>
    </div>
  ` : '';

  // Customer info
  const customerHtml = customer && customer.id !== 'walk-in' ? `
    <p style="font-size: 14px; color: #333; margin-top: 2px;">
      ${customer.businessName || ''}<br/>
      Tel: ${customer.phone || ''}
    </p>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: 148mm 210mm; margin: 6mm; }
          html, body { height: 100%; margin: 0; padding: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: white; color: #000; font-size: 15pt; line-height: 1.4; }
        </style>
      </head>
      <body>
        <div style="width: 136mm; max-width: 100%; padding: 3px; margin: 0 auto; background: white; position: relative; font-family: 'Inter', sans-serif; font-size: 15px; color: #000; box-sizing: border-box;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 2px solid #000; margin-bottom: 12px;">
            <div>
              <h1 style="font-size: 28px; font-weight: 800; color: #000; margin-bottom: 2px; letter-spacing: -0.3px;">LIYANAGE HARDWARE</h1>
              <p style="font-size: 13px; color: #333; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Quality Building Materials</p>
              <p style="font-size: 14px; color: #333; line-height: 1.5;">Hakmana Rd, Deiyandara<br/>Tel: 0773751805 / 0412268217 | info@liyanage.lk</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 28px; font-weight: 800; color: #000; letter-spacing: 1px; white-space: nowrap;">INVOICE</h2>
              <p style="font-size: 18px; font-weight: 600; color: #000; margin-top: 4px;">${invoice.invoiceNumber}</p>
              <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 6px; border: 2px solid #000; background: ${isPaid ? '#000' : 'white'}; color: ${isPaid ? 'white' : '#000'};">${isPaid ? 'PAID' : 'PENDING'}</span>
            </div>
          </div>

          <!-- Customer & Date Info -->
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex: 1; padding: 12px 14px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #000;">
              <p style="font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Bill To</p>
              <p style="font-size: 17px; font-weight: 600; color: #000;">${customer?.name || 'Walk-in Customer'}</p>
              ${customerHtml}
            </div>
            <div style="width: 130px; padding: 12px 14px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #000;">
              <p style="font-size: 12px; font-weight: 700; color: #000; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Date</p>
              <p style="font-size: 16px; font-weight: 600; color: #000;">${new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p style="font-size: 13px; color: #333; margin-top: 3px;">Due: ${new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 14px;">
            <thead>
              <tr style="background: #000;">
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; width: 6%;">#</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; text-align: left;">Item</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0px; padding: 10px; font-size: 12px; width: 10%; text-align: center; white-space: nowrap;">QTY</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; width: 22%; text-align: right;">PRICE</th>
                <th style="color: white; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 10px; font-size: 12px; width: 22%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals + Payment -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
            <!-- Payment Badge (left) -->
            <div>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 4px; font-size: 14px; font-weight: 600; border: 2px solid #000; background: white; color: #000;">
                ${invoice.paymentMethod === 'cash' ? 'Cash' : invoice.paymentMethod === 'card' ? 'Card' : invoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Credit'} Payment
              </span>
            </div>
            <!-- Totals Block (right) -->
            <div style="width: 180px;">
              <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
                <span style="color: #333;">Subtotal</span>
                <span style="font-family: 'SF Mono', Consolas, monospace; color: #000;">${invoice.subtotal.toLocaleString()}</span>
              </div>
              ${discountHtml}
              ${invoice.tax > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px;">
                <span style="color: #333;">Tax</span>
                <span style="font-family: 'SF Mono', Consolas, monospace; color: #000;">${invoice.tax.toLocaleString()}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 10px 14px; margin-top: 6px; border-radius: 4px; background: #000; color: white; font-weight: 700; font-size: 18px;">
                <span>Total</span>
                <span style="font-family: 'SF Mono', Consolas, monospace;">${invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <hr style="border: none; border-top: 1px dashed #999; margin: 12px 0 8px 0;" />
          <p style="text-align: center; font-size: 11px; color: #666; letter-spacing: 0.5px;">© 2025 Powered by Nebulainfinite - 0783233760</p>
        </div>
      </body>
    </html>
  `;
};
*/
// ============================================================
// END OF A5 PRINT DESIGN
// ============================================================

// ============================================================
// 80mm THERMAL RECEIPT PRINTER (Xprinter) - Variable Length
// ============================================================

const generate80mmReceiptContent = (invoice: Invoice, customer?: Customer | null): string => {
  const isPaid = invoice.status === 'paid';
  
  // Calculate discount
  const discType = (invoice as any).discountType;
  const discValue = (invoice as any).discountValue;
  let discountLabel = 'Discount';
  let discountAmount = invoice.discount;

  if (discType === 'percentage') {
    const perc = typeof discValue === 'number' ? discValue : invoice.discount;
    discountLabel = `Discount (${perc}%)`;
    discountAmount = Math.round((invoice.subtotal * (perc || 0)) / 100);
  } else if (discType === 'fixed') {
    discountLabel = 'Discount';
    discountAmount = typeof discValue === 'number' ? discValue : invoice.discount;
  }

  // Generate items rows - compact format for 80mm
  const itemsHtml = invoice.items.map((item, idx) => {
    const extItem = item as ExtendedInvoiceItem;
    const discountTag = extItem.discountType ? 
      ` <span style="font-size: 9px; color: #666;">(-${extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : extItem.discountValue})</span>` : '';
    
    return `
      <div style="border-bottom: 1px dotted #ccc; padding: 6px 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1; padding-right: 8px;">
            <span style="font-weight: 600; font-size: 14px; color: #000;">${idx + 1}. ${item.productName}</span>${discountTag}
          </div>
          <div style="text-align: right; white-space: nowrap;">
            <span style="font-weight: 700; font-size: 15px; font-family: 'Courier New', monospace;">${item.total.toLocaleString()}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 13px; color: #666;">
          <span>${item.quantity} × ${item.unitPrice.toLocaleString()}</span>
        </div>
      </div>
    `;
  }).join('');

  // Customer info for receipt
  const customerName = customer?.name || 'Walk-in Customer';
  const customerPhone = customer && customer.id !== 'walk-in' ? customer.phone : '';

  // Payment method icon
  const paymentIcon = invoice.paymentMethod === 'cash' ? '💵' : 
                      invoice.paymentMethod === 'card' ? '💳' : 
                      invoice.paymentMethod === 'bank_transfer' ? '🏦' : '📝';
  const paymentLabel = invoice.paymentMethod === 'cash' ? 'CASH' : 
                       invoice.paymentMethod === 'card' ? 'CARD' : 
                       invoice.paymentMethod === 'bank_transfer' ? 'BANK' : 'CREDIT';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${invoice.invoiceNumber}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0 2px; 
          }
          @media print {
            html, body { 
              width: 80mm; 
              margin: 0; 
              padding: 0;
            }
            body, .receipt-container { padding-left: 2px !important; padding-right: 2px !important; }
          }

          /* Force all text to black, but allow exceptions for specific components */
          .receipt-container, .receipt-container * { color: #000 !important; }
          .total-box, .total-box * { color: #fff !important; }
          .status-badge, .status-badge * { color: ${isPaid ? "#fff" : "#000"} !important; }

          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: white; 
            color: #000; 
            font-size: 11px; 
            line-height: 1.3; 
            width: 80mm;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container" style="width: 76mm; max-width: 100%; padding: 2px; margin: 0 auto; background: white; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000;">
          
          <!-- ═══ HEADER ═══ -->
          <div style="text-align: center; padding-bottom: 8px; border-bottom: 2px double #000;">
            <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #000;">LIYANAGE</div>
            <div style="font-size: 14px; font-weight: 700; letter-spacing: 2px; color: #000;">HARDWARE</div>
            <div style="font-size: 10px; letter-spacing: 1px; color: #666; margin-top: 3px;">★ QUALITY BUILDING MATERIALS ★</div>
            <div style="font-size: 11px; color: #333; margin-top: 6px; line-height: 1.4;">
              Hakmana Rd, Deiyandara<br/>
              Tel: 0773751805 / 0412268217
            </div>
          </div>

          <!-- ═══ INVOICE INFO BAR ═══ -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #999;">
            <div>
              <div style="font-size: 9px; color: #666; text-transform: uppercase;">Invoice</div>
              <div style="font-size: 13px; font-weight: 700; font-family: 'Courier New', monospace;">${invoice.invoiceNumber}</div>
            </div>
            <div style="text-align: center;">
              <div class="status-badge" style="display: inline-block; padding: 3px 8px; border: 1.5px solid #000; border-radius: 3px; font-size: 11px; font-weight: 700; background: ${isPaid ? '#000' : 'white'}; color: ${isPaid ? 'white' : '#000'};">
                ${isPaid ? '✓ PAID' : '○ PENDING'}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 9px; color: #666;">Date</div>
              <div style="font-size: 11px; font-weight: 600;">${new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
            </div>
          </div>

          <!-- ═══ CUSTOMER ═══ -->
          <div style="padding: 6px 0; border-bottom: 1px dashed #999;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 9px; color: #666;">Customer: </span>
                <span style="font-size: 12px; font-weight: 600;">${customerName}</span>
              </div>
              ${customerPhone ? `<span style="font-size: 10px; color: #666;">${customerPhone}</span>` : ''}
            </div>
          </div>

          <!-- ═══ ITEMS HEADER ═══ -->
          <div style="display: flex; justify-content: space-between; padding: 6px 0 4px 0; border-bottom: 1px solid #000; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #000;">
            <span>Items</span>
            <span>Amount (Rs.)</span>
          </div>

          <!-- ═══ ITEMS LIST ═══ -->
          <div style="padding: 4px 0;">
            ${itemsHtml}
          </div>

          <!-- ═══ TOTALS SECTION ═══ -->
          <div style="border-top: 1px solid #000; padding-top: 8px; margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 14px;">
              <span>Subtotal</span>
              <span style="font-family: 'Courier New', monospace;">${invoice.subtotal.toLocaleString()}</span>
            </div>
            ${invoice.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; color: #666;">
              <span>${discountLabel}</span>
              <span style="font-family: 'Courier New', monospace;">- ${Number(discountAmount).toLocaleString()}</span>
            </div>
            ` : ''}
            ${invoice.tax > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; color: #666;">
              <span>Tax</span>
              <span style="font-family: 'Courier New', monospace;">${invoice.tax.toLocaleString()}</span>
            </div>
            ` : ''}
            
            <!-- ═══ GRAND TOTAL BOX ═══ -->
            <div class="total-box" style="background: #000; color: white; padding: 10px 8px; margin-top: 6px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 14px; font-weight: 700;">TOTAL</span>
                <span style="font-size: 18px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 1px;">Rs. ${invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- ═══ PAYMENT METHOD ═══ -->
          <div style="display: flex; justify-content: center; padding: 8px 0; border-bottom: 1px dashed #999;">
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border: 1px solid #999; border-radius: 12px; font-size: 12px; font-weight: 600;">
              <span>${paymentIcon}</span>
              <span>${paymentLabel} PAYMENT</span>
            </div>
          </div>

          <!-- ═══ FOOTER ═══ -->
          <div style="text-align: center; padding-top: 10px;">
            <div style="font-size: 15px; font-weight: 700; color: #000;">Thank You!</div>
            <div style="font-size: 13px; color: #000; margin-top: 2px;">Visit us again</div>
            <div style="margin: 8px 0; border-top: 1px dotted #ccc;"></div>
            <div style="font-size: 12px; color: #000; letter-spacing: 0.5px;">© 2025 Powered by Nebulainfinite</div>
            <div style="font-size: 12px; color: #000;">0783233760</div>
          </div>

        </div>
      </body>
    </html>
  `;
};

export const printInvoice = (invoice: Invoice, customer?: Customer | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Using 80mm Xprinter thermal receipt design
      const printContent = generate80mmReceiptContent(invoice, customer);
      const printWindow = window.open('', '_blank', 'width=320,height=600');

      if (!printWindow) {
        alert('Please allow pop-ups to print the invoice');
        reject(new Error('Pop-ups blocked'));
        return;
      }

      printWindow.document.write(printContent);
      printWindow.document.close();

      const onLoadHandler = () => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (err) {
            // ignore print errors
          }
          try { printWindow.close(); } catch (e) {}
          resolve();
        }, 250);
      };

      // If document already loaded
      if (printWindow.document.readyState === 'complete') {
        onLoadHandler();
      } else {
        printWindow.onload = onLoadHandler;
      }
    } catch (err) {
      reject(err);
    }
  });
};
