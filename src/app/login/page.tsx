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
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
      defaultPass: 'admin123',
      destRoute: '/admin',
      icon: ShieldCheck,
      color: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-600',
    },
    {
      user: MOCK_USERS.find(u => u.rol === 'docente') || MOCK_USERS[1],
      roleLabel: 'Docente',
      defaultPass: 'docente123',
      destRoute: '/docente',
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      activeBg: 'bg-blue-600',
    },
    {
      user: MOCK_USERS.find(u => u.rol === 'estudiante') || MOCK_USERS[8],
      roleLabel: 'Estudiante',
      defaultPass: 'alumno123',
      destRoute: '/estudiante',
      icon: User,
      color: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-600',
    },
  ];

  const handleSelectAccount = (acc: typeof demoAccounts[0]) => {
    setSelectedUser(acc.user);
    setEmail(acc.user.email || '');
    setPassword(acc.defaultPass);
    setErrorMessage('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const foundUser = MOCK_USERS.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    ) || selectedUser;

    setTimeout(() => {
      setCurrentUser(foundUser);
      confetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b'],
      });
      setIsLoading(false);
      if (foundUser.rol === 'admin') router.push('/admin');
      else if (foundUser.rol === 'docente') router.push('/docente');
      else router.push('/estudiante');
    }, 600);
  };

  const features = [
    { icon: QrCode, label: 'Asistencia QR', desc: 'Registro instantáneo con cámara' },
    { icon: Award, label: 'Notas AD–A–B–C', desc: 'Sistema por competencias' },
    { icon: ClipboardCheck, label: 'Portal completo', desc: 'Admin, Docente y Alumno' },
  ];

  return (
    /* Full-screen page, no Navbar/Sidebar — uses its own layout */
    <div className="fixed inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 overflow-auto">
      
      {/* Decorative blobs behind the card */}
      <div className="fixed top-0 left-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Main split card */}
      <div className="relative w-full max-w-5xl min-h-[560px] flex rounded-3xl overflow-hidden shadow-2xl shadow-violet-900/30 animate-slide-up">

        {/* ——— LEFT PANEL: Purple brand side ——— */}
        <div className="hidden md:flex md:w-[45%] flex-col justify-between relative bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-700 p-10 overflow-hidden">
          
          {/* Decorative dots / circles */}
          <div className="absolute top-8 right-8 w-24 h-24 rounded-full border-4 border-white/10 pointer-events-none" />
          <div className="absolute top-16 right-16 w-10 h-10 rounded-full border-2 border-white/15 pointer-events-none" />
          <div className="absolute bottom-10 left-6 w-16 h-16 rounded-full border-4 border-white/10 pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-black text-base tracking-tight">
                ColeSistema<span className="text-emerald-300">Mini</span>
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-white font-black text-3xl leading-tight">
              GESTIÓN ESCOLAR
              <span className="block text-emerald-300">INTELIGENTE.</span>
            </h2>
            <p className="text-violet-200 text-sm leading-relaxed">
              Sistema moderno con asistencia QR, calificaciones AD–A–B–C y portales para toda la comunidad educativa.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative z-10 flex justify-center my-4">
            <Image
              src="/login-illustration.jpg"
              alt="Libros, laptop y birrete educativo"
              width={360}
              height={270}
              className="object-contain drop-shadow-2xl rounded-2xl"
              priority
            />
          </div>

          {/* Feature pills */}
          <div className="relative z-10 flex flex-wrap gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                <Icon className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-white leading-none">{label}</p>
                  <p className="text-[10px] text-violet-200">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ——— RIGHT PANEL: White form side ——— */}
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col justify-center p-8 sm:p-12">
          
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">
              ColeSistema<span className="text-emerald-500">Mini</span>
            </span>
          </div>

          <div className="max-w-sm w-full mx-auto space-y-7">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ¿No tienes cuenta?{' '}
                <span className="font-bold text-violet-600 cursor-pointer hover:text-violet-700">
                  Contacta al administrador
                </span>
              </p>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tipo de usuario
              </p>
              <div className="flex gap-2">
                {demoAccounts.map((acc) => {
                  const isSelected = selectedUser.id === acc.user.id;
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.user.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${acc.activeBg} border-transparent text-white shadow-lg`
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {acc.roleLabel}
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Correo o Usuario
                </label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    placeholder="usuario@colegio.edu.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-slate-300 dark:border-slate-600 focus:border-violet-600 dark:focus:border-violet-400 text-slate-900 dark:text-white text-sm font-medium outline-none transition-colors placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-0 py-2 pr-8 bg-transparent border-0 border-b-2 border-slate-300 dark:border-slate-600 focus:border-violet-600 dark:focus:border-violet-400 text-slate-900 dark:text-white text-sm font-medium outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-violet-600 rounded" />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="font-semibold text-slate-500 hover:text-violet-600 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Redirect notice */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-400">
                  Destino:{' '}
                  <span className="font-bold text-violet-600 dark:text-violet-400">
                    {selectedUser.rol === 'admin' && 'Dashboard Administrador'}
                    {selectedUser.rol === 'docente' && 'Panel Docente'}
                    {selectedUser.rol === 'estudiante' && 'Portal Alumno'}
                  </span>
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer tagline */}
            <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              DONDE SEA TU META — TE LLEVAMOS AHÍ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
