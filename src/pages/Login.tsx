import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface LoginFormInputs {
  username: string;
  passcode: string;
  rememberMe: boolean;
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    defaultValues: {
      username: "",
      passcode: "",
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const ok = await login(data.username, data.passcode, data.rememberMe);
      if (!ok) {
        setError(t("invalidCredentials"));
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setRecoverySent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Floating Theme & Language Toolbar */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "mr" : "en")}
          className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-white transition-all shadow-md"
        >
          {language === "en" ? "मराठी" : "English"}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white transition-all shadow-md"
          title="Toggle Theme"
        >
          {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Background blobs for premium glassmorphism effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10 text-white"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent text-center">
            {t("loginTitle")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t("loginSub")}</p>
        </div>

        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.form 
              key="login-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-5"
            >
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">{t("username")}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("username", { required: "Username is required" })}
                    placeholder="Enter security officer username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-750 bg-slate-950/40 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
                {errors.username && <p className="text-rose-400 text-[11px] mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{t("password")}</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-primary hover:text-primary-foreground transition-colors font-medium"
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("passcode", { required: "Password is required" })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-750 bg-slate-950/40 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.passcode && <p className="text-rose-400 text-[11px] mt-1">{errors.passcode.message}</p>}
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-slate-750 bg-slate-950/40 text-primary focus:ring-primary focus:ring-offset-slate-900"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs text-slate-300 cursor-pointer select-none">
                  {t("rememberMe")}
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-650 text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{t("decryptTerminal")}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>


            </motion.form>
          ) : (
            <motion.form 
              key="forgot-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleForgotSubmit} 
              className="space-y-5"
            >
              <div className="text-center mb-2">
                <h3 className="font-semibold text-sm text-slate-200">Terminal Recovery</h3>
                <p className="text-xs text-slate-400 mt-1">Enter your registered email address to reset your passcode.</p>
              </div>

              {recoverySent ? (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs leading-relaxed">
                  Passcode recovery instructions have been successfully dispatched to your email address. Please check your inbox.
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="officer@smartguard.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-750 bg-slate-950/40 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              )}

              {!recoverySent ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-colors"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatch Instructions"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setRecoverySent(false);
                  setRecoveryEmail("");
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 font-medium"
              >
                Back to Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
