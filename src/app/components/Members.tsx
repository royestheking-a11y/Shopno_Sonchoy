import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Filter, Download, Edit, Key, Trash2, X, ShieldCheck, Copy, CheckCircle } from 'lucide-react';
import { cn } from './Layout';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';
import { generateMembersReport } from '../../utils/pdfGenerator';
import { Skeleton } from './ui/skeleton';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-[#E5E7EB] dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export function Members() {
  const { t } = useTranslation();
  const { updateTicker } = useSocket();
  const [members, setMembers] = useState<any[]>([]);
  const [profitShare, setProfitShare] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isAddDepositModalOpen, setIsAddDepositModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSort, setFilterSort] = useState('all');

  // Form states
  const emptyForm = { 
    name: '', email: '', phone: '', alternatePhone: '', 
    address: '', nidNumber: '', nomineeName: '', nomineePhone: '', password: '' 
  };
  const [formData, setFormData] = useState(emptyForm);
  const [generatedCreds, setGeneratedCreds] = useState({ email: '', password: '' });

  useEffect(() => {
    fetchMembers();
  }, [updateTicker]);

  const fetchMembers = async () => {
    try {
      const [res, profitRes] = await Promise.all([
        api.get('/users'),
        api.get('/loans/system-profit')
      ]);
      setMembers(res.data.filter((u: any) => u.role === 'member'));
      
      const { totalProfit, activeMembers } = profitRes.data;
      if (activeMembers > 0) {
        setProfitShare(parseFloat((totalProfit / activeMembers).toFixed(2)));
      } else {
        setProfitShare(0);
      }
    } catch (err) {
      console.error('Failed to fetch members', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (member: any) => {
    setSelectedMember(member);
    setFormData({ 
      name: member.name, 
      email: member.email, 
      phone: member.phone || '', 
      alternatePhone: member.alternatePhone || '',
      address: member.address || '',
      nidNumber: member.nidNumber || '',
      nomineeName: member.nomineeName || '',
      nomineePhone: member.nomineePhone || '',
      password: '' 
    });
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleOpenPassword = (member: any) => {
    setSelectedMember(member);
    setFormData({ ...emptyForm, password: '' });
    setIsPasswordModalOpen(true);
    setActiveDropdown(null);
  };

  const handleOpenAddDeposit = (member: any) => {
    setSelectedMember(member);
    setDepositAmount('');
    setDepositDate(new Date().toISOString().split('T')[0]); // Default to today
    setIsAddDepositModalOpen(true);
    setActiveDropdown(null);
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
  };

  const handleSaveNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `M-${Math.floor(Math.random() * 10000) + 1000}`;
    const newPassword = generatePassword();

    try {
      await api.post('/auth/register', {
        memberId: newId,
        role: 'member',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        address: formData.address,
        nidNumber: formData.nidNumber,
        nomineeName: formData.nomineeName,
        nomineePhone: formData.nomineePhone,
        password: newPassword
      });
      
      setIsAddModalOpen(false);
      setGeneratedCreds({ email: formData.email, password: newPassword });
      setIsCredentialsModalOpen(true);
      
      fetchMembers();
      setFormData(emptyForm);
    } catch (err: any) {
      console.error('Failed to create member', err);
      toast.error(err.response?.data?.message || 'Error creating member');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedMember._id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        address: formData.address,
        nidNumber: formData.nidNumber,
        nomineeName: formData.nomineeName,
        nomineePhone: formData.nomineePhone,
      });
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      console.error('Failed to update member', err);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const memberId = selectedMember._id || selectedMember.id;
      await api.put(`/users/${memberId}/password`, {
        newPassword: formData.password
      });
      toast.success(t('admin_members.alert_reset_backend') || 'Password updated successfully!');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      console.error('Failed to reset password', err);
      toast.error(err.response?.data?.message || 'Error updating password');
    }
  };

  const handleAdminAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      const memberId = selectedMember._id || selectedMember.id;
      await api.post('/deposits/admin-bypass', {
        userId: memberId,
        amount: Number(depositAmount),
        date: new Date(depositDate).toISOString(),
        method: 'admin_bypass',
        reference: 'Admin Direct Add'
      });
      toast.success(`Deposit of ৳${depositAmount} added and auto-approved successfully!`);
      setIsAddDepositModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      console.error('Failed to add deposit', err);
      toast.error(err.response?.data?.error || 'Error adding deposit');
    }
  };

  const copyCredentials = () => {
    const text = `Email: ${generatedCreds.email}\nPassword: ${generatedCreds.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.memberId && m.memberId.toLowerCase().includes(search.toLowerCase())) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (filterSort === 'balance_high') {
    filteredMembers.sort((a, b) => (b.balance || 0) - (a.balance || 0));
  } else if (filterSort === 'loan_high') {
    filteredMembers.sort((a, b) => (b.loanBalance || 0) - (a.loanBalance || 0));
  } else if (filterSort === 'active_loan') {
    filteredMembers = filteredMembers.filter(m => (m.loanBalance || 0) > 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('admin_members.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin_members.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => generateMembersReport(filteredMembers, t, profitShare)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <Download size={16} /> {t('admin_members.export')}
          </button>
          <button 
            onClick={() => { setFormData(emptyForm); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors shadow-md shadow-primary/20"
          >
            <Plus size={16} /> {t('admin_members.create_account')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md w-full">
            <input 
              type="text" 
              placeholder={t('admin_members.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary outline-none rounded-xl text-sm transition-all"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <Filter size={16} /> {filterSort === 'all' ? t('admin_members.filters') : filterSort === 'balance_high' ? 'High Balance' : filterSort === 'loan_high' ? 'High Loan' : 'Has Active Loan'}
            </button>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-slate-700 py-1 overflow-hidden">
                  <button onClick={() => { setFilterSort('all'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">Clear Filters</button>
                  <button onClick={() => { setFilterSort('balance_high'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">Highest Balance First</button>
                  <button onClick={() => { setFilterSort('loan_high'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">Highest Loan First</button>
                  <button onClick={() => { setFilterSort('active_loan'); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50">Has Active Loan Only</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium border-b border-[#E5E7EB] dark:border-slate-700">
                <th className="px-6 py-4">{t('admin_members.col_member_info')}</th>
                <th className="px-6 py-4">{t('admin_members.col_id_contact')}</th>
                <th className="px-6 py-4">{t('admin_members.col_wallet_balance')}</th>
                <th className="px-6 py-4">{t('admin_members.col_loan_balance')}</th>
                <th className="px-6 py-4 text-right">{t('admin_members.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-28" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
                    <p>{t('admin_members.no_members')}</p>
                  </td>
                </tr>
              ) : filteredMembers.map((member) => (
                <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{member.name}</span>
                        <span className="text-xs text-slate-500">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 dark:text-slate-300 block">{member.memberId}</span>
                    <span className="text-xs text-slate-500">{member.phone || t('admin_members.no_phone')}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-success">
                    <div className="flex flex-col">
                      <span>৳ {((member.balance || 0) + profitShare).toLocaleString()}</span>
                      {profitShare > 0 && (
                         <span className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70">
                           +৳ {profitShare.toLocaleString()} profit
                         </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-amber-600">৳ {(member.loanBalance || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === member._id ? null : member._id)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeDropdown === member._id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                        <div className="absolute right-8 top-12 z-50 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-slate-700 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={() => handleOpenAddDeposit(member)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                            <Plus size={16} /> Add Deposit
                          </button>
                          <button onClick={() => handleOpenEdit(member)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <Edit size={16} /> {t('admin_members.edit_profile')}
                          </button>
                          <button onClick={() => handleOpenPassword(member)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                            <Key size={16} /> {t('admin_members.reset_password')}
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('admin_members.modal_create_title')}>
        <form onSubmit={handleSaveNewMember} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_full_name')}</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_email')}</label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="john@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_phone')}</label>
              <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="01711000000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_alt_phone')}</label>
              <input type="text" value={formData.alternatePhone} onChange={(e) => setFormData({...formData, alternatePhone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="01811000000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_nid')}</label>
            <input required type="text" value={formData.nidNumber} onChange={(e) => setFormData({...formData, nidNumber: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="1234567890" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_address')}</label>
            <textarea required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white resize-none h-20" placeholder="Full Address"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_nominee_name')}</label>
              <input required type="text" value={formData.nomineeName} onChange={(e) => setFormData({...formData, nomineeName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_nominee_phone')}</label>
              <input required type="text" value={formData.nomineePhone} onChange={(e) => setFormData({...formData, nomineePhone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="01911000000" />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-primary/10 text-primary-dark dark:text-primary rounded-xl text-sm">
            <ShieldCheck size={18} className="inline mr-2" />
            {t('admin_members.auto_password_msg')}
          </div>

          <button type="submit" className="w-full mt-6 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition-all shadow-md">{t('admin_members.create_account')}</button>
        </form>
      </Modal>

      {/* Generated Credentials Modal */}
      <Modal isOpen={isCredentialsModalOpen} onClose={() => setIsCredentialsModalOpen(false)} title={t('admin_members.modal_created_title')}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            {t('admin_members.created_msg')}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-slate-700 pb-3">
            <span className="text-sm font-medium text-slate-500">{t('admin_members.lbl_email_colon')}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{generatedCreds.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">{t('admin_members.lbl_password_colon')}</span>
            <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-widest">{generatedCreds.password}</span>
          </div>
        </div>

        <button 
          onClick={copyCredentials} 
          className={cn(
            "w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
            copied ? "bg-success text-white" : "bg-primary hover:bg-primary-dark text-white shadow-md"
          )}
        >
          {copied ? <><CheckCircle size={18} /> {t('admin_members.copied')}</> : <><Copy size={18} /> {t('admin_members.copy_credentials')}</>}
        </button>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('admin_members.modal_edit_title')}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_full_name')}</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_email')}</label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_phone')}</label>
              <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_alt_phone')}</label>
              <input type="text" value={formData.alternatePhone} onChange={(e) => setFormData({...formData, alternatePhone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_nid')}</label>
            <input required type="text" value={formData.nidNumber} onChange={(e) => setFormData({...formData, nidNumber: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_address')}</label>
            <textarea required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white resize-none h-20"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_nominee_name')}</label>
              <input required type="text" value={formData.nomineeName} onChange={(e) => setFormData({...formData, nomineeName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_nominee_phone')}</label>
              <input required type="text" value={formData.nomineePhone} onChange={(e) => setFormData({...formData, nomineePhone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
            </div>
          </div>

          <button type="submit" className="w-full mt-6 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition-all">{t('admin_members.save_changes')}</button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={t('admin_members.modal_reset_title')}>
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-lg flex gap-2 items-start">
          <ShieldCheck className="shrink-0 mt-0.5" size={16} />
          <p>{t('admin_members.reset_warning')} <strong>{selectedMember?.name}</strong>.</p>
        </div>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{t('admin_members.lbl_new_password')}</label>
            <input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition-all">{t('admin_members.confirm_reset')}</button>
        </form>
      </Modal>

      {/* Add Deposit Modal */}
      <Modal isOpen={isAddDepositModalOpen} onClose={() => setIsAddDepositModalOpen(false)} title={`Add Deposit for ${selectedMember?.name}`}>
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-sm rounded-lg flex gap-2 items-start">
          <ShieldCheck className="shrink-0 mt-0.5" size={16} />
          <p>This will create and auto-approve a deposit, bypassing standard member requests.</p>
        </div>
        <form onSubmit={handleAdminAddDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Deposit Date</label>
            <input required type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Amount (৳)</label>
            <input required type="number" min="1" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary dark:text-white" placeholder="500" />
          </div>
          <button type="submit" className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md">Add & Approve Deposit</button>
        </form>
      </Modal>

    </div>
  );
}
