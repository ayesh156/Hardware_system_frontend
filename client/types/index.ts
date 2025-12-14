export interface Customer {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  registrationDate: string;
  totalSpent: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: 'hardware' | 'electrical' | 'tools' | 'other';
  price: number;
  stock: number;
  description: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  notes?: string;
}
