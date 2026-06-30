import React, { useState, useRef, useEffect } from 'react';
import { posCategories, PosCategory, PosItem } from '../data/posCategories';
import { useTheme } from '../contexts/ThemeContext';
import { Search, Package, Plus } from 'lucide-react';

interface CategoryGridProps {
  onItemSelect: (item: PosItem, category: PosCategory) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onItemSelect }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<PosCategory | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (cat: PosCategory, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchorRect(rect);
    setActiveCategory(cat);
    setSearchFilter('');
  };

  const closeCombo = () => {
    setActiveCategory(null);
    setSearchFilter('');
    setAnchorRect(null);
  };

  // Auto-focus search when popover opens
  useEffect(() => {
    if (activeCategory && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 80);
    }
  }, [activeCategory]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.category-grid-btn')) {
          closeCombo();
        }
      }
    };
    if (activeCategory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeCategory]);

  const filteredItems = activeCategory
    ? activeCategory.items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (item.nameSi && item.nameSi.includes(searchFilter))
      )
    : [];

  const handleItemSelect = (item: PosItem) => {
    if (activeCategory) {
      onItemSelect(item, activeCategory);
      closeCombo();
    }
  };

  // Popover opens UPWARD (bottom-to-top) from the category box
  const POPOVER_HEIGHT_EST = 320; // estimated max height
  const popoverTop = anchorRect
    ? Math.max(8, anchorRect.top + window.scrollY - POPOVER_HEIGHT_EST)
    : 0;
  const popoverLeft = anchorRect ? anchorRect.left + window.scrollX : 0;
  const popoverWidth = Math.min(360, window.innerWidth - 16);
  const adjustedLeft = anchorRect
    ? Math.max(8, Math.min(popoverLeft, window.innerWidth - popoverWidth - 8))
    : 0;

  return (
    <div className="relative">
      {/* Category Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
        {posCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={(e) => handleCategoryClick(cat, e)}
            className={`category-grid-btn group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
              isDark
                ? 'bg-slate-800/60 border-slate-700/60 hover:border-orange-500/50 hover:bg-slate-700/60'
                : 'bg-white border-slate-200 hover:border-orange-400/50 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mb-1 shadow-lg`}>
              <span className="text-sm">{cat.icon}</span>
            </div>
            <span className={`text-[10px] font-semibold text-center leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Contextual Drop-Up Popover (opens upward from category box) */}
      {activeCategory && anchorRect && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={closeCombo} />

          {/* Popover anchored ABOVE the category box (drop-up) */}
          <div
            ref={popoverRef}
            className={`fixed z-50 rounded-xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
            style={{
              top: popoverTop,
              left: adjustedLeft,
              width: popoverWidth,
              maxHeight: Math.min(320, anchorRect.top - 16),
            }}
          >
            {/* Compact Header */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${activeCategory.color} flex items-center justify-center`}>
                  <span className="text-xs">{activeCategory.icon}</span>
                </div>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeCategory.name}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {activeCategory.items.length}
                </span>
              </div>
              <button
                onClick={closeCombo}
                className={`p-0.5 rounded transition-colors ${
                  isDark ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Inline search */}
            <div className={`px-3 py-1.5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${
                isDark
                  ? 'bg-slate-800 border-slate-600 focus-within:border-orange-500/50'
                  : 'bg-slate-50 border-slate-200 focus-within:border-orange-400'
              }`}>
                <Search className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter items..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={`flex-1 bg-transparent text-xs outline-none ${
                    isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Items list */}
            <div className="overflow-y-auto" style={{ maxHeight: Math.min(240, anchorRect.top - 80) }}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors border-b last:border-b-0 ${
                      isDark
                        ? 'hover:bg-slate-800/80 border-slate-700/20'
                        : 'hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <Package className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.sku}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                          item.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : item.stock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>{item.stock}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Rs.{item.unitRate.toLocaleString()}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'}`}>
                      <Plus className={`w-3 h-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    </div>
                  </button>
                ))
              ) : (
                <div className={`p-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <p className="text-xs">No items match "{searchFilter}"</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};