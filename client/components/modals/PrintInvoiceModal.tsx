import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Invoice, Customer } from '../../types/index';
import { PrintableInvoice } from '../PrintableInvoice';
import { Printer, X, Download } from 'lucide-react';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  customer?: Customer;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current || !invoice) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print the invoice');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 10mm 12mm;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              font-family: 'Segoe UI', 'Inter', -apple-system, sans-serif;
              background: white;
              color: #000;
              font-size: 11pt;
              line-height: 1.4;
            }
            
            .print-invoice {
              width: 100%;
              max-width: 180mm;
              padding: 0;
              margin: 0 auto;
              background: white;
            }

            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #1e40af;
            }

            .company-info h1 {
              font-size: 28pt;
              font-weight: 700;
              color: #1e40af;
              margin: 0 0 5px 0;
              letter-spacing: -0.5px;
            }

            .company-info .tagline {
              font-size: 9pt;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 15px;
            }

            .company-info .details {
              font-size: 9pt;
              color: #475569;
              line-height: 1.6;
            }

            .invoice-title {
              text-align: right;
            }

            .invoice-title h2 {
              font-size: 32pt;
              font-weight: 700;
              color: #1e40af;
              margin: 0;
              letter-spacing: 3px;
            }

            .invoice-title .invoice-number {
              font-size: 14pt;
              font-weight: 600;
              color: #334155;
              margin-top: 10px;
            }

            .invoice-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              gap: 30px;
            }

            .meta-box {
              flex: 1;
              padding: 15px 20px;
              background: #f8fafc;
              border-left: 4px solid #1e40af;
            }

            .meta-box.right {
              border-left: none;
              border-right: 4px solid #1e40af;
              text-align: right;
            }

            .meta-box label {
              display: block;
              font-size: 8pt;
              font-weight: 600;
              color: #1e40af;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }

            .meta-box .name {
              font-size: 13pt;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 5px;
            }

            .meta-box .info {
              font-size: 9pt;
              color: #475569;
              line-height: 1.5;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }

            .items-table thead th {
              background: #1e40af;
              color: white;
              font-size: 9pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 12px 15px;
              text-align: left;
            }

            .items-table thead th:first-child {
              width: 8%;
              text-align: center;
            }

            .items-table thead th:nth-child(3) {
              width: 10%;
              text-align: center;
            }

            .items-table thead th:nth-child(4),
            .items-table thead th:nth-child(5) {
              width: 18%;
              text-align: right;
            }

            .items-table tbody tr {
              border-bottom: 1px solid #e2e8f0;
            }

            .items-table tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .items-table tbody td {
              padding: 12px 15px;
              font-size: 10pt;
              color: #334155;
            }

            .items-table tbody td:first-child {
              text-align: center;
              color: #64748b;
              font-weight: 500;
            }

            .items-table tbody td:nth-child(2) {
              font-weight: 500;
              color: #0f172a;
            }

            .items-table tbody td:nth-child(3) {
              text-align: center;
            }

            .items-table tbody td:nth-child(4),
            .items-table tbody td:nth-child(5) {
              text-align: right;
              font-family: 'Consolas', 'Monaco', monospace;
            }

            .items-table tbody td:nth-child(5) {
              font-weight: 600;
              color: #0f172a;
            }

            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }

            .totals-box {
              width: 280px;
            }

            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 15px;
              font-size: 10pt;
            }

            .totals-row.subtotal {
              border-bottom: 1px solid #e2e8f0;
            }

            .totals-row .label {
              color: #64748b;
            }

            .totals-row .value {
              font-family: 'Consolas', 'Monaco', monospace;
              color: #334155;
              font-weight: 500;
            }

            .totals-row.total {
              background: #1e40af;
              color: white;
              font-size: 12pt;
              font-weight: 700;
              margin-top: 8px;
              padding: 12px 15px;
            }

            .totals-row.total .value {
              color: white;
              font-size: 14pt;
            }

            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 8pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .status-paid {
              background: #dcfce7;
              color: #166534;
            }

            .status-pending {
              background: #fef3c7;
              color: #92400e;
            }

            .status-overdue {
              background: #fee2e2;
              color: #dc2626;
            }

            .notes-section {
              background: #fffbeb;
              border: 1px solid #fde68a;
              border-radius: 6px;
              padding: 15px 20px;
              margin-bottom: 20px;
            }

            .notes-section label {
              display: block;
              font-size: 8pt;
              font-weight: 600;
              color: #92400e;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }

            .notes-section p {
              font-size: 9pt;
              color: #78350f;
              margin: 0;
              line-height: 1.5;
            }

            .terms-section {
              background: #f8fafc;
              border-radius: 6px;
              padding: 15px 20px;
              margin-bottom: 25px;
            }

            .terms-section label {
              display: block;
              font-size: 8pt;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }

            .terms-section ul {
              margin: 0;
              padding-left: 18px;
              font-size: 8pt;
              color: #64748b;
              line-height: 1.7;
            }

            .footer {
              border-top: 2px solid #e2e8f0;
              padding-top: 20px;
              text-align: center;
            }

            .footer .thank-you {
              font-size: 12pt;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 8px;
            }

            .footer .contact {
              font-size: 9pt;
              color: #64748b;
            }

            .footer .contact a {
              color: #1e40af;
              text-decoration: none;
              font-weight: 500;
            }

            .footer .tagline-footer {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              font-size: 8pt;
              color: #94a3b8;
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
    
    // Wait for fonts and content to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              Print Invoice - {invoice.invoiceNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Now
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Print Preview */}
        <div className="p-6 bg-slate-100 dark:bg-slate-800">
          <div className="shadow-2xl rounded-lg overflow-hidden">
            <PrintableInvoice ref={printRef} invoice={invoice} customer={customer} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceModal;
