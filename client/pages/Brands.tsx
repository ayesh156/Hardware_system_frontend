import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsMobile } from '../hooks/use-mobile';
import { mockBrands, mockProducts } from '../data/mockData';
import { Brand } from '../types/index';
import { BrandFormModal } from '../components/modals/BrandFormModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '../components/ui/searchable-select';
import { Pagination } from '../components/ui/data-table';
import { 
  Plus, Search, Edit2, Trash2, Building, Package,
  Grid3X3, List, MoreVertical, Globe, Check, X,
  Filter, SortAsc, SortDesc, Star, TrendingUp, UserCheck, UserX, RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Country flags (emoji)
const countryFlags: Record<string, string> = {
  'Sri Lanka': '🇱🇰',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'India': '🇮🇳',
  'Thailand': '🇹🇭',
  'Switzerland': '🇨🇭',
  'Netherlands': '🇳🇱',
  'China': '🇨🇳',
  'Taiwan': '🇹🇼',
  'South Korea': '🇰🇷',
  'UK': '🇬🇧',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
};

// Brand logo placeholder colors
const brandColors = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-purple-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-lime-500 to-green-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
];

export const Brands: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Get unique countries
  const countries = [...new Set(brands.map(b => b.country))].sort();

  // Get product count per brand
  const getProductCount = (brandName: string) => {
    return mockProducts.filter(p => p.brand === brandName).length;
  };

  // Filter and sort brands
  const filteredBrands = brands
    .filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        brand.country.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = countryFilter === 'all' || brand.country === countryFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && brand.isActive) ||
        (statusFilter === 'inactive' && !brand.isActive);
      return matchesSearch && matchesCountry && matchesStatus;
    })
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredBrands.length / pageSize);
  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBrands.slice(startIndex, startIndex + pageSize);
  }, [filteredBrands, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, countryFilter, statusFilter, sortOrder]);

  // Stats
  const totalBrands = brands.length;
  const activeBrands = brands.filter(b => b.isActive).length;
  const localBrands = brands.filter(b => b.country === 'Sri Lanka').length;
  const internationalBrands = brands.filter(b => b.country !== 'Sri Lanka').length;

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setIsFormModalOpen(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsFormModalOpen(true);
  };

  const handleDeleteBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteModalOpen(true);
  };

  const handleToggleStatus = (brand: Brand) => {
    setBrands(prev => prev.map(b => 
      b.id === brand.id ? { ...b, isActive: !b.isActive } : b
    ));
  };

  const handleSaveBrand = (brandData: Partial<Brand>) => {
    if (selectedBrand) {
      // Update existing
      setBrands(prev => prev.map(b => 
        b.id === selectedBrand.id ? { ...b, ...brandData } : b
      ));
    } else {
      // Add new
      const newBrand: Brand = {
        id: `brand-${String(brands.length + 1).padStart(3, '0')}`,
        name: brandData.name || '',
        country: brandData.country || 'Sri Lanka',
        description: brandData.description,
        logo: brandData.logo,
        isActive: brandData.isActive ?? true,
      };
      setBrands(prev => [...prev, newBrand]);
    }
    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedBrand) {
      setBrands(prev => prev.filter(b => b.id !== selectedBrand.id));
    }
    setIsDeleteModalOpen(false);
    setSelectedBrand(null);
  };

  const getColorIndex = (index: number) => index % brandColors.length;

  const getBrandInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Brands
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage your product brands and manufacturers
          </p>
        </div>
        <Button 
          onClick={handleAddBrand}
          className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Brand
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Building className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Total Brands</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {totalBrands}
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
              <Check className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Active Brands</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {activeBrands}
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
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Local Brands</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {localBrands}
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
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>International</p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {internationalBrands}
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
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchableSelect
                value={countryFilter}
                onValueChange={setCountryFilter}
                placeholder="All Countries"
                searchPlaceholder={t('common.search')}
                emptyMessage="No countries found"
                theme={theme}
                options={[
                  { value: 'all', label: 'All Countries', count: brands.length, icon: <Globe className="w-4 h-4" /> },
                  ...countries.map(country => ({
                    value: country,
                    label: country,
                    count: brands.filter(b => b.country === country).length,
                    icon: <span className="text-base">{countryFlags[country] || '🌍'}</span>
                  }))
                ]}
              />
            </div>

            <div className="w-full sm:w-40">
              <SearchableSelect
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
                placeholder={t('filters.allStatus')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('filters.noOptions')}
                theme={theme}
                options={[
                  { value: 'all', label: t('filters.allStatus'), count: brands.length, icon: <Filter className="w-4 h-4" /> },
                  { value: 'active', label: t('common.active'), count: activeBrands, icon: <UserCheck className="w-4 h-4 text-green-500" /> },
                  { value: 'inactive', label: t('common.inactive'), count: brands.length - activeBrands, icon: <UserX className="w-4 h-4 text-red-500" /> },
                ]}
              />
            </div>

            {/* Clear Filters */}
            {(countryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => { setCountryFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('filters.clear')}
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

      {/* Brands Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedBrands.map((brand, index) => (
            <div
              key={brand.id}
              className={`group p-4 rounded-xl border transition-all hover:shadow-lg ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              } ${!brand.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${brandColors[getColorIndex(index)]} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-lg">
                    {getBrandInitials(brand.name)}
                  </span>
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
                    <DropdownMenuItem onClick={() => handleEditBrand(brand)}>
                      <Edit2 className="w-4 h-4 mr-2" /> {t('tableHeaders.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(brand)}>
                      {brand.isActive ? (
                        <><X className="w-4 h-4 mr-2" /> {t('tableHeaders.deactivate')}</>
                      ) : (
                        <><Check className="w-4 h-4 mr-2" /> {t('tableHeaders.activate')}</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={theme === 'dark' ? 'bg-slate-700' : ''} />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteBrand(brand)}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> {t('tableHeaders.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {brand.name}
                  </h3>
                  {brand.isActive ? (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                      {t('common.active')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 border-slate-500/30 bg-slate-500/10 text-[10px]">
                      {t('common.inactive')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-base">{countryFlags[brand.country] || '🌍'}</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {brand.country}
                  </span>
                </div>

                {brand.description && (
                  <p className={`text-xs line-clamp-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                    {brand.description}
                  </p>
                )}
              </div>

              <div className={`flex items-center justify-between mt-4 pt-3 border-t ${
                theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Package className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                  <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {getProductCount(brand.name)} {t('tableHeaders.products').toLowerCase()}
                  </span>
                </div>
                <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {brand.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className={theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'}>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.brand')}</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.country')}</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.description')}</th>
                <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.products')}</th>
                <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.status')}</th>
                <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
              {paginatedBrands.map((brand, index) => (
                <tr 
                  key={brand.id}
                  className={`transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
                  } ${!brand.isActive ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${brandColors[getColorIndex(index)]} flex items-center justify-center`}>
                        <span className="text-white font-semibold text-sm">
                          {getBrandInitials(brand.name)}
                        </span>
                      </div>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {brand.name}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <div className="flex items-center gap-1.5">
                      <span>{countryFlags[brand.country] || '🌍'}</span>
                      <span>{brand.country}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="line-clamp-1">{brand.description || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Package className="w-3 h-3" />
                      {getProductCount(brand.name)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(brand)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        brand.isActive
                          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                      }`}
                    >
                      {brand.isActive ? (
                        <><Check className="w-3 h-3" /> Active</>
                      ) : (
                        <><X className="w-3 h-3" /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditBrand(brand)}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand)}
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
      {filteredBrands.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredBrands.length}
          pageSize={pageSize}
          theme={theme}
        />
      )}

      {/* Empty State */}
      {filteredBrands.length === 0 && (
        <div className={`text-center py-12 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          <Building className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            No brands found
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {searchQuery || countryFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Get started by adding your first brand'}
          </p>
          {!searchQuery && countryFilter === 'all' && statusFilter === 'all' && (
            <Button 
              onClick={handleAddBrand}
              className="mt-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Brand
            </Button>
          )}
        </div>
      )}

      {/* Brand Form Modal */}
      <BrandFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveBrand}
        brand={selectedBrand}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Brand"
        message={`Are you sure you want to delete "${selectedBrand?.name}"? This action cannot be undone and may affect products from this brand.`}
      />
    </div>
  );
};
