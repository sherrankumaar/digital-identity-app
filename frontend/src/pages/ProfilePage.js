import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Save, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    pesel: user?.pesel || '',
    date_of_birth: user?.date_of_birth || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success(t('success'), {
        description: language === 'en' ? 'Profile updated successfully' : 'Profil zaktualizowany pomyślnie'
      });
      setEditing(false);
    } catch (err) {
      toast.error(t('error'), {
        description: err.response?.data?.detail || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      pesel: user?.pesel || '',
      date_of_birth: user?.date_of_birth || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setEditing(false);
  };

  return (
    <Layout>
      <div className="animate-fade-in max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold mb-2">{t('profile')}</h1>
            <p className="text-zinc-400">{t('personalInfo')}</p>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              data-testid="edit-profile-button"
              className="bg-white text-black hover:bg-zinc-200 rounded-sm"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {t('editProfile')}
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
          {/* Avatar Section */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-zinc-800 rounded-sm flex items-center justify-center">
                <User className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{user?.name}</h2>
                <p className="text-zinc-400 text-sm">{user?.email}</p>
                <span className={`status-badge mt-2 inline-block ${user?.role === 'admin' ? 'bg-[#dc143c]/20 text-[#dc143c]' : 'status-verified'}`}>
                  {user?.role === 'admin' ? 'Administrator' : t('verified')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('name')}</Label>
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="profile-name-input"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              ) : (
                <p className="text-white text-lg">{user?.name || '—'}</p>
              )}
            </div>

            {/* PESEL */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('pesel')}</Label>
              {editing ? (
                <Input
                  value={formData.pesel}
                  onChange={(e) => setFormData({ ...formData, pesel: e.target.value })}
                  data-testid="profile-pesel-input"
                  className="bg-zinc-950 border-zinc-800 text-white font-mono"
                  maxLength={11}
                />
              ) : (
                <p className="text-white text-lg font-mono">{user?.pesel || '—'}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('dateOfBirth')}</Label>
              {editing ? (
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  data-testid="profile-dob-input"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              ) : (
                <p className="text-white text-lg">{user?.date_of_birth || '—'}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('phone')}</Label>
              {editing ? (
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="profile-phone-input"
                  placeholder="+48 123 456 789"
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              ) : (
                <p className="text-white text-lg">{user?.phone || '—'}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('address')}</Label>
              {editing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="profile-address-input"
                  placeholder={language === 'en' ? 'Street, City, Postal Code' : 'Ulica, Miasto, Kod pocztowy'}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              ) : (
                <p className="text-white text-lg">{user?.address || '—'}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">{t('email')}</Label>
              <p className="text-white text-lg">{user?.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="p-6 border-t border-zinc-800 flex gap-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                data-testid="save-profile-button"
                className="bg-white text-black hover:bg-zinc-200 rounded-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? t('loading') : t('saveChanges')}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="cancel-edit-button"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-sm"
              >
                {t('cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
