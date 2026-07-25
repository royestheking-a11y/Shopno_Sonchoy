import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Lock, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
export function Settings({ user }: { user: any }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passStatus, setPassStatus] = useState('');
  const [userData, setUserData] = useState(user);
  const [interestRate, setInterestRate] = useState(5);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Fetch fresh user data
    api.get(`/users/${user.id || user._id}`)
      .then(res => setUserData(res.data))
      .catch(console.error);
      
    if (user.role === 'admin') {
      api.get('/settings')
        .then(res => setInterestRate(res.data.globalInterestRate || 5))
        .catch(console.error);
    }
  }, [user]);

  const handleSaveAdminSettings = async () => {
    try {
      setSaveStatus('Saving...');
      await api.put('/settings', { globalInterestRate: interestRate });
      setSaveStatus('Settings updated successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err: any) {
      setSaveStatus(err.response?.data?.message || 'Error updating settings');
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setPassStatus('Passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      setPassStatus('Password must be at least 6 characters');
      return;
    }
    try {
      setPassStatus('Updating...');
      await api.put(`/users/${user.id || user._id}/password`, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setPassStatus('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setPassStatus(''), 3000);
    } catch (err: any) {
      setPassStatus(err.response?.data?.message || 'Error updating password');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <User size={18} /> {t('settings.tab_profile')}
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'security' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Shield size={18} /> {t('settings.tab_security')}
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Bell size={18} /> {t('settings.tab_notifications')}
          </button>
          {user.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'admin' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <User size={18} /> Admin Settings
            </button>
          )}
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 p-6 sm:p-8">
          
          {activeTab === 'profile' && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.personal_info')}</h3>
              <div className="flex items-center gap-6 mb-6">
                <img 
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userData.email || userData.name}&backgroundColor=e2e8f0,c7d2fe,fde68a`} 
                  alt="Auto Avatar" 
                  className="w-20 h-20 rounded-2xl border border-primary/20 bg-primary/5 object-cover shadow-sm" 
                />
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 text-xs font-bold mb-2 border border-amber-300">
                    Premium Auto Avatar
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your premium avatar is automatically generated. No upload needed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.full_name')}</label>
                  <input type="text" defaultValue={userData.name} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.member_id_role')}</label>
                  <input type="text" defaultValue={userData.memberId || userData.id || userData._id} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.email')}</label>
                  <input type="email" defaultValue={userData.email} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.phone')}</label>
                  <input type="text" defaultValue={userData.phone || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alternate Phone</label>
                  <input type="text" defaultValue={userData.alternatePhone || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">NID Number</label>
                  <input type="text" defaultValue={userData.nidNumber || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
                  <input type="text" defaultValue={userData.address || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nominee Name</label>
                  <input type="text" defaultValue={userData.nomineeName || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nominee Phone</label>
                  <input type="text" defaultValue={userData.nomineePhone || '-'} disabled className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.change_password')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.current_password')}</label>
                  <div className="relative">
                    <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.new_password')}</label>
                  <div className="relative">
                    <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('settings.confirm_password')}</label>
                  <div className="relative">
                    <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                {passStatus && (
                  <p className={`text-sm ${passStatus.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                    {passStatus}
                  </p>
                )}
                <button onClick={handlePasswordChange} className="mt-4 flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                  <Save size={18} /> Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-xl space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('settings.notification_prefs')}</h3>
              <div className="space-y-4">
                {[
                  { title: t('settings.email_notifs'), desc: t('settings.email_notifs_desc') },
                  { title: t('settings.sms_alerts'), desc: t('settings.sms_alerts_desc') },
                  { title: t('settings.marketing_updates'), desc: t('settings.marketing_updates_desc') }
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && user.role === 'admin' && (
            <div className="max-w-xl space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Platform Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Global Loan Interest Rate (%)</label>
                  <input 
                    type="number" 
                    value={interestRate} 
                    onChange={e => setInterestRate(parseFloat(e.target.value))} 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" 
                  />
                  <p className="text-xs text-slate-500 mt-2">This applies to all new loans requested by members.</p>
                </div>
                
                {saveStatus && (
                  <p className={`text-sm ${saveStatus.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                    {saveStatus}
                  </p>
                )}
                <button onClick={handleSaveAdminSettings} className="mt-4 flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                  <Save size={18} /> Update Settings
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'security' && (
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-slate-700 flex justify-end">
              <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                <Save size={18} />
                {t('settings.save_changes')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
