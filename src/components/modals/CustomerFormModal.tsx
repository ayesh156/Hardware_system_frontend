import React, { useState, useEffect, useRef } from 'react';
import { Customer, CustomerType } from '../../types/index';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Save, 
  Plus, 
  UserPlus,
  Camera,
  Crown,
  ShoppingBag,
  Wallet,
  Clock,
  IdCard,
  X
} from 'lucide-react';

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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    nameSi: '',
    businessName: '',
    email: '',
    phone: '',
    phone2: '',
    nic: '',
    address: '',
    photo: '',
    registrationDate: new Date().toISOString().split('T')[0],
    totalSpent: 0,
    customerType: 'regular',
    isActive: true,
    loanBalance: 0,
    loanDueDate: '',
    creditLimit: 0,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        nameSi: customer.nameSi || '',
        businessName: customer.businessName,
        email: customer.email,
        phone: customer.phone,
        phone2: customer.phone2 || '',
        nic: customer.nic || '',
        address: customer.address,
        photo: customer.photo || '',
        registrationDate: customer.registrationDate,
        totalSpent: customer.totalSpent,
        customerType: customer.customerType,
        isActive: customer.isActive,
        loanBalance: customer.loanBalance,
        loanDueDate: customer.loanDueDate || '',
        creditLimit: customer.creditLimit || 0,
      });
    } else {
      setFormData({
        name: '',
        nameSi: '',
        businessName: '',
        email: '',
        phone: '',
        phone2: '',
        nic: '',
        address: '',
        photo: '',
        registrationDate: new Date().toISOString().split('T')[0],
        totalSpent: 0,
        customerType: 'regular',
        isActive: true,
        loanBalance: 0,
        loanDueDate: '',
        creditLimit: 0,
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: customer?.id || `cust-${Date.now()}`,
      ...formData,
      nameSi: formData.nameSi || undefined,
      phone2: formData.phone2 || undefined,
      nic: formData.nic || undefined,
      photo: formData.photo || undefined,
      loanDueDate: formData.loanDueDate || undefined,
      creditLimit: formData.creditLimit || undefined,
    };
    onSave(newCustomer);
    onClose();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, photo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const isEditing = !!customer;

  const customerTypeOptions: { value: CustomerType; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'regular', label: t('customers.regular'), icon: ShoppingBag, color: 'text-blue-500' },
    { value: 'wholesale', label: t('customers.wholesale'), icon: Crown, color: 'text-amber-500' },
    { value: 'credit', label: t('customers.credit'), icon: CreditCard, color: 'text-purple-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isEditing ? t('common.edit') + ' ' + t('customers.customer') : t('customers.addCustomer')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('customers.updateInfo') : t('customers.addNewCustomer')}
          </DialogDescription>
        </DialogHeader>
        {/* Gradient Header */}
        <div className={`p-6 text-white ${isEditing 
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600'
        }`} aria-hidden="true">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              {isEditing ? <User className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? t('common.edit') + ' ' + t('customers.customer') : t('customers.addCustomer')}
              </h2>
              <p className={`text-sm ${isEditing ? 'text-amber-100' : 'text-orange-100'}`}>
                {isEditing ? t('customers.updateInfo') : t('customers.addNewCustomer')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload Section */}
          <div className="flex justify-center">
            <div className="relative">
              {formData.photo ? (
                <div className="relative">
                  <img 
                    src={formData.photo} 
                    alt={t('customers.customerPhoto')}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-orange-200 dark:border-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    theme === 'dark' 
                      ? 'border-slate-600 hover:border-orange-500 bg-slate-800/50' 
                      : 'border-slate-300 hover:border-orange-500 bg-slate-50'
                  }`}
                >
                  <Camera className={`w-6 h-6 mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('customers.addPhoto')}
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <User className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t('customers.personalInfo')}</span>
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
                  placeholder={t('customers.enterName')}
                />
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <User className="w-4 h-4 text-emerald-500" />
                  {t('customers.sinhalaName')}
                </label>
                <input
                  type="text"
                  value={formData.nameSi}
                  onChange={(e) => setFormData({ ...formData, nameSi: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder={t('customers.enterSinhalaName')}
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
                  placeholder={t('customers.enterBusinessName')}
                />
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <IdCard className="w-4 h-4 text-indigo-500" />
                  {t('customers.nic')}
                </label>
                <input
                  type="text"
                  value={formData.nic}
                  onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="e.g., 123456789V"
                />
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Calendar className="w-4 h-4 text-cyan-500" />
                  {t('customers.registrationDate')}
                </label>
                <input
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <Phone className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t('customers.contactInfo')}</span>
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

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Phone className="w-4 h-4 text-emerald-500" />
                  {t('customers.phone2')}
                </label>
                <input
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="+94 11 234 5678"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t('common.address')}</span>
            </div>
            <div className="space-y-2">
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
                placeholder={t('customers.enterAddress')}
              />
            </div>
          </div>

          {/* Customer Type Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <Crown className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">{t('customers.customerType')}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {customerTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, customerType: option.value })}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.customerType === option.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : theme === 'dark'
                        ? 'border-slate-700 hover:border-slate-600'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <option.icon className={`w-6 h-6 ${option.color}`} />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Credit/Loan Section - Only show for credit or wholesale customers */}
          {(formData.customerType === 'credit' || formData.customerType === 'wholesale') && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                <Wallet className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wide">{t('customers.creditInfo')}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    {t('customers.creditLimit')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <Wallet className="w-4 h-4 text-purple-500" />
                    {t('customers.loanBalance')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.loanBalance}
                    onChange={(e) => setFormData({ ...formData, loanBalance: Number(e.target.value) })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <Clock className="w-4 h-4 text-red-500" />
                    {t('customers.dueDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.loanDueDate}
                    onChange={(e) => setFormData({ ...formData, loanDueDate: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Status Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('customers.activeStatus')}
              </label>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('customers.activeStatusDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.isActive ? 'bg-emerald-500' : theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
              }`}>{t('common.preview')}</p>
              <div className="flex items-center gap-4">
                {formData.photo ? (
                  <img src={formData.photo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/20">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formData.name}</h4>
                    {customerTypeOptions.find(o => o.value === formData.customerType) && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        formData.customerType === 'wholesale' 
                          ? 'bg-amber-500/10 text-amber-500'
                          : formData.customerType === 'credit'
                            ? 'bg-purple-500/10 text-purple-500'
                            : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {customerTypeOptions.find(o => o.value === formData.customerType)?.label}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Building2 className="w-3.5 h-3.5" />
                    {formData.businessName || t('customers.businessName')}
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
                {(formData.customerType === 'credit' || formData.customerType === 'wholesale') && formData.creditLimit > 0 && (
                  <div className="text-right">
                    <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t('customers.creditLimit')}</p>
                    <p className="text-lg font-bold text-amber-400">
                      Rs. {formData.creditLimit.toLocaleString()}
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
              {isEditing ? t('common.saveChanges') : t('customers.addCustomer')}
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
