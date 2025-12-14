import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('si')}
        className={`px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
          language === 'si'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        SI
      </button>
    </div>
  );
};
