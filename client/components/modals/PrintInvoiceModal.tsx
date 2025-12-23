import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Invoice, Customer, InvoiceItem } from '../../types/index';
import { Printer, X, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// Extended invoice item type for discounts and quick add
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
}

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  customer?: Customer | null;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handlePrint = () => {
    if (!printRef.current || !invoice) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=600,height=850');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A5 portrait;
              margin: 0;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              background: white;
              color: #000;
              font-size: 15pt;
              line-height: 1.4;
            }
            
            .a5-invoice {
              width: 146mm;
              min-height: 200mm;
              padding: 2mm;
              margin: 0 auto;
              background: white;
              position: relative;
            }

            /* Header - Black & White */
            .inv-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 12px;
              border-bottom: 2px solid #000;
              margin-bottom: 12px;
              position: relative;
            }

            .company-block h1 {
              font-size: 26pt;
              font-weight: 800;
              color: #000;
              margin-bottom: 2px;
              letter-spacing: -0.3px;
            }

            .company-block .slogan {
              font-size: 12pt;
              color: #333;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 6px;
            }

            .company-block .contact-line {
              font-size: 13pt;
              color: #333;
              line-height: 1.5;
            }

            .inv-badge {
              text-align: right;
            }

            .inv-badge .badge-title {
              font-size: 28pt;
              font-weight: 800;
              color: #000;
              letter-spacing: 1px;
              white-space: nowrap;
            }

            /* Ensure item names and table cells don't wrap when printing */
            .items-grid tbody td,
            .items-grid tbody td .item-name {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .inv-badge .inv-num {
              font-size: 17pt;
              font-weight: 600;
              color: #000;
              margin-top: 3px;
            }

            .inv-badge .inv-status {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 4px;
              font-size: 12pt;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-top: 4px;
              border: 2px solid #000;
              background: white;
              color: #000;
            }

            .status-paid {
              background: #000;
              color: white;
            }

            .status-pending {
              background: white;
              color: #000;
            }

            /* Info Row */
            .info-row {
              display: flex;
              gap: 12px;
              margin-bottom: 12px;
            }

            .info-card {
              flex: 1;
              padding: 10px 12px;
              background: #f5f5f5;
              border-radius: 4px;
              border-left: 3px solid #000;
            }

            .info-card .card-label {
              font-size: 12pt;
              font-weight: 700;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 4px;
            }

            .info-card .card-main {
              font-size: 17pt;
              font-weight: 600;
              color: #000;
            }

            .info-card .card-sub {
              font-size: 13pt;
              color: #333;
              margin-top: 2px;
            }

            /* Items Table - Larger Text for B&W */
            .items-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 15pt;
            }

            .items-grid thead {
              background: #000;
            }

            .items-grid thead th {
              color: white;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 8px 10px;
              font-size: 13pt;
            }

            .items-grid thead th:first-child {
              width: 6%;
            }

            .items-grid thead th.col-qty { width: 10%; text-align: center; white-space: nowrap; letter-spacing: 0; }
            .items-grid thead th.col-price { width: 22%; text-align: right; }
            .items-grid thead th.col-total { width: 22%; text-align: right; }

            .items-grid tbody tr {
              border-bottom: 1px solid #ccc;
            }

            .items-grid tbody tr:nth-child(even) {
              background: #f5f5f5;
            }

            .items-grid tbody td {
              padding: 8px 10px;
              vertical-align: middle;
              font-size: 15pt;
            }

            .items-grid tbody td:first-child {
              color: #666;
              text-align: center;
              font-weight: 500;
            }

            .items-grid tbody .item-name {
              font-weight: 500;
              color: #000;
            }

            .items-grid tbody .item-tag {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 11pt;
              font-weight: 600;
              margin-left: 4px;
              border: 1px solid #666;
              background: white;
              color: #000;
            }

            .items-grid tbody td.col-qty { text-align: center; }
            .items-grid tbody td.col-price { 
              text-align: right; 
              font-family: 'SF Mono', 'Consolas', monospace;
              color: #333;
            }
            .items-grid tbody td.col-total { 
              text-align: right; 
              font-family: 'SF Mono', 'Consolas', monospace;
              font-weight: 600;
              color: #000;
            }

            /* Totals Block */
            .totals-block {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 12px;
            }

            .totals-inner {
              width: 160px;
            }

            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 15pt;
            }

            .total-line .t-label {
              color: #333;
            }

            .total-line .t-value {
              font-family: 'SF Mono', 'Consolas', monospace;
              color: #000;
            }

            .total-line.discount .t-value {
              color: #000;
            }

            .total-line.grand {
              background: #000;
              color: white;
              padding: 8px 12px;
              margin-top: 6px;
              border-radius: 4px;
              font-weight: 700;
              font-size: 18pt;
            }

            .total-line.grand .t-label,
            .total-line.grand .t-value {
              color: white;
            }

            /* Payment Info */
            .payment-row {
              display: flex;
              gap: 10px;
              margin-bottom: 12px;
            }

            .pay-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 13pt;
              font-weight: 600;
              border: 2px solid #000;
              background: white;
              color: #000;
            }

            /* Notes Section */
            .notes-box {
              background: #f5f5f5;
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 10px 12px;
              margin-bottom: 12px;
            }

            .notes-box .n-label {
              font-size: 12pt;
              font-weight: 700;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }

            .notes-box .n-text {
              font-size: 13pt;
              color: #333;
              line-height: 1.5;
            }

            /* Footer */
            .inv-footer {
              text-align: center;
              padding-top: 10px;
              border-top: 1px dashed #999;
            }

            .inv-footer .thanks {
              font-size: 16pt;
              font-weight: 700;
              color: #000;
              margin-bottom: 4px;
            }

            .inv-footer .footer-contact {
              font-size: 12pt;
              color: #333;
            }

            .inv-footer .powered {
              font-size: 11pt;
              color: #666;
              margin-top: 6px;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  if (!invoice) return null;

  const isPaid = invoice.status === 'paid';
  const paymentMethodLabel = {
    cash: { label: '💵 Cash', class: 'pay-cash' },
    card: { label: '💳 Card', class: 'pay-card' },
    bank_transfer: { label: '🏦 Bank', class: 'pay-bank' },
    credit: { label: '📝 Credit', class: 'pay-credit' },
  };

  const payInfo = paymentMethodLabel[invoice.paymentMethod as keyof typeof paymentMethodLabel] || paymentMethodLabel.cash;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-white'
      }`}>
        <DialogHeader className={`sticky top-0 z-10 px-6 py-4 border-b ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <FileText className="w-5 h-5 text-cyan-500" />
              {t('modals.printInvoice')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preview and print invoice details
            </DialogDescription>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all shadow-lg"
              >
                <Printer className="w-4 h-4" />
                {t('invoice.printA5')}
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
            </div>
          </div>
        </DialogHeader>
        
        {/* A5 Preview Container */}
        <div className={`p-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className="mx-auto shadow-2xl rounded-lg overflow-hidden" style={{ maxWidth: '420px' }}>
            {/* Actual printable content */}
            <div ref={printRef}>
              <div className="a5-invoice" style={{ 
                background: 'white', 
                padding: '20px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                color: '#000',
                position: 'relative'
              }}>
                {/* Header */}
                <div className="inv-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #000',
                  marginBottom: '12px',
                  position: 'relative'
                }}>
                  
                  <div>
                    <h1 style={{ 
                      fontSize: '28px', 
                      fontWeight: 800, 
                      color: '#000',
                      marginBottom: '2px',
                      letterSpacing: '-0.3px'
                    }}>LIYANAGE HARDWARE</h1>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#333', 
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      marginBottom: '6px'
                    }}>Quality Building Materials</p>
                    <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.5 }}>
                      Hakmana Rd, Deiyandara<br/>
                      Tel: 0773751805 / 0412268217 | info@liyanage.lk
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: '#000',
                      letterSpacing: '1px',
                      whiteSpace: 'nowrap'
                    }}>INVOICE</h2>
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#000', marginTop: '4px' }}>
                      {invoice.invoiceNumber}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      marginTop: '6px',
                      border: '2px solid #000',
                      background: isPaid ? '#000' : 'white',
                      color: isPaid ? 'white' : '#000'
                    }}>{isPaid ? 'PAID' : 'PENDING'}</span>
                  </div>
                </div>

                {/* Customer & Date Info */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    flex: 1,
                    padding: '12px 14px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    borderLeft: '3px solid #000'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '4px'
                    }}>Bill To</p>
                    <p style={{ fontSize: '17px', fontWeight: 600, color: '#000' }}>
                      {customer?.name || 'Walk-in Customer'}
                    </p>
                    {customer && customer.id !== 'walk-in' && (
                      <p style={{ fontSize: '14px', color: '#333', marginTop: '2px' }}>
                        {customer.businessName}<br/>
                        Tel: {customer.phone}
                      </p>
                    )}
                  </div>
                  
                  <div style={{
                    width: '130px',
                    padding: '12px 14px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    borderLeft: '3px solid #000'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '4px'
                    }}>Date</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#000' }}>
                      {new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '13px', color: '#333', marginTop: '3px' }}>
                      Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="items-grid" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '12px',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ background: '#000' }}>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '10px',
                        fontSize: '12px',
                        width: '6%'
                      }}>#</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '10px',
                        fontSize: '12px',
                        textAlign: 'left'
                      }}>Item</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        letterSpacing: '0px',
                        padding: '10px',
                        fontSize: '12px',
                        width: '10%',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>QTY</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '10px',
                        fontSize: '12px',
                        width: '22%',
                        textAlign: 'right'
                      }}>PRICE (Rs.)</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '10px',
                        fontSize: '12px',
                        width: '22%',
                        textAlign: 'right'
                      }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => {
                      const extItem = item as ExtendedInvoiceItem;
                      return (
                        <tr key={item.id} style={{ 
                          borderBottom: '1px solid #ccc',
                          background: idx % 2 === 1 ? '#f5f5f5' : 'white'
                        }}>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#666', fontWeight: 500, fontSize: '14px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: '14px' }}>
                            <span style={{ fontWeight: 500, color: '#000' }}>{item.productName}</span>
                            {extItem.discountType && (
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 600,
                                marginLeft: '4px',
                                border: '1px solid #666',
                                background: 'white',
                                color: '#000'
                              }}>
                                {extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : `${extItem.discountValue}`} off
                              </span>
                            )}
                            {extItem.isQuickAdd && (
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '11px',
                                fontWeight: 600,
                                marginLeft: '4px',
                                border: '1px solid #666',
                                background: 'white',
                                color: '#000'
                              }}>Quick</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</td>
                          <td style={{ 
                            padding: '8px 10px', 
                            textAlign: 'right',
                            fontFamily: "'SF Mono', Consolas, monospace",
                            color: '#333',
                            fontSize: '14px'
                          }}>{item.unitPrice.toLocaleString()}</td>
                          <td style={{ 
                            padding: '8px 10px', 
                            textAlign: 'right',
                            fontFamily: "'SF Mono', Consolas, monospace",
                            fontWeight: 600,
                            color: '#000',
                            fontSize: '14px'
                          }}>{item.total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals + Payment */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                  {/* Payment Badge (left) */}
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: '2px solid #000',
                      background: 'white',
                      color: '#000'
                    }}>
                      {invoice.paymentMethod === 'cash' ? 'Cash' :
                       invoice.paymentMethod === 'card' ? 'Card' :
                       invoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Credit'} Payment
                    </span>
                  </div>

                  {/* Totals Block (right) */}
                  <div style={{ width: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14px' }}>
                      <span style={{ color: '#333' }}>Subtotal</span>
                      <span style={{ fontFamily: "'SF Mono', Consolas, monospace", color: '#000' }}>
                        {invoice.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {invoice.discount > 0 && (() => {
                      // Determine discount label and amount. Handle three cases:
                      // 1) invoice.discountType === 'percentage' -> show (X%) and compute amount from subtotal
                      // 2) invoice.discountType === 'fixed' -> show (Rs. X) and amount is the fixed value
                      // 3) No discountType (e.g., quick checkout) -> treat invoice.discount as monetary amount
                      const discType = (invoice as any).discountType;
                      const discValue = (invoice as any).discountValue;

                      let label = 'Discount';
                      let amount = invoice.discount; // default to monetary discount stored in invoice.discount

                      if (discType === 'percentage') {
                        const perc = typeof discValue === 'number' ? discValue : invoice.discount;
                        label = `Discount (${perc}%)`;
                        amount = Math.round((invoice.subtotal * (perc || 0)) / 100);
                      } else if (discType === 'fixed') {
                        const val = typeof discValue === 'number' ? discValue : invoice.discount;
                        label = `Discount (Rs. ${val.toLocaleString()})`;
                        amount = val;
                      } else {
                        // quick checkout or legacy: invoice.discount is already amount
                        label = 'Discount';
                        amount = invoice.discount;
                      }

                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14px' }}>
                          <span style={{ color: '#333' }}>{label}</span>
                          <span style={{ fontFamily: "'SF Mono', Consolas, monospace", color: '#000' }}>
                            - {Number(amount).toLocaleString()}
                          </span>
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14px' }}>
                      <span style={{ color: '#333' }}>Tax</span>
                      <span style={{ fontFamily: "'SF Mono', Consolas, monospace", color: '#000' }}>
                        {invoice.tax.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      marginTop: '6px',
                      borderRadius: '4px',
                      background: '#000',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '18px'
                    }}>
                      <span>Total</span>
                      <span style={{ fontFamily: "'SF Mono', Consolas, monospace" }}>
                        {invoice.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div style={{
                    background: '#f5f5f5',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#000',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px'
                    }}>Notes</p>
                    <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.5 }}>{invoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  textAlign: 'center',
                  paddingTop: '10px',
                  borderTop: '1px dashed #999'
                }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '4px'
                  }}>Thank you for your business!</p>
                  <p style={{ fontSize: '12px', color: '#333' }}>
                    Questions? Contact us at info@liyanage.lk or 0773751805 / 0412268217
                  </p>
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '6px', letterSpacing: '0.5px' }}>
                    © 2025 Powered by Nebulainfinite
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceModal;
