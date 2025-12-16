import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockInvoices, mockCustomers, mockProducts } from '../data/mockData';
import { Customer, Product, Invoice, InvoiceItem } from '../types/index';
import {
  FileText, User, Package, CheckCircle, ArrowLeft, UserX, CreditCard,
  AlertTriangle, Building2, Phone, DollarSign, Receipt, Calendar,
  Percent, Tag, Edit3, PackagePlus, Trash2, Plus, Search, X,
  Calculator, Zap, Box, Save, XCircle, Info
} from 'lucide-react';

// Extended Invoice Item with discount tracking
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
}

export const EditInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [customers] = useState<Customer[]>(mockCustomers);
  const [products] = useState<Product[]>(mockProducts);

  // Find the invoice being edited
  const originalInvoice = useMemo(() => {
    return mockInvoices.find(inv => inv.id === id) || null;
  }, [id]);

  // State - populated from original invoice
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [items, setItems] = useState<ExtendedInvoiceItem[]>([]);
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [status, setStatus] = useState<'paid' | 'pending' | 'overdue' | 'cancelled'>('pending');
  const [notes, setNotes] = useState('');

  // Product adding states
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [priceMode, setPriceMode] = useState<'auto' | 'retail' | 'wholesale' | 'custom'>('auto');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [itemDiscountType, setItemDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [itemDiscountValue, setItemDiscountValue] = useState<number>(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState<number>(0);
  const [quickAddQty, setQuickAddQty] = useState<number>(1);

  // Initialize form with invoice data
  useEffect(() => {
    if (originalInvoice) {
      setSelectedCustomer(originalInvoice.customerId);
      setIsWalkIn(originalInvoice.customerId === 'walk-in');
      setIssueDate(originalInvoice.issueDate);
      setDueDate(originalInvoice.dueDate);
      setDiscount(originalInvoice.discount || 0);
      setPaymentMethod(originalInvoice.paymentMethod || 'cash');
      setStatus(originalInvoice.status);
      setNotes(originalInvoice.notes || '');
      
      // Convert items to extended format
      const extendedItems: ExtendedInvoiceItem[] = originalInvoice.items.map(item => {
        const extItem = item as any;
        return {
          ...item,
          originalPrice: extItem.originalPrice || item.unitPrice,
          discountType: extItem.discountType || null,
          discountValue: extItem.discountValue || 0,
          isCustomPrice: extItem.isCustomPrice || false,
          isQuickAdd: extItem.isQuickAdd || false
        };
      });
      setItems(extendedItems);
    }
  }, [originalInvoice]);

  const currentCustomer = useMemo(() => {
    if (isWalkIn) return null;
    return customers.find(c => c.id === selectedCustomer);
  }, [selectedCustomer, isWalkIn, customers]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const search = productSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search)
    );
  }, [productSearch, products]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [selectedProductId, products]);

  // Calculate product price based on mode and customer type
  const getProductPrice = (product: Product | undefined): number => {
    if (!product) return 0;
    if (priceMode === 'custom') return customPrice;
    if (priceMode === 'retail') return product.retailPrice;
    if (priceMode === 'wholesale') return product.wholesalePrice;
    
    // Auto mode: use customer type
    if (currentCustomer?.customerType === 'wholesale') {
      return product.wholesalePrice;
    }
    return product.retailPrice;
  };

  const calculateFinalPrice = (basePrice: number): number => {
    if (!itemDiscountType || itemDiscountValue === 0) return basePrice;
    
    if (itemDiscountType === 'percentage') {
      return basePrice - (basePrice * itemDiscountValue / 100);
    }
    return Math.max(0, basePrice - itemDiscountValue);
  };

  const addItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    const basePrice = getProductPrice(selectedProduct);
    const finalPrice = calculateFinalPrice(basePrice);

    const newItem: ExtendedInvoiceItem = {
      id: `${Date.now()}-${Math.random()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      unitPrice: finalPrice,
      total: finalPrice * quantity,
      originalPrice: basePrice,
      discountType: itemDiscountType,
      discountValue: itemDiscountType ? itemDiscountValue : undefined,
      isCustomPrice: priceMode === 'custom',
      isQuickAdd: false
    };

    setItems([...items, newItem]);
    
    // Reset form
    setSelectedProductId('');
    setProductSearch('');
    setQuantity(1);
    setPriceMode('auto');
    setCustomPrice(0);
    setItemDiscountType(null);
    setItemDiscountValue(0);
  };

  const addQuickItem = () => {
    if (!quickAddName.trim() || quickAddPrice <= 0 || quickAddQty <= 0) return;

    const newItem: ExtendedInvoiceItem = {
      id: `quick-${Date.now()}-${Math.random()}`,
      productId: 'quick-add',
      productName: quickAddName,
      quantity: quickAddQty,
      unitPrice: quickAddPrice,
      total: quickAddPrice * quickAddQty,
      originalPrice: quickAddPrice,
      isQuickAdd: true
    };

    setItems([...items, newItem]);
    
    // Reset quick add form
    setQuickAddName('');
    setQuickAddPrice(0);
    setQuickAddQty(1);
    setShowQuickAdd(false);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) return;
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQty, total: item.unitPrice * newQty }
        : item
    ));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    return (subtotal * discount) / 100;
  }, [subtotal, discount]);

  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.15; // 15% tax
  const total = afterDiscount + tax;

  const handleSave = () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const updatedInvoice: Invoice = {
      ...originalInvoice!,
      customerId: isWalkIn ? 'walk-in' : selectedCustomer,
      customerName: isWalkIn ? 'Walk-in Customer' : (currentCustomer?.name || ''),
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal,
      discount,
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      issueDate,
      dueDate,
      status,
      paymentMethod,
      notes
    };

    console.log('Updated Invoice:', updatedInvoice);
    alert('Invoice updated successfully!');
    navigate(`/invoices/${id}`);
  };

  if (!originalInvoice) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
      }`}>
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Invoice Not Found
          </h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            The invoice you're trying to edit doesn't exist.
          </p>
          <button
            onClick={() => navigate('/invoices')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const basePrice = selectedProduct ? getProductPrice(selectedProduct) : 0;
  const finalItemPrice = calculateFinalPrice(basePrice);
  const itemTotal = finalItemPrice * quantity;
  const availableStock = selectedProduct?.stock || 0;

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/invoices/${id}`)}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Edit Invoice
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {originalInvoice.invoiceNumber} • Updating invoice details
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/invoices/${id}`)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={items.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Edit Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Customer Section */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Customer
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isWalkIn ? 'Walk-in sale' : currentCustomer?.name || 'Select customer'}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${
              theme === 'dark' ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                  Customer cannot be changed when editing. To change the customer, create a new invoice.
                </p>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Products & Items
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {items.length} items added
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  showQuickAdd
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                Quick Add
              </button>
            </div>

            {/* Quick Add Form */}
            {showQuickAdd && (
              <div className={`mb-4 p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>
                    Quick Add Non-Inventory Item
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark'
                        ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={quickAddPrice || ''}
                    onChange={(e) => setQuickAddPrice(parseFloat(e.target.value) || 0)}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark'
                        ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={quickAddQty || ''}
                    onChange={(e) => setQuickAddQty(parseInt(e.target.value) || 1)}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark'
                        ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <button
                  onClick={addQuickItem}
                  disabled={!quickAddName.trim() || quickAddPrice <= 0 || quickAddQty <= 0}
                  className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Quick Item (Rs. {(quickAddPrice * quickAddQty).toLocaleString()})
                </button>
              </div>
            )}

            {/* Product Search & Add */}
            <div className="space-y-4 mb-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setSelectedProductId('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl ${
                    theme === 'dark'
                      ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {productSearch && !selectedProductId && (
                <div className={`max-h-60 overflow-y-auto rounded-xl border ${
                  theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}>
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setProductSearch(product.name);
                      }}
                      className={`w-full p-3 text-left transition-all border-b last:border-b-0 ${
                        theme === 'dark'
                          ? 'border-slate-700 hover:bg-slate-700'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}>
                          <Box className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {product.name}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            SKU: {product.sku} • Stock: {product.stock}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Rs. {product.retailPrice.toLocaleString()}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                            Wholesale: Rs. {product.wholesalePrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                      }`}>
                        <Package className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {selectedProduct.name}
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          SKU: {selectedProduct.sku} • Available: {availableStock} units
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductId('');
                        setProductSearch('');
                      }}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price Mode Selection */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { value: 'auto', label: 'Auto', icon: Calculator },
                      { value: 'retail', label: 'Retail', icon: Tag },
                      { value: 'wholesale', label: 'Wholesale', icon: Box },
                      { value: 'custom', label: 'Custom', icon: Edit3 }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setPriceMode(value as any)}
                        className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                          priceMode === value
                            ? 'border-blue-500 bg-blue-500/10'
                            : theme === 'dark'
                            ? 'border-slate-700 hover:border-slate-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${
                          priceMode === value ? 'text-blue-400' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          priceMode === value ? 'text-blue-400' : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {priceMode === 'custom' && (
                    <div className="mb-3">
                      <input
                        type="number"
                        placeholder="Enter custom price"
                        value={customPrice || ''}
                        onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-700 text-white'
                            : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      />
                    </div>
                  )}

                  {/* Item Discount */}
                  <div className="mb-3">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Item Discount (Optional)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={itemDiscountType || ''}
                        onChange={(e) => setItemDiscountType(e.target.value as any || null)}
                        className={`px-3 py-2 border rounded-lg ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-700 text-white'
                            : 'border-slate-200 bg-white text-slate-900'
                        }`}
                      >
                        <option value="">No Discount</option>
                        <option value="percentage">Percentage %</option>
                        <option value="fixed">Fixed Rs.</option>
                      </select>
                      {itemDiscountType && (
                        <input
                          type="number"
                          placeholder={itemDiscountType === 'percentage' ? '0-100' : 'Amount'}
                          value={itemDiscountValue || ''}
                          onChange={(e) => setItemDiscountValue(parseFloat(e.target.value) || 0)}
                          className={`flex-1 px-3 py-2 border rounded-lg ${
                            theme === 'dark'
                              ? 'border-slate-600 bg-slate-700 text-white'
                              : 'border-slate-200 bg-white text-slate-900'
                          }`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-700 text-white'
                          : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Price Calculation Display */}
                  <div className={`p-3 rounded-lg mb-3 ${
                    theme === 'dark' ? 'bg-slate-700' : 'bg-white'
                  }`}>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Base Price:</span>
                        <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                          Rs. {basePrice.toLocaleString()}
                        </span>
                      </div>
                      {itemDiscountType && itemDiscountValue > 0 && (
                        <div className="flex justify-between text-pink-400">
                          <span>Discount:</span>
                          <span>
                            - Rs. {(basePrice - finalItemPrice).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                          Final Price × {quantity}:
                        </span>
                        <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                          Rs. {finalItemPrice.toLocaleString()} × {quantity}
                        </span>
                      </div>
                      <div className={`flex justify-between pt-2 mt-2 border-t ${
                        theme === 'dark' ? 'border-slate-600' : 'border-slate-200'
                      }`}>
                        <span className="font-bold text-emerald-400">Item Total:</span>
                        <span className="font-bold text-emerald-400">Rs. {itemTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={addItem}
                    disabled={quantity > availableStock || (priceMode === 'custom' && customPrice <= 0)}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Invoice
                  </button>
                </div>
              )}
            </div>

            {/* Items List */}
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => {
                  const extItem = item as ExtendedInvoiceItem;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          extItem.isQuickAdd
                            ? 'bg-amber-500/20'
                            : 'bg-blue-500/20'
                        }`}>
                          {extItem.isQuickAdd ? (
                            <Zap className="w-6 h-6 text-amber-400" />
                          ) : (
                            <Package className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {item.productName}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {extItem.discountType && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-pink-500/10 text-pink-400 rounded-full">
                                    {extItem.discountType === 'percentage'
                                      ? `${extItem.discountValue}% off`
                                      : `Rs.${extItem.discountValue} off`}
                                  </span>
                                )}
                                {extItem.isCustomPrice && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 rounded-full">
                                    Custom Price
                                  </span>
                                )}
                                {extItem.isQuickAdd && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded-full">
                                    Quick Add
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className={`p-2 rounded-lg transition-all ${
                                theme === 'dark'
                                  ? 'hover:bg-red-500/20 text-red-400'
                                  : 'hover:bg-red-100 text-red-500'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className={`w-20 px-3 py-1.5 border rounded-lg text-center ${
                                  theme === 'dark'
                                    ? 'border-slate-600 bg-slate-700 text-white'
                                    : 'border-slate-200 bg-white text-slate-900'
                                }`}
                              />
                              <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                × Rs. {item.unitPrice.toLocaleString()}
                              </span>
                            </div>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              Rs. {item.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-12 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <Package className={`w-12 h-12 mx-auto mb-3 ${
                  theme === 'dark' ? 'text-slate-600' : 'text-slate-300'
                }`} />
                <p className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  No items added yet
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Search and add products to the invoice
                </p>
              </div>
            )}
          </div>

          {/* Invoice Settings */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Invoice Settings
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'border-slate-600 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'border-slate-600 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Status
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'pending', label: 'Pending', color: 'amber' },
                  { value: 'paid', label: 'Paid', color: 'emerald' },
                  { value: 'overdue', label: 'Overdue', color: 'red' },
                  { value: 'cancelled', label: 'Cancelled', color: 'slate' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setStatus(value as any)}
                    className={`p-2.5 rounded-lg border-2 font-medium transition-all ${
                      status === value
                        ? `border-${color}-500 bg-${color}-500/10 text-${color}-400`
                        : theme === 'dark'
                        ? 'border-slate-700 hover:border-slate-600 text-slate-400'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: DollarSign, emoji: '💵' },
                  { value: 'card', label: 'Card', icon: CreditCard, emoji: '💳' },
                  { value: 'bank_transfer', label: 'Bank', icon: Building2, emoji: '🏦' },
                  { value: 'credit', label: 'Credit', icon: Receipt, emoji: '📝' }
                ].map(({ value, label, icon: Icon, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMethod(value as any)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === value
                        ? 'border-blue-500 bg-blue-500/10'
                        : theme === 'dark'
                        ? 'border-slate-700 hover:border-slate-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span className={`text-sm font-medium ${
                        paymentMethod === value
                          ? 'text-blue-400'
                          : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg resize-none ${
                  theme === 'dark'
                    ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Preview & Summary */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`p-6 rounded-2xl border sticky top-6 ${
            theme === 'dark' ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-xl'
          }`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Calculator className="w-5 h-5 text-emerald-500" />
              Invoice Summary
            </h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Items</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {items.length} ({items.reduce((sum, item) => sum + item.quantity, 0)} units)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Subtotal</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Overall Discount */}
            <div className={`p-3 rounded-lg mb-4 ${
              theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
            }`}>
              <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Percent className="w-4 h-4 text-pink-400" />
                Overall Discount
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className={`w-24 px-3 py-2 border rounded-lg text-center ${
                    theme === 'dark'
                      ? 'border-slate-600 bg-slate-700 text-white'
                      : 'border-slate-200 bg-white text-slate-900'
                  }`}
                />
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>%</span>
                {discountAmount > 0 && (
                  <span className="text-pink-400 font-medium text-sm">
                    - Rs. {discountAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className={`space-y-2 pt-4 border-t ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            }`}>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-pink-400">
                  <span>Discount ({discount}%)</span>
                  <span className="font-mono">- Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>After Discount</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Rs. {afterDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Tax (15%)</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Rs. {tax.toFixed(2)}
                </span>
              </div>
            </div>

            <div className={`mt-4 pt-4 border-t ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Total Amount
                </span>
                <span className="text-3xl font-bold text-emerald-500">
                  Rs. {total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={items.length === 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/30"
              >
                <Save className="w-6 h-6" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoice;
