import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Wallet, TrendingUp, Calendar, Building2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PensionServicesPage = () => {
  const { t, language } = useLanguage();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPensionData();
  }, []);

  const fetchPensionData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/services/pension/account`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setAccount(response.data);
    } catch (error) {
      console.error('Error fetching pension data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-purple-500/10 rounded-sm flex items-center justify-center">
            <Wallet className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">{t('pensionServices')}</h1>
            <p className="text-zinc-400">{t('pensionDesc')}</p>
          </div>
        </div>

        {!account ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-12 text-center">
            <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">{t('noData')}</p>
          </div>
        ) : (
          <>
            {/* Account Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Account Number */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">{t('accountNumber')}</p>
                <p className="text-white text-lg font-mono">{account.account_number}</p>
              </div>

              {/* Total Contributions */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">{t('totalContributions')}</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(account.total_contributions)}</p>
              </div>

              {/* Years of Service */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">{t('yearsOfService')}</p>
                <p className="text-white text-2xl font-bold">{account.years_of_service} {language === 'en' ? 'years' : 'lat'}</p>
              </div>

              {/* Retirement Age */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">{t('retirementAge')}</p>
                <p className="text-white text-2xl font-bold">{account.retirement_age}</p>
              </div>
            </div>

            {/* Estimated Pension Card */}
            <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-sm p-8 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-sm flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-purple-400 text-xs uppercase tracking-wider">{t('estimatedPension')}</p>
                  <p className="text-white text-4xl font-bold">{formatCurrency(account.estimated_monthly_pension)}</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm">
                {language === 'en' 
                  ? 'This is an estimated amount based on your current contributions. Actual pension may vary based on future contributions and economic factors.'
                  : 'To jest szacowana kwota na podstawie Twoich obecnych składek. Rzeczywista emerytura może się różnić w zależności od przyszłych składek i czynników ekonomicznych.'
                }
              </p>
            </div>

            {/* Contribution History */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-white text-xl font-bold">{t('contributionHistory')}</h2>
              </div>
              
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">{t('year')}</TableHead>
                      <TableHead className="text-zinc-400">{t('employer')}</TableHead>
                      <TableHead className="text-zinc-400 text-right">{t('amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.contribution_history?.map((contribution, index) => (
                      <TableRow 
                        key={index}
                        data-testid={`contribution-${index}`}
                        className="border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            {contribution.year}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-zinc-500" />
                            {contribution.employer}
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-mono text-right">
                          {formatCurrency(contribution.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ZUS Info */}
            <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span className="text-zinc-400 text-xs uppercase tracking-wider">
                  {language === 'en' ? 'About ZUS' : 'O ZUS'}
                </span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {language === 'en' 
                  ? 'ZUS (Zakład Ubezpieczeń Społecznych) is the Polish Social Insurance Institution responsible for managing pension contributions and benefits. Your contributions are automatically tracked and reported by your employer.'
                  : 'ZUS (Zakład Ubezpieczeń Społecznych) to polska instytucja odpowiedzialna za zarządzanie składkami i świadczeniami emerytalnymi. Twoje składki są automatycznie śledzone i zgłaszane przez pracodawcę.'
                }
              </p>
              <div className="mt-4 flex items-center gap-4 text-zinc-500 text-sm">
                <span>{language === 'en' ? 'Contact:' : 'Kontakt:'} 22 560 16 00</span>
                <span>www.zus.pl</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PensionServicesPage;
