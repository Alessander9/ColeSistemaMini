import React from 'react';
import { AttendanceRecord } from '@/types';
import { AttendanceRow, AttendanceCardItem } from './AttendanceRow';
import { ArrowUpDown } from 'lucide-react';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onViewDetail: (record: AttendanceRecord) => void;
  viewMode?: 'table' | 'cards';
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function AttendanceTable({
  records,
  onViewDetail,
  viewMode = 'table',
  sortField,
  sortOrder,
  onSort,
}: AttendanceTableProps) {
  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {records.map((record) => (
          <AttendanceCardItem
            key={record.id}
            record={record}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800">
          <tr>
            <th
              onClick={() => onSort?.('fecha')}
              className="px-4 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>FECHA</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th
              onClick={() => onSort?.('hora_registro')}
              className="px-4 py-3 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>HORA</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>TIPO DE REGISTRO</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>ESTADO</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>OBSERVACIÓN</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span>DISPOSITIVO</span>
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
              </div>
            </th>
            <th className="px-4 py-3 text-right">
              <span>ACCIONES</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
          {records.map((record) => (
            <AttendanceRow
              key={record.id}
              record={record}
              onViewDetail={onViewDetail}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
