import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockProducts, mockBrands, mockCategories } from '../data/mockData';
import { 
  Package, Search, Plus, Edit2, Trash2, ChevronDown, AlertTriangle, CheckCircle, XCircle, 
  Filter, Grid, List, Building2, Tag, Layers, BarChart3, Box, RefreshCw, DollarSign
} from 'lucide-react';
import { Product } from '../types/index';
import { ProductFormModal } from '../components/modals/ProductFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { SearchableSelect } from '../components/ui/searchable-select';

type ViewMode = 'grid' | 'table';
type PriceDisplayMode = 'retail' | 'wholesale' | 'both';

export const Products: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [priceDisplay, setPriceDisplay] = useState<PriceDisplayMode>('both');
  const [expandedVariants, setExpandedVariants] = useState<string[]>([]);

  // Get all categories (show all available categories so new ones appear immediately)
  const allCategories = useMemo(() => {
    return mockCategories;
  }, []);

  // Get all active brands (show all available brands so new ones appear immediately)
  const allBrands = useMemo(() => {
    return mockBrands.filter(b => b.isActive);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.nameAlt && product.nameAlt.includes(searchQuery)) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter || product.category === categoryFilter;
      const matchesBrand = brandFilter === 'all' || product.brandId === brandFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = product.stock <= (product.minStock || 10) && product.stock > 0;
      } else if (stockFilter === 'out') {
        matchesStock = product.stock === 0;
      } else if (stockFilter === 'in') {
        matchesStock = product.stock > (product.minStock || 10);
      }
      
      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, stockFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter(p => p.stock <= (p.minStock || 10) && p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.retailPrice || p.price || 0) * p.stock, 0);
    return { totalProducts, lowStock, outOfStock, totalValue };
  }, [products]);

  const toggleVariants = (productId: string) => {
    setExpandedVariants(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBrandFilter('all');
    setStockFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || brandFilter !== 'all' || stockFilter !== 'all';

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

  const getStockStatus = (stock: number, minStock?: number) => {
    const threshold = minStock || 10;
    if (stock === 0) return 'outOfStock';
    if (stock <= threshold) return 'lowStock';
    return 'inStock';
  };

  const getStockBadgeClasses = (stock: number, minStock?: number) => {
    const status = getStockStatus(stock, minStock);
    switch (status) {
      case 'inStock':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'lowStock':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'outOfStock':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

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
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts([...products, product]);
      clearFilters();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            Manage your product inventory, variants, and pricing
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('products.addProduct')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.totalProducts}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Total Products</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.lowStock}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Low Stock</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.outOfStock}</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Out of Stock</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Rs. {(stats.totalValue / 1000000).toFixed(1)}M</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Stock Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Toolbar */}
      <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col gap-4">
          {/* Top Row - Search and View Mode */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, SKU, brand, or Sinhala name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>

            {/* View Mode & Price Display */}
            <div className="flex gap-2">
              <div className={`flex rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-purple-500 text-white' : theme === 'dark' ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-purple-500 text-white' : theme === 'dark' ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <SearchableSelect
                value={priceDisplay}
                onValueChange={(value) => setPriceDisplay(value as PriceDisplayMode)}
                placeholder="Price Display"
                searchPlaceholder={t('common.search')}
                emptyMessage="No options found"
                theme={theme}
                options={[
                  { value: 'both', label: 'Both Prices', icon: <DollarSign className="w-4 h-4" /> },
                  { value: 'retail', label: 'Retail Only', icon: <Tag className="w-4 h-4" /> },
                  { value: 'wholesale', label: 'Wholesale Only', icon: <Package className="w-4 h-4" /> },
                ]}
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            {/* Category Filter */}
            <div className="min-w-[180px]">
              <SearchableSelect
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
                placeholder="All Categories"
                searchPlaceholder={t('common.search')}
                emptyMessage="No categories found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Categories', count: allCategories.length, icon: <Layers className="w-4 h-4" /> },
                  ...allCategories.map(cat => ({
                    value: cat.id,
                    label: `${cat.name}${cat.nameAlt ? ` (${cat.nameAlt})` : ''}`,
                    icon: <Layers className="w-4 h-4" />
                  }))
                ]}
              />
            </div>

            {/* Brand Filter */}
            <div className="min-w-[180px]">
              <SearchableSelect
                value={brandFilter}
                onValueChange={(value) => setBrandFilter(value)}
                placeholder="All Brands"
                searchPlaceholder={t('common.search')}
                emptyMessage="No brands found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Brands', count: allBrands.length, icon: <Building2 className="w-4 h-4" /> },
                  ...allBrands.map(brand => ({
                    value: brand.id,
                    label: `${brand.name} (${brand.country})`,
                    icon: <Building2 className="w-4 h-4" />
                  }))
                ]}
              />
            </div>

            {/* Stock Filter */}
            <div className="min-w-[180px]">
              <SearchableSelect
                value={stockFilter}
                onValueChange={(value) => setStockFilter(value)}
                placeholder="All Stock Levels"
                searchPlaceholder={t('common.search')}
                emptyMessage="No options found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Stock Levels', icon: <Box className="w-4 h-4" /> },
                  { value: 'in', label: 'In Stock', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
                  { value: 'low', label: 'Low Stock', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
                  { value: 'out', label: 'Out of Stock', icon: <XCircle className="w-4 h-4 text-red-500" /> },
                ]}
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}

            <div className={`ml-auto text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`group rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col card-hover ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}
              >
                {/* Product Header */}
                <div className={`p-5 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold group-hover:text-purple-400 transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {product.name}
                      </h3>
                      {product.nameAlt && (
                        <p className={`text-xs mt-0.5 truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                          {product.nameAlt}
                        </p>
                      )}
                    </div>
                    {product.isFeatured && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.brand && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Building2 className="w-3 h-3" />
                        {product.brand}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {mockCategories.find(c => c.id === product.categoryId)?.name || product.category}
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className={`p-5 space-y-3 border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                  {(priceDisplay === 'both' || priceDisplay === 'retail') && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                        Retail Price
                      </span>
                      <span className="text-lg font-bold text-green-500">
                        {formatPrice(product.retailPrice || product.price || 0)}
                      </span>
                    </div>
                  )}
                  {(priceDisplay === 'both' || priceDisplay === 'wholesale') && product.wholesalePrice && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                        Wholesale Price
                      </span>
                      <span className="text-lg font-bold text-blue-500">
                        {formatPrice(product.wholesalePrice)}
                      </span>
                    </div>
                  )}
                  {priceDisplay === 'both' && product.costPrice && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                        Cost: {formatPrice(product.costPrice)}
                      </span>
                      <span className={`text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                        Margin: {Math.round(((product.retailPrice || product.price || 0) - product.costPrice) / product.costPrice * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock & Variants */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      Stock ({product.unit || 'pcs'})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {product.stock}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStockBadgeClasses(product.stock, product.minStock)}`}>
                        {getStockStatus(product.stock, product.minStock) === 'inStock' && <CheckCircle className="w-3 h-3" />}
                        {getStockStatus(product.stock, product.minStock) === 'lowStock' && <AlertTriangle className="w-3 h-3" />}
                        {getStockStatus(product.stock, product.minStock) === 'outOfStock' && <XCircle className="w-3 h-3" />}
                        {getStockStatus(product.stock, product.minStock) === 'inStock' ? 'In Stock' : getStockStatus(product.stock, product.minStock) === 'lowStock' ? 'Low' : 'Out'}
                      </span>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className={`w-full rounded-full h-1.5 overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        product.stock === 0
                          ? 'bg-red-500'
                          : product.stock <= (product.minStock || 10)
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((product.stock / (product.maxStock || 100)) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Variants Indicator */}
                  {product.hasVariants && product.variants && product.variants.length > 0 && (
                    <button
                      onClick={() => toggleVariants(product.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                      <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        {product.variants.length} Variants Available
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedVariants.includes(product.id) ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {/* Expanded Variants */}
                  {expandedVariants.includes(product.id) && product.variants && (
                    <div className={`space-y-1.5 p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                      {product.variants.slice(0, 4).map((variant) => (
                        <div key={variant.id} className={`flex items-center justify-between text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>{variant.size || variant.color || variant.sku}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">{formatPrice(variant.retailPrice)}</span>
                            <span className={`${variant.stock <= (variant.minStock || 5) ? 'text-yellow-500' : ''}`}>
                              ({variant.stock} in stock)
                            </span>
                          </div>
                        </div>
                      ))}
                      {product.variants.length > 4 && (
                        <p className={`text-xs text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          +{product.variants.length - 4} more variants
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sizes/Colors Tags */}
                  {product.sizes && product.sizes.length > 0 && !product.hasVariants && (
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.slice(0, 4).map((size) => (
                        <span key={size} className={`px-2 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {size}
                        </span>
                      ))}
                      {product.sizes.length > 4 && (
                        <span className={`px-2 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          +{product.sizes.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={`p-4 border-t flex gap-2 ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'}`}>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
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
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Product</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Brand</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Category</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Wholesale</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Retail</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Stock</th>
                    <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Variants</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{product.name}</p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>SKU: {product.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{product.brand || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                          {mockCategories.find(c => c.id === product.categoryId)?.name || product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-blue-500 font-medium">{product.wholesalePrice ? formatPrice(product.wholesalePrice) : '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-green-500 font-medium">{formatPrice(product.retailPrice || product.price || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{product.stock}</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${getStockBadgeClasses(product.stock, product.minStock)}`}>
                            {getStockStatus(product.stock, product.minStock) === 'inStock' && <CheckCircle className="w-3 h-3" />}
                            {getStockStatus(product.stock, product.minStock) === 'lowStock' && <AlertTriangle className="w-3 h-3" />}
                            {getStockStatus(product.stock, product.minStock) === 'outOfStock' && <XCircle className="w-3 h-3" />}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.hasVariants && product.variants ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            <Layers className="w-3 h-3" />
                            {product.variants.length}
                          </span>
                        ) : (
                          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
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
          <Package className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            No products found
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              Clear filters to see all products
            </button>
          )}
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
