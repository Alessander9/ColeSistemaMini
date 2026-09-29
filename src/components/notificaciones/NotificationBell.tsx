'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AppNotification } from '@/types';
import { Bell, BookOpen, Award, Check, CheckCheck, ChevronRight, Clock, Megaphone, QrCode, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TypeKey = AppNotification['tipo'];
type FilterKey = 'todas' | TypeKey;

// Cada tipo de aviso con su color, ícono y nombre en palabras simples
const TYPE_INFO: Record<TypeKey, { label: string; icon: React.ElementType; box: string; chip: string; bar: string }> = {
  tarea: { label: 'Tareas', icon: BookOpen, box: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300', chip: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200', bar: 'bg-purple-500' },
  nota: { label: 'Notas y evaluaciones', icon: Award, box: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200', bar: 'bg-blue-500' },
  asistencia: { label: 'Asistencia', icon: QrCode, box: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200', bar: 'bg-emerald-500' },
  comunicado: { label: 'Comunicados', icon: Megaphone, box: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300', chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200', bar: 'bg-amber-500' },
};
const typeInfo = (t: string) => TYPE_INFO[t as TypeKey] || TYPE_INFO.comunicado;

// Qué hace el botón según a dónde lleva el aviso
function actionLabel(url?: string) {
  if (!url) return null;
  if (url.includes('/docente/tareas')) return 'Ver entregas';
  if (url.includes('/docente/notas')) return 'Ir a notas';
  if (url.includes('/docente/evaluaciones') || url.includes('/evaluaciones')) return 'Ver evaluación';
  if (url.includes('asistencia')) return 'Ver asistencia';
  if (url.includes('tutoria')) return 'Ir a tutoría';
  if (url.includes('tareas')) return 'Ver tarea';
  if (url.includes('notas') || url.includes('libreta')) return 'Ver notas';
  if (url.includes('comunicado')) return 'Leer comunicado';
  return 'Ver detalles';
}

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

// Agrupa por "Hoy", "Ayer", "Esta semana" y "Antes"
function groupLabel(dateStr: string, now: Date) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Antes';
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return 'Esta semana';
  return 'Antes';
}

function timeText(dateStr: string, now: Date) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

export function NotificationBell() {
  const { notifications, markNotificationRead, currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('todas');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Avisos del usuario actual o generales, del más nuevo al más antiguo
  const userNotifications = useMemo(
    () => notifications
      .filter(n => n.user_id === currentUser.id || !n.user_id || n.user_id === 'all')
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [notifications, currentUser.id]
  );
  const unread = userNotifications.filter(n => !n.leido);
  const unreadCount = unread.length;

  // Al abrir: si no hay nada sin leer, mostrar todas
  const open = () => {
    setOnlyUnread(unreadCount > 0);
    setFilter('todas');
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const base = onlyUnread ? unread : userNotifications;
  const typeCounts = (Object.keys(TYPE_INFO) as TypeKey[])
    .map(t => ({ t, count: base.filter(n => n.tipo === t).length }))
    .filter(x => x.count > 0);
  // Si el filtro elegido se queda sin avisos (p. ej. al marcarlos como leídos), se vuelve a "Todos"
  const activeFilter: FilterKey = filter !== 'todas' && base.some(n => n.tipo === filter) ? filter : 'todas';
  const visible = activeFilter === 'todas' ? base : base.filter(n => n.tipo === activeFilter);

  const now = new Date();
  const groups: { label: string; items: AppNotification[] }[] = [];
  visible.forEach(n => {
    const label = groupLabel(n.created_at, now);
    const g = groups.find(x => x.label === label);
    if (g) g.items.push(n); else groups.push({ label, items: [n] });
  });

  const openNotification = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.url_redireccion) {
      setIsOpen(false);
      router.push(n.url_redireccion);
    }
  };
  const markAllAsRead = () => unread.forEach(n => markNotificationRead(n.id));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campana */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={unreadCount > 0 ? `Tienes ${unreadCount} avisos sin leer` : 'Avisos'}
        aria-label={unreadCount > 0 ? `Avisos: ${unreadCount} sin leer` : 'Avisos'}
        aria-expanded={isOpen}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 && !isOpen ? 'animate-[wiggle_1s_ease-in-out_2]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950 shadow-md shadow-rose-500/30" suppressHydrationWarning>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de avisos */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Avisos"
          className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-full mt-2 sm:mt-3 w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        >
          {/* Encabezado */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0"><Bell className="w-5 h-5" /></span>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Tus avisos</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? <><strong className="text-rose-600">{unreadCount} sin leer</strong> · toca un aviso para abrirlo</> : 'Estás al día'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar avisos" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sin leer / Todas */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
              {[
                { v: true, label: 'Sin leer', count: unreadCount },
                { v: false, label: 'Todas', count: userNotifications.length },
              ].map(o => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => { setOnlyUnread(o.v); setFilter('todas'); }}
                  aria-pressed={onlyUnread === o.v}
                  className={`py-2 rounded-xl text-sm font-black cursor-pointer transition-colors ${onlyUnread === o.v ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                >
                  {o.label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] ${o.v && o.count > 0 ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{o.count}</span>
                </button>
              ))}
            </div>

            {/* Filtros por tipo */}
            {typeCounts.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                <button type="button" onClick={() => setFilter('todas')} aria-pressed={activeFilter === 'todas'}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${activeFilter === 'todas' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  Todos
                </button>
                {typeCounts.map(({ t, count }) => {
                  const info = TYPE_INFO[t];
                  const Icon = info.icon;
                  return (
                    <button key={t} type="button" onClick={() => setFilter(t)} aria-pressed={activeFilter === t}
                      className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${activeFilter === t ? `${info.chip} border-transparent` : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      <Icon className="w-3.5 h-3.5" /> {info.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista agrupada por día */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {visible.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-4xl">🎉</p>
                <p className="text-base font-black text-slate-900 dark:text-white">{onlyUnread ? '¡Estás al día!' : 'Aún no tienes avisos'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{onlyUnread ? 'No tienes avisos sin leer.' : 'Aquí verás tareas entregadas, comunicados y más.'}</p>
                {onlyUnread && userNotifications.length > 0 && (
                  <button type="button" onClick={() => setOnlyUnread(false)} className="mt-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Ver avisos anteriores</button>
                )}
              </div>
            ) : groups.map(g => (
              <div key={g.label} className="py-1">
                <p className="px-2 pt-2 pb-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">{g.label}</p>
                <ul className="space-y-1.5">
                  {g.items.map(n => {
                    const info = typeInfo(n.tipo);
                    const Icon = info.icon;
                    const action = actionLabel(n.url_redireccion);
                    return (
                      <li key={n.id} className={`relative rounded-2xl border transition-colors ${!n.leido ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/60' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                        {!n.leido && <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${info.bar}`} />}
                        <button type="button" onClick={() => openNotification(n)} className="w-full text-left flex items-start gap-3 p-3 pl-4 cursor-pointer rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${info.box}`}><Icon className="w-5 h-5" /></span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2">
                              <span className={`text-sm leading-snug ${!n.leido ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{n.titulo}</span>
                            </span>
                            <span className="block text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mt-0.5">{n.mensaje}</span>
                            <span className="flex items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400" suppressHydrationWarning><Clock className="w-3 h-3" /> {timeText(n.created_at, now)}</span>
                              {action && (
                                <span className="ml-auto inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-black">
                                  {action} <ChevronRight className="w-3 h-3" />
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                        {!n.leido && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(n.id)}
                            title="Marcar como leído"
                            aria-label={`Marcar como leído: ${n.titulo}`}
                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-400 flex items-center justify-center cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Pie */}
          {unreadCount > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={markAllAsRead} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black hover:opacity-90 cursor-pointer">
                <CheckCheck className="w-4 h-4" /> Marcar todas como leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
