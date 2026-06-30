import React, { useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Invoice, Customer, InvoiceItem } from '../../types/index';
import { X, Printer } from 'lucide-react';
import { useHiddenIframePrint } from '../../hooks/useHiddenIframePrint';

interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice?: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
  productNameSi?: string;
}

interface InvoicePreviewModalProps {
  invoice: Invoice;
  customer?: Customer | null;
  onClose: () => void;
  onEdit?: () => void;
}

/**
 * InvoicePreviewModal
 *
 * Print Architecture: "Hidden Iframe Dynamic Print"
 * ---------------------------------------------------
 * Instead of relying on fragile `@media print` CSS overrides (which cause
 * blank page issues when the receipt is inside a modal/dialog overlay),
 * this component uses a completely isolated iframe-based print pipeline.
 *
 * Pipeline:
 * 1. User clicks the orange "Print" button.
 * 2. handlePrint extracts innerHTML from the receipt container div.
 * 3. Builds a standalone HTML document with its own CSS (80mm thermal styles).
 * 4. Writes that document into a hidden <iframe> appended to <body>.
 * 5. Calls iframe.contentWindow.print() — the browser prints ONLY the iframe
 *    content in complete isolation from the parent dashboard layout.
 * 6. The iframe is removed from the DOM after printing.
 *
 * Benefits:
 * - Zero layout leaking: no modal overlay / sidebar / header can interfere.
 * - WYSIWYG accuracy: the printed output matches the preview exactly.
 * - No global CSS `@media print` hacks needed.
 * - Works with any dialog/drawer/modal framework.
 */
