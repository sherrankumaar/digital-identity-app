import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Shield, FileText, AlertTriangle, Calendar, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PoliceServicesPage = () => {
  const { t, language } = useLanguage();
  const [records, setRecords] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: ''
  });

  const categories = {
    en: [
      { value: 'theft', label: 'Theft' },
      { value: 'fraud', label: 'Fraud' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'vandalism', label: 'Vandalism' },
      { value: 'assault', label: 'Assault' },
      { value: 'other', label: 'Other' }
    ],
    pl: [
      { value: 'theft', label: 'Kradzież' },
      { value: 'fraud', label: 'Oszustwo' },
      { value: 'harassment', label: 'Nękanie' },
      { value: 'vandalism', label: 'Wandalizm' },
      { value: 'assault', label: 'Napaść' },
      { value: 'other', label: 'Inne' }
    ]
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [recordsRes, complaintsRes] = await Promise.all([
        axios.get(`${API_URL}/api/services/police/records`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }),
        axios.get(`${API_URL}/api/services/police/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        })
      ]);
      setRecords(recordsRes.data.records || []);
      setComplaints(complaintsRes.data.complaints || []);
    } catch (error) {
      console.error('Error fetching police data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      toast.error(t('error'), { 
        description: language === 'en' ? 'Please fill all required fields' : 'Wypełnij wszystkie wymagane pola' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_URL}/api/services/police/complaints`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(t('success'), { 
        description: `${language === 'en' ? 'Complaint submitted. Reference:' : 'Skarga złożona. Numer referencyjny:'} ${response.data.reference_number}` 
      });
      setFormData({ title: '', description: '', category: '', location: '' });
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'status-paid',
      pending: 'status-pending',
      submitted: 'status-pending',
      under_review: 'bg-blue-500/20 text-blue-400',
      resolved: 'status-verified',
      rejected: 'status-rejected'
    };
    const labels = {
      paid: language === 'en' ? 'Paid' : 'Opłacone',
      pending: t('pending'),
      submitted: language === 'en' ? 'Submitted' : 'Złożone',
      under_review: language === 'en' ? 'Under Review' : 'W Trakcie Rozpatrywania',
      resolved: language === 'en' ? 'Resolved' : 'Rozwiązane',
      rejected: t('rejected')
    };
    return (
      <span className={`status-badge ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      fine: { en: 'Fine', pl: 'Mandat' },
      summons: { en: 'Summons', pl: 'Wezwanie' }
    };
    return labels[type]?.[language] || type;
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
          <div className="w-12 h-12 bg-emerald-500/10 rounded-sm flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">{t('policeServices')}</h1>
            <p className="text-zinc-400">{t('policeDesc')}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="complaint" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
            <TabsTrigger 
              value="complaint" 
              data-testid="police-tab-complaint"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {t('lodgeComplaint')}
            </TabsTrigger>
            <TabsTrigger 
              value="mycomplaints" 
              data-testid="police-tab-mycomplaints"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {t('myComplaints')}
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              data-testid="police-tab-records"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              {t('summonsAndFines')}
            </TabsTrigger>
          </TabsList>

          {/* Lodge Complaint Tab */}
          <TabsContent value="complaint">
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 max-w-2xl">
              <h2 className="text-white text-xl font-bold mb-6">{t('lodgeComplaint')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400">{t('complaintTitle')} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="complaint-title-input"
                    placeholder={language === 'en' ? 'Brief title of the incident' : 'Krótki tytuł zdarzenia'}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">{t('category')} *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger 
                      data-testid="complaint-category-select"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    >
                      <SelectValue placeholder={language === 'en' ? 'Select category' : 'Wybierz kategorię'} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {categories[language].map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-zinc-800">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">{t('location')}</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    data-testid="complaint-location-input"
                    placeholder={language === 'en' ? 'Where did this happen?' : 'Gdzie to się wydarzyło?'}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">{t('complaintDescription')} *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="complaint-description-input"
                    placeholder={language === 'en' ? 'Describe the incident in detail...' : 'Opisz szczegółowo zdarzenie...'}
                    className="bg-zinc-950 border-zinc-800 text-white min-h-[150px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-complaint-button"
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide rounded-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('loading')}
                    </>
                  ) : (
                    t('submit')
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* My Complaints Tab */}
          <TabsContent value="mycomplaints">
            {complaints.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-12 text-center">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">{t('noData')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint, index) => (
                  <div 
                    key={complaint.complaint_id || index}
                    data-testid={`complaint-${index}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-bold">{complaint.title}</h3>
                        <p className="text-zinc-500 text-sm font-mono">{complaint.reference_number}</p>
                      </div>
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-zinc-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {complaint.created_at?.split('T')[0]}
                      </div>
                      {complaint.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {complaint.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Summons & Fines Tab */}
          <TabsContent value="records">
            {records.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">{t('noData')}</p>
                <p className="text-zinc-500 text-sm mt-2">
                  {language === 'en' ? 'No summons or fines on record' : 'Brak wezwań i mandatów w rejestrze'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, index) => (
                  <div 
                    key={record.record_id || index}
                    data-testid={`police-record-${index}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                          record.type === 'fine' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {getTypeLabel(record.type)}
                        </span>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>
                    
                    <p className="text-white mb-2">{record.description}</p>
                    
                    {record.amount && (
                      <p className="text-white text-xl font-bold mb-2">
                        {record.amount.toFixed(2)} PLN
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-zinc-500 text-sm mt-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {record.date}
                      </div>
                      {record.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {record.location}
                        </div>
                      )}
                    </div>

                    {record.court && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm">
                        <p className="text-yellow-400 text-sm">
                          <strong>{language === 'en' ? 'Court:' : 'Sąd:'}</strong> {record.court}
                        </p>
                        {record.hearing_date && (
                          <p className="text-yellow-400 text-sm">
                            <strong>{language === 'en' ? 'Hearing Date:' : 'Data rozprawy:'}</strong> {record.hearing_date}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PoliceServicesPage;
