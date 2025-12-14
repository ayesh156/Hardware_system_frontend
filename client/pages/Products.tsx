import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProducts } from '../data/mockData';
import { Package, Search, Plus, Edit2, Trash2, ChevronDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Product } from '../types/index';
import { ProductFormModal } from '../components/modals/ProductFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';

export const Products: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowFormModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowFormModal(true);
  };

  const handleSaveProduct = (product: Product) => {
    if (selectedProduct) {
      setProducts(
        products.map((p) => (p.id === product.id ? product : p))
      );
    } else {
      setProducts([...products, product]);
      // Clear filters after adding a new product so user can see it
      setSearchQuery('');
      setCategoryFilter('all');
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      setProducts(products.filter((p) => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return 'outOfStock';
    if (stock <= 10) return 'lowStock';
    return 'inStock';
  };

  const getStockColor = (stock: number) => {
    const status = getStockStatus(stock);
    switch (status) {
      case 'inStock':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'lowStock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'outOfStock':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {t('products.title')}
          </h1>
        </div>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
          {t('products.allProducts')} ({filteredProducts.length})
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
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'}`}
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-4 py-2.5 border rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none pr-10 ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
          >
            <option value="all">{t('common.filter')}</option>
            <option value="hardware">{t('products.hardware')}</option>
            <option value="electrical">{t('products.electrical')}</option>
            <option value="tools">{t('products.tools')}</option>
            <option value="other">{t('products.other')}</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddProduct}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('products.addProduct')}
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`group rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
            >
              {/* Product Header */}
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold group-hover:text-purple-400 transition-colors line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {product.name}
                    </h3>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      SKU: {product.sku}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
                    {t(`products.${product.category}`)}
                  </span>
                </div>
                <p className={`text-sm line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {product.description}
                </p>
              </div>

              {/* Product Details */}
              <div className="p-6 space-y-4 flex-1">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {t('products.price')}
                  </span>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Rs. {product.price.toLocaleString()}
                  </span>
                </div>

                {/* Stock Status */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {t('products.stock')}
                  </span>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {product.stock}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        product.stock === 0
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : product.stock <= 10
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}
                    >
                      {getStockStatus(product.stock) === 'inStock' && (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      {getStockStatus(product.stock) === 'lowStock' && (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {getStockStatus(product.stock) === 'outOfStock' && (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {t(`products.${getStockStatus(product.stock)}`)}
                    </span>
                  </div>
                </div>

                {/* Stock Bar */}
                <div className={`w-full rounded-full h-2 overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      product.stock === 0
                        ? 'bg-red-500'
                        : product.stock <= 10
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className={`p-6 border-t flex gap-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <button
                  onClick={() => handleEditProduct(product)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDeleteClick(product)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <Package className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('products.noProducts')}
          </p>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={showFormModal}
        product={selectedProduct || undefined}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveProduct}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        itemName={productToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
