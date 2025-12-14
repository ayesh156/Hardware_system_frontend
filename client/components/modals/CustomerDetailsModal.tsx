import React from 'react';
import { Customer } from '../../types/index';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog, DialogContent } from '../ui/dialog';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Edit2,
  X,
  Sparkles,
  CreditCard,
  Clock,
  Star
} from 'lucide-react';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  customer,
  onClose,
  onEdit,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !customer) return null;

  // Generate initials from customer name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate customer tier based on total spent
  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000000) return { name: 'Platinum', color: 'from-slate-400 to-slate-600', badge: 'bg-slate-500' };
    if (totalSpent >= 500000) return { name: 'Gold', color: 'from-amber-400 to-amber-600', badge: 'bg-amber-500' };
    if (totalSpent >= 200000) return { name: 'Silver', color: 'from-gray-300 to-gray-500', badge: 'bg-gray-400' };
    return { name: 'Bronze', color: 'from-orange-400 to-orange-600', badge: 'bg-orange-500' };
  };

  // Calculate days since registration
  const getDaysSinceRegistration = (date: string) => {
    const regDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - regDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const tier = getCustomerTier(customer.totalSpent);
  const daysSinceReg = getDaysSinceRegistration(customer.registrationDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl flex flex-col">
        {/* Animated Background Header */}
        <div className="relative h-36 flex-shrink-0 bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/2 w-20 h-20 bg-white/5 rounded-full" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Customer tier badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${tier.badge} flex items-center gap-1 shadow-lg`}>
              <Star className="w-3 h-3" />
              {tier.name} Customer
            </span>
          </div>

          {/* Avatar positioned to overlap header and content */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-white dark:border-slate-900 rotate-3 hover:rotate-0 transition-transform duration-300`}>
              {getInitials(customer.name)}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-14 pb-6 px-6">
          {/* Name and Business */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {customer.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              {customer.businessName}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-800/30">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('customers.totalSpent')}</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                Rs. {customer.totalSpent.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800/30">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Member Since</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {new Date(customer.registrationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 text-center border border-purple-100 dark:border-purple-800/30">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Days Active</p>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {daysSinceReg}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a 
                href={`mailto:${customer.email}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200 group border border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.email')}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {customer.email}
                  </p>
                </div>
              </a>

              <a 
                href={`tel:${customer.phone}`}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200 group border border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.phone')}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {customer.phone}
                  </p>
                </div>
              </a>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.address')}</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {customer.address}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onEdit(customer);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              <Edit2 className="w-4 h-4" />
              {t('common.edit')} Customer
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all duration-200"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
