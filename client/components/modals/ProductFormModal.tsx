import React, { useState, useEffect } from 'react';
import { Product } from '../../types/index';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, DialogContent } from '../ui/dialog';
import { Package, Tag, DollarSign, Boxes, FileText, Grid3X3, Save, Plus } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    sku: '',
    category: 'hardware',
    price: 0,
    stock: 0,
    description: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'hardware',
        price: 0,
        stock: 0,
        description: '',
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: product?.id || `prod-${Date.now()}`,
      ...formData,
    };
    onSave(newProduct);
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!product;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[85vh] overflow-y-auto p-0 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        {/* Gradient Header */}
        <div className={`p-6 text-white ${isEditing 
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' 
          : 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? t('common.edit') + ' Product' : t('products.addProduct')}
              </h2>
              <p className={`text-sm ${isEditing ? 'text-amber-100' : 'text-purple-100'}`}>
                {isEditing ? 'Update product information' : 'Add a new product to your inventory'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name & SKU Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <Tag className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Basic Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Package className="w-4 h-4 text-purple-500" />
                  {t('products.productName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="Enter product name"
                />
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Grid3X3 className="w-4 h-4 text-purple-500" />
                  {t('products.sku')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="SKU-12345"
                />
              </div>
            </div>
          </div>

          {/* Category, Price & Stock Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Pricing & Inventory</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Tag className="w-4 h-4 text-cyan-500" />
                  {t('products.category')} *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as 'hardware' | 'electrical' | 'tools' | 'other',
                    })
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                >
                  <option value="hardware">{t('products.hardware')}</option>
                  <option value="electrical">{t('products.electrical')}</option>
                  <option value="tools">{t('products.tools')}</option>
                  <option value="other">{t('products.other')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <DollarSign className="w-4 h-4 text-green-500" />
                  {t('products.price')} (Rs.) *
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>Rs.</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <Boxes className="w-4 h-4 text-blue-500" />
                  {t('products.stock')} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    theme === 'dark'
                      ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                      : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wide">Description</span>
            </div>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-4 h-4 text-slate-500" />
                {t('common.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                }`}
                placeholder="Enter product description..."
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
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{formData.name || 'Product Name'}</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>SKU: {formData.sku || 'N/A'} • {formData.category}</p>
                  <p className="text-lg font-bold text-purple-400 mt-1">
                    Rs. {formData.price?.toLocaleString() || '0.00'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    formData.stock === 0
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : formData.stock <= 10
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {formData.stock === 0 ? 'Out of Stock' : formData.stock <= 10 ? `Low Stock (${formData.stock})` : `${formData.stock} in stock`}
                  </span>
                </div>
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
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25'
              }`}
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Save Changes' : t('common.add') + ' Product'}
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
