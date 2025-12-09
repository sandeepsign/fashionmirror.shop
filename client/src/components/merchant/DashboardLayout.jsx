import { useLocation } from 'wouter';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutDashboard, Code, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
const navItems = [
    { href: '/merchant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/merchant/integration', icon: Code, label: 'Integration' },
    { href: '/merchant/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/merchant/settings', icon: Settings, label: 'Settings' },
];
export default function DashboardLayout({ children, title }) {
    const [location, setLocation] = useLocation();
    const { merchant, logout, isAuthenticated, isLoading } = useMerchantAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Show loading state
    if (isLoading) {
        return (<div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/>
      </div>);
    }
    // Redirect if not authenticated
    if (!isAuthenticated) {
        setLocation('/merchant/login');
        return null;
    }
    const handleLogout = async () => {
        await logout();
        setLocation('/merchant/login');
    };
    return (<div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/merchant/dashboard" onClick={(e) => {
            e.preventDefault();
            setLocation('/merchant/dashboard');
        }} className="flex items-center gap-2">
              <svg className="w-24 h-auto text-white" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
                <text x="40" y="145" fill="currentColor" fontFamily="Comic Sans MS, Comic Sans, cursive" fontStyle="italic" fontWeight="700" fontSize="130" letterSpacing="-3">
                  Mirror
                </text>
                <rect x="455" y="128" width="14" height="14" fill="currentColor" transform="rotate(45 462 135)"/>
                <text x="482" y="145" fill="currentColor" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="90">
                  me
                </text>
              </svg>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (<a key={item.href} href={item.href} onClick={(e) => {
                    e.preventDefault();
                    setLocation(item.href);
                }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                    <Icon className="h-4 w-4"/>
                    {item.label}
                  </a>);
        })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-slate-400">
                {merchant?.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-700">
                <LogOut className="h-4 w-4 mr-2"/>
                <span className="hidden sm:inline">Logout</span>
              </Button>

              {/* Mobile Menu Button */}
              <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (<div className="md:hidden border-t border-slate-700">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (<a key={item.href} href={item.href} onClick={(e) => {
                        e.preventDefault();
                        setLocation(item.href);
                        setMobileMenuOpen(false);
                    }} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                    <Icon className="h-5 w-5"/>
                    {item.label}
                  </a>);
            })}
            </nav>
          </div>)}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {title && (<h1 className="text-2xl font-bold text-white mb-6">{title}</h1>)}
        {children}
      </main>
    </div>);
}
