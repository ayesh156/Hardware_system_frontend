import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { mockProducts } from '../data/mockData';
import { Product, Invoice, InvoiceItem } from '../types/index';
import { PrintInvoiceModal } from '../components/modals/PrintInvoiceModal';
import { ShortcutMapOverlay, ShortcutHintsBar, CheckoutMode, InvoiceStep } from '../components/ShortcutMapOverlay';
import {
  Zap, Search, Plus, Trash2, ArrowLeft, Printer, ShoppingCart,
  Keyboard, X, Package, Calculator, Barcode, Volume2, VolumeX,
  ChevronUp, ChevronDown, RotateCcw, CreditCard, Banknote, Percent,
  ArrowRight, ArrowUp, ArrowDown, ArrowLeftIcon, CheckCircle,
  Minus, ScanLine, ChevronRight, Receipt, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickInvoiceItem extends InvoiceItem {
  originalPrice: number;
}

// Step configuration for Quick Checkout
type QuickCheckoutStep = 'products' | 'review';
const STEPS: { key: QuickCheckoutStep; labelKey: string }[] = [
  { key: 'products', labelKey: 'invoice.stepProducts' },
  { key: 'review', labelKey: 'invoice.stepReview' },
];

// Keyboard shortcut hints
const SHORTCUTS = {
  search: 'F2',
  quantity: 'F3',
  cart: 'F4',
  payment: 'F5',
  discount: 'F6',
  addItem: 'Enter',
  removeLastItem: 'Delete',
  checkout: 'F12',
  clear: 'Escape',
};

// Mode-specific shortcuts
const QUANTITY_SHORTCUTS = {
  increase: '→',
  decrease: '←',
};

const CART_SHORTCUTS = {
  navUp: '↑',
  navDown: '↓',
  increaseQty: '→',
  decreaseQty: '←',
};

export const QuickCheckout: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [products] = useState<Product[]>(mockProducts);
  const [items, setItems] = useState<QuickInvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShortcutMap, setShowShortcutMap] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  
  // Stepped navigation state
  const [currentStep, setCurrentStep] = useState<QuickCheckoutStep>('products');
  const [currentMode, setCurrentMode] = useState<CheckoutMode>('search');
  
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  
  // Mobile-specific state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const cartListRef = useRef<HTMLDivElement>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  const [isCartFocused, setIsCartFocused] = useState(false);
  const [isPaymentFocused, setIsPaymentFocused] = useState(false);

  // Play beep sound for feedback
  const playBeep = useCallback((type: 'add' | 'remove' | 'error' | 'success') => {
    if (!soundEnabled) return;
    
    const frequencies: Record<string, number> = {
      add: 800,
      remove: 400,
      error: 200,
      success: 1000,
    };
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Filter products by search (SKU, barcode, name)
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    
    const searchLower = productSearch.toLowerCase().trim();
    
    // Check for exact barcode/SKU match first (for barcode scanner)
    const exactMatch = products.find(
      (p) => p.barcode === productSearch || p.sku.toLowerCase() === searchLower
    );
    
    if (exactMatch && exactMatch.stock > 0) {
      return [exactMatch];
    }
    
    return products
      .filter(
        (p) =>
          p.stock > 0 && (
            p.name.toLowerCase().includes(searchLower) ||
            p.sku.toLowerCase().includes(searchLower) ||
            (p.nameAlt && p.nameAlt.includes(searchLower)) ||
            (p.barcode && p.barcode.includes(searchLower)) ||
            p.category.toLowerCase().includes(searchLower)
          )
      )
      .slice(0, 8); // Limit for performance
  }, [products, productSearch]);

  // Parse common barcode scan formats and extract quantity if provided
  const parseScanInput = (input: string): { code?: string; qty?: number } | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    // qty * code  (e.g. 3*012345) or qtyxcode or qty|code or qty-code
    const prefix = trimmed.match(/^\s*(\d+)\s*[\*xX\|\-]\s*(.+)$/);
    if (prefix) return { qty: Number(prefix[1]), code: prefix[2].trim() };

    // code * qty (e.g. 012345*3)
    const suffix = trimmed.match(/^\s*(.+?)\s*[\*xX\|\-]\s*(\d+)\s*$/);
    if (suffix) return { code: suffix[1].trim(), qty: Number(suffix[2]) };

    // Plain code
    return { code: trimmed };
  };

  // Auto-detect barcode scan - set pending product for quantity input
  useEffect(() => {
    if (filteredProducts.length === 1 && productSearch.length >= 3) {
      const product = filteredProducts[0];
      // Check if it's an exact match (barcode scanner typically sends full code)
      if (product.barcode === productSearch || product.sku.toLowerCase() === productSearch.toLowerCase()) {
        // Set as pending product and focus quantity input
        setPendingProduct(product);
        setProductSearch('');
        setSelectedProductIndex(-1);
        setQuantity(1);
        setIsQuantityFocused(true);
        // Focus quantity input after a brief delay for barcode scanner
        setTimeout(() => {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }, 50);
        playBeep('add');
        toast.info(`${product.name} - ${t('quickCheckout.enterQuantity')}`);
      }
    }
  }, [filteredProducts, productSearch, playBeep, t]);

  // Add product to cart
  const addProductToCart = useCallback((product: Product, overrideQty?: number) => {
    const price = product.retailPrice || product.price || 0;
    const addQty = Math.max(1, overrideQty ?? quantity);
    
    const existingItem = items.find((i) => i.productId === product.id);
    if (existingItem) {
      // Check stock
      if (existingItem.quantity + addQty > product.stock) {
        playBeep('error');
        toast.error(`${t('quickCheckout.insufficientStock')}: ${product.stock} ${t('invoice.available')}`);
        return;
      }
      
      setItems(
        items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + addQty, total: (i.quantity + addQty) * i.unitPrice }
            : i
        )
      );
    } else {
      if (addQty > product.stock) {
        playBeep('error');
        toast.error(`${t('quickCheckout.insufficientStock')}: ${product.stock} ${t('invoice.available')}`);
        return;
      }
      
      const newItem: QuickInvoiceItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: addQty,
        unitPrice: price,
        originalPrice: price,
        total: addQty * price,
      };
      setItems([...items, newItem]);
    }
    
    playBeep('add');
    setQuantity(1);
    setProductSearch('');
    setSelectedProductIndex(-1);
    searchInputRef.current?.focus();
  }, [items, quantity, playBeep, t, products]);

  // Remove item from cart
  const removeItem = useCallback((itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
    playBeep('remove');
  }, [items, playBeep]);

  // Update item quantity
  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const product = products.find((p) => p.id === item.productId);
      if (product && newQuantity > product.stock) {
        playBeep('error');
        toast.error(`${t('quickCheckout.insufficientStock')}: ${product.stock} ${t('invoice.available')}`);
        return;
      }
    }
    
    setItems(items.map(i => 
      i.id === itemId 
        ? { ...i, quantity: newQuantity, total: newQuantity * i.unitPrice }
        : i
    ));
  }, [items, products, removeItem, playBeep, t]);

  // Mobile swipe handlers for cart items
  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: string) => {
    setTouchStartX(e.touches[0].clientX);
    setSwipedItemId(itemId);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipedItemId) return;
    const delta = e.touches[0].clientX - touchStartX;
    setTouchDeltaX(Math.max(-100, Math.min(100, delta)));
  }, [swipedItemId, touchStartX]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(touchDeltaX) > 60) {
      const item = items.find(i => i.id === swipedItemId);
      if (item) {
        if (touchDeltaX < -60) {
          // Swipe left - remove item
          removeItem(item.id);
          toast.success(t('quickCheckout.itemRemoved'));
        } else if (touchDeltaX > 60) {
          // Swipe right - increase quantity
          updateItemQuantity(item.id, item.quantity + 1);
        }
      }
    }
    setTouchDeltaX(0);
    setSwipedItemId(null);
  }, [touchDeltaX, swipedItemId, items, removeItem, updateItemQuantity, t]);

  // Quick add with haptic-style feedback
  const quickAddProduct = useCallback((product: Product) => {
    addProductToCart(product, 1);
    if (isMobile) {
      toast.success(`${product.name} ${t('quickCheckout.addedToCart')}`, { duration: 1500 });
    }
  }, [addProductToCart, isMobile, t]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Math.min(discount, subtotal); // Can't discount more than subtotal
  const total = subtotal - discountAmount;

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
    setProductSearch('');
    setQuantity(1);
    setDiscount(0);
    setPendingProduct(null);
    setSelectedProductIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  // Process checkout
  const handleCheckout = useCallback(() => {
    if (items.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    const invoiceNumber = `QC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: 'walk-in',
      customerName: t('invoice.walkInCustomer'),
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: 0,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod: paymentMethod, // 'cash' or 'credit' (credit prints as credit payment)
      notes: discountAmount > 0 
        ? `${t('quickCheckout.quickSaleNote')} - ${t('quickCheckout.discount')}: ${t('common.currency')} ${discountAmount.toLocaleString()}`
        : t('quickCheckout.quickSaleNote'),
    };

    setCreatedInvoice(invoice);
    playBeep('success');
    setShowPrintModal(true);
    setIsProcessing(false);
    setDiscount(0);
  }, [items, subtotal, total, discountAmount, paymentMethod, playBeep, t, isProcessing]);

  // Handle print modal close
  const handlePrintClose = useCallback(() => {
    setShowPrintModal(false);
    setItems([]);
    setDiscount(0);
    setCreatedInvoice(null);
    searchInputRef.current?.focus();
    toast.success(t('quickCheckout.saleCompleted'));
  }, [t]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in cart focus mode
      const isInSearchInput = document.activeElement === searchInputRef.current;
      const isInQuantityInput = document.activeElement === quantityInputRef.current;
      const isInDiscountInput = document.activeElement === discountInputRef.current;
      
      // Show shortcut map with ? key
      if (e.key === '?' && !isInSearchInput && !isInQuantityInput && !isInDiscountInput) {
        e.preventDefault();
        setShowShortcutMap(prev => !prev);
        return;
      }
      
      // Step navigation with Ctrl+Arrow or PageUp/PageDown
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep === 'review') {
          setCurrentStep('products');
          searchInputRef.current?.focus();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentStep === 'products' && items.length > 0) {
          setCurrentStep('review');
        }
        return;
      }
      
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          setIsCartFocused(false);
          setIsPaymentFocused(false);
          setIsQuantityFocused(false);
          setSelectedCartIndex(-1);
          setPendingProduct(null);
          setCurrentMode('search');
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          break;
          
        case 'F3':
          e.preventDefault();
          setIsCartFocused(false);
          setIsPaymentFocused(false);
          setSelectedCartIndex(-1);
          setIsQuantityFocused(true);
          setCurrentMode('quantity');
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
          break;
          
        case 'F4':
          e.preventDefault();
          if (items.length > 0) {
            setIsCartFocused(true);
            setIsPaymentFocused(false);
            setIsQuantityFocused(false);
            setSelectedCartIndex(items.length - 1); // Select last added item
            setSelectedProductIndex(-1);
            setPendingProduct(null);
            setCurrentMode('cart');
            // Blur any input to enable arrow key navigation
            (document.activeElement as HTMLElement)?.blur();
            cartListRef.current?.focus?.({ preventScroll: true } as FocusOptions) ?? cartListRef.current?.focus();
            playBeep('add');
          }
          break;
          
        case 'F5':
          e.preventDefault();
          setIsCartFocused(false);
          setIsQuantityFocused(false);
          setIsPaymentFocused(true);
          setPendingProduct(null);
          setCurrentMode('payment');
          (document.activeElement as HTMLElement)?.blur();
          paymentRef.current?.focus?.({ preventScroll: true } as FocusOptions) ?? paymentRef.current?.focus();
          playBeep('add');
          break;
          
        case 'F6':
          e.preventDefault();
          setIsCartFocused(false);
          setIsPaymentFocused(false);
          setIsQuantityFocused(false);
          setPendingProduct(null);
          setCurrentMode('discount');
          discountInputRef.current?.focus();
          discountInputRef.current?.select();
          break;
          
        case 'F12':
          e.preventDefault();
          if (items.length > 0) handleCheckout();
          break;
          
        case 'Escape':
          e.preventDefault();
          if (showShortcutMap) {
            setShowShortcutMap(false);
          } else if (isCartFocused) {
            setIsCartFocused(false);
            setSelectedCartIndex(-1);
            setCurrentMode('search');
            searchInputRef.current?.focus();
          } else if (isPaymentFocused) {
            setIsPaymentFocused(false);
            setCurrentMode('search');
            searchInputRef.current?.focus();
          } else if (pendingProduct) {
            setPendingProduct(null);
            setProductSearch('');
            searchInputRef.current?.focus();
          } else if (productSearch) {
            setProductSearch('');
            setSelectedProductIndex(-1);
          } else if (showShortcuts) {
            setShowShortcuts(false);
          }
          break;
          
        case 'Delete':
          // Delete removes last item from any context
          if (items.length > 0 && !isInDiscountInput) {
            e.preventDefault();
            const itemToRemove = isCartFocused && selectedCartIndex >= 0 
              ? items[selectedCartIndex] 
              : items[items.length - 1];
            removeItem(itemToRemove.id);
            // Adjust cart selection after removal
            if (isCartFocused) {
              if (items.length <= 1) {
                setIsCartFocused(false);
                setSelectedCartIndex(-1);
                searchInputRef.current?.focus();
              } else {
                setSelectedCartIndex(Math.max(0, selectedCartIndex - 1));
              }
            }
          }
          break;
          
        case 'ArrowDown':
          // In cart mode: navigate to next item
          if (isCartFocused && items.length > 0) {
            e.preventDefault();
            setSelectedCartIndex((prev) => prev < items.length - 1 ? prev + 1 : prev);
          } else if (filteredProducts.length > 0 && isInSearchInput) {
            e.preventDefault();
            // In search mode: navigate products
            setSelectedProductIndex((prev) => 
              prev < filteredProducts.length - 1 ? prev + 1 : prev
            );
          }
          break;
          
        case 'ArrowUp':
          // In cart mode: navigate to previous item
          if (isCartFocused && items.length > 0) {
            e.preventDefault();
            setSelectedCartIndex((prev) => prev > 0 ? prev - 1 : 0);
          } else if (filteredProducts.length > 0 && isInSearchInput) {
            e.preventDefault();
            // In search mode: navigate products
            setSelectedProductIndex((prev) => prev > 0 ? prev - 1 : 0);
          }
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          if (isCartFocused && items.length > 0 && selectedCartIndex >= 0) {
            // In cart mode: decrease quantity
            const item = items[selectedCartIndex];
            if (item) {
              updateItemQuantity(item.id, item.quantity - 1);
            }
          } else if (isInQuantityInput) {
            // In quantity input: decrease quantity
            setQuantity(q => Math.max(1, q - 1));
          } else if (isPaymentFocused) {
            // In payment mode: switch to cash
            setPaymentMethod('cash');
            playBeep('add');
          }
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          if (isCartFocused && items.length > 0 && selectedCartIndex >= 0) {
            // In cart mode: increase quantity
            const item = items[selectedCartIndex];
            if (item) {
              updateItemQuantity(item.id, item.quantity + 1);
            }
          } else if (isInQuantityInput) {
            // In quantity input: increase quantity
            setQuantity(q => q + 1);
          } else if (isPaymentFocused) {
            // In payment mode: switch to credit
            setPaymentMethod('credit');
            playBeep('add');
          }
          break;
          
        case 'Enter':
          if (pendingProduct && isInQuantityInput) {
            // Confirm pending product with quantity
            e.preventDefault();
            addProductToCart(pendingProduct);
            setPendingProduct(null);
          } else if (isInSearchInput && filteredProducts.length > 0) {
            e.preventDefault();
            const productToAdd = selectedProductIndex >= 0 
              ? filteredProducts[selectedProductIndex] 
              : filteredProducts[0];
            if (productToAdd) addProductToCart(productToAdd);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, productSearch, filteredProducts, selectedProductIndex, selectedCartIndex, isCartFocused, isPaymentFocused, isQuantityFocused, pendingProduct, showShortcuts, showShortcutMap, currentStep, handleCheckout, removeItem, addProductToCart, updateItemQuantity, playBeep]);

  // Auto-focus search on mount
  useEffect(() => {
    if (!isMobile) {
      searchInputRef.current?.focus();
    }
  }, [isMobile]);

  const isDark = theme === 'dark';

  // Step indicator for Quick Checkout (Product Selection → Review)
  const stepIndex = currentStep === 'products' ? 1 : 2;
  const canProceedToReview = items.length > 0;

  // ==================== MOBILE LAYOUT ====================
  if (isMobile) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} pb-40`}>
        {/* Shortcut Map Overlay */}
        <ShortcutMapOverlay
          isOpen={showShortcutMap}
          onClose={() => setShowShortcutMap(false)}
          currentStep={currentStep === 'products' ? 'products' : 'review'}
          currentMode={currentMode}
          isQuickCheckout={true}
          stepIndex={stepIndex}
          totalSteps={1}
        />

        {/* Mobile Header - Compact */}
        <div className={`sticky top-0 z-50 px-3 py-2.5 ${isDark ? 'bg-slate-800/98 backdrop-blur-lg border-b border-slate-700/50' : 'bg-white/98 backdrop-blur-lg border-b border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/invoices')}
                className={`p-2 -ml-1 rounded-xl transition-all active:scale-95 ${isDark ? 'active:bg-slate-700' : 'active:bg-slate-100'}`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('quickCheckout.title')}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition-all active:scale-95 ${soundEnabled ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={clearCart}
                disabled={items.length === 0}
                className={`p-2 rounded-xl transition-all active:scale-95 disabled:opacity-30 text-red-500`}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Section - Full Width, Touch Optimized */}
        <div className={`sticky top-[52px] z-40 px-3 py-3 ${isDark ? 'bg-slate-900/98 backdrop-blur-lg' : 'bg-slate-50/98 backdrop-blur-lg'}`}>
          {/* Pending Product Banner */}
          {pendingProduct && (
            <div className={`mb-3 p-3 rounded-2xl flex items-center justify-between animate-pulse ${isDark ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-amber-50 border-2 border-amber-300'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/30' : 'bg-amber-200'}`}>
                  <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{pendingProduct.name}</p>
                  <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    {t('common.currency')} {(pendingProduct.retailPrice || pendingProduct.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setPendingProduct(null); }}
                className={`p-2 rounded-xl ${isDark ? 'active:bg-amber-500/30 text-amber-400' : 'active:bg-amber-200 text-amber-700'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Search + Quantity Row */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <ScanLine className={`w-5 h-5 ${mobileSearchFocused ? 'text-amber-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                placeholder={t('quickCheckout.searchPlaceholder')}
                value={productSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  const parsed = parseScanInput(val);
                  if (parsed?.qty && parsed?.code) {
                    const match = products.find(
                      (p) => p.barcode === parsed.code || p.sku.toLowerCase() === parsed.code.toLowerCase()
                    );
                    if (match) {
                      addProductToCart(match, parsed.qty);
                      setProductSearch('');
                      return;
                    }
                    setProductSearch(parsed.code);
                    return;
                  }
                  setProductSearch(parsed?.code || val);
                  setSelectedProductIndex(-1);
                }}
                onFocus={() => setMobileSearchFocused(true)}
                onBlur={() => setTimeout(() => setMobileSearchFocused(false), 200)}
                className={`w-full pl-11 pr-10 py-3.5 text-base border-2 rounded-2xl focus:outline-none transition-all ${
                  mobileSearchFocused
                    ? isDark
                      ? 'border-amber-500 bg-slate-800 text-white ring-4 ring-amber-500/20'
                      : 'border-amber-500 bg-white text-slate-900 ring-4 ring-amber-100'
                    : isDark
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500'
                      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                }`}
              />
              {productSearch && (
                <button
                  onClick={() => { setProductSearch(''); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl active:scale-95 ${isDark ? 'active:bg-slate-700 text-slate-400' : 'active:bg-slate-200 text-slate-500'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Compact Quantity Stepper */}
            <div className={`flex items-center gap-1 px-2 rounded-2xl border-2 ${
              pendingProduct
                ? isDark ? 'border-amber-500 bg-amber-500/10' : 'border-amber-400 bg-amber-50'
                : isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-white'
            }`}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDark ? 'active:bg-slate-700 text-slate-400' : 'active:bg-slate-200 text-slate-600'}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                ref={quantityInputRef}
                type="number"
                inputMode="numeric"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pendingProduct) {
                    e.preventDefault();
                    addProductToCart(pendingProduct);
                    setPendingProduct(null);
                  }
                }}
                className={`w-12 py-3 text-center font-bold text-lg bg-transparent focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
              <button
                onClick={() => setQuantity(q => q + 1)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDark ? 'active:bg-slate-700 text-slate-400' : 'active:bg-slate-200 text-slate-600'}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Search Results - Slide Up Panel */}
        {(filteredProducts.length > 0 || (productSearch && filteredProducts.length === 0)) && (
          <div className="px-3 mb-3">
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white shadow-lg'}`}>
              {filteredProducts.length > 0 ? (
                <div className="max-h-[50vh] overflow-y-auto">
                  {filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => quickAddProduct(product)}
                      className={`w-full flex items-center gap-3 p-3.5 text-left transition-all active:scale-[0.98] border-b last:border-b-0 ${
                        index === selectedProductIndex
                          ? isDark ? 'bg-amber-500/20' : 'bg-amber-50'
                          : isDark ? 'active:bg-slate-700/70 border-slate-700/50' : 'active:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <Package className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {product.sku}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-lg ${
                            product.stock > 10 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : product.stock > 0 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-red-500/10 text-red-500'
                          }`}>
                            {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {t('common.currency')} {(product.retailPrice || product.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                        <Plus className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Package className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {t('quickCheckout.noProductsFound')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart Items - Main Content Area */}
        <div className="px-3 pb-4">
          <div className={`rounded-2xl border min-h-[200px] ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <h2 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ShoppingCart className="w-5 h-5" />
                {t('quickCheckout.cartItems')}
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
                items.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            
            {items.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-12 px-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <ShoppingCart className="w-10 h-10 opacity-40" />
                </div>
                <p className="text-lg font-medium">{t('quickCheckout.emptyCart')}</p>
                <p className="text-sm mt-1 text-center">{t('quickCheckout.scanOrSearch')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    onTouchStart={(e) => handleTouchStart(e, item.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      transform: swipedItemId === item.id ? `translateX(${touchDeltaX}px)` : 'translateX(0)',
                      transition: swipedItemId === item.id ? 'none' : 'transform 0.2s ease-out',
                    }}
                    className={`relative p-3.5 ${
                      swipedItemId === item.id && touchDeltaX < -30
                        ? isDark ? 'bg-red-500/20' : 'bg-red-50'
                        : swipedItemId === item.id && touchDeltaX > 30
                          ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'
                          : ''
                    }`}
                  >
                    {/* Swipe hint indicators */}
                    {swipedItemId === item.id && touchDeltaX < -30 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <Trash2 className="w-6 h-6" />
                      </div>
                    )}
                    {swipedItemId === item.id && touchDeltaX > 30 && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
                        <Plus className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.productName}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {t('common.currency')} {item.unitPrice.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, item.quantity - 1); }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                            isDark ? 'active:bg-slate-600 text-slate-300' : 'active:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className={`w-8 text-center font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, item.quantity + 1); }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                            isDark ? 'active:bg-slate-600 text-slate-300' : 'active:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className={`w-20 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {t('common.currency')} {item.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Sheet - Always Visible */}
        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-800/98 backdrop-blur-xl border-t border-slate-700' : 'bg-white/98 backdrop-blur-xl border-t border-slate-200 shadow-2xl'}`}>
          {/* Pull Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
          </div>
          
          {/* Quick Actions Row */}
          <div className="px-4 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Payment Toggle */}
              <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={() => { setPaymentMethod('cash'); playBeep('add'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  {t('invoice.cash')}
                </button>
                <button
                  onClick={() => { setPaymentMethod('credit'); playBeep('add'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                    paymentMethod === 'credit'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {t('quickCheckout.credit')}
                </button>
              </div>
              
              {/* Discount Input */}
              <div className={`flex items-center gap-2 px-3 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                <Percent className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  ref={discountInputRef}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder={t('quickCheckout.discount')}
                  className={`flex-1 py-2.5 text-sm font-medium bg-transparent focus:outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                />
              </div>
            </div>
          </div>
          
          {/* Total & Checkout */}
          <div className="px-4 pb-4">
            <div className={`flex items-center justify-between py-2 mb-3 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-slate-100'}`}>
              <div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {items.length} {t('invoice.items')} • {items.reduce((sum, i) => sum + i.quantity, 0)} {t('invoice.units')}
                </p>
                {discountAmount > 0 && (
                  <p className="text-xs text-red-500">
                    -{t('common.currency')} {discountAmount.toLocaleString()} {t('quickCheckout.discount')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('invoice.totalAmount')}</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {t('common.currency')} {total.toLocaleString()}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || isProcessing}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                items.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/30'
                  : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t('quickCheckout.checkoutAndPrint')}
                  <Receipt className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Print Modal */}
        <PrintInvoiceModal
          isOpen={showPrintModal}
          onClose={handlePrintClose}
          invoice={createdInvoice}
          customer={{
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
          }}
        />
      </div>
    );
  }

  // ==================== DESKTOP LAYOUT ====================
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} pb-16`}>
      {/* Shortcut Map Overlay */}
      <ShortcutMapOverlay
        isOpen={showShortcutMap}
        onClose={() => setShowShortcutMap(false)}
        currentStep={currentStep === 'products' ? 'products' : 'review'}
        currentMode={currentMode}
        isQuickCheckout={true}
        stepIndex={stepIndex}
        totalSteps={1}
      />

      {/* Header */}
      <div className={`sticky top-0 z-40 px-4 py-3 ${isDark ? 'bg-slate-800/95 backdrop-blur border-b border-slate-700' : 'bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/invoices')}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('quickCheckout.title')}
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('quickCheckout.subtitle')}
                </p>
              </div>
            </div>
          </div>
          

          
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${soundEnabled ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}
              title={soundEnabled ? t('quickCheckout.soundOn') : t('quickCheckout.soundOff')}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            
            {/* Keyboard Shortcuts */}
            <button
              onClick={() => setShowShortcutMap(true)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${showShortcutMap ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-600'}`}
              title={t('quickCheckout.keyboardShortcuts')}
            >
              <Keyboard className="w-5 h-5" />
            </button>
            
            {/* Clear Cart */}
            <button
              onClick={clearCart}
              disabled={items.length === 0}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 disabled:opacity-30' : 'hover:bg-slate-100 disabled:opacity-30'} text-red-500`}
              title={t('quickCheckout.clearCart')}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Product Search & Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              {/* Pending Product Banner */}
              {pendingProduct && (
                <div className={`mb-3 p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{pendingProduct.name}</p>
                      <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                        {t('quickCheckout.enterQuantityPrompt')} • {t('common.currency')} {(pendingProduct.retailPrice || pendingProduct.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPendingProduct(null); searchInputRef.current?.focus(); }}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-amber-500/30 text-amber-400' : 'hover:bg-amber-200 text-amber-700'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-3">
                {/* Product Search */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Search className="w-3 h-3" />
                      {t('quickCheckout.shortcut.search')}
                    </label>
                    <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>F2</kbd>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Barcode className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t('quickCheckout.searchPlaceholder')}
                      value={productSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        const parsed = parseScanInput(val);

                        if (parsed?.qty && parsed?.code) {
                          // If qty is provided in the scan, try to resolve product immediately
                          const match = products.find(
                            (p) => p.barcode === parsed.code || p.sku.toLowerCase() === parsed.code.toLowerCase()
                          );

                          if (match) {
                            // Auto add with provided qty
                            addProductToCart(match, parsed.qty);
                            setProductSearch('');
                            setSelectedProductIndex(-1);
                            return;
                          }

                          // If product not found yet, set code as search term
                          setProductSearch(parsed.code);
                          setSelectedProductIndex(-1);
                          return;
                        }

                        if (parsed?.code) {
                          setProductSearch(parsed.code);
                          setSelectedProductIndex(-1);
                          return;
                        }

                        setProductSearch(val);
                        setSelectedProductIndex(-1);
                      }}
                      className={`w-full pl-12 pr-4 py-4 text-lg border-2 rounded-xl focus:outline-none transition-all ${
                        isDark
                          ? 'border-slate-600 bg-slate-700/50 text-white placeholder-slate-500 focus:border-amber-500'
                          : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                      }`}
                      autoComplete="off"
                    />
                    {productSearch && (
                      <button
                        onClick={() => {
                          setProductSearch('');
                          setSelectedProductIndex(-1);
                          searchInputRef.current?.focus();
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${isDark ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Quantity Input */}
                <div className="w-32">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('quickCheckout.shortcut.quantity')}
                    </label>
                    <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>F3</kbd>
                  </div>
                  <div className="relative">
                    <input
                      ref={quantityInputRef}
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      onFocus={() => setIsQuantityFocused(true)}
                      onBlur={() => setIsQuantityFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && pendingProduct) {
                          e.preventDefault();
                          addProductToCart(pendingProduct);
                          setPendingProduct(null);
                        }
                      }}
                      className={`w-full px-4 py-4 text-lg text-center font-bold border-2 rounded-xl focus:outline-none transition-all ${
                        pendingProduct
                          ? isDark 
                            ? 'border-amber-500 bg-amber-500/10 text-white ring-2 ring-amber-500/30' 
                            : 'border-amber-400 bg-amber-50 text-slate-900 ring-2 ring-amber-200'
                          : isDark
                            ? 'border-slate-600 bg-slate-700/50 text-white focus:border-amber-500'
                            : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className={`p-0.5 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className={`p-0.5 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isQuantityFocused && (
                    <p className={`mt-1 text-xs text-center ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ← − • + →
                    </p>
                  )}
                </div>
              </div>
              
              {/* Product Results */}
              {filteredProducts.length > 0 && (
                <div 
                  ref={productListRef}
                  className={`mt-3 max-h-64 overflow-y-auto rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}
                >
                  {filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => addProductToCart(product)}
                      className={`w-full flex items-center gap-4 p-3 text-left transition-colors border-b last:border-b-0 ${
                        index === selectedProductIndex
                          ? isDark ? 'bg-amber-500/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                          : isDark ? 'hover:bg-slate-700/50 border-slate-700' : 'hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                        <Package className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            SKU: {product.sku}
                          </span>
                          {product.barcode && (
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              • {product.barcode}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            product.stock > 10 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : product.stock > 0 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-red-500/10 text-red-500'
                          }`}>
                            {product.stock} {t('invoice.available')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {t('common.currency')} {(product.retailPrice || product.price || 0).toLocaleString()}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {product.unit || 'piece'}
                        </p>
                      </div>
                      <Plus className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </button>
                  ))}
                </div>
              )}
              
              {productSearch && filteredProducts.length === 0 && (
                <div className={`mt-3 p-6 text-center rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                  <Package className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {t('quickCheckout.noProductsFound')}
                  </p>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div 
              ref={cartListRef}
              tabIndex={-1}
              className={`p-4 rounded-2xl border min-h-[300px] outline-none overflow-x-hidden ${
                isCartFocused 
                  ? isDark ? 'bg-slate-800/50 border-amber-500/50 ring-2 ring-amber-500/20' : 'bg-white border-amber-400 ring-2 ring-amber-200 shadow-lg'
                  : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <ShoppingCart className="w-5 h-5" />
                  {t('quickCheckout.cartItems')} ({items.length})
                  {isCartFocused && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                      ↑↓ {t('quickCheckout.shortcut.navigateItems')} • ←→ {t('quickCheckout.shortcut.adjustQty')}
                    </span>
                  )}
                </h2>
                <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>F4</kbd>
              </div>
              
              {items.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <ShoppingCart className="w-16 h-16 mb-3 opacity-30" />
                  <p className="text-lg">{t('quickCheckout.emptyCart')}</p>
                  <p className="text-sm mt-1">{t('quickCheckout.scanOrSearch')}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isCartFocused && index === selectedCartIndex
                          ? isDark 
                            ? 'bg-amber-500/20 shadow-md' 
                            : 'bg-amber-50 shadow-md'
                          : isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-6 text-center font-mono text-sm ${
                        isCartFocused && index === selectedCartIndex 
                          ? 'text-amber-500 font-bold' 
                          : isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.productName}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {t('common.currency')} {item.unitPrice.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          -
                        </button>
                        <span className={`w-10 text-center font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          +
                        </button>
                      </div>
                      
                      <p className={`w-24 text-right font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {t('common.currency')} {item.total.toLocaleString()}
                      </p>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Checkout Summary */}
          <div className="space-y-4">
            {/* Payment Method */}
            <div 
              ref={paymentRef}
              tabIndex={-1}
              className={`p-4 rounded-2xl border outline-none transition-all ${
                isPaymentFocused
                  ? isDark ? 'bg-slate-800/50 border-blue-500/50 ring-2 ring-blue-500/20' : 'bg-white border-blue-400 ring-2 ring-blue-200 shadow-lg'
                  : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <CreditCard className="w-4 h-4" />
                  {t('quickCheckout.paymentMethod')}
                </h3>
                <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>F5</kbd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setPaymentMethod('cash'); playBeep('add'); }}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                      : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  {t('invoice.cash')}
                </button>
                <button
                  onClick={() => { setPaymentMethod('credit'); playBeep('add'); }}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-all ${
                    paymentMethod === 'credit'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                      : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  {t('quickCheckout.credit')}
                </button>
              </div>
              {isPaymentFocused && (
                <p className={`mt-2 text-xs text-center ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  ← {t('invoice.cash')} • {t('quickCheckout.credit')} →
                </p>
              )}
            </div>

            {/* Discount */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Percent className="w-4 h-4" />
                  {t('quickCheckout.discount')}
                </h3>
                <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>F6</kbd>
              </div>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('common.currency')}
                </span>
                <input
                  ref={discountInputRef}
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className={`w-full pl-14 pr-4 py-3 text-lg text-right font-bold border-2 rounded-xl focus:outline-none transition-all ${
                    isDark
                      ? 'border-slate-600 bg-slate-700/50 text-white placeholder-slate-500 focus:border-amber-500'
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>

            {/* Summary */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Calculator className="w-5 h-5" />
                {t('quickCheckout.summary')}
              </h3>
              
              <div className="space-y-3">
                <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{t('quickCheckout.itemCount')}</span>
                  <span className="font-medium">{items.reduce((sum, i) => sum + i.quantity, 0)} {t('invoice.units')}</span>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{t('invoice.subtotal')}</span>
                  <span className="font-mono">{t('common.currency')} {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className={`flex justify-between text-red-500`}>
                    <span>{t('quickCheckout.discount')}</span>
                    <span className="font-mono">- {t('common.currency')} {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className={`pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t('invoice.totalAmount')}
                    </span>
                    <span className="text-2xl font-bold text-emerald-500">
                      {t('common.currency')} {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || isProcessing}
              className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
                items.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30'
                  : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-6 h-6" />
              {t('quickCheckout.checkoutAndPrint')}
              <kbd className="ml-2 px-2 py-1 rounded bg-white/20 text-sm font-mono">F12</kbd>
            </button>

            {/* Keyboard Shortcuts Legend */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/50 border-slate-700' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-indigo-900'}`}>
                  <Keyboard className="w-4 h-4" />
                  {t('quickCheckout.keyboardShortcuts')}
                </p>
                <button
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                >
                  {showShortcuts ? t('common.less') : t('common.more')}
                </button>
              </div>
              
              {/* Primary Shortcuts - Always visible */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className={`flex flex-col items-center p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                  <kbd className={`px-2 py-1 rounded font-mono text-sm font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>F2</kbd>
                  <span className={`mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('quickCheckout.shortcut.search')}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                  <kbd className={`px-2 py-1 rounded font-mono text-sm font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>F3</kbd>
                  <span className={`mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('quickCheckout.shortcut.quantity')}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                  <kbd className={`px-2 py-1 rounded font-mono text-sm font-bold ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>F4</kbd>
                  <span className={`mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('quickCheckout.shortcut.cart')}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`flex flex-col items-center p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                  <kbd className={`px-2 py-1 rounded font-mono text-sm font-bold ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>F5</kbd>
                  <span className={`mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('quickCheckout.shortcut.payment')}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                  <kbd className={`px-2 py-1 rounded font-mono text-sm font-bold ${isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-700'}`}>F6</kbd>
                  <span className={`mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('quickCheckout.shortcut.discount')}</span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                  <kbd className={`px-2 py-1 rounded font-mono text-sm font-bold ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>F12</kbd>
                  <span className={`mt-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('quickCheckout.shortcut.checkout')}</span>
                </div>
              </div>
              
              {/* Extended Shortcuts - Toggleable */}
              {showShortcuts && (
                <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-indigo-200'}`}>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-indigo-700'}`}>
                    {t('quickCheckout.modeShortcuts')}
                  </p>
                  
                  {/* Quantity Mode */}
                  <div className={`p-2 rounded-lg mb-2 ${isDark ? 'bg-slate-700/30' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      📊 {t('quickCheckout.quantityMode')}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>←</kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.decreaseQty')}</span>
                      <kbd className={`px-1.5 py-0.5 rounded font-mono ml-2 ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>→</kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.increaseQty')}</span>
                    </div>
                  </div>
                  
                  {/* Cart Mode */}
                  <div className={`p-2 rounded-lg mb-2 ${isDark ? 'bg-slate-700/30' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                      🛒 {t('quickCheckout.cartMode')}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>↑↓</kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.navigateItems')}</span>
                      <kbd className={`px-1.5 py-0.5 rounded font-mono ml-2 ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>←→</kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.adjustQty')}</span>
                    </div>
                  </div>
                  
                  {/* Payment Mode */}
                  <div className={`p-2 rounded-lg mb-2 ${isDark ? 'bg-slate-700/30' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                      💳 {t('quickCheckout.paymentMode')}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>←</kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('invoice.cash')}</span>
                      <kbd className={`px-1.5 py-0.5 rounded font-mono ml-2 ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>→</kbd>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.credit')}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-white'}`}>
                    <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      ⚡ {t('quickCheckout.actions')}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Enter</kbd>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.addItem')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Del</kbd>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.removeLastItem')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <kbd className={`px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Esc</kbd>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('quickCheckout.shortcut.clear')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      <PrintInvoiceModal
        isOpen={showPrintModal}
        onClose={handlePrintClose}
        invoice={createdInvoice}
        customer={{
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
        }}
      />

      {/* Shortcut Hints Bar */}
      {!isMobile && (
        <ShortcutHintsBar
          currentStep={currentStep === 'products' ? 'products' : 'review'}
          currentMode={currentMode}
          isQuickCheckout={true}
          onShowFullMap={() => setShowShortcutMap(true)}
        />
      )}
    </div>
  );
};
