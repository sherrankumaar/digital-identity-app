import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Building2, FileText, Users, Receipt, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GovernmentServicesPage = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/api/services/government/services`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error fetching government services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (id) => {
    const icons = {
      tax: Receipt,
      documents: FileText,
      social: Users,
      registry: Building2
    };
    return icons[id] || FileText;
  };

  const getServiceColor = (id) => {
    const colors = {
      tax: 'text-amber-400 bg-amber-500/10',
      documents: 'text-blue-400 bg-blue-500/10',
      social: 'text-green-400 bg-green-500/10',
      registry: 'text-purple-400 bg-purple-500/10'
    };
    return colors[id] || 'text-zinc-400 bg-zinc-500/10';
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
          <div className="w-12 h-12 bg-amber-500/10 rounded-sm flex items-center justify-center">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">{t('governmentServices')}</h1>
            <p className="text-zinc-400">{t('govDesc')}</p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const Icon = getServiceIcon(service.id);
            const colorClass = getServiceColor(service.id);
            
            return (
              <div 
                key={service.id}
                data-testid={`gov-service-${service.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${colorClass.split(' ')[1]} rounded-sm flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colorClass.split(' ')[0]}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-badge status-verified">
                      {service.status === 'available' 
                        ? (language === 'en' ? 'Available' : 'Dostępne')
                        : (language === 'en' ? 'Unavailable' : 'Niedostępne')
                      }
                    </span>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                
                <h3 className="text-white text-lg font-bold mb-2">
                  {language === 'en' ? service.name : service.name_pl}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {language === 'en' ? service.description : service.description_pl}
                </p>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-amber-400 rounded-full" />
            <span className="text-zinc-400 text-xs uppercase tracking-wider">
              {language === 'en' ? 'Important Information' : 'Ważne Informacje'}
            </span>
          </div>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {language === 'en' 
              ? 'All government services are accessible through your verified e-Identity profile. Click on any service to start the process. Your digital signature and identity verification will be handled automatically.'
              : 'Wszystkie usługi rządowe są dostępne poprzez Twój zweryfikowany profil e-Identity. Kliknij na dowolną usługę, aby rozpocząć proces. Twój podpis cyfrowy i weryfikacja tożsamości zostaną obsłużone automatycznie.'
            }
          </p>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
            <h4 className="text-white font-bold mb-2">
              {language === 'en' ? 'Emergency Contacts' : 'Kontakty Alarmowe'}
            </h4>
            <p className="text-zinc-400 text-sm">112 - {language === 'en' ? 'Emergency' : 'Pogotowie'}</p>
            <p className="text-zinc-400 text-sm">997 - {language === 'en' ? 'Police' : 'Policja'}</p>
            <p className="text-zinc-400 text-sm">998 - {language === 'en' ? 'Fire' : 'Straż Pożarna'}</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
            <h4 className="text-white font-bold mb-2">
              {language === 'en' ? 'Working Hours' : 'Godziny Pracy'}
            </h4>
            <p className="text-zinc-400 text-sm">
              {language === 'en' ? 'Mon-Fri: 8:00 - 16:00' : 'Pon-Pt: 8:00 - 16:00'}
            </p>
            <p className="text-zinc-400 text-sm">
              {language === 'en' ? 'Online services: 24/7' : 'Usługi online: 24/7'}
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
            <h4 className="text-white font-bold mb-2">
              {language === 'en' ? 'Support' : 'Wsparcie'}
            </h4>
            <p className="text-zinc-400 text-sm">
              {language === 'en' ? 'Helpline: 19524' : 'Infolinia: 19524'}
            </p>
            <p className="text-zinc-400 text-sm">
              Email: pomoc@gov.pl
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GovernmentServicesPage;
