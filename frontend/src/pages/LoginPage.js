import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const { login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatApiError = (detail) => {
    if (detail == null) return 'Something went wrong. Please try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(e => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
    }
    if (detail && typeof detail.msg === 'string') return detail.msg;
    return String(detail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success(t('success'), { description: 'Welcome back!' });
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || err.message;
      setError(errorMsg);
      toast.error(t('error'), { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12">
        {/* Language toggle */}
        <div className="absolute top-6 right-6 lg:left-6 lg:right-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            data-testid="language-toggle"
            className="text-zinc-400 hover:text-white"
          >
            <Globe className="w-4 h-4 mr-2" />
            {language === 'en' ? 'EN' : 'PL'}
          </Button>
        </div>

        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center">
              <span className="text-black font-black text-xl">eID</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">e-Identity</h1>
              <p className="text-zinc-500 text-xs uppercase tracking-wider">Poland</p>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">{t('welcomeBack')}</h2>
            <p className="text-zinc-400">{t('signInToContinue')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                data-testid="login-email-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white focus:ring-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="login-password-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white focus:ring-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide rounded-sm"
            >
              {loading ? t('loading') : t('signIn')}
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-zinc-400">
            {t('noAccount')}{' '}
            <Link to="/register" data-testid="register-link" className="text-white hover:underline font-medium">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1643483189749-7b4cbfb7f8f0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwyfHx3YXJzYXclMjBza3lsaW5lJTIwbmlnaHR8ZW58MHx8fHwxNzc2NDQxNzQzfDA&ixlib=rb-4.1.0&q=85')`
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-2 bg-white" />
            <div className="w-8 h-2 bg-[#dc143c]" />
          </div>
          <h3 className="text-white text-2xl font-bold mb-2">{t('digitalIdentity')}</h3>
          <p className="text-zinc-300 text-sm">
            {language === 'en' 
              ? 'Secure access to government services with your digital identity'
              : 'Bezpieczny dostęp do usług rządowych dzięki Twojej tożsamości cyfrowej'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
