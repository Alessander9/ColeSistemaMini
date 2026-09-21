import { DayOfWeek } from '@/types';

export interface ScheduleTimeBlock {
  id: string;
  label: string;
  inicio: string;
  fin: string;
  isBreak?: boolean;
}

export interface ScheduleDay {
  key: DayOfWeek;
  label: string;
  short: string;
}

export const TIME_BLOCKS: ScheduleTimeBlock[] = [
  { id: 'b1', label: '1° Hora', inicio: '08:00', fin: '08:45' },
  { id: 'b2', label: '2° Hora', inicio: '08:45', fin: '09:30' },
  { id: 'b3', label: '3° Hora', inicio: '09:30', fin: '10:15' },
  { id: 'recreo', label: 'RECREO', inicio: '10:15', fin: '10:45', isBreak: true },
  { id: 'b4', label: '4° Hora', inicio: '10:45', fin: '11:30' },
  { id: 'b5', label: '5° Hora', inicio: '11:30', fin: '12:15' },
  { id: 'b6', label: '6° Hora', inicio: '12:15', fin: '13:00' },
  { id: 'b7', label: '7° Hora', inicio: '13:00', fin: '13:45' },
];

export const DAYS: ScheduleDay[] = [
  { key: 'lunes', label: 'Lunes', short: 'LUN' },
  { key: 'martes', label: 'Martes', short: 'MAR' },
  { key: 'miercoles', label: 'Miércoles', short: 'MIÉ' },
  { key: 'jueves', label: 'Jueves', short: 'JUE' },
  { key: 'viernes', label: 'Viernes', short: 'VIE' },
];
