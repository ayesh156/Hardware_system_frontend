import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  Package, FileText, Users, LayoutDashboard, Settings, LogOut,
  Moon, Sun, Menu, X, ChevronLeft, ChevronRight, Bell, Search,
  User, HelpCircle, ChevronDown, Sparkles, TrendingUp, Shield,
  FolderTree, Building
} from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationCount] = useState(3);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setProfileDropdownOpen(false);
    if (profileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'nav.home', badge: null },
    { path: '/invoices', icon: FileText, label: 'nav.invoices', badge: '12' },
    { path: '/products', icon: Package, label: 'nav.products', badge: null },
    { path: '/categories', icon: FolderTree, label: 'nav.categories', badge: null },
    { path: '/brands', icon: Building, label: 'nav.brands', badge: null },
    { path: '/customers', icon: Users, label: 'nav.customers', badge: '3' },
    { path: '/financial-reports', icon: TrendingUp, label: 'Financial Reports', badge: null },
  ];

  const bottomNavItems = [
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/help', icon: HelpCircle, label: 'Help Center' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Sidebar Component
  const Sidebar = () => (
    <aside 
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50' 
          : 'bg-gradient-to-b from-white via-white to-slate-50 border-r border-slate-200 shadow-xl'
      }`}
    >
      {/* Logo Section */}
      <div className={`flex items-center h-16 px-4 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className={`text-lg font-bold whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Hardware<span className="text-orange-500">Pro</span>
              </span>
              <span className={`text-[10px] -mt-0.5 tracking-wider uppercase whitespace-nowrap ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Admin Panel
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100%-4rem)] px-3 py-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="flex-1 space-y-1">
          {!sidebarCollapsed && (
            <span className={`px-3 text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Main Menu
            </span>
          )}
          <div className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? theme === 'dark' 
                        ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 shadow-lg shadow-orange-500/10' 
                        : 'bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600 shadow-lg shadow-orange-500/10'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={sidebarCollapsed ? t(item.label) : undefined}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-rose-500 rounded-r-full" />
                  )}
                  
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-orange-500' : ''
                  }`} />
                  
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{t(item.label)}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          theme === 'dark' 
                            ? 'bg-orange-500/20 text-orange-400' 
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && (
                    <div className={`absolute left-full ml-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 ${
                      theme === 'dark' ? 'bg-slate-800 text-white shadow-xl' : 'bg-slate-900 text-white shadow-xl'
                    }`}>
                      {t(item.label)}
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-orange-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 space-y-1 border-t border-slate-800/30">
          {!sidebarCollapsed && (
            <span className={`px-3 text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Support
            </span>
          )}
          <div className="mt-2 space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? theme === 'dark' 
                        ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 shadow-lg shadow-orange-500/10' 
                        : 'bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600 shadow-lg shadow-orange-500/10'
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-rose-500 rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-orange-500' : ''}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  
                  {sidebarCollapsed && (
                    <div className={`absolute left-full ml-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 ${
                      theme === 'dark' ? 'bg-slate-800 text-white shadow-xl' : 'bg-slate-900 text-white shadow-xl'
                    }`}>
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Collapse Button */}
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-2 rounded-xl font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'text-slate-500 hover:text-white hover:bg-slate-800/50' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Pro Card */}
        {!sidebarCollapsed && (
          <div className={`mt-4 p-4 rounded-2xl border ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-orange-500/10 to-rose-500/5 border-orange-500/20' 
              : 'bg-gradient-to-br from-orange-50 to-rose-50 border-orange-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Pro Features
              </span>
            </div>
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Unlock advanced analytics and reports
            </p>
            <button className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-orange-500/20">
              Upgrade Now
            </button>
          </div>
        )}
      </nav>
    </aside>
  );

  // Mobile Sidebar Overlay
  const MobileSidebar = () => (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-screen w-72 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50' 
            : 'bg-gradient-to-b from-white via-white to-slate-50 border-r border-slate-200 shadow-2xl'
        }`}
      >
        {/* Close button */}
        <button 
          onClick={() => setMobileSidebarOpen(false)}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo Section */}
        <div className={`flex items-center h-16 px-4 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl blur-lg opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Hardware<span className="text-orange-500">Pro</span>
              </span>
              <span className={`text-[10px] -mt-0.5 tracking-wider uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100%-4rem)] px-3 py-4 overflow-y-auto">
          <div className="flex-1 space-y-1">
            <span className={`px-3 text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Main Menu
            </span>
            <div className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 ${
                      active
                        ? theme === 'dark' 
                          ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400' 
                          : 'bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600'
                        : theme === 'dark' 
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-rose-500 rounded-r-full" />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-orange-500' : ''}`} />
                    <span className="flex-1">{t(item.label)}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        theme === 'dark' 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pro Card */}
          <div className={`mt-4 p-4 rounded-2xl border ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-orange-500/10 to-rose-500/5 border-orange-500/20' 
              : 'bg-gradient-to-br from-orange-50 to-rose-50 border-orange-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Pro Features
              </span>
            </div>
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Unlock advanced analytics
            </p>
            <button className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium rounded-lg">
              Upgrade Now
            </button>
          </div>
        </nav>
      </aside>
    </>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0f1a]' : 'bg-slate-100'}`}>
      {/* Ambient background effects */}
      <div className={`fixed inset-0 overflow-hidden pointer-events-none transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar - Desktop */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar */}
      {isMobile && <MobileSidebar />}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${!isMobile ? (sidebarCollapsed ? 'ml-20' : 'ml-72') : 'ml-0'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-30 h-16 border-b backdrop-blur-xl transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-800/50 bg-[#0a0f1a]/80' : 'border-slate-200 bg-white/80'
        }`}>
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className={`p-2 rounded-xl transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {/* Search Bar */}
              <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 focus-within:border-orange-500/50' 
                  : 'bg-slate-50 border-slate-200 focus-within:border-orange-500/50'
              }`}>
                <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className={`bg-transparent outline-none text-sm w-48 lg:w-64 ${
                    theme === 'dark' ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
                <kbd className={`hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                }`}>
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`relative p-2.5 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Sun className={`w-4 h-4 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                }`} />
                <Moon className={`w-4 h-4 text-blue-400 transition-all duration-300 ${
                  theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                }`} />
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notifications */}
              <button className={`relative p-2.5 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <Bell className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className={`hidden lg:block w-px h-8 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className={`flex items-center gap-3 p-1.5 pr-3 rounded-xl border transition-all ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Admin User
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      admin@hardwarepro.lk
                    </p>
                  </div>
                  <ChevronDown className={`hidden lg:block w-4 h-4 transition-transform ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  } ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Admin User
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        admin@hardwarepro.lk
                      </p>
                    </div>
                    <div className="py-1">
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'
                      }`}>
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'
                      }`}>
                        <Shield className="w-4 h-4" />
                        Security
                      </button>
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        theme === 'dark' ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                        Activity Log
                      </button>
                    </div>
                    <div className={`border-t py-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors ${
                        theme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                      }`}>
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2">
          <div className={`relative mx-auto max-w-md rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${
            theme === 'dark' 
              ? 'bg-slate-900/90 border-slate-700/50' 
              : 'bg-white/90 border-slate-200'
          }`}>
            <div className="relative flex items-center justify-around py-2 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex flex-col items-center group py-1"
                  >
                    <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                      active 
                        ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 scale-110' 
                        : 'scale-100 group-hover:scale-105'
                    }`}>
                      <Icon className={`w-5 h-5 transition-all duration-300 ${
                        active 
                          ? 'text-orange-500' 
                          : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {parseInt(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-medium mt-0.5 transition-all duration-300 ${
                      active 
                        ? 'text-orange-500' 
                        : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {t(item.label)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};
