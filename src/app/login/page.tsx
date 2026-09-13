'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { MOCK_USERS } from '@/lib/mock-data';
import Image from 'next/image';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye,
  EyeOff,
  CheckCircle2,
  QrCode,
  Award,
  ClipboardCheck,
  Sparkles,
  School,
  KeyRound,
  Shield,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { loginWithCredentials } from '@/lib/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useApp();

  const [email, setEmail] = useState('admin@colegio.edu.pe');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const demoAccounts = [
    {
      user: MOCK_USERS.find(u => u.rol === 'admin') || MOCK_USERS[0],
      roleLabel: 'Administrador',
      subtitle: 'Dirección & Gestión',
      defaultPass: 'admin123',
      destRoute: '/admin',
      icon: ShieldCheck,
      color: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20',
      tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    },
    {
      user: MOCK_USERS.find(u => u.rol === 'docente') || MOCK_USERS[1],
      roleLabel: 'Docente',
      subtitle: 'Notas & Asistencia',
      defaultPass: 'profesor123',
      destRoute: '/docente',
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20',
      tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      user: MOCK_USERS.find(u => u.rol === 'estudiante') || MOCK_USERS[8],
      roleLabel: 'Estudiante',
      subtitle: 'Carnet QR & Libreta',
      defaultPass: 'alumno123',
      destRoute: '/estudiante',
      icon: User,
      color: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20',
      tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      user: MOCK_USERS.find(u => u.rol === 'asistencia') || MOCK_USERS[1],
      roleLabel: 'Portería / QR',
      subtitle: 'Control en Puerta',
      defaultPass: 'porteria123',
      destRoute: '/asistencia',
      icon: QrCode,
      color: 'text-amber-600 dark:text-amber-400',
      activeBg: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20',
      tagColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
  ];

  const handleSelectAccount = (acc: typeof demoAccounts[0]) => {
    setSelectedUser(acc.user);
    setEmail(acc.user.email || '');
    setPassword(acc.defaultPass);
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const { user, error } = await loginWithCredentials(email.trim(), password);

    if (error || !user) {
      setIsLoading(false);
      setErrorMessage(error || 'Credenciales inválidas. Por favor verifica tus datos.');
      return;
    }

    setCurrentUser(user);
    if (typeof document !== 'undefined') {
      document.cookie = `cole_user_role=${user.rol}; path=/; max-age=604800; SameSite=Lax`;
    }

    confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b'],
    });

    setIsLoading(false);
    router.push('/bienvenida');
  };

  const features = [
    { icon: QrCode, label: 'Asistencia QR', desc: 'Registro instantáneo con cámara' },
    { icon: Award, label: 'Notas AD–A–B–C', desc: 'Sistema por competencias' },
    { icon: ClipboardCheck, label: 'Portal completo', desc: 'Admin, Docente y Alumno' },
  ];

  const activeDemo = demoAccounts.find(d => d.user.id === selectedUser.id) || demoAccounts[0];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-6 md:p-8 relative overflow-x-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="fixed top-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-violet-500/15 rounded-full blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="fixed bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Main split card */}
      <div className="relative w-full max-w-5xl rounded-3xl md:rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-950/15 dark:shadow-black/50 border border-white/60 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row transition-all duration-300">

        {/* ——— MOBILE ONLY TOP HERO BANNER (< 768px) ——— */}
        <div className="md:hidden relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-700 p-6 text-white overflow-hidden">
          {/* Subtle circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-emerald-400/20 rounded-full blur-lg pointer-events-none -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
                <GraduationCap className="w-5 h-5 text-white drop-shadow" />
              </div>
              <div>
                <span className="text-white font-black text-lg tracking-tight block leading-tight">
                  ColeSistema<span className="text-emerald-300">Mini</span>
                </span>
                <span className="text-[11px] text-violet-200 font-medium">
                  Portal de Gestión Escolar
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              2026
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="text-xl font-extrabold text-white leading-tight">
              Bienvenido de nuevo 👋
            </h2>
            <p className="text-xs text-violet-100/90 mt-0.5">
              Selecciona tu tipo de cuenta o escribe tus credenciales.
            </p>
          </div>
        </div>

        {/* ——— DESKTOP ONLY LEFT PANEL: Purple brand showcase (>= 768px) ——— */}
        <div className="hidden md:flex md:w-[45%] flex-col justify-between relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-10 text-white overflow-hidden">
          
          {/* Decorative shapes */}
          <div className="absolute top-8 right-8 w-28 h-28 rounded-full border-4 border-white/10 pointer-events-none" />
          <div className="absolute top-20 right-20 w-12 h-12 rounded-full border-2 border-white/15 pointer-events-none" />
          <div className="absolute bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-black text-xl tracking-tight block">
                  ColeSistema<span className="text-emerald-300">Mini</span>
                </span>
                <span className="text-xs text-violet-200">Educación & Tecnología</span>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10 space-y-3 my-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma Integral 2026
            </div>
            <h2 className="text-white font-black text-3xl leading-tight">
              GESTIÓN ESCOLAR
              <span className="block text-emerald-300">INTELIGENTE.</span>
            </h2>
            <p className="text-violet-200 text-sm leading-relaxed">
              Control de asistencia QR, calificaciones CNEB (AD–A–B–C), horarios interactivos y portales adaptados para cada rol.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative z-10 flex justify-center my-2">
            <Image
              src="/login-illustration.jpg"
              alt="Educación digital y escolar"
              width={340}
              height={240}
              className="object-contain drop-shadow-2xl rounded-2xl border border-white/15"
              priority
            />
          </div>

          {/* Feature pills */}
          <div className="relative z-10 grid grid-cols-1 gap-2 pt-2">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-7 h-7 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{label}</p>
                  <p className="text-[11px] text-violet-200">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ——— FORM CONTAINER (Responsive Mobile & Desktop) ——— */}
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col justify-center p-5 sm:p-8 md:p-12">
          
          <div className="max-w-md w-full mx-auto space-y-5 sm:space-y-6">
            
            {/* Desktop header title */}
            <div className="hidden md:block">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selecciona tu perfil de prueba o escribe tus credenciales.
              </p>
            </div>

            {/* Role Quick Selector (2x2 grid on mobile, 4 columns on desktop) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Seleccionar Perfil Demo (1-Click)
                </span>
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                  Acceso Rápido
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {demoAccounts.map((acc) => {
                  const isSelected = selectedUser.id === acc.user.id;
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.user.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`relative flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none active:scale-95 min-h-[72px] sm:min-h-[82px] ${
                        isSelected
                          ? `${acc.activeBg}`
                          : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-colors ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 shadow-sm ' + acc.color
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <span className="text-xs font-bold leading-tight line-clamp-1">
                        {acc.roleLabel}
                      </span>
                      
                      <span className={`text-[9px] leading-tight line-clamp-1 mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {acc.subtitle}
                      </span>

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-4.5">
              
              {/* Email / Username field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Correo Electrónico o Usuario
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="usuario@colegio.edu.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 dark:focus:border-violet-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Contraseña
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setPassword(activeDemo.defaultPass)}
                    className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Restablecer pass demo
                  </button>
                </div>
                
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 dark:focus:border-violet-400 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 accent-violet-600 rounded cursor-pointer" 
                  />
                  <span className="font-medium">Mantener sesión iniciada</span>
                </label>
                <span className="text-[11px] text-slate-400">v2.0 WebApp</span>
              </div>

              {/* Error box */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium animate-shake">
                  {errorMessage}
                </div>
              )}

              {/* Destination badge summary */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <School className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Destino tras ingresar:
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedUser.rol === 'admin' && 'Dashboard Director / Administrador'}
                      {selectedUser.rol === 'docente' && 'Panel Docente & Asistencia'}
                      {selectedUser.rol === 'estudiante' && 'Portal Alumno & Carnet QR'}
                      {selectedUser.rol === 'asistencia' && 'Terminal Portería Móvil QR'}
                    </span>
                  </div>
                </div>

                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-xl shadow-violet-600/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando usuario...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Mobile Footer / Security Note */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Acceso Seguro SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-violet-500" />
                <span>100% Móvil & PWA</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
