// Financial data for hardware store in Sri Lanka
export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit';
}

export interface FinancialSummary {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

// Mock financial transactions
export const mockFinancialTransactions: FinancialTransaction[] = [
  // December 2024 - Revenue
  { id: 'ft1', date: '2024-12-01', type: 'revenue', category: 'Paint Sales', description: 'Nippon Paint - 5L Emulsion', amount: 45000, paymentMethod: 'card' },
  { id: 'ft2', date: '2024-12-01', type: 'revenue', category: 'Tools Sales', description: 'Power Drill Set', amount: 28000, paymentMethod: 'cash' },
  { id: 'ft3', date: '2024-12-02', type: 'revenue', category: 'Cement Sales', description: 'Holcim Cement - 50kg x 20', amount: 72000, paymentMethod: 'bank_transfer' },
  { id: 'ft4', date: '2024-12-02', type: 'revenue', category: 'Electrical', description: 'LED Bulbs Wholesale', amount: 35000, paymentMethod: 'credit' },
  { id: 'ft5', date: '2024-12-03', type: 'revenue', category: 'Plumbing', description: 'PVC Pipes & Fittings', amount: 52000, paymentMethod: 'cash' },
  { id: 'ft6', date: '2024-12-03', type: 'revenue', category: 'Hardware', description: 'Nails, Screws, Bolts Bulk', amount: 18500, paymentMethod: 'card' },
  { id: 'ft7', date: '2024-12-04', type: 'revenue', category: 'Paint Sales', description: 'Asian Paints - Weather Shield', amount: 68000, paymentMethod: 'bank_transfer' },
  { id: 'ft8', date: '2024-12-04', type: 'revenue', category: 'Safety Equipment', description: 'Safety Helmets & Gloves', amount: 24000, paymentMethod: 'cash' },
  { id: 'ft9', date: '2024-12-05', type: 'revenue', category: 'Tools Sales', description: 'Hand Tools Assortment', amount: 42000, paymentMethod: 'card' },
  { id: 'ft10', date: '2024-12-05', type: 'revenue', category: 'Cement Sales', description: 'Tokyo Cement - 50kg x 15', amount: 54000, paymentMethod: 'credit' },
  { id: 'ft11', date: '2024-12-06', type: 'revenue', category: 'Electrical', description: 'Switches & Sockets', amount: 38000, paymentMethod: 'cash' },
  { id: 'ft12', date: '2024-12-06', type: 'revenue', category: 'Paint Sales', description: 'Decorative Wall Paints', amount: 56000, paymentMethod: 'bank_transfer' },
  { id: 'ft13', date: '2024-12-07', type: 'revenue', category: 'Plumbing', description: 'Water Tanks & Fittings', amount: 125000, paymentMethod: 'bank_transfer' },
  { id: 'ft14', date: '2024-12-08', type: 'revenue', category: 'Hardware', description: 'Door Locks & Hinges', amount: 32000, paymentMethod: 'card' },
  { id: 'ft15', date: '2024-12-09', type: 'revenue', category: 'Tools Sales', description: 'Electric Grinder', amount: 45000, paymentMethod: 'cash' },
  { id: 'ft16', date: '2024-12-10', type: 'revenue', category: 'Cement Sales', description: 'Holcim Cement Bulk Order', amount: 180000, paymentMethod: 'bank_transfer' },
  { id: 'ft17', date: '2024-12-11', type: 'revenue', category: 'Paint Sales', description: 'Berger Paints - Wood Finish', amount: 62000, paymentMethod: 'credit' },
  { id: 'ft18', date: '2024-12-12', type: 'revenue', category: 'Electrical', description: 'Wiring & Cables', amount: 48000, paymentMethod: 'cash' },
  { id: 'ft19', date: '2024-12-13', type: 'revenue', category: 'Plumbing', description: 'Sanitary Ware', amount: 95000, paymentMethod: 'card' },
  { id: 'ft20', date: '2024-12-14', type: 'revenue', category: 'Tools Sales', description: 'Saw Set & Hammer', amount: 28500, paymentMethod: 'cash' },
  
  // December 2024 - Expenses
  { id: 'ft21', date: '2024-12-01', type: 'expense', category: 'Inventory Purchase', description: 'Paint Stock Replenishment', amount: 125000, paymentMethod: 'bank_transfer' },
  { id: 'ft22', date: '2024-12-01', type: 'expense', category: 'Utilities', description: 'Electricity Bill - Nov', amount: 18500, paymentMethod: 'cash' },
  { id: 'ft23', date: '2024-12-02', type: 'expense', category: 'Salaries', description: 'Staff Salaries - December', amount: 250000, paymentMethod: 'bank_transfer' },
  { id: 'ft24', date: '2024-12-03', type: 'expense', category: 'Transportation', description: 'Delivery Vehicle Fuel', amount: 25000, paymentMethod: 'card' },
  { id: 'ft25', date: '2024-12-04', type: 'expense', category: 'Inventory Purchase', description: 'Cement Stock from Holcim', amount: 180000, paymentMethod: 'bank_transfer' },
  { id: 'ft26', date: '2024-12-05', type: 'expense', category: 'Maintenance', description: 'Shop Repairs & Painting', amount: 45000, paymentMethod: 'cash' },
  { id: 'ft27', date: '2024-12-06', type: 'expense', category: 'Inventory Purchase', description: 'Electrical Goods Stock', amount: 95000, paymentMethod: 'bank_transfer' },
  { id: 'ft28', date: '2024-12-07', type: 'expense', category: 'Marketing', description: 'Facebook Ads & Banners', amount: 12000, paymentMethod: 'card' },
  { id: 'ft29', date: '2024-12-08', type: 'expense', category: 'Utilities', description: 'Water & Internet Bills', amount: 8500, paymentMethod: 'cash' },
  { id: 'ft30', date: '2024-12-09', type: 'expense', category: 'Inventory Purchase', description: 'Plumbing Supplies', amount: 110000, paymentMethod: 'bank_transfer' },
  { id: 'ft31', date: '2024-12-10', type: 'expense', category: 'Transportation', description: 'Delivery Vehicle Maintenance', amount: 35000, paymentMethod: 'card' },
  { id: 'ft32', date: '2024-12-11', type: 'expense', category: 'Insurance', description: 'Shop Insurance Premium', amount: 28000, paymentMethod: 'bank_transfer' },
  { id: 'ft33', date: '2024-12-12', type: 'expense', category: 'Inventory Purchase', description: 'Tools & Hardware Stock', amount: 88000, paymentMethod: 'bank_transfer' },
  { id: 'ft34', date: '2024-12-13', type: 'expense', category: 'Professional Fees', description: 'Accountant Service Fee', amount: 15000, paymentMethod: 'cash' },
  { id: 'ft35', date: '2024-12-14', type: 'expense', category: 'Utilities', description: 'Telephone & Mobile Bills', amount: 6500, paymentMethod: 'card' },
];

// Calculate financial summaries by period
export const calculateFinancialSummary = (
  transactions: FinancialTransaction[],
  startDate: Date,
  endDate: Date
): FinancialSummary => {
  const filtered = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  const revenue = filtered
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    revenue,
    expenses,
    profit,
    profitMargin
  };
};

