import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { mockInvoices, mockCustomers, mockProducts } from '../data/mockData';
import { FileText, Filter, Search, Plus, Eye, Edit2, Trash2, ChevronDown, Printer, Calendar, User, Receipt, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Invoice } from '../types/index';
import { InvoiceWizardModal } from '../components/modals/InvoiceWizardModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { PrintInvoiceModal } from '../components/modals/PrintInvoiceModal';
import { InvoiceDetailModal } from '../components/modals/InvoiceDetailModal';
import { InvoiceEditModal } from '../components/modals/InvoiceEditModal';
import { useIsMobile } from '../hooks/use-mobile';

export const Invoices: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [customers] = useState(mockCustomers);
  const [products] = useState(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = (invoiceData: Omit<Invoice, 'id'>): Invoice => {
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      ...invoiceData,
    };
    setInvoices([newInvoice, ...invoices]);
    return newInvoice;
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handlePrintClick = (invoice: Invoice) => {
    setInvoiceToPrint(invoice);
    setShowPrintModal(true);
  };

  const handleViewClick = (invoice: Invoice) => {
    setInvoiceToView(invoice);
    setShowDetailModal(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setInvoiceToEdit(invoice);
    setShowEditModal(true);
  };

  const handleSaveInvoice = (updatedInvoice: Invoice) => {
    setInvoices(invoices.map((inv) => 
      inv.id === updatedInvoice.id ? updatedInvoice : inv
    ));
    setShowEditModal(false);
    setInvoiceToEdit(null);
  };

  const handlePrintFromDetail = () => {
    if (invoiceToView) {
      setShowDetailModal(false);
      setInvoiceToPrint(invoiceToView);
      setShowPrintModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      setInvoices(invoices.filter((inv) => inv.id !== invoiceToDelete.id));
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'overdue':
        return 'bg-red-500/15 text-red-400 border border-red-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('invoices.title')}
          </h1>
        </div>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
          {t('invoices.allInvoices')} ({filteredInvoices.length})
        </p>
      </div>

      {/* Toolbar */}
      <div className={`flex flex-col md:flex-row gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'}`}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2.5 border rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-10 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
          >
            <option value="all">{t('common.filter')}</option>
            <option value="paid">{t('invoices.paid')}</option>
            <option value="pending">{t('invoices.pending')}</option>
            <option value="overdue">{t('invoices.overdue')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('invoices.addInvoice')}
        </button>
      </div>

      {/* Invoices - Creative Table for Desktop, Cards for Mobile */}
      {filteredInvoices.length > 0 ? (
        <>
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-4">
              {filteredInvoices.map((invoice, index) => (
                <div
                  key={invoice.id}
                  className={`group relative rounded-2xl border overflow-hidden transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/30' 
                      : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  {/* Status-based top border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    invoice.status === 'paid' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : invoice.status === 'pending' 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`} />
                  
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <button
                          onClick={() => navigate(`/invoice/${invoice.id}`)}
                          className={`text-lg font-bold hover:underline ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}
                        >
                          {invoice.invoiceNumber}
                        </button>
                        <div className={`flex items-center gap-1.5 mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          <User className="w-3.5 h-3.5" />
                          <span>{invoice.customerName}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {invoice.status === 'paid' && <CheckCircle className="w-3.5 h-3.5" />}
                        {invoice.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {invoice.status === 'overdue' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {t(`invoices.${invoice.status}`)}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                        <div className={`flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                          <Calendar className="w-3 h-3" />
                          {t('invoices.issueDate')}
                        </div>
                        <p className={`font-medium mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                        <div className={`flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                          <Calendar className="w-3 h-3" />
                          {t('invoices.dueDate')}
                        </div>
                        <p className={`font-medium mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className={`flex items-center justify-between p-4 rounded-xl mb-4 ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20' 
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-400" />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          {t('invoices.totalAmount')}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-400">
                        Rs. {invoice.total.toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-2 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <button
                        onClick={() => handleViewClick(invoice)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          theme === 'dark' 
                            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        {t('common.details')}
                      </button>
                      <button
                        onClick={() => handlePrintClick(invoice)}
                        className={`p-2.5 rounded-xl transition-all ${
                          theme === 'dark' 
                            ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' 
                            : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'
                        }`}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(invoice)}
                        className={`p-2.5 rounded-xl transition-all ${
                          theme === 'dark' 
                            ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                            : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(invoice)}
                        className={`p-2.5 rounded-xl transition-all ${
                          theme === 'dark' 
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                            : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Creative Table */
            <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          {t('invoices.invoiceNumber')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          {t('invoices.customer')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          {t('invoices.issueDate')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          {t('invoices.dueDate')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center justify-end gap-2">
                          <Receipt className="w-4 h-4 text-teal-400 flex-shrink-0" />
                          {t('invoices.totalAmount')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        {t('common.status')}
                      </th>
                      <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/30' : 'divide-slate-200'}`}>
                    {filteredInvoices.map((invoice, index) => (
                      <tr
                        key={invoice.id}
                        className={`group transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'hover:bg-slate-700/20' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/invoice/${invoice.id}`)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm transition-all hover:scale-105 ${
                              theme === 'dark' 
                                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            {invoice.invoiceNumber}
                          </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                              theme === 'dark' 
                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400' 
                                : 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600'
                            }`}>
                              {invoice.customerName.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {invoice.customerName}
                            </span>
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            {new Date(invoice.issueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm border border-emerald-500/20">
                            Rs. {invoice.total.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'paid' && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                            {invoice.status === 'pending' && <Clock className="w-3.5 h-3.5 flex-shrink-0" />}
                            {invoice.status === 'overdue' && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
                            {t(`invoices.${invoice.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewClick(invoice)}
                              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                theme === 'dark' 
                                  ? 'hover:bg-blue-500/20 text-blue-400' 
                                  : 'hover:bg-blue-50 text-blue-500'
                              }`}
                              title={t('common.details')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintClick(invoice)}
                              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                theme === 'dark' 
                                  ? 'hover:bg-cyan-500/20 text-cyan-400' 
                                  : 'hover:bg-cyan-50 text-cyan-500'
                              }`}
                              title="Print Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(invoice)}
                              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                theme === 'dark' 
                                  ? 'hover:bg-amber-500/20 text-amber-400' 
                                  : 'hover:bg-amber-50 text-amber-500'
                              }`}
                              title={t('common.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(invoice)}
                              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                theme === 'dark' 
                                  ? 'hover:bg-red-500/20 text-red-400' 
                                  : 'hover:bg-red-50 text-red-500'
                              }`}
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
          }`}>
            <FileText className={`w-10 h-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('invoices.noInvoices')}
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
            Create your first invoice to get started
          </p>
        </div>
      )}

      {/* Modals */}
      <InvoiceWizardModal
        isOpen={showWizard}
        customers={customers}
        products={products}
        onClose={() => setShowWizard(false)}
        onCreateInvoice={handleCreateInvoice}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        itemName={invoiceToDelete?.invoiceNumber}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <PrintInvoiceModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        invoice={invoiceToPrint}
        customer={customers.find(c => c.id === invoiceToPrint?.customerId)}
      />

      <InvoiceDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        invoice={invoiceToView}
        customer={customers.find(c => c.id === invoiceToView?.customerId)}
        onPrint={handlePrintFromDetail}
      />

      <InvoiceEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setInvoiceToEdit(null);
        }}
        invoice={invoiceToEdit}
        customers={customers}
        products={products}
        onSave={handleSaveInvoice}
      />
    </div>
  );
};
