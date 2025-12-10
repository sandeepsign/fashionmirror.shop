import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Code, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import BackgroundAnimation from './BackgroundAnimation';

interface UnifiedDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  activeTab?: string;
}

const navItems = [
  { id: 'try-on', href: '/dashboard', icon: Sparkles, label: 'Mirror.me Studio', hasGradient: true },
  { id: 'integration', href: '/dashboard/integration', icon: Code, label: 'Integration', hasGradient: false },
  { id: 'analytics', href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', hasGradient: false },
  { id: 'settings', href: '/dashboard/settings', icon: Settings, label: 'Settings', hasGradient: false },
];

export default function UnifiedDashboardLayout({ children, title, activeTab }: UnifiedDashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference, default to true (dark mode)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardDarkMode');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('dashboardDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-primary' : 'text-gray-900'}`} />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation('/');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  // Determine active tab from location or prop
  const currentTab = activeTab || (
    location === '/dashboard' ? 'try-on' :
    location.includes('/integration') ? 'integration' :
    location.includes('/analytics') ? 'analytics' :
    location.includes('/settings') ? 'settings' : 'try-on'
  );

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
      {/* Background Animation - only in dark mode */}
      {isDarkMode && <BackgroundAnimation />}

      {/* Top Navigation */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${
        isDarkMode
          ? 'bg-black/60 border-white/10'
          : 'bg-white/80 border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                setLocation('/dashboard');
              }}
              className="flex items-center gap-2"
            >
              <span className={`text-2xl font-bold tracking-tighter text-transparent bg-clip-text drop-shadow-sm ${
                isDarkMode
                  ? 'bg-gradient-to-r from-white via-white to-white/70'
                  : 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600'
              }`} style={{ fontFamily: '"Playfair Display", serif' }}>
                FashionMirror
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation(item.href);
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? item.hasGradient
                          ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                          : 'bg-primary text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                        : isDarkMode
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.hasGradient && !isActive ? (
                      <>
                        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-semibold">Mirror.me</span>
                        <span> Studio</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </a>
                );
              })}
            </nav>

            {/* User Menu & Dark Mode Toggle */}
            <div className="flex items-center gap-3">
              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`relative group flex items-center justify-center w-9 h-9 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-yellow-400/30 to-orange-500/30 border border-yellow-400/50 hover:border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                    : 'bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/50 hover:border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                }`}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isDarkMode ? 0 : 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex items-center justify-center"
                >
                  {isDarkMode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
                      <circle cx="12" cy="12" r="4" fill="currentColor"/>
                      <path d="M12 2V4M12 20V22M4 12H2M6.31 6.31L4.9 4.9M17.69 6.31L19.1 4.9M6.31 17.69L4.9 19.1M17.69 17.69L19.1 19.1M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </motion.div>
              </button>

              <span className={`hidden sm:block text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                {user?.name || user?.email}
              </span>

              <button
                onClick={handleLogout}
                className={`relative group px-4 py-2 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 ${
                  isDarkMode ? '' : ''
                }`}
              >
                <div className={`absolute inset-0 backdrop-blur-md border rounded-full transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20 group-hover:bg-red-500/20 group-hover:border-red-400/50'
                    : 'bg-gray-100 border-gray-300 group-hover:bg-red-50 group-hover:border-red-300'
                }`} />
                <span className={`relative flex items-center gap-2 text-sm font-medium ${
                  isDarkMode
                    ? 'text-white group-hover:text-red-400'
                    : 'text-gray-700 group-hover:text-red-600'
                }`}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                className={`md:hidden transition-colors ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${isDarkMode ? 'border-white/10 bg-black/80' : 'border-gray-200 bg-white/95'} backdrop-blur-md`}>
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? item.hasGradient
                          ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white'
                          : 'bg-primary text-black'
                        : isDarkMode
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.hasGradient && !isActive ? (
                      <>
                        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-semibold">Mirror.me</span>
                        <span> Studio</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (
          <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
        )}
        {/* Pass isDarkMode to children through CSS variables or context */}
        <div className={isDarkMode ? 'dashboard-dark' : 'dashboard-light'} data-theme={isDarkMode ? 'dark' : 'light'}>
          {children}
        </div>
      </main>
    </div>
  );
}
