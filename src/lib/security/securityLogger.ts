/**
 * In-Memory Security Audit Ring Buffer & Incident Logger
 * Registra eventos de seguridad en tiempo real para análisis y auditoría forense.
 */

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'rate_limit_violation' | 'ip_jailed' | 'csrf_mismatch' | 'unauthorized_access' | 'xss_blocked' | 'login_failure';
  ip: string;
  path: string;
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const MAX_LOG_ENTRIES = 200;
const securityEventsRingBuffer: SecurityEvent[] = [];

/**
 * Registra un evento de seguridad de forma segura y sin bloquear la ejecución.
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
  const newEntry: SecurityEvent = {
    ...event,
    id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  securityEventsRingBuffer.unshift(newEntry);
  if (securityEventsRingBuffer.length > MAX_LOG_ENTRIES) {
    securityEventsRingBuffer.pop();
  }

  // Notificación en consola para monitoreo en desarrollo y logs de servidor
  if (event.severity === 'high' || event.severity === 'critical') {
    console.warn(`[SECURITY ALERT] [${event.type.toUpperCase()}] IP: ${event.ip} Path: ${event.path} - ${event.details || ''}`);
  }
}

/**
 * Obtiene los eventos de seguridad recientes para el panel de administración.
 */
export function getRecentSecurityEvents(): SecurityEvent[] {
  return [...securityEventsRingBuffer];
}
