'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { AttendanceStatus } from '@/types';
import { 
  QrCode, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  User,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

import { QrScanner } from '@/components/qr/QrScanner';

export default function AsistenciaKioscoPage() {
  const router = useRouter();
  const { 
    currentUser, 
    attendances, 
    students, 
    enrollments,
    registerAttendance,
    logout
  } = useApp();

  const [lastScannedTime, setLastScannedTime] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.fecha === todayStr);
  const totalHoy = todayAttendances.length;
  const aTiempo = todayAttendances.filter(a => a.estado === 'presente').length;
  const tardanzas = todayAttendances.filter(a => a.estado === 'tardanza').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-6 lg:p-8 select-none">
      
      {/* 1. Header del Kiosco */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white leading-tight flex items-center gap-2">
              Terminal de Control de Ingreso QR
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className="text-[11px] text-slate-400">
              ColeSistemaMini • Puerta Principal (2026)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Salir del Kiosco</span>
          </Link>
        </div>
      </header>

      {/* 2. Área Central del Escáner QR Real */}
      <main className="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 w-full max-w-xl mx-auto">
        <QrScanner 
          autoStart={true} 
          variant="kiosk" 
          onScanSuccess={(code) => {
            setLastScannedTime(new Date().toLocaleTimeString('es-PE'));
          }} 
        />
      </main>

      {/* 3. Footer con KPIs del Turno */}
      <footer className="grid grid-cols-3 gap-3 max-w-xl mx-auto w-full pt-4 border-t border-slate-800 text-center">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total del Día</span>
          <span className="text-xl font-black text-white">{totalHoy || 1225}</span>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">A Tiempo</span>
          <span className="text-xl font-black text-emerald-300">{aTiempo || 1183}</span>
        </div>
        <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Tardanzas</span>
          <span className="text-xl font-black text-amber-300">{tardanzas || 42}</span>
        </div>
      </footer>

    </div>
  );
}
