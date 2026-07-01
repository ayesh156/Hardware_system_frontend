import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Category } from '../types/index';
import { InventoryProduct } from '../types/index';
import { mockCategories, inventoryItems as initialInventory, linkedCatalogItems, searchInventory } from '../data/mockData';
import { CatalogItem } from '../data/mockData';

interface CatalogState {
  categories: Category[];
  inventoryItems: InventoryProduct[];
  catalogItems: CatalogItem[];
}

interface CatalogContextValue extends CatalogState {
  addCategory: (category: Partial<Category>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addInventoryItem: (item: InventoryProduct) => void;
  searchByQuery: (query: string) => CatalogItem[];
  getCategoryName: (id: string) => string;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const useCatalog = (): CatalogContextValue => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
};

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => mockCategories);
  const [inventoryItems, setInventoryItems] = useState<InventoryProduct[]>(() => initialInventory);

  // Add category with auto-ID
  const addCategory = useCallback((data: Partial<Category>): Category => {
    const newCat: Category = {
      id: `cat-${String(Date.now()).slice(-6)}`,
      name: data.name || '',
      nameAlt: data.nameAlt,
      icon: data.icon,
      description: data.description,
      usageCount: 0,
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback((id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const addInventoryItem = useCallback((item: InventoryProduct) => {
    setInventoryItems(prev => [item, ...prev]);
  }, []);

  const searchByQuery = useCallback((query: string): CatalogItem[] => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    return linkedCatalogItems.filter(item =>
      item.sku.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.includes(q))
    );
  }, []);

  const getCategoryName = useCallback((id: string): string => {
    return categories.find(c => c.id === id)?.name || id;
  }, [categories]);

  const value = useMemo(() => ({
    categories,
    inventoryItems,
    catalogItems: linkedCatalogItems,
    addCategory,
    updateCategory,
    deleteCategory,
    addInventoryItem,
    searchByQuery,
    getCategoryName,
  }), [categories, inventoryItems, addCategory, updateCategory, deleteCategory, addInventoryItem, searchByQuery, getCategoryName]);

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};