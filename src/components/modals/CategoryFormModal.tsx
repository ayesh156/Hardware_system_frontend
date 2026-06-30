import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Category } from '../../types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '../ui/searchable-select';
import { 
  FolderTree, Tag, Languages, FileText, Layers, Building, Zap, Wrench, Paintbrush, Hammer, TreePine, Home, HardHat
} from 'lucide-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => void;
  category: Category | null;
  categories: Category[];
}

// Predefined icons for categories
const categoryIconOptions = [
  { value: 'building', label: 'Building' },
  { value: 'steel', label: 'Steel & Metal' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'tools', label: 'Tools' },
  { value: 'paint', label: 'Paint' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'wood', label: 'Wood & Timber' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'safety', label: 'Safety' },
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  categories,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isEditing = !!category;

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    nameAlt: '',
    icon: '',
    description: '',
    parentId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        nameAlt: category.nameAlt || '',
        icon: category.icon || '',
        description: category.description || '',
        parentId: category.parentId || '',
      });
    } else {
      setFormData({
        name: '',
        nameAlt: '',
        icon: '',
        description: '',
        parentId: '',
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = t('categories.categoryNameRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof Category, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Filter out current category and its children for parent selection
  // Only main categories (without parentId) can be parents
  const availableParents = categories.filter(cat => 
    cat.id !== category?.id && !cat.parentId
  );

  // Get count of subcategories for each main category
  const getSubcategoryCount = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] max-h-[90vh] overflow-y-auto ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500">
                <FolderTree className="w-4 h-4 text-white" />
              </div>
              {isEditing ? t('categories.editCategory') : t('categories.addNewCategory')}
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              {isEditing 
                ? t('categories.editDescription')
                : t('categories.addDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <Tag className="w-4 h-4" />
                {t('categories.categoryName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('categories.namePlaceholder')}
                className={`${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                } ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{t('categories.nameRequired')}</p>
              )}
            </div>

            {/* Sinhala Name */}
            <div className="space-y-2">
              <Label htmlFor="nameAlt" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <Languages className="w-4 h-4" />
                {t('categories.sinhalaName')}
              </Label>
              <Input
                id="nameAlt"
                value={formData.nameAlt}
                onChange={(e) => handleChange('nameAlt', e.target.value)}
                placeholder={t('categories.sinhalaNamePlaceholder')}
                className={`${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                }`}
              />
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('categories.sinhalaNameHelp')}
              </p>
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <Layers className="w-4 h-4" />
                {t('categories.parentCategory')}
              </Label>
              <SearchableSelect
                value={formData.parentId || 'none'}
                onValueChange={(value) => handleChange('parentId', value === 'none' ? '' : value)}
                placeholder={t('categories.selectParentCategory')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('categories.noCategoriesFound')}
                theme={theme}
                options={[
                  { value: 'none', label: t('categories.noParent'), icon: <FolderTree className="w-4 h-4 text-blue-400" /> },
                  ...availableParents.map(cat => ({
                    value: cat.id,
                    label: cat.name,
                    count: getSubcategoryCount(cat.id),
                    icon: <Layers className="w-4 h-4 text-orange-400" />
                  }))
                ]}
              />
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('categories.parentHelp')}
              </p>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <FolderTree className="w-4 h-4" />
                {t('categories.categoryIcon')}
              </Label>
              <SearchableSelect
                value={formData.icon || 'none'}
                onValueChange={(value) => handleChange('icon', value === 'none' ? '' : value)}
                placeholder={t('categories.selectIcon')}
                searchPlaceholder={t('common.search')}
                emptyMessage={t('categories.noIconsFound')}
                theme={theme}
                options={[
                  { value: 'none', label: t('categories.defaultIcon'), icon: <FolderTree className="w-4 h-4 text-slate-400" /> },
                  { value: 'building', label: t('categories.iconBuilding'), icon: <Building className="w-4 h-4" /> },
                  { value: 'steel', label: t('categories.iconSteel'), icon: <Hammer className="w-4 h-4" /> },
                  { value: 'electrical', label: t('categories.iconElectrical'), icon: <Zap className="w-4 h-4" /> },
                  { value: 'plumbing', label: t('categories.iconPlumbing'), icon: <Home className="w-4 h-4" /> },
                  { value: 'tools', label: t('categories.iconTools'), icon: <Wrench className="w-4 h-4" /> },
                  { value: 'paint', label: t('categories.iconPaint'), icon: <Paintbrush className="w-4 h-4" /> },
                  { value: 'hardware', label: t('categories.iconHardware'), icon: <Hammer className="w-4 h-4" /> },
                  { value: 'wood', label: t('categories.iconWood'), icon: <TreePine className="w-4 h-4" /> },
                  { value: 'roofing', label: t('categories.iconRoofing'), icon: <Home className="w-4 h-4" /> },
                  { value: 'safety', label: t('categories.iconSafety'), icon: <HardHat className="w-4 h-4" /> },
                ]}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className="w-4 h-4" />
                {t('categories.description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('categories.descriptionPlaceholder')}
                rows={3}
                className={`resize-none ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : ''}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              {isEditing ? t('categories.updateCategory') : t('categories.createCategory')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
