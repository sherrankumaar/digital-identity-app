import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Heart, 
  Landmark, 
  Building2, 
  Shield, 
  Wallet,
  ChevronRight,
  User,
  FileCheck
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const services = [
    {
      id: 'health',
      path: '/services/health',
      icon: Heart,
      label: 'healthServices',
      description: 'healthDesc',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      id: 'bank',
      path: '/services/bank',
      icon: Landmark,
      label: 'bankVerification',
      description: 'bankDesc',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'government',
      path: '/services/government',
      icon: Building2,
      label: 'governmentServices',
      description: 'govDesc',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 'police',
      path: '/services/police',
      icon: Shield,
      label: 'policeServices',
      description: 'policeDesc',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      id: 'pension',
      path: '/services/pension',
      icon: Wallet,
      label: 'pensionServices',
      description: 'pensionDesc',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-2">
            {t('welcomeUser')} <span className="text-zinc-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-zinc-400">{t('accessServices')}</p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Identity Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="status-badge status-verified">{t('verified')}</span>
            </div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('pesel')}</h3>
            <p className="text-white text-lg font-mono">{user?.pesel || '---'}</p>
          </div>

          {/* Date of Birth Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('dateOfBirth')}</h3>
            <p className="text-white text-lg">{user?.date_of_birth || '---'}</p>
          </div>

          {/* Email Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
                <span className="text-white text-sm font-bold">@</span>
              </div>
            </div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('email')}</h3>
            <p className="text-white text-lg truncate">{user?.email}</p>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-6">
          <h2 className="text-white text-xl font-bold mb-4">{t('availableServices')}</h2>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Link
              key={service.id}
              to={service.path}
              data-testid={`service-card-${service.id}`}
              className="service-card bg-zinc-900 border border-zinc-800 rounded-sm p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${service.bgColor} rounded-sm flex items-center justify-center`}>
                  <service.icon className={`w-6 h-6 ${service.color}`} />
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-white font-bold mb-2">{t(service.label)}</h3>
              <p className="text-zinc-400 text-sm">{t(service.description)}</p>
            </Link>
          ))}
        </div>

        {/* Quick Stats for Admin */}
        {user?.role === 'admin' && (
          <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-[#dc143c] rounded-full" />
              <span className="text-zinc-400 text-xs uppercase tracking-wider">
                {language === 'en' ? 'Admin Access' : 'Dostęp Administratora'}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">
              {language === 'en' 
                ? 'You have administrator privileges. Access the Admin Panel to manage users and view system statistics.'
                : 'Masz uprawnienia administratora. Przejdź do Panelu Admina, aby zarządzać użytkownikami i przeglądać statystyki systemu.'
              }
            </p>
            <Link 
              to="/admin"
              data-testid="admin-panel-link"
              className="inline-flex items-center gap-2 mt-4 text-white font-medium hover:underline"
            >
              {t('admin')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
