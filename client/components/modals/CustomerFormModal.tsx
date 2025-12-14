import React, { useState, useEffect } from 'react';
import { Customer } from '../../types/index';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, DialogContent } from '../ui/dialog';
import { User, Building2, Mail, Phone, MapPin, Calendar, CreditCard, Save, Plus, UserPlus } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    registrationDate: new Date().toISOString().split('T')[0],
    totalSpent: 0,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        businessName: customer.businessName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        registrationDate: customer.registrationDate,
        totalSpent: customer.totalSpent,
      });
    } else {
      setFormData({
        name: '',
        businessName: '',
        email: '',
        phone: '',
        address: '',
        registrationDate: new Date().toISOString().split('T')[0],
        totalSpent: 0,
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: customer?.id || `cust-${Date.now()}`,
      ...formData,
    };
    onSave(newCustomer);
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!customer;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[85vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        {/* Gradient Header */}
        <div className={`p-6 text-white ${isEditing 
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              {isEditing ? <User className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? t('common.edit') + ' Customer' : t('customers.addCustomer')}
              </h2>
              <p className={`text-sm ${isEditing ? 'text-amber-100' : 'text-orange-100'}`}>
                {isEditing ? 'Update customer information' : 'Add a new customer to your database'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <User className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Personal Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <User className="w-4 h-4 text-orange-500" />
                  {t('customers.customerName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Building2 className="w-4 h-4 text-rose-500" />
                  {t('customers.businessName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="Enter business name"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <Phone className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Contact Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Mail className="w-4 h-4 text-blue-500" />
                  {t('common.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Phone className="w-4 h-4 text-green-500" />
                  {t('common.phone')} *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="+94 71 234 5678"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Address</span>
            </div>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <MapPin className="w-4 h-4 text-red-500" />
                {t('common.address')} *
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="Enter complete address"
              />
            </div>
          </div>

          {/* Preview Card */}
          {formData.name && (
            <div className={`rounded-xl p-4 border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/30 border-slate-700/50'
                : 'bg-gradient-to-br from-slate-100 to-white border-slate-200'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>Preview</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/20">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formData.name}</h4>
                  <p className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Building2 className="w-3.5 h-3.5" />
                    {formData.businessName || 'Business Name'}
                  </p>
                  <div className={`flex items-center gap-4 mt-2 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {formData.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {formData.email}
                      </span>
                    )}
                    {formData.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {formData.phone}
                      </span>
                    )}
                  </div>
                </div>
                {isEditing && customer && (
                  <div className="text-right">
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Total Spent</p>
                    <p className="text-lg font-bold text-orange-400">
                      Rs. {customer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className={`flex gap-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all shadow-lg ${
                isEditing
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-orange-500/25'
              }`}
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Save Changes' : t('common.add') + ' Customer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors border ${
                theme === 'dark'
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600/50'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
              }`}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
