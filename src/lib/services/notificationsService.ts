import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AppNotification } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';

let localNotifications: AppNotification[] = [...MOCK_NOTIFICATIONS];

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  if (!isSupabaseConfigured()) {
    return localNotifications.filter(n => n.user_id === userId);
  }
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return localNotifications.filter(n => n.user_id === userId);
    return data as AppNotification[];
  } catch {
    return localNotifications.filter(n => n.user_id === userId);
  }
}

export async function createNotificationInDb(notif: {
  userId: string;
  tipo: 'asistencia' | 'tarea' | 'nota' | 'comunicado';
  titulo: string;
  mensaje: string;
  urlRedireccion?: string;
}): Promise<AppNotification | null> {
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}`,
    user_id: notif.userId,
    tipo: notif.tipo,
    titulo: notif.titulo,
    mensaje: notif.mensaje,
    url_redireccion: notif.urlRedireccion,
    leido: false,
    created_at: new Date().toISOString(),
  };

  localNotifications.unshift(newNotif);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('notificaciones').insert({
        user_id: notif.userId,
        tipo: notif.tipo,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        url_redireccion: notif.urlRedireccion || null,
        leido: false,
      });
    } catch {
      /* ignore */
    }
  }

  return newNotif;
}

export async function markNotificationAsReadInDb(notificationId: string): Promise<void> {
  const notif = localNotifications.find(n => n.id === notificationId);
  if (notif) notif.leido = true;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('notificaciones').update({ leido: true }).eq('id', notificationId);
    } catch {
      /* ignore */
    }
  }
}