export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  customer,
  onClose,
  onEdit,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const receiptRef = useRef<HTMLDivElement>(null);
  const printWrapperRef = useRef<HTMLDivElement>(null);

  // Hidden iframe print hook — completely isolated print context
  const { printViaHiddenIframe } = useHiddenIframePrint();

  /**
   * handlePrint
   *
   * Extracts the receipt HTML from the print wrapper div and prints it
   * via a hidden iframe. This guarantees that:
   * - The modal overlay / dark backdrop never appears in the print.
   * - The receipt renders at 80mm width with proper thermal styling.
   * - No parent CSS `@media print` rules can interfere.
   */
  const handlePrint = useCallback(() => {
    if (printWrapperRef.current) {
      printViaHiddenIframe(printWrapperRef.current)
        .catch((err) => {
          console.warn('Iframe print failed, falling back to window.print():', err);
          // Fallback: if iframe print fails, try window.print() as safety net
          window.print();
        });
    } else {
      // Fallback
      window.print();
    }
  }, [printViaHiddenIframe]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const discountAmount = invoice.discountType === 'percentage'
    ? (invoice.subtotal * (invoice.discountValue || invoice.discount || 0)) / 100
    : (invoice.discountValue || invoice.discount || 0);

  const isPaid = invoice.status === 'paid';
  const isWalkIn = !customer || customer.id === 'walk-in';

  const receivedAmount = invoice.receivedAmount || 0;
  const changeAmount = invoice.changeAmount || (receivedAmount > 0 ? receivedAmount - invoice.total : 0);

  const totalItemDiscounts = invoice.items.reduce((sum, item) => {
    const extItem = item as ExtendedInvoiceItem;
    if (extItem.originalPrice && extItem.originalPrice > item.unitPrice) {
      return sum + (extItem.originalPrice - item.unitPrice) * item.quantity;
    }
    return sum;
  }, 0);

  return (
    <>
      {/* ── OVERLAY ── */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative w-full max-w-[480px] rounded-2xl border shadow-2xl animate-fade-in mx-2"
          style={{
            background: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? 'rgba(51,65,85,0.5)' : '#e2e8f0',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Fixed Action Bar (sticky at top, NOT printed) ── */}
          <div className={`flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b rounded-t-2xl ${
            isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Receipt Preview
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-semibold rounded-lg hover:from-orange-600 hover:to-rose-600 transition-all shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  Edit
                </button>
              )}
              <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE RECEIPT CANVAS ──
               max-h so the user can scroll for long invoices.
               Inner receipt expands naturally like thermal paper. */}
          <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '4px 2px' }}>
            {/*
              printWrapperRef is the DOUBLE wrapper strategy:
              - Outer div (receiptRef): full container with styling for SCREEN preview.
                80mm (302px) + 2px padding — mirrors the iframe <body> dimensions.
              - Inner div (printWrapperRef): RAW innerHTML extractor for iframe printing.
                76mm (287px) centered — mirrors the iframe .receipt-print-root dimensions.
                This guarantees the screen preview matches the print output pixel-for-pixel.
            */}
            <div
              id="thermal-receipt-print-area"
              ref={receiptRef}
              style={{
                background: '#ffffff',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: '11px',
                color: '#000',
                lineHeight: 1.3,
                width: 'min(100%, 302px)',
                margin: '0 auto',
                padding: '2px',
                boxSizing: 'border-box',
              }}
            >
              {/* ═══ INNER PRINT WRAPPER — ref for iframe content extraction ═══
                   Width matches the iframe's .receipt-print-root (76mm ≈ 287px) */}
              <div ref={printWrapperRef} style={{ width: 'min(100%, 287px)', margin: '0 auto' }}>
                {/* ═══ HEADER ═══ */}
                <div style={{ textAlign: 'center', paddingBottom: '4px', borderBottom: '2px double #000' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                      <svg width="32" height="32" viewBox="0 0 50 50" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <polygon points="25,2 46,14 46,36 25,48 4,36 4,14" fill="none" stroke="#000" strokeWidth="2"/>
                      </svg>
                      <svg width="32" height="32" viewBox="0 0 50 50" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path d="M16 12 L16 38 L34 38" fill="none" stroke="#000" strokeWidth="5" strokeLinecap="square"/>
                        <circle cx="34" cy="16" r="4" fill="none" stroke="#000" strokeWidth="2"/>
                        <line x1="30" y1="20" x2="24" y2="26" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '1px' }}>ලියනගේ</div>
                      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', borderTop: '1px solid #000', paddingTop: '1px' }}>හාඩ්වෙයාර්</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>★ උසස් තත්ත්වයේ ගොඩනැගිලි ද්‍රව්‍ය ★</div>
                  <div style={{ fontSize: '9px', color: '#333', marginTop: '2px', lineHeight: 1.3 }}>
                    හක්මන පාර, දෙයියන්දර<br />
                    දුරකථන: 0773751805 / 0412268217
                  </div>
                </div>

                {/* ═══ INVOICE INFO BAR ═══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px dashed #999' }}>
                  <div>
                    <div style={{ fontSize: '8px', color: '#666' }}>බිල්පත</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: "'Courier New', monospace" }}>{invoice.invoiceNumber}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '1px 5px', border: '1.5px solid #000', borderRadius: '2px', fontSize: '9px', fontWeight: 700, background: isPaid ? '#000' : 'white', color: isPaid ? 'white' : '#000' }}>
                      {isPaid ? '✓ ගෙවා ඇත' : '○ ගෙවිය යුතු'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '8px', color: '#666' }}>දිනය</div>
                    <div style={{ fontSize: '9px', fontWeight: 600 }}>{new Date(invoice.issueDate).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* ═══ CUSTOMER ═══ */}
                {!isWalkIn && (
                  <div style={{ padding: '2px 0', borderBottom: '1px dashed #999' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '8px', color: '#666' }}>පාරිභෝගිකයා: </span>
                      <span style={{ fontSize: '10px', fontWeight: 600 }}>{customer?.name || invoice.customerName}</span>
                    </div>
                  </div>
                )}

                {/* ═══ ITEMS HEADER ═══ */}
                <div style={{ padding: '2px 0 1px 0', borderBottom: '1px solid #000' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, marginBottom: '1px' }}>භාණ්ඩය</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: '#666' }}>
                    <span style={{ width: '15%', textAlign: 'center' }}>ප්‍රමාණය</span>
                    <span style={{ width: '25%', textAlign: 'right' }}>සදහන් මිල</span>
                    <span style={{ width: '25%', textAlign: 'right' }}>අපේ මිල</span>
                    <span style={{ width: '30%', textAlign: 'right' }}>එකතුව</span>
                  </div>
                </div>

                {/* ═══ ITEMS LIST — dynamically expands ═══ */}
                <div>
                  {invoice.items.map((item) => {
                    const extItem = item as ExtendedInvoiceItem;
                    const hasItemDiscount = extItem.originalPrice && extItem.originalPrice > item.unitPrice;
                    const originalPrice = hasItemDiscount ? extItem.originalPrice : item.unitPrice;
                    const ourPrice = item.unitPrice;

                    return (
                      <div key={item.id} style={{ borderBottom: '1px dotted #ccc', padding: '2px 0' }}>
                        <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: '1px' }}>
                          {item.productName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: "'Courier New', monospace" }}>
                          <span style={{ width: '15%', textAlign: 'center' }}>{item.quantity}</span>
                          <span style={{ width: '25%', textAlign: 'right', ...(hasItemDiscount ? { color: '#777', textDecoration: 'line-through' } : {}) }}>
                            {originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span style={{ width: '25%', textAlign: 'right', fontWeight: hasItemDiscount ? 600 : 400 }}>
                            {ourPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span style={{ width: '30%', textAlign: 'right', fontWeight: 700 }}>
                            {item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ═══ TOTALS ═══ */}
                <div style={{ borderTop: '1px solid #000', paddingTop: '3px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '10px' }}>
                    <span>උප එකතුව</span>
                    <span style={{ fontFamily: "'Courier New', monospace" }}>{invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '10px', color: '#d63384' }}>
                      <span>වට්ටම් {invoice.discountType === 'percentage' ? `(${invoice.discountValue || invoice.discount}%)` : ''}</span>
                      <span style={{ fontFamily: "'Courier New', monospace" }}>- {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {(invoice.tax ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '9px', color: '#666' }}>
                      <span>බදු</span>
                      <span style={{ fontFamily: "'Courier New', monospace" }}>{(invoice.tax ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {/* Grand Total Box */}
                  <div className="print-total-box" style={{ background: '#000', color: 'white', padding: '5px', marginTop: '3px', borderRadius: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>මුළු එකතුව</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>
                        {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ═══ PAYMENT INFO ═══ */}
                <div style={{ borderTop: '1px dashed #999', marginTop: '3px', paddingTop: '3px' }}>
                  {receivedAmount > 0 && (
                    <div style={{ background: '#f5f5f5', padding: '3px 4px', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '9px' }}>
                        <span>ගෙවූ මුදල</span>
                        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 600 }}>{receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '9px' }}>
                        <span>ඉතිරි මුදල</span>
                        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 600 }}>{changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px', color: '#666', ...(receivedAmount > 0 ? { borderTop: '1px dotted #ccc', marginTop: '2px' } : {}) }}>
                    <span>තාණ්ඩ සංඛ්‍යාව</span>
                    <span style={{ fontWeight: 600 }}>[{invoice.items.length}]</span>
                  </div>
                  {totalItemDiscounts > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', fontSize: '9px', color: '#d63384', fontWeight: 600 }}>
                      <span>ඔබ ලැබූ ලාභය</span>
                      <span style={{ fontFamily: "'Courier New', monospace" }}>{totalItemDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '8px', color: '#666', padding: '1px 0' }}>
                    <span>කැෂියර්: </span><span style={{ fontWeight: 600 }}>Admin</span>
                  </div>
                </div>

                {/* ═══ NOTES ═══ */}
                {invoice.notes && (
                  <div style={{ padding: '3px 0', borderTop: '1px dashed #999', marginTop: '2px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700 }}>සටහන්:</div>
                    <div style={{ fontSize: '9px', color: '#333' }}>{invoice.notes}</div>
                  </div>
                )}

                {/* ═══ FOOTER ═══ */}
                <div style={{ textAlign: 'center', paddingTop: '5px', borderTop: '1px dashed #999', marginTop: '3px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>ස්තූතියි නැවත එන්න !</div>
                  <div style={{ margin: '3px 0', borderTop: '1px dotted #ccc' }} />
                  <div style={{ fontSize: '8px', color: '#666', letterSpacing: '0.3px' }}>Software by nebulainfinite - 078 3233 760</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePreviewModal;