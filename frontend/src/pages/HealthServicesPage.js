import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Heart, Calendar, User, FileText, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HealthServicesPage = () => {
  const { t, language } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/services/health/records`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setRecords(response.data.records || []);
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      visit: { en: 'Hospital Visit', pl: 'Wizyta Szpitalna' },
      vaccination: { en: 'Vaccination', pl: 'Szczepienie' },
      lab_test: { en: 'Lab Test', pl: 'Badanie Laboratoryjne' }
    };
    return labels[type]?.[language] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      visit: 'text-blue-400 bg-blue-500/10',
      vaccination: 'text-green-400 bg-green-500/10',
      lab_test: 'text-purple-400 bg-purple-500/10'
    };
    return colors[type] || 'text-zinc-400 bg-zinc-500/10';
  };

  const visits = records.filter(r => r.type === 'visit');
  const vaccinations = records.filter(r => r.type === 'vaccination');
  const labTests = records.filter(r => r.type === 'lab_test');

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
          <div className="w-12 h-12 bg-red-500/10 rounded-sm flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">{t('healthServices')}</h1>
            <p className="text-zinc-400">{t('healthDesc')}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
            <TabsTrigger 
              value="all" 
              data-testid="health-tab-all"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {language === 'en' ? 'All Records' : 'Wszystkie'}
            </TabsTrigger>
            <TabsTrigger 
              value="visits" 
              data-testid="health-tab-visits"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {t('hospitalVisits')}
            </TabsTrigger>
            <TabsTrigger 
              value="vaccinations" 
              data-testid="health-tab-vaccinations"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {t('vaccinations')}
            </TabsTrigger>
            <TabsTrigger 
              value="lab" 
              data-testid="health-tab-lab"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {t('labTests')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <RecordsList records={records} getTypeLabel={getTypeLabel} getTypeColor={getTypeColor} t={t} language={language} />
          </TabsContent>
          <TabsContent value="visits">
            <RecordsList records={visits} getTypeLabel={getTypeLabel} getTypeColor={getTypeColor} t={t} language={language} />
          </TabsContent>
          <TabsContent value="vaccinations">
            <RecordsList records={vaccinations} getTypeLabel={getTypeLabel} getTypeColor={getTypeColor} t={t} language={language} />
          </TabsContent>
          <TabsContent value="lab">
            <RecordsList records={labTests} getTypeLabel={getTypeLabel} getTypeColor={getTypeColor} t={t} language={language} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const RecordsList = ({ records, getTypeLabel, getTypeColor, t, language }) => {
  if (records.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-12 text-center">
        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <div 
          key={record.record_id || index}
          data-testid={`health-record-${index}`}
          className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${getTypeColor(record.type)}`}>
                {getTypeLabel(record.type)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Calendar className="w-4 h-4" />
              {record.date}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('hospital')}</p>
              <p className="text-white">{record.hospital}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('doctor')}</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                <p className="text-white">{record.doctor}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{t('diagnosis')}</p>
            <p className="text-zinc-300">{record.diagnosis}</p>
          </div>

          {record.prescriptions && record.prescriptions.length > 0 && (
            <div className="mt-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
                {language === 'en' ? 'Prescriptions' : 'Recepty'}
              </p>
              <div className="flex flex-wrap gap-2">
                {record.prescriptions.map((prescription, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-sm">
                    {prescription}
                  </span>
                ))}
              </div>
            </div>
          )}

          {record.results && (
            <div className="mt-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
                {language === 'en' ? 'Results' : 'Wyniki'}
              </p>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(record.results).map(([key, value]) => (
                  <div key={key} className="bg-zinc-800 p-3 rounded-sm">
                    <p className="text-zinc-400 text-xs uppercase">{key}</p>
                    <p className="text-white font-mono">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HealthServicesPage;
