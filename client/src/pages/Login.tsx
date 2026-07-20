// client/src/pages/Login.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { motion } from 'framer-motion';
import { Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: '',
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanUsername = data.username ? String(data.username).trim().toLowerCase() : '';
      await login(cleanUsername, data.password);
      navigate('/');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.response?.data?.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/50 via-slate-950 to-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-md"
      >
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white font-extrabold text-2xl shadow-lg shadow-primary/30">SG</div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">{t('loginTitle')}</h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">{t('loginSub')}</p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400 font-medium"
          >
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('username')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  {...register('username', { required: true })}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900/30 py-2.5 pl-10 pr-4 text-sm !text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Enter username"
                />
              </div>
              {errors.username && <span className="text-[10px] text-red-400 mt-1 block">Username is required</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', { required: true })}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-900/30 py-2.5 pl-10 pr-10 text-sm !text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  placeholder="Enter security key"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-[10px] text-red-400 mt-1 block">Password is required</span>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white shadow-lg hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? 'Decrypting...' : t('decryptTerminal')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
