export type CustomerType = 'regular' | 'wholesale' | 'credit';

export interface Customer {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  phone2?: string;
  nic?: string; // National ID Card
  address: string;
  photo?: string;
  registrationDate: string;
  totalSpent: number;
  
  // Customer classification
  customerType: CustomerType;
  isActive: boolean;
  
  // Credit/Loan tracking
  loanBalance: number;
  loanDueDate?: string;
  creditLimit?: number;
}

// Brand/Company Management
export interface Brand {
  id: string;
  name: string;
  logo?: string;
  country: string;
  description?: string;
  isActive: boolean;
}

// Product Categories with subcategories
export interface Category {
  id: string;
  name: string;
  nameAlt?: string; // Sinhala name
  icon?: string;
  parentId?: string; // For subcategories
  description?: string;
}

// Size/Variant Options
export interface SizeOption {
  id: string;
  label: string; // e.g., "1/2 inch", "25mm", "50kg"
  value: string;
  unit: string;
}

// Product Variant (different sizes/colors of same product)
export interface ProductVariant {
  id: string;
  productId: string;
  size?: string;
  color?: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  minStock: number; // Reorder level
  maxStock?: number;
  isActive: boolean;
}

// Enhanced Product Interface
export interface Product {
  id: string;
  name: string;
  nameAlt?: string; // Sinhala name
  sku: string;
  barcode?: string;
  description: string;
  
  // Categorization
  categoryId?: string;
  category: 'building_materials' | 'steel_metal' | 'electrical' | 'plumbing' | 'tools' | 'paint' | 'hardware' | 'wood_timber' | 'safety' | 'other';
  subcategory?: string;
  brandId?: string;
  brand?: string;
  
  // Pricing (base prices - variants may override)
  price?: number;         // Legacy field for backward compatibility
  costPrice?: number;     // Purchase/cost price
  wholesalePrice?: number; // Bulk/dealer price
  retailPrice?: number;   // Selling price to customers
  
  // Stock Management
  stock: number;
  minStock?: number;      // Reorder level alert
  maxStock?: number;
  unit?: 'piece' | 'kg' | 'g' | 'meter' | 'feet' | 'liter' | 'bag' | 'box' | 'pack' | 'roll' | 'sheet' | 'pair' | 'set' | 'sqft' | 'sqm' | 'bundle' | 'cube';
  
  // Product Attributes
  sizes?: string[];       // Available sizes
  colors?: string[];      // Available colors
  weight?: number;        // Weight in kg
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'mm' | 'cm' | 'm' | 'inch' | 'feet';
  };
  
  // Variants
  hasVariants?: boolean;
  variants?: ProductVariant[];
  
  // Additional Info
  warranty?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  specifications?: Record<string, string>;
  tags?: string[];
  images?: string[];
  
  // Status
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  enableTax?: boolean;
  taxRate?: number;
  tax: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'credit';
  notes?: string;
}

// Supplier Management
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  brands?: string[];
  categories?: string[];
  paymentTerms?: string;
  isActive: boolean;
}

