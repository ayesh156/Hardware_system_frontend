import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Invoice, Customer, InvoiceItem } from '../../types/index';
import { Printer, X, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();

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
              margin: 5mm;
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
              color: #1e293b;
              font-size: 8pt;
              line-height: 1.3;
            }
            
            .a5-invoice {
              width: 138mm;
              min-height: 200mm;
              padding: 8mm;
              margin: 0 auto;
              background: white;
              position: relative;
            }

            /* Header with gradient accent */
            .inv-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 10px;
              border-bottom: 2px solid #0ea5e9;
              margin-bottom: 10px;
              position: relative;
            }

            .inv-header::before {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 60px;
              height: 2px;
              background: linear-gradient(90deg, #8b5cf6, #ec4899);
            }

            .company-block h1 {
              font-size: 14pt;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 2px;
              letter-spacing: -0.3px;
            }

            .company-block .slogan {
              font-size: 6pt;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 6px;
            }

            .company-block .contact-line {
              font-size: 6.5pt;
              color: #475569;
              line-height: 1.4;
            }

            .inv-badge {
              text-align: right;
            }

            .inv-badge .badge-title {
              font-size: 18pt;
              font-weight: 800;
              background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              letter-spacing: 1px;
            }

            .inv-badge .inv-num {
              font-size: 8pt;
              font-weight: 600;
              color: #334155;
              margin-top: 3px;
            }

            .inv-badge .inv-status {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 6pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-top: 4px;
            }

            .status-paid {
              background: linear-gradient(135deg, #10b981, #34d399);
              color: white;
            }

            .status-pending {
              background: linear-gradient(135deg, #f59e0b, #fbbf24);
              color: white;
            }

            /* Info Row */
            .info-row {
              display: flex;
              gap: 10px;
              margin-bottom: 10px;
            }

            .info-card {
              flex: 1;
              padding: 8px 10px;
              background: #f8fafc;
              border-radius: 6px;
              border-left: 3px solid #0ea5e9;
            }

            .info-card.alt {
              border-left-color: #8b5cf6;
            }

            .info-card .card-label {
              font-size: 5.5pt;
              font-weight: 700;
              color: #0ea5e9;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 3px;
            }

            .info-card.alt .card-label {
              color: #8b5cf6;
            }

            .info-card .card-main {
              font-size: 8pt;
              font-weight: 600;
              color: #0f172a;
            }

            .info-card .card-sub {
              font-size: 6.5pt;
              color: #64748b;
              margin-top: 2px;
            }

            /* Items Table - Compact */
            .items-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              font-size: 7pt;
            }

            .items-grid thead {
              background: linear-gradient(135deg, #0f172a, #1e293b);
            }

            .items-grid thead th {
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              padding: 6px 8px;
              font-size: 6pt;
            }

            .items-grid thead th:first-child {
              border-radius: 4px 0 0 4px;
              width: 6%;
            }

            .items-grid thead th:last-child {
              border-radius: 0 4px 4px 0;
            }

            .items-grid thead th.col-qty { width: 10%; text-align: center; }
            .items-grid thead th.col-price { width: 20%; text-align: right; }
            .items-grid thead th.col-total { width: 20%; text-align: right; }

            .items-grid tbody tr {
              border-bottom: 1px solid #e2e8f0;
            }

            .items-grid tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .items-grid tbody td {
              padding: 5px 8px;
              vertical-align: middle;
            }

            .items-grid tbody td:first-child {
              color: #94a3b8;
              text-align: center;
              font-weight: 500;
            }

            .items-grid tbody .item-name {
              font-weight: 500;
              color: #0f172a;
            }

            .items-grid tbody .item-tag {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 3px;
              font-size: 5pt;
              font-weight: 600;
              margin-left: 3px;
            }

            .tag-discount {
              background: #fce7f3;
              color: #db2777;
            }

            .tag-quick {
              background: #fef3c7;
              color: #d97706;
            }

            .items-grid tbody td.col-qty { text-align: center; }
            .items-grid tbody td.col-price { 
              text-align: right; 
              font-family: 'SF Mono', 'Consolas', monospace;
              color: #64748b;
            }
            .items-grid tbody td.col-total { 
              text-align: right; 
              font-family: 'SF Mono', 'Consolas', monospace;
              font-weight: 600;
              color: #0f172a;
            }

            /* Totals Block */
            .totals-block {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 10px;
            }

            .totals-inner {
              width: 140px;
            }

            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              font-size: 7pt;
            }

            .total-line .t-label {
              color: #64748b;
            }

            .total-line .t-value {
              font-family: 'SF Mono', 'Consolas', monospace;
              color: #334155;
            }

            .total-line.discount .t-value {
              color: #ec4899;
            }

            .total-line.grand {
              background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
              color: white;
              padding: 6px 10px;
              margin-top: 5px;
              border-radius: 5px;
              font-weight: 700;
              font-size: 9pt;
            }

            .total-line.grand .t-label,
            .total-line.grand .t-value {
              color: white;
            }

            /* Payment Info */
            .payment-row {
              display: flex;
              gap: 10px;
              margin-bottom: 10px;
            }

            .pay-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 4px 10px;
              border-radius: 15px;
              font-size: 6.5pt;
              font-weight: 600;
            }

            .pay-cash { background: #d1fae5; color: #047857; }
            .pay-card { background: #dbeafe; color: #1d4ed8; }
            .pay-bank { background: #ede9fe; color: #6d28d9; }
            .pay-credit { background: #fef3c7; color: #b45309; }

            /* Notes Section */
            .notes-box {
              background: #fffbeb;
              border: 1px solid #fde68a;
              border-radius: 5px;
              padding: 8px 10px;
              margin-bottom: 10px;
            }

            .notes-box .n-label {
              font-size: 5.5pt;
              font-weight: 700;
              color: #b45309;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 3px;
            }

            .notes-box .n-text {
              font-size: 6.5pt;
              color: #92400e;
              line-height: 1.4;
            }

            /* Footer */
            .inv-footer {
              text-align: center;
              padding-top: 8px;
              border-top: 1px dashed #cbd5e1;
            }

            .inv-footer .thanks {
              font-size: 8pt;
              font-weight: 700;
              background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 3px;
            }

            .inv-footer .footer-contact {
              font-size: 6pt;
              color: #64748b;
            }

            .inv-footer .powered {
              font-size: 5.5pt;
              color: #94a3b8;
              margin-top: 5px;
              letter-spacing: 0.5px;
            }

            /* Decorative corner */
            .corner-decor {
              position: absolute;
              top: 0;
              right: 0;
              width: 30px;
              height: 30px;
              background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
              clip-path: polygon(100% 0, 0 0, 100% 100%);
              opacity: 0.1;
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
                padding: '24px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px',
                color: '#1e293b',
                position: 'relative'
              }}>
                {/* Corner decoration */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                  opacity: 0.15
                }} />

                {/* Header */}
                <div className="inv-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #0ea5e9',
                  marginBottom: '12px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: 0,
                    width: '60px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                  }} />
                  
                  <div>
                    <h1 style={{ 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      color: '#0f172a',
                      marginBottom: '2px',
                      letterSpacing: '-0.3px'
                    }}>COSMOS HARDWARE</h1>
                    <p style={{ 
                      fontSize: '8px', 
                      color: '#64748b', 
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      marginBottom: '6px'
                    }}>Quality Building Materials</p>
                    <p style={{ fontSize: '9px', color: '#475569', lineHeight: 1.4 }}>
                      📍 123 Main Street, Colombo<br/>
                      📞 011-2345678 | ✉️ info@cosmos.lk
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '1px'
                    }}>INVOICE</h2>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginTop: '3px' }}>
                      {invoice.invoiceNumber}
                    </p>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '8px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      marginTop: '5px',
                      background: isPaid ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      color: 'white'
                    }}>{isPaid ? '✓ Paid' : '⏳ Pending'}</span>
                  </div>
                </div>

                {/* Customer & Date Info */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    borderLeft: '3px solid #0ea5e9'
                  }}>
                    <p style={{
                      fontSize: '7px',
                      fontWeight: 700,
                      color: '#0ea5e9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '4px'
                    }}>Bill To</p>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                      {customer?.name || 'Walk-in Customer'}
                    </p>
                    {customer && customer.id !== 'walk-in' && (
                      <p style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                        {customer.businessName}<br/>
                        📞 {customer.phone}
                      </p>
                    )}
                  </div>
                  
                  <div style={{
                    width: '120px',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    borderLeft: '3px solid #8b5cf6'
                  }}>
                    <p style={{
                      fontSize: '7px',
                      fontWeight: 700,
                      color: '#8b5cf6',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      marginBottom: '4px'
                    }}>Date</p>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: '#0f172a' }}>
                      {new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '8px', color: '#64748b', marginTop: '3px' }}>
                      Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="items-grid" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '12px',
                  fontSize: '9px'
                }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '8px',
                        fontSize: '7px',
                        borderRadius: '4px 0 0 4px',
                        width: '6%'
                      }}>#</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '8px',
                        fontSize: '7px',
                        textAlign: 'left'
                      }}>Item</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '8px',
                        fontSize: '7px',
                        width: '10%',
                        textAlign: 'center'
                      }}>Qty</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '8px',
                        fontSize: '7px',
                        width: '22%',
                        textAlign: 'right'
                      }}>Price</th>
                      <th style={{ 
                        color: 'white', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        padding: '8px',
                        fontSize: '7px',
                        width: '22%',
                        textAlign: 'right',
                        borderRadius: '0 4px 4px 0'
                      }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => {
                      const extItem = item as ExtendedInvoiceItem;
                      return (
                        <tr key={item.id} style={{ 
                          borderBottom: '1px solid #e2e8f0',
                          background: idx % 2 === 1 ? '#f8fafc' : 'white'
                        }}>
                          <td style={{ padding: '6px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <span style={{ fontWeight: 500, color: '#0f172a' }}>{item.productName}</span>
                            {extItem.discountType && (
                              <span style={{
                                display: 'inline-block',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontSize: '6px',
                                fontWeight: 600,
                                marginLeft: '4px',
                                background: '#fce7f3',
                                color: '#db2777'
                              }}>
                                {extItem.discountType === 'percentage' ? `${extItem.discountValue}%` : `Rs.${extItem.discountValue}`} off
                              </span>
                            )}
                            {extItem.isQuickAdd && (
                              <span style={{
                                display: 'inline-block',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                fontSize: '6px',
                                fontWeight: 600,
                                marginLeft: '4px',
                                background: '#fef3c7',
                                color: '#d97706'
                              }}>Quick</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right',
                            fontFamily: "'SF Mono', Consolas, monospace",
                            color: '#64748b'
                          }}>Rs. {item.unitPrice.toLocaleString()}</td>
                          <td style={{ 
                            padding: '6px 8px', 
                            textAlign: 'right',
                            fontFamily: "'SF Mono', Consolas, monospace",
                            fontWeight: 600,
                            color: '#0f172a'
                          }}>Rs. {item.total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <div style={{ width: '160px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '9px' }}>
                      <span style={{ color: '#64748b' }}>Subtotal</span>
                      <span style={{ fontFamily: "'SF Mono', Consolas, monospace", color: '#334155' }}>
                        Rs. {invoice.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {invoice.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '9px' }}>
                        <span style={{ color: '#64748b' }}>Discount ({invoice.discount}%)</span>
                        <span style={{ fontFamily: "'SF Mono', Consolas, monospace", color: '#ec4899' }}>
                          - Rs. {((invoice.subtotal * invoice.discount) / 100).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '9px' }}>
                      <span style={{ color: '#64748b' }}>Tax</span>
                      <span style={{ fontFamily: "'SF Mono', Consolas, monospace", color: '#334155' }}>
                        Rs. {invoice.tax.toLocaleString()}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      marginTop: '6px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '11px'
                    }}>
                      <span>Total</span>
                      <span style={{ fontFamily: "'SF Mono', Consolas, monospace" }}>
                        Rs. {invoice.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Badge */}
                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '15px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: invoice.paymentMethod === 'cash' ? '#d1fae5' :
                               invoice.paymentMethod === 'card' ? '#dbeafe' :
                               invoice.paymentMethod === 'bank_transfer' ? '#ede9fe' : '#fef3c7',
                    color: invoice.paymentMethod === 'cash' ? '#047857' :
                           invoice.paymentMethod === 'card' ? '#1d4ed8' :
                           invoice.paymentMethod === 'bank_transfer' ? '#6d28d9' : '#b45309'
                  }}>
                    {payInfo.label} Payment
                  </span>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      fontSize: '7px',
                      fontWeight: 700,
                      color: '#b45309',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px'
                    }}>📝 Notes</p>
                    <p style={{ fontSize: '9px', color: '#92400e', lineHeight: 1.4 }}>{invoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  textAlign: 'center',
                  paddingTop: '10px',
                  borderTop: '1px dashed #cbd5e1'
                }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '4px'
                  }}>Thank you for your business!</p>
                  <p style={{ fontSize: '8px', color: '#64748b' }}>
                    Questions? Contact us at info@cosmos.lk or 011-2345678
                  </p>
                  <p style={{ fontSize: '7px', color: '#94a3b8', marginTop: '6px', letterSpacing: '0.5px' }}>
                    Powered by Cosmos POS System
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
