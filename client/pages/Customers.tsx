import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockCustomers } from '../data/mockData';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Building2, 
  Mail, 
  Phone, 
  Wallet, 
  Sparkles,
  LayoutGrid,
  List,
  Filter,
  ChevronDown,
  AlertTriangle,
  Crown,
  ShoppingBag,
  CreditCard,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  X,
  Banknote,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Customer, CustomerType } from '../types/index';
import { CustomerFormModal } from '../components/modals/CustomerFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { CustomerDetailsModal } from '../components/modals/CustomerDetailsModal';
import { useIsMobile } from '../hooks/use-mobile';
import { SearchableSelect } from '../components/ui/searchable-select';
import { Pagination } from '../components/ui/data-table';

type ViewMode = 'grid' | 'table';
type LoanFilter = 'all' | 'no-loan' | 'has-loan' | 'overdue';

export const Customers: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // New filter states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerType | 'all'>('all');
  const [loanFilter, setLoanFilter] = useState<LoanFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const pageSize = 12;

  // Check if a customer's loan is overdue
  const isLoanOverdue = (customer: Customer) => {
    if (!customer.loanDueDate || customer.loanBalance <= 0) return false;
    return new Date(customer.loanDueDate) < new Date();
  };

  // Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.isActive).length;
    const regular = customers.filter(c => c.customerType === 'regular').length;
    const wholesale = customers.filter(c => c.customerType === 'wholesale').length;
    const credit = customers.filter(c => c.customerType === 'credit').length;
    const withLoans = customers.filter(c => c.loanBalance > 0).length;
    const overdue = customers.filter(c => isLoanOverdue(c)).length;
    const totalLoanBalance = customers.reduce((sum, c) => sum + c.loanBalance, 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    
    return { total, active, regular, wholesale, credit, withLoans, overdue, totalLoanBalance, totalRevenue };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      // Search filter
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery);
      
      // Customer type filter
      const matchesType = customerTypeFilter === 'all' || customer.customerType === customerTypeFilter;
      
      // Loan filter
      let matchesLoan = true;
      if (loanFilter === 'no-loan') matchesLoan = customer.loanBalance === 0;
      else if (loanFilter === 'has-loan') matchesLoan = customer.loanBalance > 0;
      else if (loanFilter === 'overdue') matchesLoan = isLoanOverdue(customer);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && customer.isActive) || 
        (statusFilter === 'inactive' && !customer.isActive);
      
      return matchesSearch && matchesType && matchesLoan && matchesStatus;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [customers, searchQuery, customerTypeFilter, loanFilter, statusFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, customerTypeFilter, loanFilter, statusFilter]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowFormModal(true);
  };

  const handleSaveCustomer = (customer: Customer) => {
    if (selectedCustomer) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) => (c.id === customer.id ? customer : c))
      );
    } else {
      setCustomers((prevCustomers) => [...prevCustomers, customer]);
    }
    setSearchQuery('');
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setCustomerTypeFilter('all');
    setLoanFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = customerTypeFilter !== 'all' || loanFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '';

  // Customer type badge styling
  const getCustomerTypeBadge = (type: CustomerType) => {
    const badges = {
      regular: {
        icon: ShoppingBag,
        label: t('customers.regular'),
        className: theme === 'dark' 
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
          : 'bg-blue-50 text-blue-600 border-blue-200'
      },
      wholesale: {
        icon: Crown,
        label: t('customers.wholesale'),
        className: theme === 'dark' 
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
          : 'bg-amber-50 text-amber-600 border-amber-200'
      },
      credit: {
        icon: CreditCard,
        label: t('customers.credit'),
        className: theme === 'dark' 
          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
          : 'bg-purple-50 text-purple-600 border-purple-200'
      }
    };
    return badges[type];
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('customers.title')}
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('customers.allCustomers')} ({filteredCustomers.length})
          </p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('customers.addCustomer')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('customers.totalCustomers')}</p>
            </div>
          </div>
        </div>

        {/* Wholesale Customers */}
        <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.wholesale}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('customers.wholesale')}</p>
            </div>
          </div>
        </div>

        {/* Total Loan Balance */}
        <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
              <Wallet className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('common.currency')} {stats.totalLoanBalance.toLocaleString()}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('customers.totalLoans')}</p>
            </div>
          </div>
        </div>

        {/* Overdue Loans */}
        <div className={`rounded-2xl p-4 border ${stats.overdue > 0 ? 'border-red-500/50' : ''} ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.overdue > 0 ? 'bg-red-500/20' : theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'}`}>
              {stats.overdue > 0 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <UserCheck className="w-5 h-5 text-green-500" />}
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-500' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.overdue}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('customers.overdueLoans')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`flex flex-col gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all border ${
              hasActiveFilters
                ? 'bg-orange-500 text-white border-orange-500'
                : theme === 'dark' 
                  ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700' 
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t('common.filter')}
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                {[customerTypeFilter !== 'all', loanFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                theme === 'dark' ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
              {t('common.clearFilters')}
            </button>
          )}

          {/* Sort Button */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all border ${
              theme === 'dark' 
                ? 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            {t('common.sort')}
          </button>

          {/* View Mode Toggle */}
          {!isMobile && (
            <div className={`flex items-center gap-1 p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-orange-500 text-white shadow-md'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-orange-500 text-white shadow-md'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className={`flex flex-wrap gap-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
            {/* Customer Type Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('customers.customerType')}
              </label>
              <SearchableSelect
                value={customerTypeFilter}
                onValueChange={(value) => setCustomerTypeFilter(value as CustomerType | 'all')}
                placeholder={t('customers.customerType')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('customers.noCustomers')}
                theme={theme}
                options={[
                  { value: 'all', label: t('common.all'), count: stats.total, icon: <Users className="w-4 h-4" /> },
                  { value: 'regular', label: t('customers.regular'), count: stats.regular, icon: <ShoppingBag className="w-4 h-4" /> },
                  { value: 'wholesale', label: t('customers.wholesale'), count: stats.wholesale, icon: <Crown className="w-4 h-4" /> },
                  { value: 'credit', label: t('customers.credit'), count: stats.credit, icon: <CreditCard className="w-4 h-4" /> },
                ]}
              />
            </div>

            {/* Loan Status Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('customers.loanStatus')}
              </label>
              <SearchableSelect
                value={loanFilter}
                onValueChange={(value) => setLoanFilter(value as LoanFilter)}
                placeholder={t('customers.loanStatus')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('customers.noCustomers')}
                theme={theme}
                options={[
                  { value: 'all', label: t('common.all'), icon: <Wallet className="w-4 h-4" /> },
                  { value: 'no-loan', label: t('customers.noLoan'), icon: <UserCheck className="w-4 h-4 text-green-500" /> },
                  { value: 'has-loan', label: t('customers.hasLoan'), count: stats.withLoans, icon: <Banknote className="w-4 h-4 text-blue-500" /> },
                  { value: 'overdue', label: t('customers.overdue'), count: stats.overdue, icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('common.status')}
              </label>
              <SearchableSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
                placeholder={t('common.status')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('customers.noCustomers')}
                theme={theme}
                options={[
                  { value: 'all', label: t('common.all'), icon: <Users className="w-4 h-4" /> },
                  { value: 'active', label: t('common.active'), count: stats.active, icon: <UserCheck className="w-4 h-4 text-green-500" /> },
                  { value: 'inactive', label: t('common.inactive'), count: stats.total - stats.active, icon: <UserX className="w-4 h-4 text-red-500" /> },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Customers Display */}
      {filteredCustomers.length > 0 ? (
        <>
          {/* Grid View */}
          {(isMobile || viewMode === 'grid') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCustomers.map((customer, index) => {
                const typeBadge = getCustomerTypeBadge(customer.customerType);
                const TypeIcon = typeBadge.icon;
                const overdue = isLoanOverdue(customer);
                
                return (
                  <div
                    key={customer.id}
                    className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      theme === 'dark' 
                        ? `bg-slate-800/50 border-slate-700/50 hover:border-orange-500/30 ${!customer.isActive ? 'opacity-60' : ''}` 
                        : `bg-white border-slate-200 hover:border-orange-300 shadow-sm ${!customer.isActive ? 'opacity-60' : ''}`
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Top gradient line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      overdue 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                        : 'bg-gradient-to-r from-orange-500 via-rose-500 to-purple-500'
                    } opacity-60`} />
                    
                    {/* Inactive overlay */}
                    {!customer.isActive && (
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <UserX className="w-3 h-3 inline mr-1" />
                        {t('common.inactive')}
                      </div>
                    )}
                    
                    <div className="p-5">
                      {/* Header with Avatar */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {customer.photo ? (
                            <img 
                              src={customer.photo} 
                              alt={customer.name}
                              className="w-14 h-14 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                              theme === 'dark' 
                                ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400' 
                                : 'bg-gradient-to-br from-orange-100 to-rose-100 text-orange-600'
                            }`}>
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {customer.isActive && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                              <Sparkles className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {customer.name}
                          </h3>
                          <div className={`flex items-center gap-1.5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.businessName}</span>
                          </div>
                          
                          {/* Customer Type Badge */}
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 border ${typeBadge.className}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeBadge.label}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className={`flex items-center gap-2.5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span>{customer.phone}</span>
                        </div>
                        <div className={`flex items-center gap-2.5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <span className="truncate">{customer.email}</span>
                        </div>
                      </div>

                      {/* Financial Info */}
                      <div className={`grid grid-cols-2 gap-2 mb-4`}>
                        {/* Total Spent */}
                        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                            <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {t('customers.totalSpent')}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-emerald-400">
                            {t('common.currency')} {customer.totalSpent.toLocaleString()}
                          </p>
                        </div>
                        
                        {/* Loan Balance */}
                        <div className={`p-3 rounded-xl ${
                          overdue 
                            ? theme === 'dark' ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
                            : theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-100'
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Wallet className={`w-3.5 h-3.5 ${overdue ? 'text-red-400' : theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                            <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {t('customers.loanBalance')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold ${overdue ? 'text-red-400' : customer.loanBalance > 0 ? 'text-purple-400' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {t('common.currency')} {customer.loanBalance.toLocaleString()}
                            </p>
                            {overdue && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                                <AlertTriangle className="w-3 h-3" />
                                {t('customers.overdue')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Loan Due Date if exists */}
                      {customer.loanDueDate && customer.loanBalance > 0 && (
                        <div className={`flex items-center gap-2 text-xs mb-4 ${
                          overdue ? 'text-red-400' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {t('customers.dueDate')}: {new Date(customer.loanDueDate).toLocaleDateString()}
                        </div>
                      )}

                      {/* Actions */}
                      <div className={`flex gap-2 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                        <button
                          onClick={() => handleViewCustomer(customer)}
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
                          onClick={() => handleEditCustomer(customer)}
                          className={`p-2.5 rounded-xl transition-all ${
                            theme === 'dark' 
                              ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
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
                );
              })}
            </div>
          )}

          {/* Pagination for Grid View */}
          {(isMobile || viewMode === 'grid') && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCustomers.length}
              pageSize={pageSize}
              theme={theme}
            />
          )}

          {/* Table View - Desktop Only */}
          {!isMobile && viewMode === 'table' && (
            <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-400" />
                          {t('customers.customerName')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        {t('customers.customerType')}
                      </th>
                      <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-400" />
                          {t('common.phone')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-right text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          {t('customers.totalSpent')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-right text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center justify-end gap-2">
                          <Wallet className="w-4 h-4 text-purple-400" />
                          {t('customers.loanBalance')}
                        </div>
                      </th>
                      <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        {t('common.status')}
                      </th>
                      <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/30' : 'divide-slate-200'}`}>
                    {paginatedCustomers.map((customer) => {
                      const typeBadge = getCustomerTypeBadge(customer.customerType);
                      const TypeIcon = typeBadge.icon;
                      const overdue = isLoanOverdue(customer);
                      
                      return (
                        <tr
                          key={customer.id}
                          className={`group transition-all duration-300 ${
                            !customer.isActive ? 'opacity-50' : ''
                          } ${
                            theme === 'dark' 
                              ? 'hover:bg-slate-700/20' 
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Customer Name with Photo */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {customer.photo ? (
                                <img 
                                  src={customer.photo} 
                                  alt={customer.name}
                                  className="w-10 h-10 rounded-xl object-cover"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                                  theme === 'dark' 
                                    ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400' 
                                    : 'bg-gradient-to-br from-orange-100 to-rose-100 text-orange-600'
                                }`}>
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {customer.name}
                                </span>
                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {customer.businessName}
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          {/* Customer Type */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${typeBadge.className}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeBadge.label}
                            </span>
                          </td>
                          
                          {/* Phone */}
                          <td className={`px-4 py-4 text-sm font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {customer.phone}
                          </td>
                          
                          {/* Total Spent */}
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                              Rs. {customer.totalSpent.toLocaleString()}
                            </span>
                          </td>
                          
                          {/* Loan Balance */}
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm ${
                                overdue 
                                  ? 'bg-red-500/10 text-red-400'
                                  : customer.loanBalance > 0 
                                    ? 'bg-purple-500/10 text-purple-400' 
                                    : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                              }`}>
                                Rs. {customer.loanBalance.toLocaleString()}
                              </span>
                              {overdue && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                                  <AlertTriangle className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              customer.isActive
                                ? theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {customer.isActive ? (
                                <><UserCheck className="w-3 h-3" /> {t('common.active')}</>
                              ) : (
                                <><UserX className="w-3 h-3" /> {t('common.inactive')}</>
                              )}
                            </span>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewCustomer(customer)}
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
                                onClick={() => handleEditCustomer(customer)}
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
                                onClick={() => handleDeleteClick(customer)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination for Table View */}
          {!isMobile && viewMode === 'table' && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCustomers.length}
              pageSize={pageSize}
              theme={theme}
            />
          )}
        </>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
          }`}>
            <Users className={`w-10 h-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('customers.noCustomers')}
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
            {hasActiveFilters ? t('common.tryDifferentFilters') : t('customers.addFirstCustomer')}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <CustomerFormModal
        isOpen={showFormModal}
        customer={selectedCustomer || undefined}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveCustomer}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title={t('customers.deleteCustomer')}
        message={t('customers.deleteConfirmation')}
        itemName={customerToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <CustomerDetailsModal
        isOpen={showDetailsModal}
        customer={viewingCustomer}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEditCustomer}
      />
    </div>
  );
};
