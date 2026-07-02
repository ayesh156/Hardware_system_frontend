import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import { useDropdownPosition } from '../hooks/use-dropdown-position';
import { useCatalog } from '../contexts/CatalogContext';
import { mockProducts, mockInvoices, mockCustomers, mockCategories, categoryNames } from '../data/mockData';
import { Product, Invoice, InvoiceItem, FlattenedProduct, InventoryProduct, Customer } from '../types/index';
import { flattenProducts } from '../lib/utils';
import { printInvoice } from '../components/modals/PrintInvoiceModal';
import ThermalReceiptPreview from '../components/ThermalReceiptPreview';
import { ShortcutMapOverlay, ShortcutHintsBar, CheckoutMode, InvoiceStep } from '../components/ShortcutMapOverlay';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductFormModal } from '../components/ProductFormModal';
import { PosItem, PosCategory } from '../data/mockData';
import {
  Zap, Search, Plus, Trash2, ArrowLeft, Printer, ShoppingCart,
  Keyboard, X, Package, Calculator, Barcode, Volume2, VolumeX,
  ChevronUp, ChevronDown, RotateCcw, CreditCard, Banknote, Percent,
  ArrowRight, ArrowUp, ArrowDown, ArrowLeftIcon, CheckCircle,
  Minus, ScanLine, ChevronRight, Receipt, Sparkles, User, Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickInvoiceItem extends InvoiceItem {
  originalPrice: number;
  productNameSi?: string;
  cost?: number;
  lastPrice?: number;
  salesPrice?: number;
  displayPrice?: number;
  ourPrice?: number;
  storeQty?: number;
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

// Import concurrency-safe invoice number generator
import { generateNextInvoiceNumberSync, initializeFromExistingInvoices } from '../lib/invoiceNumberService';

// Initialize invoice counter from existing data on module load
initializeFromExistingInvoices(mockInvoices);

export const QuickCheckout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isSinhala = i18n.language === 'si';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const { inventoryItems, addInventoryItem } = useCatalog();
  
  // Derive flattenedProducts from mockProducts once for legacy product catalog
  const [products] = useState<Product[]>(() => mockProducts);
  const flattenedProducts = useMemo(() => flattenProducts(products), [products]);
  
  // Build a live search index from inventoryItems for newly added products
  const inventorySearchIndex = useMemo(() => {
    const idx = new Map<string, InventoryProduct>();
    inventoryItems.forEach(item => {
      const key = item.searchKey.toLowerCase().trim();
      if (key) idx.set(key, item);
      const nameKey = item.name.toLowerCase().trim();
      if (nameKey) idx.set(nameKey, item);
    });
    return idx;
  }, [inventoryItems]);
  // ── In-place Edit mode via query param ──
  const editInvoiceId = searchParams.get('edit');
  const editingInvoice = useMemo(() => {
    if (!editInvoiceId) return null;
    return mockInvoices.find(inv => inv.id === editInvoiceId) || null;
  }, [editInvoiceId]);

  // ── Hydrate state when editing an existing invoice ──
  useEffect(() => {
    if (!editingInvoice) return;

    // Map invoice items → QuickInvoiceItem, preserving all pricing fields
    // from the rich mock data (displayPrice, ourPrice, cost, etc.)
    const hydratedItems: QuickInvoiceItem[] = editingInvoice.items.map(item => {
      const ext = item as any;
      const ourPrice   = Number(ext.ourPrice   || ext.salesPrice  || item.unitPrice || 0);
      const dispPrice  = Number(ext.displayPrice|| ext.originalPrice || item.unitPrice || 0);
      const costPrice  = Number(ext.cost        || 0);
      const lastPrice  = Number(ext.lastPrice   || dispPrice);

      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productNameSi: ext.productNameSi || item.productName,
        variantId: item.variantId,
        size: item.size,
        quantity: item.quantity,
        // unitPrice drives the legacy subtotal calc — use ourPrice
        unitPrice: ourPrice,
        originalPrice: dispPrice,
        displayPrice: dispPrice,
        ourPrice: ourPrice,
        cost: costPrice,
        salesPrice: ourPrice,
        lastPrice: lastPrice,
        total: ourPrice * item.quantity,
      };
    });
    setItems(hydratedItems);

    // Populate customer
    if (editingInvoice.customerId && editingInvoice.customerId !== 'walk-in') {
      setSelectedCustomerId(editingInvoice.customerId);
      const cust = mockCustomers.find(c => c.id === editingInvoice.customerId);
      if (cust) {
        setCustomerSearch(cust.name);
      }
    } else {
      setSelectedCustomerId('walk-in');
      setCustomerSearch('');
    }

    // Populate financial fields
    const invoiceDiscount = editingInvoice.discountValue || editingInvoice.discount || 0;
    setDiscount(invoiceDiscount);
    setReceivedAmount(editingInvoice.receivedAmount || 0);

    // Map payment method (cash/credit are the two options in QuickCheckout)
    if (editingInvoice.paymentMethod === 'cash' || editingInvoice.paymentMethod === 'credit') {
      setPaymentMethod(editingInvoice.paymentMethod);
    }

    // Toast notification
    toast.info(`Editing invoice ${editingInvoice.invoiceNumber}`, {
      description: `${hydratedItems.length} items loaded`,
    });
  }, [editingInvoice]);

  const [items, setItems] = useState<QuickInvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShortcutMap, setShowShortcutMap] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [pendingProduct, setPendingProduct] = useState<FlattenedProduct | null>(null);
  
  // Stepped navigation state
  const [currentStep, setCurrentStep] = useState<QuickCheckoutStep>('products');
  const [currentMode, setCurrentMode] = useState<CheckoutMode>('search');
  
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
  const cartItemsContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for scroll synchronization - stores refs to individual items
  const cartItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const productItemRefs = useRef<Map<number, HTMLElement>>(new Map());
  
  // Quick Add row refs and state
  const quickAddNameRef = useRef<HTMLInputElement>(null);
  const quickAddPriceRef = useRef<HTMLInputElement>(null);
  const quickAddQtyRef = useRef<HTMLInputElement>(null);
  const [isQuickAddMode, setIsQuickAddMode] = useState(false);
  const [quickAddFocusField, setQuickAddFocusField] = useState<'name' | 'price' | 'qty'>('name');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState<number>(0);
  const [quickAddQty, setQuickAddQty] = useState<number>(1);
  
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(-1);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(-1);
  const [isCartFocused, setIsCartFocused] = useState(false);
  const [isPaymentFocused, setIsPaymentFocused] = useState(false);
  const [priceEditBuffer, setPriceEditBuffer] = useState<string>('');
  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const priceEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Quick Categories Drag-and-Drop State ──
  const allCategoryNames = useMemo(() => {
    return categoryNames.filter(c => c !== "සියල්ල");
  }, []);
  const [quickCategories, setQuickCategories] = useState<string[]>(() => {
    return allCategoryNames.slice(0, 18);
  });
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeCategoryPopover, setActiveCategoryPopover] = useState<string | null>(null);
  const [categoryPopoverFilter, setCategoryPopoverFilter] = useState('');
  const [categoryPopoverAnchor, setCategoryPopoverAnchor] = useState<DOMRect | null>(null);
  const categoryPopoverRef = useRef<HTMLDivElement>(null);
  const categoryPopoverInputRef = useRef<HTMLInputElement>(null);

  // ── Category Popover Keyboard Navigation State ──
  const [activeCategoryItemIndex, setActiveCategoryItemIndex] = useState<number>(0);
  const [quantityPromptProduct, setQuantityPromptProduct] = useState<any | null>(null);
  const [categoryPromptQty, setCategoryPromptQty] = useState<string>("1");
  const categoryListContainerRef = useRef<HTMLDivElement>(null);
  
  // Memoized map of category → products for the Quick Categories grid
  const categoryProductMap = useMemo(() => {
    const map = new Map<string, typeof inventoryItems>();
    inventoryItems.forEach(item => {
      if (item.productCategory) {
        const existing = map.get(item.productCategory);
        if (existing) {
          existing.push(item);
        } else {
          map.set(item.productCategory, [item]);
        }
      }
    });
    return map;
  }, [inventoryItems]);

  // Customer selection state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const filteredCustomers = useMemo(() => mockCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())), [customerSearch]);

  // Helper functions for decimal-preserving quantity adjustments
  const incrementQuantity = useCallback((currentQty: number): number => {
    const intPart = Math.floor(currentQty);
    const decimalPart = currentQty - intPart;
    return intPart + 1 + decimalPart;
  }, []);

  const decrementQuantity = useCallback((currentQty: number, minValue: number = 0.01): number => {
    const intPart = Math.floor(currentQty);
    const decimalPart = currentQty - intPart;
    const newIntPart = Math.max(0, intPart - 1);
    const newQty = newIntPart + decimalPart;
    return Math.max(minValue, newQty > 0 ? newQty : decimalPart > 0 ? decimalPart : minValue);
  }, []);

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

  // ── Search inventoryItems directly from live CatalogContext ──
  // Multi-word matching: every space-separated word token in the query must appear
  // somewhere in the product name OR searchKey. Raw spaces are preserved in the
  // input — never stripped — so "7 යතුරු" and "GI BOX 1x1" both resolve correctly.
  const filteredProducts = useMemo((): any[] => {
    if (!productSearch.trim()) return [];

    const raw = productSearch.trim();
    const normalizedQuery = raw.toLowerCase();

    // ── Priority 1: exact barcode match — surface as single result ──
    const barcodeHit = inventoryItems.find(
      item => item.barcode && item.barcode.trim() === raw
    );
    if (barcodeHit) {
      return [{
        flatId: barcodeHit.id,
        product: { nameAlt: barcodeHit.name, sku: barcodeHit.searchKey, category: barcodeHit.productCategory } as any,
        variant: undefined,
        displayName: barcodeHit.name,
        displaySku: barcodeHit.searchKey,
        displayBarcode: barcodeHit.barcode,
        costPrice:    barcodeHit.cost,
        wholesalePrice: barcodeHit.displayPrice,  // display/marked price (shown struck-through)
        retailPrice:  barcodeHit.salesPrice,      // our actual selling price
        discountedPrice: undefined,
        hasDiscount: false,
        stock: barcodeHit.storeQty,
        minStock: 0,
        isVariant: false,
        variantLabel: undefined,
      }];
    }

    // ── Priority 2: multi-word fuzzy text search ──
    // Split on whitespace → every token must appear in name or searchKey.
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    return inventoryItems.filter(item => {
      if (!item.searchKey && !item.name) return false;
      const targetName = item.name.toLowerCase();
      const targetKey  = (item.searchKey || '').toLowerCase();
      return words.every(w => targetName.includes(w) || targetKey.includes(w));
    }).slice(0, 12).map(item => ({
      flatId: item.id,
      product: { nameAlt: item.name, sku: item.searchKey, category: item.productCategory } as any,
      variant: undefined,
      displayName: item.name,
      displaySku: item.searchKey,
      displayBarcode: item.barcode || item.searchKey,
      costPrice:    item.cost,
      wholesalePrice: item.displayPrice,  // display/marked price (shown struck-through)
      retailPrice:  item.salesPrice,      // our actual selling price
      discountedPrice: undefined,
      hasDiscount: false,
      stock: item.storeQty,
      minStock: 0,
      isVariant: false,
      variantLabel: undefined,
    }));
  }, [inventoryItems, productSearch]);
  const parseScanInput = (input: string): { code?: string; qty?: number } | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    const prefix = trimmed.match(/^\s*(\d+)\s*[\*xX\|\-]\s*(.+)$/);
    if (prefix) return { qty: Number(prefix[1]), code: prefix[2].trim() };

    const suffix = trimmed.match(/^\s*(.+?)\s*[\*xX\|\-]\s*(\d+)\s*$/);
    if (suffix) return { code: suffix[1].trim(), qty: Number(suffix[2]) };

    return { code: trimmed };
  };

  // Auto-detect barcode scan / direct paste (when field gains input)
  useEffect(() => {
    if (filteredProducts.length === 1 && productSearch.length >= 2) {
      const flatProduct = filteredProducts[0];
      const isExactMatch =
        flatProduct.displayBarcode === productSearch ||
        flatProduct.displaySku.toLowerCase() === productSearch.toLowerCase() ||
        flatProduct.product.sku.toLowerCase() === productSearch.toLowerCase();

      if (isExactMatch) {
        setPendingProduct(flatProduct);
        setProductSearch('');
        setSelectedProductIndex(-1);
        setQuantity(1);
        setIsQuantityFocused(true);
        setTimeout(() => {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }, 50);
        playBeep('add');
        toast.info(`${flatProduct.displayName} - ${t('quickCheckout.enterQuantity')}`);
      }
    }
  }, [filteredProducts, productSearch, playBeep, t]);

  // Add product to cart
  const addProductToCart = useCallback((flatProduct: FlattenedProduct, overrideQty?: number) => {
    const addQty = Math.max(1, overrideQty ?? quantity);

    // ── Single source of truth: all pricing pulled directly from inventoryItems ──
    // Lookup is strictly by unique `id` (flatId) — NEVER by searchKey string,
    // which is non-unique and causes price cloning across products that share a key.
    // retailPrice  = salesPrice   (our actual charge — maps to ourPrice)
    // wholesalePrice = displayPrice (marked/RRP shown struck-through on receipt)
    const masterProduct = inventoryItems.find(
      inv => inv.id === flatProduct.flatId
    );
    const ourPriceVal     = Number(masterProduct?.salesPrice   ?? flatProduct.retailPrice    ?? 0);
    const displayPriceVal = Number(masterProduct?.displayPrice ?? flatProduct.wholesalePrice ?? 0);
    const costVal         = Number(masterProduct?.cost         ?? flatProduct.costPrice      ?? 0);
    const lastPriceVal    = Number(masterProduct?.lastPrice    ?? 0);
    const storeQtyVal     = Number(masterProduct?.storeQty     ?? flatProduct.stock          ?? 0);

    const existingItem = items.find((i) => i.productId === flatProduct.flatId);
    if (existingItem) {
      if (existingItem.quantity + addQty > storeQtyVal) {
        playBeep('error');
        toast.error(`${t('quickCheckout.insufficientStock')}: ${storeQtyVal} ${t('invoice.available')}`);
        return;
      }
      setItems(
        items.map((i) =>
          i.productId === flatProduct.flatId
            ? { ...i, quantity: i.quantity + addQty, total: (i.quantity + addQty) * ourPriceVal }
            : i
        )
      );
    } else {
      if (addQty > storeQtyVal) {
        playBeep('error');
        toast.error(`${t('quickCheckout.insufficientStock')}: ${storeQtyVal} ${t('invoice.available')}`);
        return;
      }
      const newItem: QuickInvoiceItem = {
        id:            `item-${Date.now()}`,
        productId:     flatProduct.flatId,
        productName:   flatProduct.displayName,
        productNameSi: flatProduct.product.nameAlt || flatProduct.displayName,
        variantId:     flatProduct.variant?.id,
        size:          flatProduct.variant?.size,
        quantity:      addQty,
        unitPrice:     ourPriceVal,     // salesPrice is the billing rate
        originalPrice: displayPriceVal, // displayPrice — shown struck-through on receipt
        total:         addQty * ourPriceVal,
        cost:          costVal,
        lastPrice:     lastPriceVal,
        salesPrice:    ourPriceVal,
        displayPrice:  displayPriceVal,
        ourPrice:      ourPriceVal,
        storeQty:      storeQtyVal,
      };
      setItems([...items, newItem]);
    }

    playBeep('add');
    setQuantity(1);
    setProductSearch('');
    setSelectedProductIndex(-1);
    searchInputRef.current?.focus();

    setTimeout(() => {
      if (cartItemsContainerRef.current) {
        cartItemsContainerRef.current.scrollTop = cartItemsContainerRef.current.scrollHeight;
      }
    }, 50);
  }, [items, quantity, inventoryItems, playBeep, t]);

  // ── findExactMatch: checks if input is a fully-qualified barcode/SKU ──
  const findExactMatch = useCallback((input: string): FlattenedProduct | undefined => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    const lower = trimmed.toLowerCase();
    return flattenedProducts.find(
      (fp) =>
        fp.displayBarcode === trimmed ||
        fp.displaySku.toLowerCase() === lower ||
        fp.product.sku.toLowerCase() === lower
    );
  }, [flattenedProducts]);

  // ── onPaste handler: direct add-to-cart for exact matches ──
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (!pasted || pasted.length < 2) return;

    const match = findExactMatch(pasted);
    if (match && match.stock > 0) {
      e.preventDefault();
      addProductToCart(match, 1);
      setProductSearch('');
      toast.success(`${match.displayName} ${t('quickCheckout.addedToCart')}`, { duration: 1500 });
      playBeep('add');
    }
  }, [findExactMatch, addProductToCart, playBeep, t]);

  // ── Barcode hot-scan dispatcher ──────────────────────────────────────────
  // On exact barcode hit: populate the search field with the product name,
  // store it as pendingProduct, and shift focus to the qty input so the
  // cashier confirms quantity before the item enters the cart.
  // Returns true when a barcode was matched (caller should stop propagation).
  const handleBarcodeScanDispatch = useCallback((scannedValue: string): boolean => {
    const trimmed = scannedValue.trim();
    if (!trimmed || trimmed.length < 4) return false;

    const foundProduct = inventoryItems.find(
      p => p.barcode && p.barcode.trim() === trimmed
    );
    if (!foundProduct) return false;

    // Build a FlattenedProduct shell so pendingProduct / addProductToCart work normally
    const fp: FlattenedProduct = {
      flatId: foundProduct.id,
      product: { nameAlt: foundProduct.name, sku: foundProduct.searchKey, category: foundProduct.productCategory } as any,
      variant: undefined,
      displayName: foundProduct.name,
      displaySku: foundProduct.searchKey,
      displayBarcode: foundProduct.barcode,
      costPrice:      foundProduct.cost,
      wholesalePrice: foundProduct.displayPrice,  // display/marked price (shown struck-through)
      retailPrice:    foundProduct.salesPrice,    // our actual selling price
      discountedPrice: undefined,
      hasDiscount: false,
      stock: foundProduct.storeQty,
      minStock: 0,
      isVariant: false,
      variantLabel: undefined,
    } as FlattenedProduct;

    // Stage the item — do NOT add to cart yet
    setPendingProduct(fp);
    setProductSearch(foundProduct.name);
    setQuantity(1);
    setSelectedProductIndex(-1);
    playBeep('add');
    toast.info(`${foundProduct.name} — ${t('quickCheckout.enterQuantity')}`, { duration: 2000 });

    // Shift focus to the qty input so cashier can confirm / change qty then hit Enter
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 30);

    return true;
  }, [inventoryItems, playBeep, t]);

  // Remove item from cart
  const removeItem = useCallback((itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
    playBeep('remove');
  }, [items, playBeep]);

  // Apply bulk discount to all items
  const applyDiscountToAll = useCallback((percent: number) => {
    if (items.length === 0) {
      toast.error(t('invoice.noItemsYet'));
      return;
    }
    if (percent <= 0 || percent > 100) {
      toast.error(t('invoice.enterDiscountPercent'));
      return;
    }
    
    setItems(items.map(item => {
      const discountedPrice = Math.round(item.originalPrice * (1 - percent / 100));
      return {
        ...item,
        unitPrice: discountedPrice,
        total: item.quantity * discountedPrice,
      };
    }));
    
    toast.success(`${percent}% ${t('invoice.discountApplied')}`);
    setBulkDiscountPercent(0);
    playBeep('add');
  }, [items, t, playBeep]);

  // In-cart editable price override: mutates ALL pricing keys in sync
  const handleUpdateCartItemPrice = useCallback((itemId: string, newPrice: number) => {
    const sanitizedPrice = Number(newPrice || 0);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { 
              ...item, 
              salesPrice: sanitizedPrice, 
              ourPrice: sanitizedPrice,
              unitPrice: sanitizedPrice,
              total: sanitizedPrice * item.quantity,
            }
          : item
      )
    );
  }, []);

  // Update item quantity
  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const flatProduct = flattenedProducts.find((fp) => fp.flatId === item.productId);
      if (flatProduct && newQuantity > flatProduct.stock) {
        playBeep('error');
        toast.error(`${t('quickCheckout.insufficientStock')}: ${flatProduct.stock} ${t('invoice.available')}`);
        return;
      }
    }
    
    setItems(items.map(i => 
      i.id === itemId 
        ? { ...i, quantity: newQuantity, total: newQuantity * Number(i.salesPrice || i.ourPrice || i.unitPrice) }
        : i
    ));
  }, [items, flattenedProducts, removeItem, playBeep, t]);

  // Mobile swipe handlers
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
          removeItem(item.id);
          toast.success(t('quickCheckout.itemRemoved'));
        } else if (touchDeltaX > 60) {
          updateItemQuantity(item.id, item.quantity + 1);
        }
      }
    }
    setTouchDeltaX(0);
    setSwipedItemId(null);
  }, [touchDeltaX, swipedItemId, items, removeItem, updateItemQuantity, t]);

  // Quick add
  const quickAddProduct = useCallback((flatProduct: FlattenedProduct) => {
    addProductToCart(flatProduct, 1);
    if (isMobile) {
      toast.success(`${flatProduct.displayName} ${t('quickCheckout.addedToCart')}`, { duration: 1500 });
    }
  }, [addProductToCart, isMobile, t]);

  // Add custom item
  const addQuickAddItem = useCallback(() => {
    if (!quickAddName.trim() || quickAddPrice <= 0 || quickAddQty <= 0) {
      playBeep('error');
      toast.error(t('quickCheckout.quickAddValidation'));
      return;
    }
    
    const newItem: QuickInvoiceItem = {
      id: `custom-${Date.now()}`,
      productId: `custom-${Date.now()}`,
      productName: quickAddName.trim(),
      quantity: quickAddQty,
      unitPrice: quickAddPrice,
      originalPrice: quickAddPrice,
      total: quickAddQty * quickAddPrice,
    };
    
    setItems(prev => [...prev, newItem]);
    playBeep('add');
    toast.success(`${quickAddName} ${t('quickCheckout.addedToCart')}`);
    
    setQuickAddName('');
    setQuickAddPrice(0);
    setQuickAddQty(1);
    setIsQuickAddMode(false);
    setQuickAddFocusField('name');
    searchInputRef.current?.focus();
    
    setTimeout(() => {
      if (cartItemsContainerRef.current) {
        cartItemsContainerRef.current.scrollTop = cartItemsContainerRef.current.scrollHeight;
      }
    }, 50);
  }, [quickAddName, quickAddPrice, quickAddQty, playBeep, t]);

  // ── Computed totals (lastPrice-based) ────────────────────────────────────
  // salesPrice is the definitive transaction rate used for all billing maths.
  // displayPrice is shown on receipt column 2 (struck-through reference price).
  // lastPrice / ourPrice are preserved on the item for internal reference only.

  const computedSubtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.salesPrice || item.ourPrice || 0) * item.quantity), 0);
  }, [items]);

  const computedDiscount = Number(discount) || 0;
  const computedFinalTotal = Math.max(0, computedSubtotal - computedDiscount);

  // Customer savings: Σ((displayPrice - salesPrice) × qty) + manual discount
  const computedCustomerProfit = useMemo(() => {
    const priceGapSavings = items.reduce((acc, item) => {
      const display = Number(item.displayPrice || 0);
      const sales = Number(item.salesPrice || item.ourPrice || 0);
      return acc + ((display - sales) * item.quantity);
    }, 0);
    return priceGapSavings + (Number(discount) || 0);
  }, [items, discount]);

  // Legacy subtotal kept for applyDiscountToAll (uses item.unitPrice based totals)
  const subtotal = items.reduce((sum, item) => sum + (Number(item.salesPrice || item.ourPrice || 0) * item.quantity), 0);

  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const receivedAmountInputRef = useRef<HTMLInputElement>(null);
  const changeAmount = receivedAmount > 0 ? Math.max(0, receivedAmount - computedFinalTotal) : 0;

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
    setProductSearch('');
    setQuantity(1);
    setDiscount(0);
    setReceivedAmount(0);
    setPendingProduct(null);
    setSelectedProductIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  // Finalize sale
  const finalizeSale = useCallback((invoiceNumber?: string) => {
    setItems([]);
    setDiscount(0);
    setReceivedAmount(0);
    setIsProcessing(false);
    searchInputRef.current?.focus();
    if (invoiceNumber) {
      toast.success(`${t('quickCheckout.saleCompleted')}: ${invoiceNumber}`);
    } else {
      toast.success(t('quickCheckout.saleCompleted'));
    }
  }, [t]);

  // Process checkout
  const handleCheckout = useCallback(() => {
    if (items.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    const invoiceNumber = generateNextInvoiceNumberSync();
    const invoiceDiscount = Math.round(computedDiscount * 100) / 100;
    // Build invoice items — salesPrice drives all line totals
    const invoiceItems = items.map(item => ({
      ...item,
      unitPrice: Number(item.salesPrice || item.ourPrice || item.unitPrice),
      total: Number(item.salesPrice || item.ourPrice || item.unitPrice) * item.quantity,
      displayPrice: Number(item.displayPrice || item.lastPrice || item.unitPrice),
      ourPrice: Number(item.salesPrice || item.ourPrice || item.unitPrice),
    }));
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: selectedCustomerId || 'walk-in',
      customerName: selectedCustomerId !== 'walk-in'
        ? (mockCustomers.find(c => c.id === selectedCustomerId)?.name ?? t('invoice.walkInCustomer'))
        : t('invoice.walkInCustomer'),
      items: invoiceItems,
      subtotal: Math.round(computedSubtotal * 100) / 100,
      tax: 0,
      discount: invoiceDiscount,
      total: Math.round(computedFinalTotal * 100) / 100,
      receivedAmount: receivedAmount > 0 ? Math.round(receivedAmount * 100) / 100 : undefined,
      changeAmount: changeAmount > 0 ? Math.round(changeAmount * 100) / 100 : undefined,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod: paymentMethod,
      notes: invoiceDiscount > 0 
        ? `${t('quickCheckout.quickSaleNote')} - ${t('quickCheckout.discount')}: ${t('common.currency')} ${invoiceDiscount.toLocaleString()}`
        : t('quickCheckout.quickSaleNote'),
    };

    playBeep('success');

    const selectedCustomer = selectedCustomerId !== 'walk-in'
      ? mockCustomers.find(c => c.id === selectedCustomerId) ?? null
      : null;
    const walkInCustomer: Customer = {
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
    };

    printInvoice(invoice, selectedCustomer ?? walkInCustomer, isSinhala ? 'si' : 'en')
      .then(() => {
        finalizeSale(invoice.invoiceNumber);
      })
      .catch(() => {
        toast.error(t('quickCheckout.printBlocked'));
        finalizeSale(invoice.invoiceNumber);
      });
  }, [items, computedSubtotal, computedFinalTotal, computedDiscount, selectedCustomerId, paymentMethod, playBeep, t, finalizeSale, receivedAmount, changeAmount, isSinhala]);

  // Quick save
  const handleQuickSave = useCallback(() => {
    if (items.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    const invoiceNumber = generateNextInvoiceNumberSync();
    const invoiceDiscount = Math.round(computedDiscount * 100) / 100;
    // Build invoice items — salesPrice drives all line totals
    const invoiceItems = items.map(item => ({
      ...item,
      unitPrice: Number(item.salesPrice || item.ourPrice || item.unitPrice),
      total: Number(item.salesPrice || item.ourPrice || item.unitPrice) * item.quantity,
      displayPrice: Number(item.displayPrice || item.lastPrice || item.unitPrice),
      ourPrice: Number(item.salesPrice || item.ourPrice || item.unitPrice),
    }));
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: selectedCustomerId || 'walk-in',
      customerName: selectedCustomerId !== 'walk-in'
        ? (mockCustomers.find(c => c.id === selectedCustomerId)?.name ?? t('invoice.walkInCustomer'))
        : t('invoice.walkInCustomer'),
      items: invoiceItems,
      subtotal: Math.round(computedSubtotal * 100) / 100,
      tax: 0,
      discount: invoiceDiscount,
      total: Math.round(computedFinalTotal * 100) / 100,
      receivedAmount: receivedAmount > 0 ? Math.round(receivedAmount * 100) / 100 : undefined,
      changeAmount: changeAmount > 0 ? Math.round(changeAmount * 100) / 100 : undefined,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: paymentMethod === 'credit' ? 'pending' : 'paid',
      paymentMethod: paymentMethod,
      notes: invoiceDiscount > 0 
        ? `${t('quickCheckout.quickSaleNote')} - ${t('quickCheckout.discount')}: ${t('common.currency')} ${invoiceDiscount.toLocaleString()}`
        : t('quickCheckout.quickSaleNote'),
    };

    playBeep('success');
    toast.success(
      `${t('quickCheckout.invoiceSaved')}: ${invoiceNumber}`, 
      { description: `${t('common.currency')} ${invoice.total.toLocaleString()}` }
    );
    
    setItems([]);
    setDiscount(0);
    setReceivedAmount(0);
    setIsProcessing(false);
    searchInputRef.current?.focus();
  }, [items, computedSubtotal, computedFinalTotal, computedDiscount, selectedCustomerId, paymentMethod, playBeep, t, isProcessing, receivedAmount, changeAmount]);

  // Keyboard event handler (full, preserved as-is)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInSearchInput = document.activeElement === searchInputRef.current;
      const isInQuantityInput = document.activeElement === quantityInputRef.current;
      const isInDiscountInput = document.activeElement === discountInputRef.current;
      const isInReceivedInput = document.activeElement === receivedAmountInputRef.current;
      
      if (e.key === '?' && !isInSearchInput && !isInQuantityInput && !isInDiscountInput && !isInReceivedInput) {
        e.preventDefault();
        setShowShortcutMap(prev => !prev);
        return;
      }
      
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
            setSelectedCartIndex(items.length - 1);
            setSelectedProductIndex(-1);
            setPendingProduct(null);
            setCurrentMode('cart');
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
          
        case 'F7':
          e.preventDefault();
          setIsCartFocused(false);
          setIsPaymentFocused(false);
          setIsQuantityFocused(false);
          setPendingProduct(null);
          setCurrentMode('discount');
          receivedAmountInputRef.current?.focus();
          receivedAmountInputRef.current?.select();
          playBeep('add');
          break;
          
        case 'F8':
          e.preventDefault();
          setIsCartFocused(false);
          setIsPaymentFocused(false);
          setIsQuantityFocused(false);
          setPendingProduct(null);
          setIsQuickAddMode(true);
          setQuickAddFocusField('name');
          setCurrentMode('search');
          setTimeout(() => {
            quickAddNameRef.current?.focus();
            quickAddNameRef.current?.select();
          }, 50);
          playBeep('add');
          break;
          
        case 'F9':
          e.preventDefault();
          if (items.length > 0) handleQuickSave();
          break;
          
        case 'F12':
          e.preventDefault();
          if (items.length > 0) handleCheckout();
          break;
          
        case 'Escape':
          e.preventDefault();
          if (showShortcutMap) {
            setShowShortcutMap(false);
          } else if (isQuickAddMode) {
            setIsQuickAddMode(false);
            setQuickAddName('');
            setQuickAddPrice(0);
            setQuickAddQty(1);
            setQuickAddFocusField('name');
            searchInputRef.current?.focus();
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
          if (items.length > 0 && !isInDiscountInput) {
            e.preventDefault();
            const itemToRemove = isCartFocused && selectedCartIndex >= 0 
              ? items[selectedCartIndex] 
              : items[items.length - 1];
            removeItem(itemToRemove.id);
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
          if (isCartFocused && items.length > 0) {
            e.preventDefault();
            setSelectedCartIndex((prev) => prev < items.length - 1 ? prev + 1 : prev);
            setPriceEditBuffer('');
            setIsPriceEditing(false);
            if (priceEditTimeoutRef.current) {
              clearTimeout(priceEditTimeoutRef.current);
            }
          } else if (filteredProducts.length > 0 && isInSearchInput) {
            e.preventDefault();
            setSelectedProductIndex((prev) => 
              prev < filteredProducts.length - 1 ? prev + 1 : prev
            );
          }
          break;
          
        case 'ArrowUp':
          if (isCartFocused && items.length > 0) {
            e.preventDefault();
            setSelectedCartIndex((prev) => prev > 0 ? prev - 1 : 0);
            setPriceEditBuffer('');
            setIsPriceEditing(false);
            if (priceEditTimeoutRef.current) {
              clearTimeout(priceEditTimeoutRef.current);
            }
          } else if (filteredProducts.length > 0 && isInSearchInput) {
            e.preventDefault();
            setSelectedProductIndex((prev) => prev > 0 ? prev - 1 : 0);
          }
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          if (isCartFocused && items.length > 0 && selectedCartIndex >= 0) {
            const item = items[selectedCartIndex];
            if (item) {
              updateItemQuantity(item.id, decrementQuantity(item.quantity, 0.01));
            }
          } else if (isInQuantityInput) {
            setQuantity(q => decrementQuantity(q, 0.01));
          } else if (isPaymentFocused) {
            setPaymentMethod('cash');
            playBeep('add');
          }
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          if (isCartFocused && items.length > 0 && selectedCartIndex >= 0) {
            const item = items[selectedCartIndex];
            if (item) {
              updateItemQuantity(item.id, incrementQuantity(item.quantity));
            }
          } else if (isInQuantityInput) {
            setQuantity(q => incrementQuantity(q));
          } else if (isPaymentFocused) {
            setPaymentMethod('credit');
            playBeep('add');
          }
          break;
          
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          if (isCartFocused && items.length > 0 && selectedCartIndex >= 0 && !isInSearchInput && !isInQuantityInput && !isInDiscountInput) {
            e.preventDefault();
            const digit = e.key;
            
            if (priceEditTimeoutRef.current) {
              clearTimeout(priceEditTimeoutRef.current);
            }
            
            const newBuffer = priceEditBuffer + digit;
            setPriceEditBuffer(newBuffer);
            setIsPriceEditing(true);
            
            const item = items[selectedCartIndex];
            let newPrice: number;
            let isRelativeDeduction = false;
            
            if (newBuffer.startsWith('-')) {
              const deductionAmount = parseFloat(newBuffer.slice(1)) || 0;
              newPrice = Math.max(0, (item?.originalPrice || 0) - deductionAmount);
              isRelativeDeduction = true;
            } else {
              newPrice = parseFloat(newBuffer) || 0;
            }
            
            if (item && newPrice >= 0) {
              setItems(prevItems => prevItems.map(i => 
                i.id === item.id 
                  ? { 
                      ...i, 
                      unitPrice: newPrice, 
                      salesPrice: newPrice, 
                      ourPrice: newPrice,
                      total: i.quantity * newPrice 
                    }
                  : i
              ));
            }
            
            priceEditTimeoutRef.current = setTimeout(() => {
              setPriceEditBuffer('');
              setIsPriceEditing(false);
              if (newPrice > 0) {
                playBeep('success');
                if (isRelativeDeduction) {
                  const deductionAmount = parseFloat(newBuffer.slice(1)) || 0;
                  toast.success(`${t('quickCheckout.priceDeducted')}: -${t('common.currency')} ${deductionAmount.toLocaleString()} → ${t('common.currency')} ${newPrice.toLocaleString()}`);
                } else {
                  toast.success(`${t('quickCheckout.priceUpdated')}: ${t('common.currency')} ${newPrice.toLocaleString()}`);
                }
              }
            }, 1500);
          }
          break;
          
        case 'Backspace':
          if (isCartFocused && isPriceEditing && priceEditBuffer.length > 0 && !isInSearchInput && !isInQuantityInput && !isInDiscountInput) {
            e.preventDefault();
            
            if (priceEditTimeoutRef.current) {
              clearTimeout(priceEditTimeoutRef.current);
            }
            
            const newBuffer = priceEditBuffer.slice(0, -1);
            setPriceEditBuffer(newBuffer);
            
            const newPrice = parseFloat(newBuffer) || 0;
            const item = items[selectedCartIndex];
            if (item) {
              const effectivePrice = newPrice || item.originalPrice;
              setItems(prevItems => prevItems.map(i => 
                i.id === item.id 
                  ? { 
                      ...i, 
                      unitPrice: effectivePrice, 
                      salesPrice: effectivePrice,
                      ourPrice: effectivePrice,
                      total: i.quantity * effectivePrice 
                    }
                  : i
              ));
            }
            
            if (newBuffer === '') {
              setIsPriceEditing(false);
            } else {
              priceEditTimeoutRef.current = setTimeout(() => {
                setPriceEditBuffer('');
                setIsPriceEditing(false);
              }, 1500);
            }
          }
          break;
          
        case '.':
          if (isCartFocused && isPriceEditing && !priceEditBuffer.includes('.') && !isInSearchInput && !isInQuantityInput && !isInDiscountInput) {
            e.preventDefault();
            
            if (priceEditTimeoutRef.current) {
              clearTimeout(priceEditTimeoutRef.current);
            }
            
            const newBuffer = priceEditBuffer + '.';
            setPriceEditBuffer(newBuffer);
            
            priceEditTimeoutRef.current = setTimeout(() => {
              setPriceEditBuffer('');
              setIsPriceEditing(false);
            }, 1500);
          }
          break;
          
        case '-':
          if (isCartFocused && items.length > 0 && selectedCartIndex >= 0 && !isInSearchInput && !isInQuantityInput && !isInDiscountInput) {
            if (priceEditBuffer === '') {
              e.preventDefault();
              
              if (priceEditTimeoutRef.current) {
                clearTimeout(priceEditTimeoutRef.current);
              }
              
              setPriceEditBuffer('-');
              setIsPriceEditing(true);
              
              priceEditTimeoutRef.current = setTimeout(() => {
                setPriceEditBuffer('');
                setIsPriceEditing(false);
              }, 1500);
            }
          }
          break;
          
        case 'Enter':
          if (isQuickAddMode) {
            e.preventDefault();
            addQuickAddItem();
          } else if (pendingProduct && isInQuantityInput) {
            e.preventDefault();
            addProductToCart(pendingProduct);
            setPendingProduct(null);
            setCurrentMode('search');
            searchInputRef.current?.focus();
          } else if (isInSearchInput && filteredProducts.length > 0) {
            e.preventDefault();
            const productToSelect = selectedProductIndex >= 0 
              ? filteredProducts[selectedProductIndex] 
              : filteredProducts[0];
            if (productToSelect) {
              setPendingProduct(productToSelect);
              setProductSearch('');
              setSelectedProductIndex(-1);
              setQuantity(1);
              setIsQuantityFocused(true);
              setCurrentMode('quantity');
              setTimeout(() => {
                quantityInputRef.current?.focus();
                quantityInputRef.current?.select();
              }, 50);
              playBeep('add');
              toast.info(`${productToSelect.displayName} - ${t('quickCheckout.enterQuantity')}`);
            }
          }
          break;
          
        case 'Tab':
          if (isQuickAddMode) {
            e.preventDefault();
            if (e.shiftKey) {
              if (quickAddFocusField === 'qty') {
                setQuickAddFocusField('price');
                quickAddPriceRef.current?.focus();
              } else if (quickAddFocusField === 'price') {
                setQuickAddFocusField('name');
                quickAddNameRef.current?.focus();
              } else {
                setQuickAddFocusField('qty');
                quickAddQtyRef.current?.focus();
              }
            } else {
              if (quickAddFocusField === 'name') {
                setQuickAddFocusField('price');
                quickAddPriceRef.current?.focus();
              } else if (quickAddFocusField === 'price') {
                setQuickAddFocusField('qty');
                quickAddQtyRef.current?.focus();
              } else {
                setQuickAddFocusField('name');
                quickAddNameRef.current?.focus();
              }
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, productSearch, filteredProducts, selectedProductIndex, selectedCartIndex, isCartFocused, isPaymentFocused, isQuantityFocused, pendingProduct, showShortcuts, showShortcutMap, currentStep, handleCheckout, handleQuickSave, removeItem, addProductToCart, updateItemQuantity, playBeep, priceEditBuffer, isPriceEditing, t, incrementQuantity, decrementQuantity, isQuickAddMode, quickAddFocusField, addQuickAddItem]);

  // Auto-focus search on mount and cleanup timeout on unmount
  useEffect(() => {
    if (!isMobile) {
      searchInputRef.current?.focus();
    }
    
    return () => {
      if (priceEditTimeoutRef.current) {
        clearTimeout(priceEditTimeoutRef.current);
      }
    };
  }, [isMobile]);

  // Active-scroll synchronization
  useEffect(() => {
    if (isCartFocused && selectedCartIndex >= 0) {
      const itemElement = cartItemRefs.current.get(selectedCartIndex);
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedCartIndex, isCartFocused]);

  useEffect(() => {
    if (selectedProductIndex >= 0) {
      const itemElement = productItemRefs.current.get(selectedProductIndex);
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedProductIndex]);

  const isDark = theme === 'dark';

  const stepIndex = currentStep === 'products' ? 1 : 2;
  const canProceedToReview = items.length > 0;

  // ==================== MOBILE LAYOUT ====================
  if (isMobile) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} pb-40`}>
        <ShortcutMapOverlay
          isOpen={showShortcutMap}
          onClose={() => setShowShortcutMap(false)}
          currentStep={currentStep === 'products' ? 'products' : 'review'}
          currentMode={currentMode}
          isQuickCheckout={true}
          stepIndex={stepIndex}
          totalSteps={1}
        />

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

        <div className={`sticky top-[52px] z-40 px-3 py-2 ${isDark ? 'bg-slate-900/98 backdrop-blur-lg' : 'bg-slate-50/98 backdrop-blur-lg'}`}>
          {pendingProduct && (
            <div className={`mb-2 p-2 rounded-xl flex items-center justify-between animate-pulse ${isDark ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-amber-50 border-2 border-amber-300'}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/30' : 'bg-amber-200'}`}>
                  <Package className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-xs truncate ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{isSinhala ? (pendingProduct.product.nameAlt || pendingProduct.displayName) : pendingProduct.displayName}</p>
                  <p className={`text-[10px] ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    {t('common.currency')} {pendingProduct.retailPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setPendingProduct(null); }}
                className={`p-1 rounded-xl ${isDark ? 'active:bg-amber-500/30 text-amber-400' : 'active:bg-amber-200 text-amber-700'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ScanLine className={`w-4 h-4 ${mobileSearchFocused ? 'text-amber-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                inputMode="search"
                placeholder={t('quickCheckout.searchPlaceholder')}
                value={productSearch}
                onChange={(e) => {
                  const val = e.target.value;

                  // ── Barcode hot-scan: exact barcode match → stage in pendingProduct ──
                  if (handleBarcodeScanDispatch(val)) return;

                  // ── Scan multiplier pattern only (e.g. "3*CUT 4") ──
                  const parsed = parseScanInput(val);
                  if (parsed?.qty && parsed?.code) {
                    const match = flattenedProducts.find(
                      (fp) => fp.displayBarcode === parsed.code || fp.displaySku.toLowerCase() === parsed.code.toLowerCase()
                    );
                    if (match) {
                      addProductToCart(match, parsed.qty);
                      setProductSearch('');
                      return;
                    }
                    // code portion only — preserve it including spaces
                    setProductSearch(parsed.code);
                    return;
                  }

                  // ── Normal typing: pass raw value unchanged (spaces allowed) ──
                  setProductSearch(val);
                  setSelectedProductIndex(-1);
                }}
                onFocus={() => {
                  setMobileSearchFocused(true);
                  setIsCartFocused(false);
                  setSelectedCartIndex(-1);
                  setIsPaymentFocused(false);
                  setPriceEditBuffer('');
                  setIsPriceEditing(false);
                }}
                onBlur={() => setTimeout(() => setMobileSearchFocused(false), 200)}
                className={`w-full pl-9 pr-9 py-2 text-sm border-2 rounded-xl focus:outline-none transition-all ${
                  mobileSearchFocused
                    ? isDark
                      ? 'border-amber-500 bg-slate-800 text-white ring-2 ring-amber-500/20'
                      : 'border-amber-500 bg-white text-slate-900 ring-2 ring-amber-100'
                    : isDark
                      ? 'border-slate-700 bg-slate-800/80 text-white placeholder-slate-500'
                      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                }`}
              />
              {productSearch && (
                <button
                  onClick={() => { setProductSearch(''); }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-xl active:scale-95 ${isDark ? 'active:bg-slate-700 text-slate-400' : 'active:bg-slate-200 text-slate-500'}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className={`flex items-center gap-1 px-1.5 rounded-xl border-2 ${
              pendingProduct
                ? isDark ? 'border-amber-500 bg-amber-500/10' : 'border-amber-400 bg-amber-50'
                : isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-white'
            }`}>
              <button
                onClick={() => setQuantity(q => decrementQuantity(q, 0.01))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${isDark ? 'active:bg-slate-700 text-slate-400' : 'active:bg-slate-200 text-slate-600'}`}
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                ref={quantityInputRef}
                id="main-checkout-qty-input"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                onFocus={() => {
                  setIsCartFocused(false);
                  setSelectedCartIndex(-1);
                  setIsPaymentFocused(false);
                  setPriceEditBuffer('');
                  setIsPriceEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pendingProduct) {
                    e.preventDefault();
                    addProductToCart(pendingProduct);
                    setPendingProduct(null);
                    setProductSearch('');
                    setQuantity(1);
                    setTimeout(() => {
                      searchInputRef.current?.focus();
                      searchInputRef.current?.select();
                    }, 30);
                  }
                }}
                className={`w-10 py-2 text-center font-bold text-sm bg-transparent focus:outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
              />
              <button
                onClick={() => setQuantity(q => incrementQuantity(q))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${isDark ? 'active:bg-slate-700 text-slate-400' : 'active:bg-slate-200 text-slate-600'}`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {(filteredProducts.length > 0 || (productSearch && filteredProducts.length === 0)) && (
          <div className="px-3 mb-2">
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white shadow-sm'}`}>
              {filteredProducts.length > 0 ? (
                <div className="max-h-[40vh] overflow-y-auto">
                  {filteredProducts.map((flatProduct, index) => (
                    <button
                      key={flatProduct.flatId}
                      ref={(el) => {
                        if (el) productItemRefs.current.set(index, el);
                        else productItemRefs.current.delete(index);
                      }}
                      onClick={() => quickAddProduct(flatProduct)}
                      className={`w-full flex items-center gap-2 p-2.5 text-left transition-all active:scale-[0.98] border-b last:border-b-0 ${
                        index === selectedProductIndex
                          ? isDark ? 'bg-amber-500/20' : 'bg-amber-50'
                          : isDark ? 'active:bg-slate-700/70 border-slate-700/50' : 'active:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <Package className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {isSinhala ? (flatProduct.product.nameAlt || flatProduct.displayName) : flatProduct.displayName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {flatProduct.displaySku}
                          </span>
                          <span className={`text-[10px] px-1 py-0.5 rounded ${
                            flatProduct.stock > 10 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : flatProduct.stock > 0 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-red-500/10 text-red-500'
                          }`}>
                            {flatProduct.stock}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {flatProduct.hasDiscount && flatProduct.discountedPrice ? (
                          <>
                            <p className={`text-[10px] line-through ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              Rs. {flatProduct.retailPrice.toLocaleString()}
                            </p>
                            <p className="text-xs font-bold text-pink-500">
                              Rs. {flatProduct.discountedPrice.toLocaleString()}
                            </p>
                          </>
                        ) : (
                          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Rs. {flatProduct.retailPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                        <Plus className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Package className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    {t('quickCheckout.noProductsFound')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-3 pb-4">
          <div className={`rounded-xl border min-h-[150px] ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <h2 className={`font-bold flex items-center gap-1.5 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ShoppingCart className="w-4 h-4" />
                {t('quickCheckout.cartItems')}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                items.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            
            {items.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-8 px-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <ShoppingCart className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm font-medium">{t('quickCheckout.emptyCart')}</p>
                <p className="text-[11px] mt-1 text-center">{t('quickCheckout.scanOrSearch')}</p>
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
                    className={`relative p-2.5 ${
                      swipedItemId === item.id && touchDeltaX < -30
                        ? isDark ? 'bg-red-500/20' : 'bg-red-50'
                        : swipedItemId === item.id && touchDeltaX > 30
                          ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'
                          : ''
                    }`}
                  >
                    {swipedItemId === item.id && touchDeltaX < -30 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </div>
                    )}
                    {swipedItemId === item.id && touchDeltaX > 30 && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
                        <Plus className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {isSinhala ? (item.productNameSi || item.productName) : item.productName}
                        </p>
                        <div className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.unitPrice !== item.originalPrice && (
                            <span className="line-through text-[10px]">
                              Rs. {item.originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className={item.unitPrice !== item.originalPrice ? 'text-emerald-500 font-medium' : ''}>
                            Rs. {item.unitPrice.toLocaleString()}
                          </span>
                          <span>× {item.quantity}</span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-0.5 p-0.5 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, decrementQuantity(item.quantity, 0.01)); }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all active:scale-90 ${
                            isDark ? 'active:bg-slate-600 text-slate-300' : 'active:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-6 text-center font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, incrementQuantity(item.quantity)); }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all active:scale-90 ${
                            isDark ? 'active:bg-slate-600 text-slate-300' : 'active:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <p className={`w-16 text-right font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Rs. {item.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-800/98 backdrop-blur-xl border-t border-slate-700' : 'bg-white/98 backdrop-blur-xl border-t border-slate-200 shadow-2xl'}`}>
          <div className="flex justify-center pt-1.5 pb-0.5">
            <div className={`w-8 h-0.5 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
          </div>
          
          <div className="px-3 pb-2">
            <div className="grid grid-cols-2 gap-1.5">
              <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={() => { setPaymentMethod('cash'); playBeep('add'); }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  {t('invoice.cash')}
                </button>
                <button
                  onClick={() => { setPaymentMethod('credit'); playBeep('add'); }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-all ${
                    paymentMethod === 'credit'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('quickCheckout.credit')}
                </button>
              </div>
              
              <div className={`flex items-center gap-1.5 px-2 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                <Percent className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  ref={discountInputRef}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={computedSubtotal}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder={t('quickCheckout.discount')}
                  className={`flex-1 py-2 text-xs font-medium bg-transparent focus:outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                />
              </div>
              
              <div className={`flex items-center gap-1.5 px-2 rounded-lg border ${isDark ? 'border-slate-700 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
                <Banknote className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                <input
                  ref={receivedAmountInputRef}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={receivedAmount || ''}
                  onChange={(e) => setReceivedAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder={t('invoice.receivedAmount')}
                  className={`flex-1 py-2 text-xs font-medium bg-transparent focus:outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                />
                {receivedAmount > 0 && (
                  <span className={`text-xs font-bold ${changeAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    Δ {changeAmount.toLocaleString()}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isProcessing}
                className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                  items.length > 0
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('quickCheckout.checkoutAndPrint')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== DESKTOP LAYOUT (optimized) ====================
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <ShortcutMapOverlay
        isOpen={showShortcutMap}
        onClose={() => setShowShortcutMap(false)}
        currentStep={currentStep === 'products' ? 'products' : 'review'}
        currentMode={currentMode}
        isQuickCheckout={true}
        stepIndex={stepIndex}
        totalSteps={1}
      />

      {/* Compact toolbar - no top nav header, just a slim bar */}
      <div className={`sticky top-0 z-10 px-3 py-1.5 ${isDark ? 'bg-slate-800/95 backdrop-blur border-b border-slate-700/50' : 'bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/invoices')}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow shadow-amber-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('quickCheckout.title')}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${soundEnabled ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}
              title={soundEnabled ? t('quickCheckout.soundOn') : t('quickCheckout.soundOff')}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowShortcutMap(true)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} ${showShortcutMap ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-600'}`}
              title={t('quickCheckout.keyboardShortcuts')}
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={clearCart}
              disabled={items.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 disabled:opacity-30' : 'hover:bg-slate-100 disabled:opacity-30'} text-red-500`}
              title={t('quickCheckout.clearCart')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-3">
        <div className="flex gap-4 items-start">
          {/* ── LEFT + CENTRE: existing 12-col grid ── */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel - Main checkout area */}
          <div className="lg:col-span-9 space-y-2">
            {/* Condensed Search Bar */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              {pendingProduct && (
                <div className={`mb-2 p-2 rounded-lg flex items-center justify-between ${isDark ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div>
                      <p className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{isSinhala ? (pendingProduct.product.nameAlt || pendingProduct.displayName) : pendingProduct.displayName}</p>
                      <p className={`text-[10px] ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                        {t('quickCheckout.enterQuantityPrompt')} • Rs. {pendingProduct.retailPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPendingProduct(null); searchInputRef.current?.focus(); }}
                    className={`p-0.5 rounded-lg ${isDark ? 'hover:bg-amber-500/30 text-amber-400' : 'hover:bg-amber-200 text-amber-700'}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Barcode className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={t('quickCheckout.searchPlaceholder')}
                      value={productSearch}
                      onPaste={handlePaste}
                      onFocus={() => {
                        setIsCartFocused(false);
                        setSelectedCartIndex(-1);
                        setIsPaymentFocused(false);
                        setPriceEditBuffer('');
                        setIsPriceEditing(false);
                        setCurrentMode('search');
                      }}
                      onChange={(e) => {
                        const val = e.target.value;

                        // ── Barcode hot-scan: exact barcode match → stage in pendingProduct ──
                        if (handleBarcodeScanDispatch(val)) return;

                        // ── Scan multiplier pattern only (e.g. "3*CUT 4") ──
                        const parsed = parseScanInput(val);
                        if (parsed?.qty && parsed?.code) {
                          const match = flattenedProducts.find(
                            (fp) => fp.displayBarcode === parsed.code || fp.displaySku.toLowerCase() === parsed.code.toLowerCase()
                          );
                          if (match) {
                            addProductToCart(match, parsed.qty);
                            setProductSearch('');
                            setSelectedProductIndex(-1);
                            return;
                          }
                          // code portion only — preserve it including spaces
                          setProductSearch(parsed.code);
                          setSelectedProductIndex(-1);
                          return;
                        }

                        // ── Normal typing: pass raw value unchanged (spaces allowed) ──
                        setProductSearch(val);
                        setSelectedProductIndex(-1);
                      }}
                      className={`w-full pl-9 pr-8 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
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
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full ${isDark ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* ── ABSOLUTE FLOATING OVERLAY DROPDOWN ── */}
                  {(filteredProducts.length > 0 || (productSearch && filteredProducts.length === 0)) && (
                    <div className="absolute left-0 right-0 z-50 mt-1 w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-y-auto max-h-[65vh] custom-scrollbar">
                      {filteredProducts.length > 0 ? (
                        <div className="p-1">
                          {filteredProducts.map((flatProduct, index) => (
                            <button
                              key={flatProduct.flatId}
                              ref={(el) => {
                                if (el) productItemRefs.current.set(index, el);
                                else productItemRefs.current.delete(index);
                              }}
                              onClick={() => {
                                setPendingProduct(flatProduct);
                                setProductSearch('');
                                setSelectedProductIndex(-1);
                                setQuantity(1);
                                setIsQuantityFocused(true);
                                setCurrentMode('quantity');
                                setTimeout(() => {
                                  quantityInputRef.current?.focus();
                                  quantityInputRef.current?.select();
                                }, 50);
                                playBeep('add');
                                toast.info(`${flatProduct.displayName} - ${t('quickCheckout.enterQuantity')}`);
                              }}
                              className={`w-full flex items-center gap-2 p-2 text-left transition-colors border-b last:border-b-0 rounded-lg ${
                                index === selectedProductIndex
                                  ? isDark ? 'bg-amber-500/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                                  : isDark ? 'hover:bg-slate-700/50 border-slate-700' : 'hover:bg-white border-slate-200'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                                <Package className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {isSinhala ? (flatProduct.product.nameAlt || flatProduct.displayName) : flatProduct.displayName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {flatProduct.displaySku}
                                  </span>
                                  <span className={`text-[9px] px-1 py-0.5 rounded ${
                                    flatProduct.stock > 10 
                                      ? 'bg-emerald-500/10 text-emerald-500' 
                                      : flatProduct.stock > 0 
                                        ? 'bg-amber-500/10 text-amber-500' 
                                        : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {flatProduct.stock}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  Rs. {flatProduct.retailPrice.toLocaleString()}
                                </p>
                              </div>
                              <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <Package className={`w-8 h-8 mx-auto mb-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t('quickCheckout.noProductsFound')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* + Add Product button */}
                <button
                  onClick={() => setShowProductFormModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow shadow-amber-500/30`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('products.addProduct')}</span>
                </button>
                {/* Condensed Quantity Input */}
                <div className="flex items-center gap-1">
                  <label className={`text-[10px] font-medium mr-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Qty:</label>
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setQuantity(q => decrementQuantity(q, 0.01))}
                      className={`p-1 rounded ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <input
                      ref={quantityInputRef}
                      id="main-checkout-qty-input"
                      type="number"
                      min="0.01"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                      onFocus={() => {
                        setIsQuantityFocused(true);
                        setIsCartFocused(false);
                        setSelectedCartIndex(-1);
                        setIsPaymentFocused(false);
                        setPriceEditBuffer('');
                        setIsPriceEditing(false);
                        setCurrentMode('quantity');
                      }}
                      onBlur={() => setIsQuantityFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && pendingProduct) {
                          e.preventDefault();
                          addProductToCart(pendingProduct);
                          setPendingProduct(null);
                          setProductSearch('');
                          setQuantity(1);
                          setTimeout(() => {
                            searchInputRef.current?.focus();
                            searchInputRef.current?.select();
                          }, 30);
                        }
                      }}
                      className={`w-14 py-1.5 text-sm text-center font-bold border-2 rounded-lg focus:outline-none transition-all ${
                        pendingProduct
                          ? isDark 
                            ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/30' 
                            : 'border-amber-400 bg-amber-50 text-slate-900 ring-1 ring-amber-200'
                          : isDark
                            ? 'border-slate-600 bg-slate-700/50 text-white focus:border-amber-500'
                            : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                    <button
                      onClick={() => setQuantity(q => incrementQuantity(q))}
                      className={`p-1 rounded ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              
            </div>

            {/* Compact Cart Items - shows ~3 rows */}
            <div 
              ref={cartListRef}
              tabIndex={-1}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsCartFocused(false);
                  setSelectedCartIndex(-1);
                  setPriceEditBuffer('');
                  setIsPriceEditing(false);
                }
              }}
              className={`p-3 rounded-xl border outline-none overflow-x-hidden ${
                isCartFocused 
                  ? isDark ? 'bg-slate-800/50 border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-white border-amber-400 ring-1 ring-amber-200 shadow'
                  : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className={`font-bold flex items-center gap-1.5 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <ShoppingCart className="w-4 h-4" />
                  {t('quickCheckout.cartItems')} ({items.length})
                  {isCartFocused && (
                    <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                      ↑↓ → ← 0-9
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5">
                  <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>F4</kbd>
                  <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>F9</kbd>
                </div>
              </div>
              
              {isQuickAddMode && (
                <div className={`mb-2 p-2 rounded-lg border ${isDark ? 'bg-teal-500/10 border-teal-500/50 ring-1 ring-teal-500/20' : 'bg-teal-50 border-teal-400 ring-1 ring-teal-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Plus className={`w-3 h-3 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                      {t('quickCheckout.quickAddTitle')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input ref={quickAddNameRef} type="text" placeholder={t('quickCheckout.itemName')} value={quickAddName} onChange={(e) => setQuickAddName(e.target.value)} onFocus={() => { setIsCartFocused(false); setSelectedCartIndex(-1); setPriceEditBuffer(''); setIsPriceEditing(false); setQuickAddFocusField('name'); }} className={`flex-1 px-2 py-1.5 text-xs border rounded-lg focus:outline-none ${quickAddFocusField === 'name' ? isDark ? 'border-teal-500 bg-slate-700 text-white ring-1 ring-teal-500/30' : 'border-teal-500 bg-white text-slate-900 ring-1 ring-teal-200' : isDark ? 'border-slate-600 bg-slate-700/50 text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
                    <div className="w-16">
                      <input ref={quickAddPriceRef} type="number" min="0.01" step="any" placeholder={t('quickCheckout.price')} value={quickAddPrice || ''} onChange={(e) => setQuickAddPrice(Math.max(0, parseFloat(e.target.value) || 0))} onFocus={() => { setIsCartFocused(false); setSelectedCartIndex(-1); setPriceEditBuffer(''); setIsPriceEditing(false); setQuickAddFocusField('price'); }} className={`w-full px-2 py-1.5 text-xs text-right border rounded-lg focus:outline-none ${quickAddFocusField === 'price' ? isDark ? 'border-teal-500 bg-slate-700 text-white ring-1 ring-teal-500/30' : 'border-teal-500 bg-white text-slate-900 ring-1 ring-teal-200' : isDark ? 'border-slate-600 bg-slate-700/50 text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
                    </div>
                    <div className="w-14">
                      <input ref={quickAddQtyRef} type="number" min="0.01" step="any" placeholder={t('quickCheckout.qty')} value={quickAddQty || ''} onChange={(e) => setQuickAddQty(Math.max(0.01, parseFloat(e.target.value) || 0.01))} onFocus={() => { setIsCartFocused(false); setSelectedCartIndex(-1); setPriceEditBuffer(''); setIsPriceEditing(false); setQuickAddFocusField('qty'); }} className={`w-full px-2 py-1.5 text-xs text-center border rounded-lg focus:outline-none ${quickAddFocusField === 'qty' ? isDark ? 'border-teal-500 bg-slate-700 text-white ring-1 ring-teal-500/30' : 'border-teal-500 bg-white text-slate-900 ring-1 ring-teal-200' : isDark ? 'border-slate-600 bg-slate-700/50 text-white' : 'border-slate-200 bg-white text-slate-900'}`} />
                    </div>
                    <button onClick={addQuickAddItem} className={`px-2 py-1.5 rounded-lg text-xs font-medium ${quickAddName && quickAddPrice > 0 ? 'bg-teal-500 hover:bg-teal-600 text-white' : isDark ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              
              {items.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
                  <p className="text-sm">{t('quickCheckout.emptyCart')}</p>
                  <p className="text-xs mt-0.5">{t('quickCheckout.scanOrSearch')}</p>
                </div>
              ) : (
                <>
                {/* Cart table header — 12-column grid for strict vertical alignment */}
                <div className={`grid grid-cols-12 gap-x-2 px-2 py-1.5 mb-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500 bg-slate-800/50' : 'text-slate-500 bg-slate-100'}`}>
                  <div className="col-span-3">Product</div>
                  <div className="col-span-1 text-right">Cost</div>
                  <div className="col-span-1 text-right">Last</div>
                  <div className="col-span-1 text-right">Sales</div>
                  <div className="col-span-1 text-right">Display</div>
                  <div className="col-span-1 text-center">Stock</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>
                <div 
                  ref={cartItemsContainerRef}
                  className="space-y-0.5 h-[280px] overflow-y-auto"
                >
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (el) cartItemRefs.current.set(index, el);
                        else cartItemRefs.current.delete(index);
                      }}
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsCartFocused(true);
                        setSelectedCartIndex(index);
                        setSelectedProductIndex(-1);
                        setPendingProduct(null);
                        setCurrentMode('cart');
                        setPriceEditBuffer('');
                        setIsPriceEditing(false);
                        if (document.activeElement instanceof HTMLInputElement) {
                          document.activeElement.blur();
                        }
                        cartListRef.current?.focus();
                        playBeep('add');
                      }}
                      onFocus={() => {
                        setIsCartFocused(true);
                        setSelectedCartIndex(index);
                        setCurrentMode('cart');
                      }}
                      className={`grid grid-cols-12 gap-x-2 items-center px-2 py-2 rounded-lg transition-all cursor-pointer outline-none relative group ${
                        isCartFocused && index === selectedCartIndex
                          ? isDark 
                            ? 'bg-amber-500/20 shadow ring-1 ring-amber-500/50' 
                            : 'bg-amber-50 shadow ring-1 ring-amber-400/50'
                          : isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      {/* col 1-3: Product name */}
                      <div className="col-span-3 min-w-0">
                        <p className={`text-[11px] font-medium truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {isSinhala ? (item.productNameSi || item.productName) : item.productName}
                        </p>
                        {isPriceEditing && isCartFocused && index === selectedCartIndex && (
                          <p className={`text-[9px] font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            ✎ {priceEditBuffer || '…'}
                          </p>
                        )}
                      </div>
                      {/* col 4: Cost */}
                      <div className="col-span-1 text-right">
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {Number(item.cost || 0).toFixed(2)}
                        </span>
                      </div>
                      {/* col 5: Last Price */}
                      <div className="col-span-1 text-right">
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {Number(item.lastPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      {/* col 6: Sales Price (Sales) — inline editable override */}
                      <div className="col-span-1 text-right">
                        <input
                          type="number"
                          value={Number(item.salesPrice || item.ourPrice || 0)}
                          onChange={(e) => handleUpdateCartItemPrice(item.id, Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-full max-w-[80px] ml-auto px-1 py-0.5 text-[10px] font-semibold font-mono text-center rounded-lg border focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isDark 
                              ? 'bg-slate-800 border-slate-700 text-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30' 
                              : 'bg-white border-slate-200 text-amber-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-200'
                          }`}
                        />
                      </div>
                      {/* col 7: DISPLAY — displayPrice (reference price shown on receipt) */}
                      <div className="col-span-1 text-right">
                        <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                          {Number(item.displayPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      {/* col 8: Stock */}
                      <div className="col-span-1 text-center">
                        <span className={`text-[10px] font-mono ${
                          item.storeQty !== undefined && item.storeQty < 10
                            ? 'text-amber-500 font-bold animate-pulse'
                            : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {item.storeQty ?? '—'}
                        </span>
                      </div>
                      {/* col 9-10: Qty stepper */}
                      <div className="col-span-2 flex justify-center items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, decrementQuantity(item.quantity, 0.01)); }}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className={`w-6 text-center font-bold text-[10px] tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, incrementQuantity(item.quantity)); }}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${isDark ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      {/* col 11-12: Line total (salesPrice × qty) */}
                      <div className="col-span-2 text-right pr-4">
                        <span className={`text-[11px] font-bold font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {(Number(item.salesPrice || item.ourPrice || 0) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {/* Hover remove button */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                          className="p-0.5 rounded text-red-500 hover:bg-red-500/10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                </>
              )}
            </div>

            {/* ── FULL REFACTORED QUICK CATEGORIES CONTAINER ── */}
            <div className={`rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="p-3 pb-0">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-3 border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <h3 className={`text-xs font-bold tracking-wide uppercase ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Quick Categories
                    </h3>
                  </div>
                  
                  {/* Premium Toggle Mode Button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditingCategories(!isEditingCategories);
                      setIsAddDropdownOpen(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all duration-200 flex items-center gap-1 ${
                      isEditingCategories 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : isDark 
                          ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' 
                          : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {isEditingCategories ? "Done" : "Edit"}
                  </button>
                </div>
              </div>

              {/* FIXED MAX 3 ROWS CONTAINER WITH INDEPENDENT VIEWPORT SCROLL */}
              <div className={`px-3 pb-3 max-h-[305px] overflow-y-auto pr-2 ${isDark ? 'scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900' : 'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {quickCategories.map((category, index) => {
                    const categoryProducts = categoryProductMap.get(category) || [];
                    return (
                    <div 
                      key={category}
                      draggable={isEditingCategories}
                      onDragStart={(e) => {
                        if (!isEditingCategories) return;
                        setDraggedIndex(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        if (!isEditingCategories || draggedIndex === null) return;
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (!isEditingCategories || draggedIndex === null) return;
                        e.preventDefault();
                        const updated = [...quickCategories];
                        const [removed] = updated.splice(draggedIndex, 1);
                        updated.splice(index, 0, removed);
                        setQuickCategories(updated);
                        setDraggedIndex(null);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}

                      className={`relative group rounded-xl flex flex-col items-center justify-between text-center min-h-[85px] transition-all duration-200 ${
                        isEditingCategories 
                          ? 'border-2 border-dashed border-amber-500/30 bg-slate-950/60 cursor-grab active:cursor-grabbing hover:border-amber-500/60' 
                          : isDark
                            ? 'bg-slate-800/50 border border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/60 cursor-pointer active:scale-95'
                            : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer active:scale-95 shadow-sm'
                      } ${draggedIndex === index ? 'opacity-40 border-amber-500 bg-amber-500/5' : ''}`}
                      onClick={(e) => {
                        if (!isEditingCategories) {
                          if (categoryProducts.length > 0) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setCategoryPopoverAnchor(rect);
                            setActiveCategoryPopover(category);
                            setCategoryPopoverFilter('');
                            setTimeout(() => categoryPopoverInputRef.current?.focus(), 100);
                          } else {
                            toast.info(`${category} - ${t('quickCheckout.noProductsFound')}`);
                          }
                        }
                      }}
                    >
                      {/* Top Control Layer for Drag Handle / Badge indication */}
                      {isEditingCategories && (
                        <div className="absolute top-1 left-1 right-1 flex justify-between items-center w-[calc(100%-8px)] opacity-80 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-slate-600 font-bold select-none leading-none">⠿</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickCategories(quickCategories.filter(c => c !== category));
                              toast.success(`Removed "${category}" from grid`);
                            }}
                            className="w-4 h-4 rounded-md bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white flex items-center justify-center text-[9px] font-black transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Centralized Label Display Area */}
                      <div className="w-full flex flex-col items-center justify-center my-auto pt-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                          index % 2 === 0 ? 'from-cyan-500 to-blue-600' : 'from-amber-500 to-orange-500'
                        } flex items-center justify-center mb-1 shadow-lg`}>
                          <Package className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={`text-[10px] font-bold tracking-wide uppercase leading-tight line-clamp-2 px-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {category}
                        </span>
                      </div>

                      {/* Visual Dot Identity Base */}
                      {!isEditingCategories && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-glow mt-1 mb-0.5"></div>
                      )}
                    </div>
                    );
                  })}

                  {/* ── ADD ITEM CARD TRIGGER (Edit Mode only) ── */}
                  {isEditingCategories && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                        className={`w-full min-h-[85px] border-2 border-dashed border-slate-800 hover:border-emerald-500/40 bg-slate-950/20 hover:bg-emerald-950/5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group ${
                          isDark ? '' : 'bg-slate-50/50 border-slate-300 hover:border-emerald-400/40 hover:bg-emerald-50/30'
                        }`}
                      >
                        <span className="text-emerald-500 text-lg font-bold group-hover:scale-125 transition-transform">+</span>
                        <span className="text-[9px] font-bold text-slate-500 group-hover:text-emerald-400 uppercase tracking-wider">Add Box</span>
                      </button>

                      {/* ── CUSTOM FLOATING DARK DROPDOWN - ADD CATEGORY ── */}
                      {isAddDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAddDropdownOpen(false)} />
                          <div className={`absolute bottom-full left-0 mb-2 w-64 max-h-60 overflow-y-auto rounded-xl shadow-2xl p-2 z-50 animate-fade-in ${
                            isDark 
                              ? 'bg-slate-950 border border-slate-800' 
                              : 'bg-white border border-slate-200 shadow-lg'
                          }`}>
                            <div className={`px-2 py-1.5 text-[9px] font-black tracking-wider uppercase border-b mb-1 ${
                              isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-200'
                            }`}>
                              Select Category to Append
                            </div>
                            {allCategoryNames
                              .filter(c => !quickCategories.includes(c))
                              .map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    setQuickCategories([...quickCategories, cat]);
                                    setIsAddDropdownOpen(false);
                                    toast.success(`Added "${cat}" to grid`);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-2 ${
                                    isDark 
                                      ? 'text-slate-300 hover:text-white hover:bg-slate-900/60' 
                                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {cat}
                                </button>
                              ))}
                            {allCategoryNames.filter(c => !quickCategories.includes(c)).length === 0 && (
                              <div className="text-center py-4 text-xs text-slate-600 font-bold">
                                All items are already on layout grid!
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

                    {/* ── CATEGORY PRODUCT POPOVER ── */}
            {activeCategoryPopover && categoryPopoverAnchor && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setActiveCategoryPopover(null); setQuantityPromptProduct(null); setActiveCategoryItemIndex(0); }} />
                <div 
                  ref={categoryPopoverRef}
                  className="fixed z-50 rounded-xl border shadow-2xl overflow-hidden animate-fade-in"
                  style={{
                    top: Math.max(8, categoryPopoverAnchor.top - 360),
                    left: Math.max(8, Math.min(categoryPopoverAnchor.left, window.innerWidth - 360)),
                    width: 350,
                    maxHeight: 340,
                  }}
                >
                  {/* ── RESOLVED FILTERED PRODUCTS LIST ── */}
                  {(() => {
                    const catProducts = inventoryItems
                      .filter(inv => inv.productCategory === activeCategoryPopover)
                      .filter(item => {
                        if (!categoryPopoverFilter.trim()) return true;
                        const q = categoryPopoverFilter.toLowerCase();
                        return item.name.toLowerCase().includes(q) || 
                               (item.searchKey && item.searchKey.toLowerCase().includes(q));
                      });
                    const filteredCategoryProducts = catProducts;

                    // Auto-scroll effect when activeCategoryItemIndex changes
                    const scrollActiveIntoView = (idx: number) => {
                      setTimeout(() => {
                        const container = categoryListContainerRef.current;
                        if (!container) return;
                        const activeEl = container.querySelector(`[data-cat-index="${idx}"]`);
                        if (activeEl) {
                          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        }
                      }, 10);
                    };

                    return (
                      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border relative`}>
                        {/* Conditionally render quantity overlay OR the standard popover content */}
                        {quantityPromptProduct ? (
                          /* ── EMBEDDED QUANTITY PROMPT OVERLAY ── */
                          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 animate-fade-in">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
                              <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase block mb-1">අවශ්‍ය ප්‍රමාණය ඇතුළත් කරන්න</span>
                              <h3 className="text-xs font-black text-slate-200 mb-4 line-clamp-2">{quantityPromptProduct.name}</h3>
                              <input
                                type="number"
                                autoFocus
                                value={categoryPromptQty}
                                onChange={(e) => setCategoryPromptQty(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const finalQty = Math.max(1, parseInt(categoryPromptQty) || 1);
                                    // Build the FlattenedProduct shell and add to cart with custom qty
                                    const fp: FlattenedProduct = {
                                      flatId: quantityPromptProduct.id,
                                      product: { nameAlt: quantityPromptProduct.name, sku: quantityPromptProduct.searchKey, category: activeCategoryPopover } as any,
                                      displayName: quantityPromptProduct.name,
                                      displaySku: quantityPromptProduct.searchKey,
                                      retailPrice: Number(quantityPromptProduct.salesPrice),
                                      wholesalePrice: Number(quantityPromptProduct.displayPrice),
                                      costPrice: Number(quantityPromptProduct.cost),
                                      stock: Number(quantityPromptProduct.storeQty),
                                      hasDiscount: false,
                                    } as FlattenedProduct;
                                    addProductToCart(fp, finalQty);
                                    toast.success(`${quantityPromptProduct.name} × ${finalQty} ${t('quickCheckout.addedToCart')}`);
                                    // Reset all category popover states
                                    setQuantityPromptProduct(null);
                                    setActiveCategoryPopover(null);
                                    setCategoryPopoverFilter('');
                                    setActiveCategoryItemIndex(0);
                                    // Re-focus main search input
                                    setTimeout(() => searchInputRef.current?.focus(), 50);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setQuantityPromptProduct(null);
                                    // Re-focus the category search input
                                    setTimeout(() => categoryPopoverInputRef.current?.focus(), 50);
                                  }
                                }}
                                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-amber-500 rounded-xl p-3 text-center text-lg font-black text-white focus:outline-none tracking-widest mb-4"
                              />
                              <div className="text-[10px] font-bold text-slate-500">
                                Press <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">Enter</kbd> to Add • <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">Esc</kbd> to Cancel
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Popover Header */}
                            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center`}>
                                  <Package className="w-3 h-3 text-white" />
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {activeCategoryPopover}
                                </span>
                                <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {filteredCategoryProducts.length} items
                                </span>
                              </div>
                              <button 
                                onClick={() => { setActiveCategoryPopover(null); setActiveCategoryItemIndex(0); }}
                                className={`p-0.5 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Search Input with Full Keyboard Navigation */}
                            <div className={`px-3 py-1.5 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                              <div className="relative">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input
                                  ref={categoryPopoverInputRef}
                                  type="text"
                                  value={categoryPopoverFilter}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setCategoryPopoverFilter(e.target.value);
                                    setActiveCategoryItemIndex(0); // Reset index on every keystroke
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder={`Filter ${activeCategoryPopover} items...`}
                                  /* ── CRITICAL: Inner keydown interceptor for mouseless navigation ── */
                                  onKeyDown={(e) => {
                                    if (filteredCategoryProducts.length === 0) return;

                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setActiveCategoryItemIndex((prev) => 
                                        prev < filteredCategoryProducts.length - 1 ? prev + 1 : prev
                                      );
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setActiveCategoryItemIndex((prev) => (prev > 0 ? prev - 1 : 0));
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const targetedProduct = filteredCategoryProducts[activeCategoryItemIndex];
                                      if (targetedProduct) {
                                        // Build FlattenedProduct and stage as pendingProduct (matches main search selection flow)
                                        const fp: FlattenedProduct = {
                                          flatId: targetedProduct.id,
                                          product: { nameAlt: targetedProduct.name, sku: targetedProduct.searchKey, category: activeCategoryPopover } as any,
                                          displayName: targetedProduct.name,
                                          displaySku: targetedProduct.searchKey,
                                          retailPrice: Number(targetedProduct.salesPrice),
                                          wholesalePrice: Number(targetedProduct.displayPrice),
                                          costPrice: Number(targetedProduct.cost),
                                          stock: Number(targetedProduct.storeQty),
                                          hasDiscount: false,
                                        } as FlattenedProduct;
                                        setPendingProduct(fp);
                                        setProductSearch(targetedProduct.name);
                                        // Close the category popover cleanly
                                        setActiveCategoryPopover(null);
                                        setCategoryPopoverFilter('');
                                        setActiveCategoryItemIndex(0);
                                        setQuantity(1);
                                        setIsQuantityFocused(true);
                                        setCurrentMode('quantity');
                                        // Focus the top main qty input (id="main-checkout-qty-input") for instant quantity confirmation
                                        setTimeout(() => {
                                          quantityInputRef.current?.focus();
                                          quantityInputRef.current?.select();
                                        }, 50);
                                        playBeep('add');
                                        toast.info(`${targetedProduct.name} - ${t('quickCheckout.enterQuantity')}`);
                                      }
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setActiveCategoryPopover(null);
                                      setActiveCategoryItemIndex(0);
                                      setCategoryPopoverFilter('');
                                      searchInputRef.current?.focus();
                                    }
                                  }}
                                  className={`w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl p-3 pl-10 text-xs font-bold text-white focus:outline-none mb-0 ${
                                    isDark 
                                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                                      : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Product List with Visual Highlighting and Auto-Scroll */}
                            <div 
                              ref={categoryListContainerRef}
                              className="overflow-y-auto custom-scrollbar" 
                              style={{ maxHeight: 220 }}
                            >
                              {filteredCategoryProducts.length > 0 ? (
                                <div className="flex flex-col gap-0.5 p-1">
                                  {filteredCategoryProducts.map((item, idx) => {
                                    const isFocusedRow = idx === activeCategoryItemIndex;
                                    return (
                                      <div
                                        key={item.id}
                                        data-cat-index={idx}
                                        onClick={() => {
                                          setActiveCategoryItemIndex(idx);
                                          setQuantityPromptProduct(item);
                                          setCategoryPromptQty("1");
                                        }}
                                        className={`p-2.5 rounded-xl flex items-center gap-2 transition-all duration-150 cursor-pointer border-l-4 ${
                                          isFocusedRow 
                                            ? 'bg-slate-800 border-l-4 border-amber-500 shadow-lg translate-x-0.5 scale-[1.01] z-10' 
                                            : 'bg-slate-900/40 hover:bg-slate-900/80 border-l-4 border-transparent hover:border-slate-700'
                                        }`}
                                      >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          isFocusedRow 
                                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20' 
                                            : 'bg-slate-800'
                                        }`}>
                                          <Package className={`w-3.5 h-3.5 ${isFocusedRow ? 'text-white' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-[11px] font-semibold truncate ${isFocusedRow ? 'text-white' : 'text-slate-200'}`}>
                                            {item.name}
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[8px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                              {item.searchKey}
                                            </span>
                                            <span className={`text-[8px] px-1 py-0.5 rounded-full ${
                                              item.storeQty > 10 
                                                ? 'bg-emerald-500/10 text-emerald-500' 
                                                : item.storeQty > 0 
                                                  ? 'bg-amber-500/10 text-amber-500' 
                                                  : 'bg-red-500/10 text-red-500'
                                            }`}>
                                              {item.storeQty}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                                          <p className={`text-[11px] font-black ${isFocusedRow ? 'text-amber-400' : 'text-slate-300'}`}>
                                            Rs. {Number(item.salesPrice).toFixed(2)}
                                          </p>
                                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black transition-all ${
                                            isFocusedRow 
                                              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-110' 
                                              : 'bg-slate-800 text-slate-400'
                                          }`}>
                                            +
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className={`p-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-xs font-medium">No items found</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Checkout Summary */}
          <div className="lg:col-span-3 space-y-2">
            {/* Discount */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Percent className="w-3 h-3" />
                  {t('quickCheckout.discount')}
                </h3>
                <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>F6</kbd>
              </div>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rs.</span>
                <input ref={discountInputRef} type="number" min="0" max={computedSubtotal} value={discount || ''} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} onFocus={() => { setIsCartFocused(false); setSelectedCartIndex(-1); setIsPaymentFocused(false); setPriceEditBuffer(''); setIsPriceEditing(false); setCurrentMode('discount'); }} onBlur={() => setCurrentMode('search')} placeholder="0" className={`w-full pl-9 pr-3 py-2 text-sm text-right font-bold border-2 rounded-lg focus:outline-none transition-all ${isDark ? 'border-slate-600 bg-slate-700/50 text-white placeholder-slate-500 focus:border-amber-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-amber-500'}`} />
              </div>
            </div>

            {/* Received Amount */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Banknote className={`w-3 h-3 ${receivedAmount > 0 && receivedAmount >= computedFinalTotal ? 'text-emerald-500' : ''}`} />
                  {t('invoice.receivedAmount')}
                </h3>
                <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>F7</kbd>
              </div>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rs.</span>
                <input ref={receivedAmountInputRef} type="number" min="0" value={receivedAmount || ''} onChange={(e) => setReceivedAmount(Math.max(0, parseFloat(e.target.value) || 0))} onFocus={() => { setIsCartFocused(false); setSelectedCartIndex(-1); setIsPaymentFocused(false); setPriceEditBuffer(''); setIsPriceEditing(false); setCurrentMode('payment'); }} onBlur={() => setCurrentMode('search')} placeholder="0" className={`w-full pl-9 pr-3 py-2 text-sm text-right font-bold border-2 rounded-lg focus:outline-none transition-all ${isDark ? 'border-slate-600 bg-slate-700/50 text-white placeholder-slate-500 focus:border-emerald-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-500'}`} />
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {[{ label: 'Exact', value: computedFinalTotal, isExact: true }, { label: '+100', value: Math.ceil(computedFinalTotal / 100) * 100 }, { label: '+500', value: Math.ceil(computedFinalTotal / 500) * 500 }, { label: '+1K', value: Math.ceil(computedFinalTotal / 1000) * 1000 }].map((btn) => (
                  <button key={btn.label} onClick={() => { setReceivedAmount(btn.value); playBeep('add'); }} className={`px-1 py-1 rounded text-[9px] font-medium transition-all ${btn.isExact ? isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200' : isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>{btn.isExact ? '= ' + btn.value.toLocaleString() : btn.label}</button>
                ))}
              </div>
              {receivedAmount > 0 && (
                <div className={`mt-1.5 p-2 rounded-lg ${changeAmount >= 0 ? isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200' : isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-medium ${changeAmount >= 0 ? isDark ? 'text-emerald-400' : 'text-emerald-700' : isDark ? 'text-red-400' : 'text-red-700'}`}>{changeAmount >= 0 ? t('invoice.changeAmount') : t('invoice.balanceDue')}</span>
                    <span className={`text-sm font-bold font-mono ${changeAmount >= 0 ? isDark ? 'text-emerald-400' : 'text-emerald-600' : isDark ? 'text-red-400' : 'text-red-600'}`}>Rs. {Math.abs(changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className={`text-xs font-semibold mb-2.5 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Calculator className="w-3 h-3" />
                {t('quickCheckout.summary')}
              </h3>

              <div className="space-y-2 text-[11px]">
                {/* Total items */}
                <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{t('quickCheckout.itemCount')}</span>
                  <span className="font-medium tabular-nums">
                    {items.reduce((sum, i) => sum + i.quantity, 0)} {t('invoice.units')}
                  </span>
                </div>

                {/* Subtotal */}
                <div className={`flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>{t('invoice.subtotal')}</span>
                  <span className="font-mono tabular-nums">
                    Rs. {computedSubtotal.toFixed(2)}
                  </span>
                </div>

                {/* Manual discount — conditional */}
                {computedDiscount > 0 && (
                  <div className="flex justify-between items-center text-red-500">
                    <span>{t('quickCheckout.discount')}</span>
                    <span className="font-mono tabular-nums">- Rs. {computedDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* ඔබ ලැබූ ලාභය — always shown when savings > 0 */}
                {computedCustomerProfit > 0 && (
                  <div className={`flex justify-between items-center ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <span className="font-semibold">ඔබ ලැබූ ලාභය</span>
                    <span className="font-mono font-bold tabular-nums">
                      Rs. {computedCustomerProfit.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Grand total */}
                <div className={`pt-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t('invoice.totalAmount')}
                    </span>
                    <span className="text-base font-bold text-emerald-500 tabular-nums font-mono">
                      Rs. {computedFinalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button onClick={handleCheckout} disabled={items.length === 0 || isProcessing} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${items.length > 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30' : isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <Printer className="w-4 h-4" />
              {t('quickCheckout.checkoutAndPrint')}
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">F12</kbd>
            </button>            

            {/* Customer Selection — below Payment Method, above Shortcuts */}
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <User className="w-3 h-3" />
                  Customer Selection
                </h3>
                <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>F3</kbd>
              </div>
              <div className="relative">
                <div className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg transition-all cursor-pointer ${
                  isDark ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}>
                  <User className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => { setCustomerOpen(true); }}
                    placeholder="Search or select a customer..."
                    className={`flex-1 bg-transparent text-xs font-medium focus:outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                  />
                  {selectedCustomerId !== 'walk-in' && (
                    <button onClick={() => { setSelectedCustomerId('walk-in'); setCustomerSearch(''); setCustomerOpen(false); }}
                      className={`p-0.5 rounded ${isDark ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {customerOpen && (
                  <div className={`absolute left-0 bottom-full mb-1 w-full rounded-lg border shadow-2xl z-50 overflow-hidden backdrop-blur-md ${
                    isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-slate-200'
                  }`}>
                    <div className="max-h-32 overflow-y-auto">
                      <button onClick={() => { setSelectedCustomerId('walk-in'); setCustomerSearch(''); setCustomerOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedCustomerId === 'walk-in' ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
                        }`}>
                        <span className="flex items-center gap-2"><User className="w-3 h-3" />Walk-in Customer</span>
                      </button>
                      {filteredCustomers.map((c) => (
                        <button key={c.id} onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(c.name); setCustomerOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                            selectedCustomerId === c.id ? 'bg-orange-500/20 text-orange-400' : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
                          }`}>
                          <span className="flex items-center gap-2"><Building2 className="w-3 h-3" />{c.name}</span>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && customerSearch && (
                        <div className={`px-3 py-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No customers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedCustomerId !== 'walk-in' && selectedCustomerId && (() => {
                const c = mockCustomers.find(cu => cu.id === selectedCustomerId);
                return c ? (
                  <div className={`mt-1.5 p-1.5 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-slate-50'}`}>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.phone || 'No phone'}</p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Payment Method */}
            <div ref={paymentRef} tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsPaymentFocused(false); }} className={`p-3 rounded-xl border outline-none transition-all ${isPaymentFocused ? isDark ? 'bg-slate-800/50 border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-white border-blue-400 ring-1 ring-blue-200 shadow' : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <CreditCard className="w-3 h-3" />
                  {t('quickCheckout.paymentMethod')}
                </h3>
                <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>F5</kbd>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => { setPaymentMethod('cash'); playBeep('add'); }} className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all ${paymentMethod === 'cash' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow shadow-emerald-500/30' : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  <Banknote className="w-3.5 h-3.5" />
                  {t('invoice.cash')}
                </button>
                <button onClick={() => { setPaymentMethod('credit'); playBeep('add'); }} className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all ${paymentMethod === 'credit' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow shadow-blue-500/30' : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('quickCheckout.credit')}
                </button>
              </div>
            </div>

          </div>
        </div>
          </div>{/* end flex-1 inner grid wrapper */}

          {/* ── RECEIPT PREVIEW COLUMN — visible on xl+ ── */}
          <div className="hidden xl:block w-[320px] flex-shrink-0 sticky top-[52px] self-start max-h-[calc(100vh-68px)] overflow-y-auto">
            <ThermalReceiptPreview
              items={items}
              discount={computedDiscount}
              receivedAmount={receivedAmount}
              paymentMethod={paymentMethod}
              subtotal={computedSubtotal}
              total={computedFinalTotal}
              customer={
                selectedCustomerId !== 'walk-in'
                  ? (mockCustomers.find(c => c.id === selectedCustomerId) ?? null)
                  : null
              }
              invoiceNumber="PREVIEW"
              language={isSinhala ? 'si' : 'en'}
            />
          </div>
        </div>{/* end outer flex gap-4 */}
      </div>{/* end w-full px-6 py-3 */}

      {!isMobile && (
        <ShortcutHintsBar
          currentStep={currentStep === 'products' ? 'products' : 'review'}
          currentMode={currentMode}
          isQuickCheckout={true}
          onShowFullMap={() => setShowShortcutMap(true)}
        />
      )}

      {/* ── Unified Product Form Modal ── */}
      <ProductFormModal
        isOpen={showProductFormModal}
        onClose={() => setShowProductFormModal(false)}
        mode="create"
        initialData={null}
      />
    </div>
  );
};