// Expense categories for Sri Lankan hardware store
export const expenseCategories = [
  { name: 'Inventory Purchase', color: '#3b82f6', icon: '📦' },
  { name: 'Salaries', color: '#8b5cf6', icon: '👥' },
  { name: 'Utilities', color: '#f59e0b', icon: '⚡' },
  { name: 'Transportation', color: '#10b981', icon: '🚚' },
  { name: 'Maintenance', color: '#ef4444', icon: '🔧' },
  { name: 'Marketing', color: '#ec4899', icon: '📢' },
  { name: 'Insurance', color: '#06b6d4', icon: '🛡️' },
  { name: 'Professional Fees', color: '#6366f1', icon: '💼' }
];

// Revenue categories
export const revenueCategories = [
  { name: 'Paint Sales', color: '#8b5cf6', icon: '🎨' },
  { name: 'Cement Sales', color: '#64748b', icon: '🏗️' },
  { name: 'Tools Sales', color: '#f59e0b', icon: '🔨' },
  { name: 'Electrical', color: '#f59e0b', icon: '💡' },
  { name: 'Plumbing', color: '#06b6d4', icon: '🚰' },
  { name: 'Hardware', color: '#3b82f6', icon: '🔩' },
  { name: 'Safety Equipment', color: '#10b981', icon: '🦺' }
];
