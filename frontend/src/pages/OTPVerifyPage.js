import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { Globe, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const OTPVerifyPage = () => {
  const { verifyOTP, resendOTP } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatApiError = (detail) => {
    if (detail == null) return 'Something went wrong. Please try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(e => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
    }
    if (detail && typeof detail.msg === 'string') return detail.msg;
    return String(detail);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError(language === 'en' ? 'Please enter all 6 digits' : 'Wprowadź wszystkie 6 cyfr');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyOTP(email, otp);
      toast.success(t('success'), { 
        description: language === 'en' 
          ? 'Email verified successfully!' 
          : 'Email zweryfikowany pomyślnie!'
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || err.message;
      setError(errorMsg);
      toast.error(t('error'), { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      await resendOTP(email);
      toast.success(t('success'), { 
        description: language === 'en' 
          ? 'New verification code sent!' 
          : 'Nowy kod weryfikacyjny wysłany!'
      });
      setCountdown(60);
      setOtp('');
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || err.message;
      toast.error(t('error'), { description: errorMsg });
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      {/* Language toggle */}
      <div className="absolute top-6 right-6">
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

      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/register')}
          data-testid="back-button"
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
      </div>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-black text-xl">eID</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl tracking-tight">e-Identity</h1>
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Poland</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8">
          <h2 className="text-white text-2xl font-bold mb-2 text-center">{t('verifyEmail')}</h2>
          <p className="text-zinc-400 text-center mb-2">{t('enterOTP')}</p>
          <p className="text-white text-sm text-center mb-8 font-medium">{email}</p>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm mb-6">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* OTP Input */}
          <div className="flex justify-center mb-8">
            <InputOTP 
              maxLength={6} 
              value={otp} 
              onChange={setOtp}
              data-testid="otp-input"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="bg-zinc-950 border-zinc-700 text-white text-xl w-12 h-14" />
                <InputOTPSlot index={1} className="bg-zinc-950 border-zinc-700 text-white text-xl w-12 h-14" />
                <InputOTPSlot index={2} className="bg-zinc-950 border-zinc-700 text-white text-xl w-12 h-14" />
                <InputOTPSlot index={3} className="bg-zinc-950 border-zinc-700 text-white text-xl w-12 h-14" />
                <InputOTPSlot index={4} className="bg-zinc-950 border-zinc-700 text-white text-xl w-12 h-14" />
                <InputOTPSlot index={5} className="bg-zinc-950 border-zinc-700 text-white text-xl w-12 h-14" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Verify button */}
          <Button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            data-testid="verify-otp-button"
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide rounded-sm mb-4"
          >
            {loading ? t('loading') : t('verify')}
          </Button>

          {/* Resend button */}
          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={resending || countdown > 0}
            data-testid="resend-otp-button"
            className="w-full text-zinc-400 hover:text-white"
          >
            {resending 
              ? t('loading')
              : countdown > 0 
                ? `${t('resendCode')} (${countdown}s)`
                : t('resendCode')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyPage;
