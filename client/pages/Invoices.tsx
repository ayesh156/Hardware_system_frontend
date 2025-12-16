import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { mockInvoices, mockCustomers, mockProducts } from '../data/mockData';
import { 
  FileText, Search, Plus, Eye, Edit2, Trash2, Printer, Calendar, User, Receipt, 
  Clock, CheckCircle, AlertTriangle, XCircle, Filter, Grid, List, RefreshCw,
  TrendingUp, CreditCard, Building2
} from 'lucide-react';
import { Invoice } from '../types/index';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { PrintInvoiceModal } from '../components/modals/PrintInvoiceModal';
import { useIsMobile } from '../hooks/use-mobile';
import { SearchableSelect } from '../components/ui/searchable-select';

type ViewMode = 'grid' | 'table';

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
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Get unique customers from invoices
  const invoiceCustomers = useMemo(() => {
    const customerIds = [...new Set(invoices.map(inv => inv.customerId))];
    return customers.filter(c => customerIds.includes(c.id));
  }, [invoices, customers]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesCustomer = customerFilter === 'all' || invoice.customerId === customerFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const invoiceDate = new Date(invoice.issueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = invoiceDate.toDateString() === today.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = invoiceDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = invoiceDate >= monthAgo;
            break;
          case 'year':
            matchesDate = invoiceDate.getFullYear() === today.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [invoices, searchQuery, statusFilter, customerFilter, dateFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    const pendingCount = invoices.filter(i => i.status === 'pending').length;
    const overdueCount = invoices.filter(i => i.status === 'overdue').length;
    return { totalInvoices, totalRevenue, pendingAmount, overdueAmount, paidCount, pendingCount, overdueCount };
  }, [invoices]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCustomerFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || customerFilter !== 'all' || dateFilter !== 'all';

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handlePrintClick = (invoice: Invoice) => {
    setInvoiceToPrint(invoice);
    setShowPrintModal(true);
  };

  const handleViewClick = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  const handleEditClick = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}/edit`);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'overdue': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'cancelled': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            Manage your invoices, track payments, and view sales history
          </p>
        </div>
        <button
          onClick={() => navigate('/invoices/create')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('invoices.addInvoice')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.totalInvoices}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Total Invoices</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Rs. {(stats.totalRevenue / 1000).toFixed(0)}K</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Revenue ({stats.paidCount} paid)</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Rs. {(stats.pendingAmount / 1000).toFixed(0)}K</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Pending ({stats.pendingCount})</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Rs. {(stats.overdueAmount / 1000).toFixed(0)}K</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Overdue ({stats.overdueCount})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Toolbar */}
      <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col gap-4">
          {/* Search and View Mode */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>
            <div className={`flex rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>
            <div className="min-w-[140px]">
              <SearchableSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                placeholder="All Status"
                searchPlaceholder={t('common.search')}
                emptyMessage="No options found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Status', icon: <Filter className="w-4 h-4" /> },
                  { value: 'paid', label: t('invoices.paid'), icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
                  { value: 'pending', label: t('invoices.pending'), icon: <Clock className="w-4 h-4 text-amber-500" /> },
                  { value: 'overdue', label: t('invoices.overdue'), icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
                ]}
              />
            </div>
            <div className="min-w-[160px]">
              <SearchableSelect
                value={customerFilter}
                onValueChange={(value) => setCustomerFilter(value)}
                placeholder="All Customers"
                searchPlaceholder={t('common.search')}
                emptyMessage="No customers"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Customers', icon: <User className="w-4 h-4" /> },
                  ...invoiceCustomers.map(c => ({ value: c.id, label: c.name, icon: <Building2 className="w-4 h-4" /> }))
                ]}
              />
            </div>
            <div className="min-w-[140px]">
              <SearchableSelect
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value)}
                placeholder="All Time"
                searchPlaceholder={t('common.search')}
                emptyMessage="No options"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Time', icon: <Calendar className="w-4 h-4" /> },
                  { value: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
                  { value: 'week', label: 'This Week', icon: <Calendar className="w-4 h-4" /> },
                  { value: 'month', label: 'This Month', icon: <Calendar className="w-4 h-4" /> },
                ]}
              />
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <div className={`ml-auto text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {filteredInvoices.length} of {invoices.length}
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Display */}
      {filteredInvoices.length > 0 ? (
        viewMode === 'grid' || isMobile ? (
          /* Grid/Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className={`group rounded-2xl border overflow-hidden transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Status bar */}
                <div className={`h-1 ${
                  invoice.status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                    : invoice.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`} />
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className={`text-base font-bold hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                      >
                        {invoice.invoiceNumber}
                      </button>
                      <div className={`flex items-center gap-1.5 mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        <User className="w-3.5 h-3.5" />
                        <span>{invoice.customerName}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {t(`invoices.${invoice.status}`)}
                    </span>
                  </div>
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-50'}`}>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Issue</p>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-50'}`}>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Due</p>
                      <p className={`text-sm font-medium ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' ? 'text-red-400' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {/* Amount */}
                  <div className={`p-3 rounded-xl mb-3 ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Total</span>
                      <span className="text-lg font-bold text-emerald-500">Rs. {invoice.total.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className={`flex gap-2 pt-3 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                    <button onClick={() => handleViewClick(invoice)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button onClick={() => handlePrintClick(invoice)} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100'}`}>
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditClick(invoice)} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(invoice)} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Invoice</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Customer</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Date</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Amount</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className={theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/invoices/${invoice.id}`)} className={`font-mono font-bold text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                          {invoice.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{invoice.customerName}</span>
                      </td>
                      <td className={`px-4 py-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-500">Rs. {invoice.total.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            {t(`invoices.${invoice.status}`)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewClick(invoice)} className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintClick(invoice)} className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-cyan-500/20 text-cyan-400' : 'hover:bg-cyan-50 text-cyan-500'}`}><Printer className="w-4 h-4" /></button>
                          <button onClick={() => handleEditClick(invoice)} className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-amber-500/20 text-amber-400' : 'hover:bg-amber-50 text-amber-500'}`}><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteClick(invoice)} className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
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
    </div>
  );
};
