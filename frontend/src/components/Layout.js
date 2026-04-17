import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutDashboard, 
  User, 
  Building2, 
  Shield, 
  Heart, 
  Landmark, 
  FileText,
  Wallet,
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/profile', icon: User, label: 'profile' },
    { path: '/services/health', icon: Heart, label: 'healthServices' },
    { path: '/services/bank', icon: Landmark, label: 'bankVerification' },
    { path: '/services/government', icon: Building2, label: 'governmentServices' },
    { path: '/services/police', icon: Shield, label: 'policeServices' },
    { path: '/services/pension', icon: Wallet, label: 'pensionServices' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: FileText, label: 'admin' });
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-zinc-950 border-r border-zinc-800
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
                <span className="text-black font-black text-lg">eID</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg tracking-tight">e-Identity</h1>
                <p className="text-zinc-500 text-xs uppercase tracking-wider">Poland</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-black' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-4 py-3 mb-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-sm flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-zinc-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              data-testid="logout-button"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 glass-header border-b border-zinc-800 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
              data-testid="mobile-menu-button"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Page title - hidden on mobile */}
            <div className="hidden lg:block">
              <h2 className="text-white font-bold text-xl">{t('digitalIdentity')}</h2>
            </div>

            {/* Language toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              data-testid="language-toggle"
              className="flex items-center gap-2 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'EN' : 'PL'}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 px-4 lg:px-8 py-4">
          <p className="text-zinc-500 text-xs text-center">{t('copyright')}</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
