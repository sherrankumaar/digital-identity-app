import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Landmark, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BankVerificationPage = () => {
  const { t, language } = useLanguage();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_purpose: ''
  });

  const banks = [
    'PKO Bank Polski',
    'Bank Pekao',
    'Santander Bank Polska',
    'mBank',
    'ING Bank Śląski',
    'BNP Paribas Bank Polska',
    'Alior Bank',
    'Millennium Bank',
    'Credit Agricole',
    'Getin Noble Bank'
  ];

  const purposes = {
    en: ['Personal Account', 'Business Account', 'Mortgage Application', 'Credit Application', 'Investment Account'],
    pl: ['Konto Osobiste', 'Konto Firmowe', 'Wniosek Hipoteczny', 'Wniosek Kredytowy', 'Konto Inwestycyjne']
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/services/bank/verifications`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setVerifications(response.data.verifications || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bank_name || !formData.account_purpose) {
      toast.error(t('error'), { 
        description: language === 'en' ? 'Please fill all fields' : 'Wypełnij wszystkie pola' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_URL}/api/services/bank/verify`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(t('success'), { 
        description: language === 'en' ? 'Identity verified successfully!' : 'Tożsamość zweryfikowana pomyślnie!' 
      });
      setFormData({ bank_name: '', account_purpose: '' });
      fetchVerifications();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      verified: 'status-verified',
      pending: 'status-pending',
      rejected: 'status-rejected'
    };
    const labels = {
      verified: t('verified'),
      pending: t('pending'),
      rejected: t('rejected')
    };
    return (
      <span className={`status-badge ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-500/10 rounded-sm flex items-center justify-center">
            <Landmark className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">{t('bankVerification')}</h1>
            <p className="text-zinc-400">{t('bankDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
            <h2 className="text-white text-xl font-bold mb-6">{t('requestVerification')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">{t('bankName')}</Label>
                <Select 
                  value={formData.bank_name} 
                  onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                >
                  <SelectTrigger 
                    data-testid="bank-select"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  >
                    <SelectValue placeholder={language === 'en' ? 'Select bank' : 'Wybierz bank'} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {banks.map((bank) => (
                      <SelectItem key={bank} value={bank} className="text-white hover:bg-zinc-800">
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">{t('accountPurpose')}</Label>
                <Select 
                  value={formData.account_purpose} 
                  onValueChange={(value) => setFormData({ ...formData, account_purpose: value })}
                >
                  <SelectTrigger 
                    data-testid="purpose-select"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  >
                    <SelectValue placeholder={language === 'en' ? 'Select purpose' : 'Wybierz cel'} />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {purposes[language].map((purpose) => (
                      <SelectItem key={purpose} value={purpose} className="text-white hover:bg-zinc-800">
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                data-testid="verify-button"
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide rounded-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('loading')}
                  </>
                ) : (
                  t('requestVerification')
                )}
              </Button>
            </form>

            {/* Info box */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-sm">
              <p className="text-blue-400 text-sm">
                {language === 'en' 
                  ? 'Your identity will be verified instantly using your e-Identity profile. The bank will receive confirmation of your identity.'
                  : 'Twoja tożsamość zostanie zweryfikowana natychmiast przy użyciu profilu e-Identity. Bank otrzyma potwierdzenie Twojej tożsamości.'
                }
              </p>
            </div>
          </div>

          {/* Verification History */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
            <h2 className="text-white text-xl font-bold mb-6">{t('verificationHistory')}</h2>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">{t('noData')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.map((verification, index) => (
                  <div 
                    key={verification.verification_id || index}
                    data-testid={`verification-${index}`}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {verification.status === 'verified' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-400" />
                        )}
                        <span className="text-white font-medium">{verification.bank_name}</span>
                      </div>
                      {getStatusBadge(verification.status)}
                    </div>
                    <p className="text-zinc-400 text-sm mb-2">{verification.account_purpose}</p>
                    <p className="text-zinc-500 text-xs">
                      {verification.verified_at || verification.requested_at}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BankVerificationPage;
