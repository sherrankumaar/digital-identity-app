import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Users, 
  BarChart3, 
  FileText, 
  Trash2, 
  Shield, 
  ShieldOff,
  Loader2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPage = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, complaintsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { headers, withCredentials: true }),
        axios.get(`${API_URL}/api/admin/complaints`, { headers, withCredentials: true }),
        axios.get(`${API_URL}/api/admin/stats`, { headers, withCredentials: true })
      ]);
      
      setUsers(usersRes.data.users || []);
      setComplaints(complaintsRes.data.complaints || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error(t('error'), { description: error.response?.data?.detail || error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`${language === 'en' ? 'Delete user' : 'Usuń użytkownika'} ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      toast.success(t('success'), { 
        description: language === 'en' ? 'User deleted successfully' : 'Użytkownik usunięty pomyślnie' 
      });
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || error.message });
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_URL}/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
      toast.success(t('success'), { 
        description: language === 'en' ? `User role updated to ${newRole}` : `Rola użytkownika zmieniona na ${newRole}` 
      });
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || error.message });
    }
  };

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_URL}/api/admin/complaints/${complaintId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
      toast.success(t('success'), { 
        description: language === 'en' ? 'Complaint status updated' : 'Status skargi zaktualizowany' 
      });
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || error.message });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'status-pending',
      under_review: 'bg-blue-500/20 text-blue-400',
      resolved: 'status-verified',
      rejected: 'status-rejected'
    };
    const labels = {
      submitted: language === 'en' ? 'Submitted' : 'Złożone',
      under_review: language === 'en' ? 'Under Review' : 'W Trakcie',
      resolved: language === 'en' ? 'Resolved' : 'Rozwiązane',
      rejected: t('rejected')
    };
    return (
      <span className={`status-badge ${styles[status] || styles.submitted}`}>
        {labels[status] || status}
      </span>
    );
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
          <div className="w-12 h-12 bg-[#dc143c]/10 rounded-sm flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#dc143c]" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">{t('admin')}</h1>
            <p className="text-zinc-400">
              {language === 'en' ? 'Manage users and system settings' : 'Zarządzaj użytkownikami i ustawieniami systemu'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('totalUsers')}</p>
              <p className="text-white text-2xl font-bold">{stats.total_users}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('adminUsers')}</p>
              <p className="text-white text-2xl font-bold">{stats.admin_users}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('regularUsers')}</p>
              <p className="text-white text-2xl font-bold">{stats.regular_users}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('totalComplaints')}</p>
              <p className="text-white text-2xl font-bold">{stats.total_complaints}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{t('pendingComplaints')}</p>
              <p className="text-yellow-400 text-2xl font-bold">{stats.pending_complaints}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
            <TabsTrigger 
              value="users" 
              data-testid="admin-tab-users"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              {t('userManagement')}
            </TabsTrigger>
            <TabsTrigger 
              value="complaints" 
              data-testid="admin-tab-complaints"
              className="data-[state=active]:bg-white data-[state=active]:text-black rounded-sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('allComplaints')}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">{t('name')}</TableHead>
                      <TableHead className="text-zinc-400">{t('email')}</TableHead>
                      <TableHead className="text-zinc-400">{t('pesel')}</TableHead>
                      <TableHead className="text-zinc-400">{t('role')}</TableHead>
                      <TableHead className="text-zinc-400 text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow 
                        key={user._id || index}
                        data-testid={`user-row-${index}`}
                        className="border-zinc-800 hover:bg-zinc-800/50"
                      >
                        <TableCell className="text-white font-medium">{user.name}</TableCell>
                        <TableCell className="text-zinc-300">{user.email}</TableCell>
                        <TableCell className="text-zinc-300 font-mono">{user.pesel || '—'}</TableCell>
                        <TableCell>
                          <span className={`status-badge ${user.role === 'admin' ? 'bg-[#dc143c]/20 text-[#dc143c]' : 'status-verified'}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRole(user._id, user.role)}
                              data-testid={`toggle-role-${index}`}
                              className="text-zinc-400 hover:text-white"
                            >
                              {user.role === 'admin' ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              data-testid={`delete-user-${index}`}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints">
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
                    data-testid={`admin-complaint-${index}`}
                    className="bg-zinc-900 border border-zinc-800 rounded-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-bold">{complaint.title}</h3>
                        <p className="text-zinc-500 text-sm">
                          {complaint.reference_number} | {language === 'en' ? 'By' : 'Od'}: {complaint.user_name}
                        </p>
                      </div>
                      {getStatusBadge(complaint.status)}
                    </div>
                    
                    <p className="text-zinc-400 text-sm mb-4">{complaint.description}</p>
                    
                    <div className="flex items-center gap-4 text-zinc-500 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {complaint.created_at?.split('T')[0]}
                      </div>
                      <span className="px-2 py-1 bg-zinc-800 rounded-sm text-xs uppercase">
                        {complaint.category}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateComplaintStatus(complaint.complaint_id, 'under_review')}
                        data-testid={`review-complaint-${index}`}
                        className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                      >
                        {language === 'en' ? 'Review' : 'Rozpatrz'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateComplaintStatus(complaint.complaint_id, 'resolved')}
                        data-testid={`resolve-complaint-${index}`}
                        className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                      >
                        {language === 'en' ? 'Resolve' : 'Rozwiąż'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateComplaintStatus(complaint.complaint_id, 'rejected')}
                        data-testid={`reject-complaint-${index}`}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                      >
                        {language === 'en' ? 'Reject' : 'Odrzuć'}
                      </Button>
                    </div>
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

export default AdminPage;
