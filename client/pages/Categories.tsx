import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../hooks/use-mobile';
import { mockCategories, mockProducts } from '../data/mockData';
import { Category } from '../types/index';
import { CategoryFormModal } from '../components/modals/CategoryFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '../components/ui/searchable-select';
import { Pagination } from '../components/ui/data-table';
import { 
  Plus, Search, Edit2, Trash2, FolderTree, Package,
  Grid3X3, List, MoreVertical, Building2, Layers,
  ChevronRight, Tag, Filter, SortAsc, SortDesc, RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'cat-001': <Building2 className="w-5 h-5" />,
  'cat-002': <Layers className="w-5 h-5" />,
  'cat-003': <Package className="w-5 h-5" />,
  'cat-004': <Package className="w-5 h-5" />,
  'cat-005': <Package className="w-5 h-5" />,
  'cat-006': <Package className="w-5 h-5" />,
  'cat-007': <Package className="w-5 h-5" />,
  'cat-008': <Package className="w-5 h-5" />,
  'cat-009': <Package className="w-5 h-5" />,
  'cat-010': <Package className="w-5 h-5" />,
};

// Category colors for visual distinction
const categoryColors = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-violet-500',
  'from-lime-500 to-green-500',
  'from-yellow-500 to-amber-500',
  'from-cyan-500 to-blue-500',
  'from-pink-500 to-rose-500',
];

export const Categories: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'main' | 'sub'>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Get main categories for parent filter
  const mainCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);

  // Get product count per category
  const getProductCount = (categoryId: string) => {
    return mockProducts.filter(p => p.categoryId === categoryId).length;
  };

  // Check if category has active filters
  const hasActiveFilters = typeFilter !== 'all' || parentFilter !== 'all' || searchQuery;

  // Filter and sort categories
  const filteredCategories = categories
    .filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.nameAlt && cat.nameAlt.includes(searchQuery)) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'main' && !cat.parentId) ||
        (typeFilter === 'sub' && cat.parentId);
      
      const matchesParent = parentFilter === 'all' || cat.parentId === parentFilter;
      
      return matchesSearch && matchesType && matchesParent;
    })
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCategories.slice(startIndex, startIndex + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, parentFilter, sortOrder]);

  // Stats
  const totalCategories = categories.length;
  const categoriesWithProducts = categories.filter(cat => cat.description).length; // Placeholder logic

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsFormModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsFormModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCategory = (categoryData: Partial<Category>) => {
    if (selectedCategory) {
      // Update existing
      setCategories(prev => prev.map(cat => 
        cat.id === selectedCategory.id ? { ...cat, ...categoryData } : cat
      ));
    } else {
      // Add new
      const newCategory: Category = {
        id: `cat-${String(categories.length + 1).padStart(3, '0')}`,
        name: categoryData.name || '',
        nameAlt: categoryData.nameAlt,
        icon: categoryData.icon,
        description: categoryData.description,
        parentId: categoryData.parentId,
      };
      setCategories(prev => [...prev, newCategory]);
    }
    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      setCategories(prev => prev.filter(cat => cat.id !== selectedCategory.id));
    }
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  const getColorIndex = (index: number) => index % categoryColors.length;

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Categories
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage your product categories and subcategories
          </p>
        </div>
        <Button 
          onClick={handleAddCategory}
          className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <FolderTree className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Total Categories</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {totalCategories}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>With Products</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {categoriesWithProducts}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Layers className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Main Categories</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {categories.filter(c => !c.parentId).length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Tag className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Sub Categories</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {categories.filter(c => c.parentId).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={`p-4 rounded-xl border ${
        theme === 'dark' 
          ? 'bg-slate-800/50 border-slate-700/50' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="w-full sm:w-44">
              <SearchableSelect
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as 'all' | 'main' | 'sub')}
                placeholder="All Types"
                searchPlaceholder={t('common.search')}
                emptyMessage="No options found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Types', count: totalCategories, icon: <FolderTree className="w-4 h-4" /> },
                  { value: 'main', label: 'Main Categories', count: mainCategories.length, icon: <Layers className="w-4 h-4 text-blue-500" /> },
                  { value: 'sub', label: 'Sub Categories', count: totalCategories - mainCategories.length, icon: <Tag className="w-4 h-4 text-purple-500" /> },
                ]}
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchableSelect
                value={parentFilter}
                onValueChange={setParentFilter}
                placeholder="All Parents"
                searchPlaceholder={t('common.search')}
                emptyMessage="No categories found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Parents', icon: <FolderTree className="w-4 h-4" /> },
                  ...mainCategories.map(cat => ({
                    value: cat.id,
                    label: cat.name,
                    count: categories.filter(c => c.parentId === cat.id).length,
                    icon: <Layers className="w-4 h-4" />
                  }))
                ]}
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={() => { setTypeFilter('all'); setParentFilter('all'); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : ''}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>

            <div className={`flex items-center rounded-lg border p-1 ${
              theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-orange-500 text-white' 
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-orange-500 text-white' 
                    : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedCategories.map((category, index) => (
            <div
              key={category.id}
              className={`group p-4 rounded-xl border transition-all hover:shadow-lg ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryColors[getColorIndex(index)]} shadow-lg`}>
                  {categoryIcons[category.id] || <FolderTree className="w-5 h-5 text-white" />}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                      theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    }`}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                    <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                      <Edit2 className="w-4 h-4 mr-2" /> {t('tableHeaders.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> {t('tableHeaders.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Parent Category Badge for Subcategories */}
              {category.parentId && (
                <div className="mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    theme === 'dark' 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    <Layers className="w-3 h-3" />
                    {categories.find(c => c.id === category.parentId)?.name || 'Unknown'}
                  </span>
                </div>
              )}

              <h3 className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {category.name}
              </h3>
              {category.nameAlt && (
                <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {category.nameAlt}
                </p>
              )}
              {category.description && (
                <p className={`text-xs line-clamp-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                  {category.description}
                </p>
              )}

              <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
                theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'
              }`}>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  ID: {category.id}
                </span>
                <ChevronRight className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className={theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.category')}</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.sinhalaName')}</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.parentCategory')}</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.description')}</th>
                <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
              {paginatedCategories.map((category, index) => (
                <tr 
                  key={category.id}
                  className={`transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[getColorIndex(index)]}`}>
                        {categoryIcons[category.id] || <FolderTree className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {category.nameAlt || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {category.parentId ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' 
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        <Layers className="w-3 h-3" />
                        {categories.find(c => c.id === category.parentId)?.name || 'Unknown'}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        <FolderTree className="w-3 h-3" />
                        Main Category
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="line-clamp-1">{category.description || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-600 hover:text-red-500'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredCategories.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCategories.length}
          pageSize={pageSize}
          theme={theme}
        />
      )}

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className={`text-center py-12 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <FolderTree className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            No categories found
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {searchQuery ? 'Try adjusting your search query' : 'Get started by adding your first category'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={handleAddCategory}
              className="mt-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone and may affect products in this category.`}
      />
    </div>
  );
};
