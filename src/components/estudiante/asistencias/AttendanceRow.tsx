import React from 'react';
import { AttendanceRecord } from '@/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { Calendar, Clock, Eye, Smartphone, ChevronRight } from 'lucide-react';

interface AttendanceRowProps {
  record: AttendanceRecord;
  onViewDetail: (record: AttendanceRecord) => void;
}

export function AttendanceRow({ record, onViewDetail }: AttendanceRowProps) {
  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
      {/* FECHA */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          {record.fecha}
        </span>
      </td>

      {/* HORA */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
          {record.hora_registro !== '—' ? (
            <>
              <Clock className="w-3 h-3 text-slate-400" />
              {record.hora_registro}
            </>
          ) : (
            <span className="text-slate-400 font-normal">—</span>
          )}
        </span>
      </td>

      {/* TIPO DE REGISTRO */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize">
          {record.tipo_registro || (record.estado === 'falta' ? 'Inasistencia' : 'Ingreso')}
        </span>
      </td>

      {/* ESTADO */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <AttendanceStatusBadge estado={record.estado} />
      </td>

      {/* OBSERVACIÓN */}
      <td className="px-4 py-3.5">
        <span className="text-slate-500 dark:text-slate-400 text-xs italic block max-w-xs truncate">
          {record.observacion && record.observacion !== '—' ? record.observacion : '—'}
        </span>
      </td>

      {/* DISPOSITIVO */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
          {record.dispositivo && record.dispositivo !== '—' ? (
            <>
              <Smartphone className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[140px]">{record.dispositivo}</span>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
      </td>

      {/* ACCIONES */}
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        <button
          onClick={() => onViewDetail(record)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver</span>
        </button>
      </td>
    </tr>
  );
}

export function AttendanceCardItem({ record, onViewDetail }: AttendanceRowProps) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          {record.fecha}
        </span>
        <AttendanceStatusBadge estado={record.estado} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs py-1 border-y border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Hora</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {record.hora_registro || '—'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Tipo</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
            {record.tipo_registro || (record.estado === 'falta' ? 'Inasistencia' : 'Ingreso')}
          </span>
        </div>
      </div>

      {record.observacion && record.observacion !== '—' && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          "{record.observacion}"
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
          {record.dispositivo || 'Kiosko QR'}
        </span>
        <button
          onClick={() => onViewDetail(record)}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          <span>Ver Detalle</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
