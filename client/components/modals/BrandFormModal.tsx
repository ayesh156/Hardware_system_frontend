import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Brand } from '../../types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Building, Globe, FileText, Image, Check
} from 'lucide-react';

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brand: Partial<Brand>) => void;
  brand: Brand | null;
}

// Common countries for Sri Lankan hardware industry
const countries = [
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'UK', name: 'UK', flag: '🇬🇧' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
];

export const BrandFormModal: React.FC<BrandFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brand,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isEditing = !!brand;

  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    country: 'Sri Lanka',
    description: '',
    logo: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        country: brand.country,
        description: brand.description || '',
        logo: brand.logo || '',
        isActive: brand.isActive,
      });
    } else {
      setFormData({
        name: '',
        country: 'Sri Lanka',
        description: '',
        logo: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [brand, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Brand name is required';
    }
    
    if (!formData.country?.trim()) {
      newErrors.country = 'Country is required';
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

  const handleChange = (field: keyof Brand, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getCountryFlag = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country?.flag || '🌍';
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
                <Building className="w-4 h-4 text-white" />
              </div>
              {isEditing ? 'Edit Brand' : 'Add New Brand'}
            </DialogTitle>
            <DialogDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              {isEditing 
                ? 'Update the brand details below.'
                : 'Register a new brand or manufacturer for your products.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <Building className="w-4 h-4" />
                Brand Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., INSEE, Nippon Paint, Bosch"
                className={`${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                } ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <Globe className="w-4 h-4" />
                Country of Origin <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                value={formData.country}
                onValueChange={(value) => handleChange('country', value)}
                placeholder="Select country"
                searchPlaceholder={t('common.search')}
                emptyMessage="No countries found"
                theme={theme}
                options={countries.map(country => ({
                  value: country.name,
                  label: country.name,
                  icon: <span className="text-base">{country.flag}</span>
                }))}
              />
              {errors.country && (
                <p className="text-xs text-red-500">{errors.country}</p>
              )}
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <Image className="w-4 h-4" />
                Logo URL
              </Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className={
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                }
              />
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Optional: Add a URL to the brand's logo image
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText className="w-4 h-4" />
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the brand..."
                rows={3}
                className={`resize-none ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>

            {/* Active Status */}
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-0.5">
                <Label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Check className="w-4 h-4" />
                  Active Status
                </Label>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  Inactive brands won't appear in product forms
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
            </div>

            {/* Popular Sri Lankan Brands Info */}
            {!isEditing && (
              <div className={`p-4 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-blue-500/10 border-blue-500/20' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                  💡 Popular Hardware Brands in Sri Lanka
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-blue-300/80' : 'text-blue-600'}`}>
                  <strong>Cement:</strong> INSEE, Tokyo Cement, Holcim<br />
                  <strong>Steel:</strong> Lanwa, Melwa<br />
                  <strong>Paint:</strong> Nippon Paint, Dulux, Asian Paints<br />
                  <strong>Electrical:</strong> Kelani Cables, ACL, Orange Electric<br />
                  <strong>Tools:</strong> Bosch, Makita, Stanley, DeWalt
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800' : ''}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
            >
              {isEditing ? 'Update Brand' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
