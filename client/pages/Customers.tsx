import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockCustomers } from '../data/mockData';
import { Users, Search, Plus, Edit2, Trash2, Eye, Building2, Mail, Phone, Wallet, Sparkles } from 'lucide-react';
import { Customer } from '../types/index';
import { CustomerFormModal } from '../components/modals/CustomerFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { CustomerDetailsModal } from '../components/modals/CustomerDetailsModal';
import { useIsMobile } from '../hooks/use-mobile';

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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
    // Always clear search filter after saving so user can see the updated/new customer
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('customers.title')}
          </h1>
        </div>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
          {t('customers.allCustomers')} ({filteredCustomers.length})
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
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'}`}
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddCustomer}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('customers.addCustomer')}
        </button>
      </div>

      {/* Customers - Creative Table for Desktop, Cards for Mobile */}
      {filteredCustomers.length > 0 ? (
        <>
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-4">
              {filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={`group relative rounded-2xl border overflow-hidden transition-all duration-500 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-orange-500/30' 
                      : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-orange-300 shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Decorative gradient line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-500 opacity-60" />
                  
                  <div className="p-5">
                    {/* Header with Avatar */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400' 
                          : 'bg-gradient-to-br from-orange-100 to-rose-100 text-orange-600'
                      }`}>
                        {customer.name.charAt(0).toUpperCase()}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                          <Sparkles className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {customer.name}
                        </h3>
                        <div className={`flex items-center gap-1.5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">{customer.businessName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2.5 mb-4">
                      <div className={`flex items-center gap-2.5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className={`flex items-center gap-2.5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span>{customer.phone}</span>
                      </div>
                    </div>

                    {/* Total Spent Badge */}
                    <div className={`flex items-center justify-between p-3 rounded-xl ${
                      theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Wallet className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {t('customers.totalSpent')}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-emerald-400">
                        Rs. {customer.totalSpent.toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-2 mt-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
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
              ))}
            </div>
          ) : (
            /* Desktop Creative Table */
            <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-400" />
                          {t('customers.customerName')}
                        </div>
                      </th>
                      <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          {t('customers.businessName')}
                        </div>
                      </th>
                      <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400" />
                          {t('common.email')}
                        </div>
                      </th>
                      <th className={`px-6 py-5 text-left text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-400" />
                          {t('common.phone')}
                        </div>
                      </th>
                      <th className={`px-6 py-5 text-right text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        <div className="flex items-center justify-end gap-2">
                          <Wallet className="w-4 h-4 text-amber-400" />
                          {t('customers.totalSpent')}
                        </div>
                      </th>
                      <th className={`px-6 py-5 text-center text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400 bg-slate-800/80' : 'text-slate-500 bg-slate-50'}`}>
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredCustomers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className={`group table-row-creative transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-transparent' 
                            : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent'
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-110 ${
                              theme === 'dark' 
                                ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400' 
                                : 'bg-gradient-to-br from-orange-100 to-rose-100 text-orange-600'
                            }`}>
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className={`px-6 py-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                            theme === 'dark' ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {customer.businessName}
                          </span>
                        </td>
                        <td className={`px-6 py-5 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {customer.email}
                        </td>
                        <td className={`px-6 py-5 text-sm font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {customer.phone}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                            <span className="text-emerald-500/60">Rs.</span>
                            {customer.totalSpent.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewCustomer(customer)}
                              className={`p-2.5 rounded-xl transition-all hover:scale-110 ${
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
                              className={`p-2.5 rounded-xl transition-all hover:scale-110 ${
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
                              className={`p-2.5 rounded-xl transition-all hover:scale-110 ${
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
            <Users className={`w-10 h-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('customers.noCustomers')}
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
            Add your first customer to get started
          </p>
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
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        itemName={customerToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        isOpen={showDetailsModal}
        customer={viewingCustomer}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEditCustomer}
      />
    </div>
  );
};
