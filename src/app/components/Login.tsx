import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Building2, Globe2, Fingerprint, ScanFace, Activity, Eye, EyeOff } from 'lucide-react';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'biometric'>('password');
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const { t, i18n } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      localStorage.setItem('shopno_auth', JSON.stringify(response.data));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || t('login.error_invalid'));
    }
  };

  const handleBiometricLogin = () => {
    setIsScanning(true);
    setError('');
    
    // Simulate biometric scan delay
    setTimeout(async () => {
      // In a real app, this would call WebAuthn / Passkeys API
      try {
        const res = await api.post('/auth/login', { 
          email: 'admin@shopno.com', 
          password: 'shopno9965' 
        });
        setScanSuccess(true);
        setTimeout(() => {
          localStorage.setItem('shopno_auth', JSON.stringify(res.data));
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        setIsScanning(false);
        setError(t('login.error_biometric'));
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden selection:bg-primary/30 selection:text-primary">
      {/* Left side - Premium Branding */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden bg-slate-900 text-white">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-600/40 blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, 100, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tl from-blue-500/30 to-teal-400/30 blur-3xl"
          />
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 font-bold text-3xl tracking-tight text-white">
          {t('login.brand_name')}
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1 className="text-5xl font-extrabold mb-6 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-300">
              {t('login.hero_title_1')}<br/>{t('login.hero_title_2')}
            </h1>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed font-light">
              {t('login.hero_desc')}
            </p>
          </motion.div>
          
          <div className="space-y-6">
            {[
              { icon: Building2, text: t('login.feature_1'), delay: 0.4 },
              { icon: ShieldCheck, text: t('login.feature_2'), delay: 0.5 },
              { icon: Globe2, text: t('login.feature_3'), delay: 0.6 }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.delay, duration: 0.5 }}
                className="flex items-center gap-4 text-slate-200 group cursor-default"
              >
                <div className="p-3 bg-white/5 border border-white/10 text-blue-400 rounded-xl backdrop-blur-md group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                  <item.icon size={22} strokeWidth={1.5} />
                </div>
                <span className="font-medium tracking-wide">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-slate-400/80 font-medium">
          {t('login.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        
        {/* Language Toggle */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'bn' : 'en')}
            className="px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-200 text-sm font-bold text-slate-700 hover:text-primary hover:border-primary/30 hover:bg-slate-50 transition-all duration-200"
          >
            {i18n.language === 'en' ? 'বাংলা' : 'English'}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 backdrop-blur-xl"
        >
          <div className="lg:hidden flex items-center gap-2 font-bold text-2xl tracking-tight text-primary mb-10 justify-center">
            {t('login.brand_name')}
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">{t('login.welcome_back')}</h2>
            <p className="text-slate-500 font-medium">{t('login.sign_in_desc')}</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8 relative">
            <motion.div 
              layoutId="login-method-bg"
              className="absolute top-1 bottom-1 left-1 bg-white rounded-xl shadow-sm w-[calc(50%-4px)]"
              animate={{
                x: loginMethod === 'biometric' ? '100%' : '0%',
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button 
              onClick={() => { setLoginMethod('password'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 ${loginMethod === 'password' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Lock size={16} /> {t('login.password_tab')}
            </button>
            <button 
              onClick={() => { setLoginMethod('biometric'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 ${loginMethod === 'biometric' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ScanFace size={16} /> {t('login.biometric_tab')}
            </button>
          </div>

          <div className="min-h-[280px]">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error-msg"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3 font-medium"
                >
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {loginMethod === 'password' ? (
                <motion.form 
                  key="password-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin} 
                  className="space-y-6"
                >
                  <div className="space-y-5">
                    <div className="group relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{t('login.email_label')}</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                      </div>
                    </div>
                    
                    <div className="group relative">
                      <div className="flex justify-between items-center mb-2 ml-1 pr-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('login.password_label')}</label>
                        <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">{t('login.forgot_password')}</button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          className="w-full pl-12 pr-12 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] mt-8"
                  >
                    {t('login.sign_in_button')}
                    <ArrowRight size={18} className="ml-1" />
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div 
                  key="biometric-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-6 space-y-8 h-full"
                >
                  <div className="relative">
                    {/* Ripple effects when scanning */}
                    {isScanning && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0.8, scale: 1 }}
                          animate={{ opacity: 0, scale: 2.5 }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 bg-blue-500 rounded-full z-0"
                        />
                        <motion.div 
                          initial={{ opacity: 0.8, scale: 1 }}
                          animate={{ opacity: 0, scale: 2 }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          className="absolute inset-0 bg-indigo-500 rounded-full z-0"
                        />
                      </>
                    )}
                    
                    <motion.button
                      whileHover={!isScanning ? { scale: 1.05 } : {}}
                      whileTap={!isScanning ? { scale: 0.95 } : {}}
                      onClick={handleBiometricLogin}
                      disabled={isScanning || scanSuccess}
                      className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                        scanSuccess 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                          : isScanning
                            ? 'bg-white border-blue-500 text-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 shadow-inner'
                      }`}
                    >
                      {scanSuccess ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <ShieldCheck size={48} strokeWidth={2.5} />
                        </motion.div>
                      ) : isScanning ? (
                        <Activity size={48} strokeWidth={2} className="animate-pulse" />
                      ) : (
                        <Fingerprint size={56} strokeWidth={1.5} />
                      )}
                      
                      {/* Scanning Line */}
                      {isScanning && !scanSuccess && (
                        <motion.div 
                          animate={{ y: [-40, 40, -40] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute w-20 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70 blur-[1px]"
                        />
                      )}
                    </motion.button>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {scanSuccess ? t('login.biometric_title_success') : isScanning ? t('login.biometric_title_scanning') : t('login.biometric_title_default')}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium h-5">
                      {scanSuccess 
                        ? t('login.biometric_desc_success')
                        : isScanning 
                          ? t('login.biometric_desc_scanning') 
                          : t('login.biometric_desc_default')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100/60 text-center text-xs font-medium text-slate-500">
            Powered by <a href="https://www.rizqara.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Rizqara Tech</a>
          </div>
        </motion.div>
      </div>

      {/* Premium Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowForgotModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Password Reset</h3>
              <p className="text-slate-500 font-medium mb-8">
                For security reasons, please contact your system administrator to request a password reset.
              </p>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
