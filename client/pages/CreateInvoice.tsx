import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { mockCustomers, mockProducts } from '../data/mockData';
import { Customer, Product, Invoice, InvoiceItem } from '../types/index';
import { PrintInvoiceModal } from '../components/modals/PrintInvoiceModal';
import {
  FileText, User, Package, CheckCircle, ChevronLeft, ChevronRight,
  Search, Plus, Trash2, Calendar, ArrowLeft, UserX, CreditCard,
  AlertTriangle, Building2, Phone, DollarSign, ShoppingCart, Receipt,
  Percent, Tag, Box, Edit3, PackagePlus, Boxes, Calculator, Zap
} from 'lucide-react';

// Extended Invoice Item with discount tracking
interface ExtendedInvoiceItem extends InvoiceItem {
  originalPrice: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  isCustomPrice?: boolean;
  isQuickAdd?: boolean;
}

type Step = 1 | 2 | 3;

export const CreateInvoice: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [customers] = useState<Customer[]>(mockCustomers);
  const [products] = useState<Product[]>(mockProducts);
  
  const [step, setStep] = useState<Step>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<ExtendedInvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [enableTax, setEnableTax] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(15);
  
  // Enhanced pricing state
  const [priceMode, setPriceMode] = useState<'auto' | 'wholesale' | 'retail' | 'custom'>('auto');
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [itemDiscountType, setItemDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [itemDiscountValue, setItemDiscountValue] = useState<number>(0);
  
  // Quick add product state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState<number>(0);
  const [quickAddQty, setQuickAddQty] = useState<number>(1);
  
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const currentCustomer = customers.find((c) => c.id === selectedCustomer);
  const currentProduct = products.find((p) => p.id === selectedProductId);

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.businessName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(searchLower)
    );
  }, [customers, customerSearch]);

  // Filter products by search - include out of stock for visibility
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (productSearch.trim()) {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (selectedProduct && productSearch === selectedProduct.name) {
        filtered = products;
      } else {
        const searchLower = productSearch.toLowerCase();
        filtered = products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.sku.toLowerCase().includes(searchLower) ||
            (p.nameAlt && p.nameAlt.includes(searchLower)) ||
            p.category.toLowerCase().includes(searchLower) ||
            (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
            (p.barcode && p.barcode.includes(searchLower))
        );
      }
    }
    
    // Sort: in-stock first, then by name
    return filtered.sort((a, b) => {
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, productSearch, selectedProductId]);

  // Determine the best price based on customer type
  const getProductPrice = (product: Product): { price: number; label: string } => {
    const isWholesaleCustomer = currentCustomer?.customerType === 'wholesale';
    
    if (priceMode === 'custom' && customPrice > 0) {
      return { price: customPrice, label: 'Custom' };
    }
    if (priceMode === 'wholesale' || (priceMode === 'auto' && isWholesaleCustomer)) {
      return { price: product.wholesalePrice || product.retailPrice || product.price || 0, label: 'Wholesale' };
    }
    return { price: product.retailPrice || product.price || 0, label: 'Retail' };
  };

  // Calculate final price after item discount
  const calculateFinalPrice = (basePrice: number): number => {
    if (itemDiscountType === 'percentage' && itemDiscountValue > 0) {
      return basePrice * (1 - itemDiscountValue / 100);
    }
    if (itemDiscountType === 'fixed' && itemDiscountValue > 0) {
      return Math.max(0, basePrice - itemDiscountValue);
    }
    return basePrice;
  };

  // Reset pricing options when product changes
  useEffect(() => {
    if (currentProduct) {
      const { price } = getProductPrice(currentProduct);
      setCustomPrice(price);
      setItemDiscountType('none');
      setItemDiscountValue(0);
      setPriceMode('auto');
    }
  }, [selectedProductId]);

  const addItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const { price: basePrice } = getProductPrice(product);
    const finalPrice = priceMode === 'custom' ? customPrice : calculateFinalPrice(basePrice);
    
    const newItem: ExtendedInvoiceItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: finalPrice,
      originalPrice: basePrice,
      total: quantity * finalPrice,
      discountType: itemDiscountType !== 'none' ? itemDiscountType : undefined,
      discountValue: itemDiscountValue > 0 ? itemDiscountValue : undefined,
      isCustomPrice: priceMode === 'custom',
    };

    const existingItem = items.find((i) => i.productId === selectedProductId && i.unitPrice === finalPrice);
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.unitPrice }
            : i
        )
      );
    } else {
      setItems([...items, newItem]);
    }

    // Reset all
    setSelectedProductId('');
    setProductSearch('');
    setQuantity(1);
    setPriceMode('auto');
    setCustomPrice(0);
    setItemDiscountType('none');
    setItemDiscountValue(0);
  };

  // Quick add item (not in inventory)
  const addQuickItem = () => {
    if (!quickAddName.trim() || quickAddPrice <= 0 || quickAddQty <= 0) return;
    
    const newItem: ExtendedInvoiceItem = {
      id: `quick-${Date.now()}`,
      productId: `quick-${Date.now()}`,
      productName: quickAddName,
      quantity: quickAddQty,
      unitPrice: quickAddPrice,
      originalPrice: quickAddPrice,
      total: quickAddQty * quickAddPrice,
      isQuickAdd: true,
    };
    
    setItems([...items, newItem]);
    setQuickAddName('');
    setQuickAddPrice(0);
    setQuickAddQty(1);
    setShowQuickAdd(false);
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'none' ? 0 : (discountType === 'percentage' ? (subtotal * discount) / 100 : discount);
  const taxableAmount = subtotal - discountAmount;
  const tax = enableTax ? taxableAmount * (taxRate / 100) : 0;
  const total = taxableAmount + tax;

  const handleCreateInvoice = () => {
    if ((!selectedCustomer && !isWalkIn) || items.length === 0) return;

    const customerName = isWalkIn ? 'Walk-in Customer' : (currentCustomer?.name || 'Unknown');
    const customerId = isWalkIn ? 'walk-in' : selectedCustomer;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId,
      customerName,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: discountType !== 'none' ? Math.round(discountAmount * 100) / 100 : 0,
      discountType,
      discountValue: discount,
      enableTax,
      taxRate: enableTax ? taxRate : 0,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      issueDate,
      dueDate,
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod,
      notes,
    };

    setCreatedInvoice(invoice);
    setShowPrintModal(true);
  };

  const handlePrintClose = () => {
    setShowPrintModal(false);
    navigate('/invoices');
  };

  const canProceedToStep2 = selectedCustomer || isWalkIn;
  const canProceedToStep3 = items.length > 0;

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1: return <User className="w-4 h-4" />;
      case 2: return <Package className="w-4 h-4" />;
      case 3: return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getCustomerStatusColor = (customer: Customer) => {
    if (customer.loanBalance > 0) {
      const dueDate = customer.loanDueDate ? new Date(customer.loanDueDate) : null;
      if (dueDate && dueDate < new Date()) {
        return 'border-red-500/50 bg-red-500/5';
      }
      return 'border-amber-500/50 bg-amber-500/5';
    }
    return '';
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'mb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className={`p-2 rounded-xl transition-colors ${
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('invoice.createInvoice')}
              </h1>
            </div>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              {t('invoice.createInvoiceSteps')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                    s < step
                      ? 'bg-emerald-500 text-white'
                      : s === step
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white ring-4 ring-blue-500/30'
                      : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {s < step ? <CheckCircle className="w-6 h-6" /> : getStepIcon(s)}
                </div>
                <p className={`mt-2 text-sm font-medium ${
                  s <= step ? (theme === 'dark' ? 'text-white' : 'text-slate-900') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
                }`}>
                  {s === 1 ? t('invoice.stepCustomer') : s === 2 ? t('invoice.stepProducts') : t('invoice.stepReview')}
                </p>
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1.5 mx-4 rounded-full transition-colors ${
                  s < step ? 'bg-emerald-500' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 rounded-2xl border min-h-[500px] ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.selectCustomer')}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('invoice.selectCustomerHint')}
                  </p>
                </div>
              </div>

              {/* Walk-in Toggle */}
              <button
                onClick={() => {
                  setIsWalkIn(!isWalkIn);
                  setSelectedCustomer('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  isWalkIn
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                    : theme === 'dark' 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserX className="w-4 h-4" />
                {t('invoice.walkInCustomer')}
              </button>
            </div>

            {isWalkIn ? (
              /* Walk-in Customer Confirmation */
              <div className={`p-6 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-purple-500/50 bg-purple-500/5' : 'border-purple-300 bg-purple-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
                      : 'bg-gradient-to-br from-purple-100 to-pink-100'
                  }`}>
                    <UserX className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {t('invoice.walkInCustomer')}
                    </h4>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('invoice.walkInCustomerConfirm')}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-emerald-400 ml-auto" />
                </div>
              </div>
            ) : (
              /* Existing Customer Selection */
              <>
                {/* Customer Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('invoice.searchCustomerPlaceholder')}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Customer Grid */}
                {filteredCustomers.length === 0 ? (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('invoice.noCustomersFound')} "{customerSearch}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer.id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          selectedCustomer === customer.id
                            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                            : `${getCustomerStatusColor(customer)} ${
                                theme === 'dark' 
                                  ? 'border-slate-700 hover:border-blue-500/50' 
                                  : 'border-slate-200 hover:border-blue-500/50'
                              }`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                            theme === 'dark' 
                              ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400' 
                              : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600'
                          }`}>
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {customer.name}
                              </p>
                              {customer.customerType === 'wholesale' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-full">
                                  {t('invoice.wholesale')}
                                </span>
                              )}
                              {customer.customerType === 'credit' && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full">
                                  {t('invoice.credit')}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              <Building2 className="w-3 h-3 inline mr-1" />
                              {customer.businessName}
                            </p>
                            <div className={`flex items-center gap-3 mt-1 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </span>
                            </div>
                            
                            {/* Balance/Due Amount */}
                            {customer.loanBalance > 0 && (
                              <div className={`mt-2 p-2 rounded-lg ${
                                customer.loanDueDate && new Date(customer.loanDueDate) < new Date()
                                  ? 'bg-red-500/10 border border-red-500/20'
                                  : 'bg-amber-500/10 border border-amber-500/20'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${
                                    customer.loanDueDate && new Date(customer.loanDueDate) < new Date()
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }`}>
                                    <CreditCard className="w-3 h-3 inline mr-1" />
                                    {t('invoice.dueBalance')}
                                  </span>
                                  <span className={`text-sm font-bold ${
                                    customer.loanDueDate && new Date(customer.loanDueDate) < new Date()
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }`}>
                                    {t('common.currency')} {customer.loanBalance.toLocaleString()}
                                  </span>
                                </div>
                                {customer.loanDueDate && (
                                  <p className={`text-xs mt-1 ${
                                    new Date(customer.loanDueDate) < new Date() ? 'text-red-400' : 'text-amber-400/70'
                                  }`}>
                                    {new Date(customer.loanDueDate) < new Date() ? (
                                      <>
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        {t('invoice.overdueSince')} {new Date(customer.loanDueDate).toLocaleDateString()}
                                      </>
                                    ) : (
                                      <>{t('invoice.dueBy')} {new Date(customer.loanDueDate).toLocaleDateString()}</>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Total Spent */}
                            <div className={`mt-2 flex items-center justify-between text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                              <span>{t('invoice.totalPurchases')}</span>
                              <span className="font-medium text-emerald-500">
                                {t('common.currency')} {customer.totalSpent.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Add Items - Enhanced */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.addProducts')}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentCustomer?.customerType === 'wholesale' && (
                      <span className="text-purple-400 font-medium">{t('invoice.wholesalePricing')} • </span>
                    )}
                    {t('invoice.searchAddProducts')}
                  </p>
                </div>
              </div>
              {/* Quick Add Button */}
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  showQuickAdd
                    ? 'bg-amber-500 text-white'
                    : theme === 'dark' 
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30' 
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <PackagePlus className="w-4 h-4" />
                {t('invoice.quickAddProduct')}
              </button>
            </div>

            {/* Quick Add Panel */}
            {showQuickAdd && (
              <div className={`p-4 rounded-xl border-2 border-dashed ${
                theme === 'dark' ? 'border-amber-500/50 bg-amber-500/5' : 'border-amber-300 bg-amber-50'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.quickAddTitle')}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder={t('invoice.productServicePlaceholder')}
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                          : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <span className={`absolute left-3 top-2.5 text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                      <input
                        type="number"
                        placeholder={t('invoice.pricePlaceholder')}
                        value={quickAddPrice || ''}
                        onChange={(e) => setQuickAddPrice(parseFloat(e.target.value) || 0)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                            : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t('invoice.qtyPlaceholder')}
                      min="1"
                      value={quickAddQty}
                      onChange={(e) => setQuickAddQty(parseInt(e.target.value) || 1)}
                      className={`w-20 px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        theme === 'dark'
                          ? 'border-slate-600 bg-slate-800 text-white'
                          : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    />
                    <button
                      onClick={addQuickItem}
                      disabled={!quickAddName.trim() || quickAddPrice <= 0}
                      className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('invoice.searchProductPlaceholder')}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProductId('');
                    }}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      theme === 'dark'
                        ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Product List */}
                <div className={`h-[240px] overflow-y-auto border rounded-xl ${
                  theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  {filteredProducts.length === 0 ? (
                    <div className={`p-8 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>{t('invoice.noProductsFound')}</p>
                      <button
                        onClick={() => setShowQuickAdd(true)}
                        className="mt-2 text-amber-400 text-sm hover:underline"
                      >
                        {t('invoice.quickAddInstead')}
                      </button>
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isOutOfStock = p.stock <= 0;
                      const isLowStock = p.stock <= (p.minStock || 5);
                      const isWholesale = currentCustomer?.customerType === 'wholesale';
                      const displayPrice = isWholesale ? (p.wholesalePrice || p.retailPrice || p.price || 0) : (p.retailPrice || p.price || 0);
                      
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setProductSearch(p.name);
                            const { price } = getProductPrice(p);
                            setCustomPrice(price);
                          }}
                          disabled={isOutOfStock}
                          className={`w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors ${
                            theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'
                          } ${
                            isOutOfStock
                              ? 'opacity-50 cursor-not-allowed'
                              : selectedProductId === p.id
                                ? 'bg-cyan-500/10'
                                : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-3">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium truncate ${
                                  selectedProductId === p.id ? 'text-cyan-400' : (theme === 'dark' ? 'text-white' : 'text-slate-900')
                                }`}>
                                  {p.name}
                                </p>
                                {isOutOfStock && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 rounded">
                                    {t('invoice.outOfStock')}
                                  </span>
                                )}
                              </div>
                              {p.nameAlt && (
                                <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                                  {p.nameAlt}
                                </p>
                              )}
                              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {p.sku} • {p.brand || p.category}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex flex-col items-end">
                                {isWholesale && p.wholesalePrice && (
                                  <span className="text-xs text-purple-400 font-medium">{t('invoice.wholesale')}</span>
                                )}
                                <p className="font-bold text-emerald-500">
                                  {t('common.currency')} {displayPrice.toLocaleString()}
                                </p>
                                {p.wholesalePrice && p.retailPrice && isWholesale && (
                                  <p className="text-xs text-slate-500 line-through">
                                    {t('common.currency')} {p.retailPrice.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <p className={`text-xs mt-1 flex items-center gap-1 justify-end ${
                                isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                              }`}>
                                <Boxes className="w-3 h-3" />
                                {p.stock} {p.unit || 'pcs'}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Enhanced Product Add Panel */}
                {currentProduct && (
                  <div className={`p-4 rounded-xl border-2 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-cyan-500/50' : 'bg-cyan-50/50 border-cyan-200'
                  }`}>
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {currentProduct.name}
                        </h4>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {currentProduct.sku} • {t('invoice.available')}: <span className={currentProduct.stock <= (currentProduct.minStock || 5) ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>{currentProduct.stock} {currentProduct.unit || 'pcs'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {currentCustomer?.customerType === 'wholesale' && currentProduct.wholesalePrice && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded">
                            {t('invoice.wholesaleRate')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price Selection */}
                    <div className="mb-4">
                      <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {t('invoice.priceMode')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPriceMode('auto')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            priceMode === 'auto'
                              ? 'bg-cyan-500 text-white'
                              : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {t('invoice.auto')} ({currentCustomer?.customerType === 'wholesale' ? t('invoice.wholesale') : t('invoice.retail')})
                        </button>
                        <button
                          onClick={() => setPriceMode('retail')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            priceMode === 'retail'
                              ? 'bg-emerald-500 text-white'
                              : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {t('invoice.retail')}: {t('common.currency')} {(currentProduct.retailPrice || currentProduct.price || 0).toLocaleString()}
                        </button>
                        {currentProduct.wholesalePrice && (
                          <button
                            onClick={() => setPriceMode('wholesale')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              priceMode === 'wholesale'
                                ? 'bg-purple-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {t('invoice.wholesale')}: {t('common.currency')} {currentProduct.wholesalePrice.toLocaleString()}
                          </button>
                        )}
                        <button
                          onClick={() => setPriceMode('custom')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            priceMode === 'custom'
                              ? 'bg-amber-500 text-white'
                              : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3 h-3 inline mr-1" />
                          {t('invoice.custom')}
                        </button>
                      </div>
                    </div>

                    {/* Custom Price Input */}
                    {priceMode === 'custom' && (
                      <div className="mb-4">
                        <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {t('invoice.customPrice')}
                        </label>
                        <div className="relative">
                          <span className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                          <input
                            type="number"
                            value={customPrice || ''}
                            onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              theme === 'dark'
                                ? 'border-slate-600 bg-slate-800 text-white'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Item Discount (for paint, etc.) */}
                    {priceMode !== 'custom' && (
                      <div className="mb-4">
                        <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {t('invoice.itemDiscountOptional')}
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setItemDiscountType('none')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              itemDiscountType === 'none'
                                ? 'bg-slate-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {t('invoice.none')}
                          </button>
                          <button
                            onClick={() => setItemDiscountType('percentage')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              itemDiscountType === 'percentage'
                                ? 'bg-pink-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Percent className="w-3 h-3" />
                            {t('invoice.percentage')}
                          </button>
                          <button
                            onClick={() => setItemDiscountType('fixed')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              itemDiscountType === 'fixed'
                                ? 'bg-pink-500 text-white'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Tag className="w-3 h-3" />
                            {t('invoice.fixed')}
                          </button>
                        </div>
                        {itemDiscountType !== 'none' && (
                          <div className="mt-2 relative">
                            {itemDiscountType === 'fixed' && (
                              <span className={`absolute left-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('common.currency')}</span>
                            )}
                            <input
                              type="number"
                              placeholder={itemDiscountType === 'percentage' ? t('invoice.discountPercentPlaceholder') : t('invoice.discountAmountPlaceholder')}
                              value={itemDiscountValue || ''}
                              onChange={(e) => setItemDiscountValue(parseFloat(e.target.value) || 0)}
                              className={`w-full ${itemDiscountType === 'fixed' ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                                theme === 'dark'
                                  ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                                  : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                              }`}
                            />
                            {itemDiscountType === 'percentage' && (
                              <span className={`absolute right-3 top-2.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>%</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Calculation Preview */}
                    {(() => {
                      const { price: basePrice, label } = getProductPrice(currentProduct);
                      const finalPrice = priceMode === 'custom' ? customPrice : calculateFinalPrice(basePrice);
                      const hasDiscount = itemDiscountType !== 'none' && itemDiscountValue > 0;
                      
                      return (
                        <div className={`p-3 rounded-xl mb-4 ${
                          theme === 'dark' ? 'bg-slate-900/50' : 'bg-white'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {priceMode === 'custom' ? t('invoice.customPrice') : `${label === 'Wholesale' ? t('invoice.wholesale') : t('invoice.retail')} ${t('invoice.price')}`}
                            </span>
                            <span className={`text-sm ${hasDiscount ? 'line-through text-slate-500' : 'font-medium ' + (theme === 'dark' ? 'text-white' : 'text-slate-900')}`}>
                              {t('common.currency')} {basePrice.toLocaleString()}
                            </span>
                          </div>
                          {hasDiscount && priceMode !== 'custom' && (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs text-pink-400`}>
                                  {t('invoice.discount')} ({itemDiscountType === 'percentage' ? `${itemDiscountValue}%` : `${t('common.currency')} ${itemDiscountValue}`})
                                </span>
                                <span className="text-sm text-pink-400">
                                  - {t('common.currency')} {(basePrice - finalPrice).toLocaleString()}
                                </span>
                              </div>
                              <div className={`border-t pt-1 mt-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {t('invoice.finalUnitPrice')}
                                  </span>
                                  <span className="text-sm font-bold text-emerald-500">
                                    {t('common.currency')} {finalPrice.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          <div className={`flex items-center justify-between mt-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                            <span className={`text-sm font-medium flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Calculator className="w-3.5 h-3.5" />
                              {t('invoice.total')} ({quantity} × {t('common.currency')} {finalPrice.toLocaleString()})
                            </span>
                            <span className="text-lg font-bold text-emerald-500">
                              {t('common.currency')} {(quantity * finalPrice).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quantity & Add */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={currentProduct.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, currentProduct.stock))}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center text-lg font-bold ${
                              theme === 'dark'
                                ? 'border-slate-600 bg-slate-800 text-white'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-3 top-3.5 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            / {currentProduct.stock}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={addItem}
                        disabled={quantity <= 0 || quantity > currentProduct.stock}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                      >
                        <Plus className="w-5 h-5" />
                        {t('invoice.addToInvoice')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart / Items List */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <ShoppingCart className="w-4 h-4" />
                    {t('invoice.selectedItems')} ({items.length} {t('invoice.items')})
                  </h4>
                  {items.length > 0 && (
                    <span className="text-emerald-500 font-bold text-lg">
                      {t('common.currency')} {subtotal.toLocaleString()}
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t('invoice.noItemsYet')}</p>
                    <p className="text-xs mt-1">{t('invoice.selectProductsHint')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {items.map((item) => {
                      const extItem = item as ExtendedInvoiceItem;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border ${
                            extItem.isQuickAdd
                              ? theme === 'dark' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                              : theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {item.productName}
                                </p>
                                {extItem.isQuickAdd && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded">
                                    {t('invoice.quickBadge')}
                                  </span>
                                )}
                                {extItem.isCustomPrice && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded">
                                    {t('invoice.customBadge')}
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs flex items-center gap-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span>{t('common.currency')} {item.unitPrice.toLocaleString()} × {item.quantity}</span>
                                {extItem.discountType && (
                                  <span className="text-pink-400">
                                    ({extItem.discountType === 'percentage' ? `${extItem.discountValue}% ${t('invoice.off')}` : `${t('common.currency')} ${extItem.discountValue} ${t('invoice.off')}`})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className={`w-16 px-2 py-1 text-center border rounded-lg text-sm ${
                                  theme === 'dark'
                                    ? 'border-slate-600 bg-slate-700 text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-900'
                                }`}
                              />
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-end mt-1">
                            <span className="text-emerald-500 font-semibold">
                              {t('common.currency')} {item.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Complete - Creative Invoice Preview */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {t('invoice.reviewComplete')}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('invoice.reviewHint')}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl ${
                paymentMethod === 'credit' 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}>
                <span className={`text-sm font-medium ${paymentMethod === 'credit' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {paymentMethod === 'credit' ? t('invoice.creditSale') : t('invoice.cashSale')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Left Panel - Settings */}
              <div className="xl:col-span-2 space-y-4">
                {/* Customer Info Card */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <User className="w-4 h-4 text-blue-400" />
                    {t('invoice.customer')}
                  </h4>
                  {isWalkIn ? (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                      }`}>
                        <UserX className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('invoice.walkInCustomer')}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{t('invoice.cashQuickSale')}</p>
                      </div>
                    </div>
                  ) : currentCustomer && (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                        theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {currentCustomer.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentCustomer.name}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{currentCustomer.businessName}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{currentCustomer.phone}</p>
                      </div>
                      {currentCustomer.customerType === 'wholesale' && (
                        <span className="ml-auto px-2 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded">
                          {t('invoice.wholesale')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    {t('invoice.invoiceDates')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('invoice.issueDate')}
                      </label>
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-800 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('invoice.dueDate')}
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          theme === 'dark'
                            ? 'border-slate-600 bg-slate-800 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    {t('invoice.paymentMethod')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'cash', label: t('invoice.cash'), icon: DollarSign, color: 'emerald' },
                      { value: 'card', label: t('invoice.card'), icon: CreditCard, color: 'blue' },
                      { value: 'bank_transfer', label: t('invoice.bankTransfer'), icon: Building2, color: 'purple' },
                      { value: 'credit', label: t('invoice.credit'), icon: AlertTriangle, color: 'amber' },
                    ].map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                        className={`p-2.5 rounded-lg border-2 text-left transition-all flex items-center gap-2 ${
                          paymentMethod === value
                            ? `border-${color}-500 bg-${color}-500/10`
                            : theme === 'dark' ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${paymentMethod === value ? `text-${color}-400` : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className={`text-sm font-medium ${paymentMethod === value ? `text-${color}-400` : theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overall Discount */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <Percent className="w-4 h-4 text-pink-400" />
                    {t('invoice.overallDiscount')}
                  </h4>
                  <div className="space-y-3">
                    {/* Discount Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'none', label: t('invoice.none') },
                        { value: 'percentage', label: t('invoice.percentage') },
                        { value: 'fixed', label: t('invoice.fixed') },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => {
                            setDiscountType(value as typeof discountType);
                            if (value === 'none') setDiscount(0);
                          }}
                          className={`p-2 rounded-lg border-2 text-center transition-all ${
                            discountType === value
                              ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                              : theme === 'dark' ? 'border-slate-700 hover:border-slate-600 text-slate-400' : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Discount Value Input */}
                    {discountType !== 'none' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max={discountType === 'percentage' ? 100 : subtotal}
                          value={discount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (discountType === 'percentage') {
                              setDiscount(Math.min(100, Math.max(0, val)));
                            } else {
                              setDiscount(Math.min(subtotal, Math.max(0, val)));
                            }
                          }}
                          className={`w-28 px-3 py-2 text-center border rounded-lg ${
                            theme === 'dark'
                              ? 'border-slate-600 bg-slate-800 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-900'
                          }`}
                        />
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                          {discountType === 'percentage' ? '%' : t('common.currency')}
                        </span>
                        {discountAmount > 0 && (
                          <span className="text-pink-400 font-medium">
                            - {t('common.currency')} {discountAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Settings */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    {t('invoice.taxSettings')}
                  </h4>
                  <div className="space-y-3">
                    {/* Enable Tax Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={enableTax}
                          onChange={(e) => setEnableTax(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          enableTax ? 'bg-cyan-500' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            enableTax ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t('invoice.addTax')}
                      </span>
                    </label>
                    {/* Tax Rate Input */}
                    {enableTax && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className={`w-20 px-3 py-2 text-center border rounded-lg ${
                            theme === 'dark'
                              ? 'border-slate-600 bg-slate-800 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-900'
                          }`}
                        />
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>%</span>
                        {tax > 0 && (
                          <span className="text-cyan-400 font-medium">
                            + {t('common.currency')} {tax.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <FileText className="w-4 h-4 text-slate-400" />
                    {t('invoice.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('invoice.notesPlaceholder')}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-xl text-sm resize-none ${
                      theme === 'dark'
                        ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Right Panel - Invoice Preview */}
              <div className="xl:col-span-3">
                <div className={`rounded-2xl overflow-hidden shadow-2xl ${
                  theme === 'dark' ? 'shadow-black/50' : 'shadow-slate-300/50'
                }`}>
                  {/* Invoice Preview Header */}
                  <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">LIYANAGE HARDWARE</h2>
                        <p className="text-amber-200 text-xs mt-1 tracking-widest">QUALITY BUILDING MATERIALS</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold tracking-wider">{t('tableHeaders.invoice').toUpperCase()}</p>
                        <p className="text-blue-200 text-sm mt-1">#{`INV-${new Date().getFullYear()}-XXXXXX`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Body */}
                  <div className={`p-6 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    {/* Customer & Date Row */}
                    <div className="flex justify-between mb-6 pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{t('invoice.billTo')}</p>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {isWalkIn ? t('invoice.walkInCustomer') : currentCustomer?.name}
                        </p>
                        {!isWalkIn && currentCustomer && (
                          <>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{currentCustomer.businessName}</p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{currentCustomer.phone}</p>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="mb-2">
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{t('invoice.issueDate')}</p>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {new Date(issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{t('invoice.dueDate')}</p>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {new Date(dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                      <table className="w-full">
                        <thead>
                          <tr className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            <th className="text-left py-2 font-semibold">#</th>
                            <th className="text-left py-2 font-semibold">{t('tableHeaders.item')}</th>
                            <th className="text-center py-2 font-semibold">{t('tableHeaders.qty')}</th>
                            <th className="text-right py-2 font-semibold">{t('tableHeaders.price')}</th>
                            <th className="text-right py-2 font-semibold">{t('tableHeaders.total')}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                          {items.slice(0, 5).map((item, index) => {
                            const extItem = item as ExtendedInvoiceItem;
                            return (
                              <tr key={item.id} className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                <td className={`py-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{index + 1}</td>
                                <td className="py-2">
                                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.productName}</span>
                                  {extItem.discountType && (
                                    <span className="ml-2 text-xs text-pink-400">
                                      ({extItem.discountType === 'percentage' ? `${extItem.discountValue}% ${t('invoice.off')}` : `${t('common.currency')} ${extItem.discountValue} ${t('invoice.off')}`})
                                    </span>
                                  )}
                                  {extItem.isQuickAdd && (
                                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-400 rounded">{t('invoice.quickBadge')}</span>
                                  )}
                                </td>
                                <td className="py-2 text-center">{item.quantity}</td>
                                <td className={`py-2 text-right font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {t('common.currency')} {item.unitPrice.toLocaleString()}
                                </td>
                                <td className={`py-2 text-right font-mono font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {t('common.currency')} {item.total.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                          {items.length > 5 && (
                            <tr>
                              <td colSpan={5} className={`py-2 text-center text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                {t('invoice.andMoreItems').replace('{count}', (items.length - 5).toString())}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                      <div className="w-64">
                        <div className={`flex justify-between py-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>{t('invoice.subtotal')}</span>
                          <span className="font-mono">{t('common.currency')} {subtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between py-2 text-sm text-pink-400">
                            <span>{t('invoice.discount')} {discountType === 'percentage' ? `(${discount}%)` : `(${t('invoice.fixed')})`}</span>
                            <span className="font-mono">- {t('common.currency')} {discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {enableTax && (
                          <div className={`flex justify-between py-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            <span>{t('invoice.tax')} ({taxRate}%)</span>
                            <span className="font-mono">{t('common.currency')} {tax.toFixed(2)}</span>
                          </div>
                        )}
                        <div className={`flex justify-between py-3 mt-2 border-t-2 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                          <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('invoice.totalAmount')}</span>
                          <span className="text-xl font-bold text-emerald-500">{t('common.currency')} {total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Badge */}
                    <div className="mt-4 flex justify-between items-center">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        paymentMethod === 'cash' ? 'bg-emerald-500/10 text-emerald-400' :
                        paymentMethod === 'card' ? 'bg-blue-500/10 text-blue-400' :
                        paymentMethod === 'bank_transfer' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {paymentMethod === 'cash' ? `💵 ${t('invoice.cashPayment')}` :
                         paymentMethod === 'card' ? `💳 ${t('invoice.cardPayment')}` :
                         paymentMethod === 'bank_transfer' ? `🏦 ${t('invoice.bankTransferPayment')}` :
                         `📝 ${t('invoice.creditDue')}`}
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        paymentMethod === 'credit' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {paymentMethod === 'credit' ? t('invoice.pending') : t('invoice.paid')}
                      </div>
                    </div>

                    {notes && (
                      <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                        <p className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>{t('invoice.notes')}:</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-amber-200/70' : 'text-amber-800'}`}>{notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Invoice Footer */}
                  <div className={`px-6 py-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <p className={`text-center text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      {t('invoice.thankYouMessage')} • Liyanage Hardware • 📞 0773751805 / 0412268217
                    </p>
                    <p className={`text-center text-[10px] mt-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                      © 2025 Powered by Nebulainfinite
                    </p>
                  </div>
                </div>

                {/* Complete Button */}
                <button
                  onClick={handleCreateInvoice}
                  disabled={items.length === 0}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle className="w-6 h-6" />
                  {t('invoice.completeAndPrint')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className={`flex justify-between p-6 rounded-2xl border ${
        theme === 'dark' ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          onClick={() => step > 1 && setStep((step - 1) as Step)}
          disabled={step === 1}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            step === 1 
              ? 'opacity-50 cursor-not-allowed' 
              : theme === 'dark' ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          {t('invoice.previous')}
        </button>

        {step < 3 && (
          <button
            onClick={() => {
              if (step === 1 && canProceedToStep2) setStep(2);
              if (step === 2 && canProceedToStep3) setStep(3);
            }}
            disabled={(step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            {t('invoice.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Print Modal */}
      <PrintInvoiceModal
        isOpen={showPrintModal}
        onClose={handlePrintClose}
        invoice={createdInvoice}
        customer={isWalkIn ? { 
          id: 'walk-in', 
          name: t('invoice.walkInCustomer'), 
          businessName: t('invoice.walkInCustomer'),
          email: '',
          phone: '',
          address: '',
          registrationDate: new Date().toISOString(),
          totalSpent: 0,
          customerType: 'regular',
          isActive: true,
          loanBalance: 0
        } : currentCustomer}
      />
    </div>
  );
};
