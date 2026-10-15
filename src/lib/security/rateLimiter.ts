/**
 * Enterprise Multi-Tier Adaptive Rate Limiter & IP Jail Quarantine
 * Protege contra DoS, Distributed Brute Force, Credential Stuffing y Flood Attacks.
 */

interface RateLimitRecord {
  timestamps: number[];
  violations: number;
  jailedUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpieza automática periódica de registros obsoletos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (record.jailedUntil && record.jailedUntil > now) {
        return; // Mantener en cuarentena
      }
      record.timestamps = record.timestamps.filter(t => now - t < 600000);
      if (record.timestamps.length === 0 && (!record.jailedUntil || record.jailedUntil <= now)) {
        rateLimitStore.delete(key);
      }
    });
  }, 180000); // Cada 3 minutos
}

export interface AdaptiveRateLimitOptions {
  /** Máximo de peticiones permitidas en la ventana estándar */
  maxRequests: number;
  /** Duración de la ventana estándar en milisegundos */
  windowMs: number;
  /** Máximo de peticiones instantáneas en ráfaga (burst) */
  burstLimit?: number;
  /** Duración de la ventana de ráfaga (ej. 5 segundos) */
  burstWindowMs?: number;
  /** Número de infracciones consecutivas antes de poner la IP en cárcel/cuarentena */
  maxViolationsBeforeJail?: number;
  /** Tiempo de cuarentena inicial en milisegundos (por defecto 15 minutos) */
  jailDurationMs?: number;
}

export interface AdaptiveRateLimitResult {
  allowed: boolean;
  isJailed: boolean;
  remaining: number;
  resetTimeMs: number;
  totalRequests: number;
  reason?: 'rate_limit_exceeded' | 'burst_limit_exceeded' | 'ip_jailed';
}

/**
 * Evalúa y aplica control de velocidad y cuarentena automática para la IP o identificador.
 */
export function checkAdaptiveRateLimit(
  identifier: string,
  options: AdaptiveRateLimitOptions = {
    maxRequests: 30,
    windowMs: 60000,
    burstLimit: 10,
    burstWindowMs: 5000,
    maxViolationsBeforeJail: 3,
    jailDurationMs: 900000, // 15 minutos
  }
): AdaptiveRateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const burstStart = now - (options.burstWindowMs || 5000);

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [], violations: 0, jailedUntil: null };
    rateLimitStore.set(identifier, record);
  }

  // 1. Verificar si la IP está en cuarentena (Jailed)
  if (record.jailedUntil && record.jailedUntil > now) {
    const remainingJailMs = record.jailedUntil - now;
    return {
      allowed: false,
      isJailed: true,
      remaining: 0,
      resetTimeMs: remainingJailMs,
      totalRequests: record.timestamps.length,
      reason: 'ip_jailed',
    };
  } else if (record.jailedUntil && record.jailedUntil <= now) {
    // Expiró la cuarentena, restaurar
    record.jailedUntil = null;
  }

  // 2. Filtrar peticiones fuera de la ventana
  record.timestamps = record.timestamps.filter(t => t > windowStart);

  // 3. Verificación de Ráfaga Corta (Anti-Burst Flooding)
  if (options.burstLimit) {
    const burstCount = record.timestamps.filter(t => t > burstStart).length;
    if (burstCount >= options.burstLimit) {
      record.violations += 1;
      checkAndApplyJail(record, options, now);
      return {
        allowed: false,
        isJailed: !!record.jailedUntil,
        remaining: 0,
        resetTimeMs: record.jailedUntil ? record.jailedUntil - now : (options.burstWindowMs || 5000),
        totalRequests: record.timestamps.length,
        reason: record.jailedUntil ? 'ip_jailed' : 'burst_limit_exceeded',
      };
    }
  }

  // 4. Verificación de Límite Estándar de Ventana
  if (record.timestamps.length >= options.maxRequests) {
    record.violations += 1;
    checkAndApplyJail(record, options, now);
    const oldest = record.timestamps[0] || windowStart;
    const resetTimeMs = record.jailedUntil ? record.jailedUntil - now : Math.max(0, oldest + options.windowMs - now);

    return {
      allowed: false,
      isJailed: !!record.jailedUntil,
      remaining: 0,
      resetTimeMs,
      totalRequests: record.timestamps.length,
      reason: record.jailedUntil ? 'ip_jailed' : 'rate_limit_exceeded',
    };
  }

  // Registrar nueva petición permitida
  record.timestamps.push(now);
  const remaining = Math.max(0, options.maxRequests - record.timestamps.length);

  return {
    allowed: true,
    isJailed: false,
    remaining,
    resetTimeMs: options.windowMs,
    totalRequests: record.timestamps.length,
  };
}

function checkAndApplyJail(record: RateLimitRecord, options: AdaptiveRateLimitOptions, now: number) {
  const threshold = options.maxViolationsBeforeJail || 3;
  if (record.violations >= threshold) {
    // Cuarentena exponencial según el número de reincidencias
    const multiplier = Math.pow(2, record.violations - threshold);
    const duration = (options.jailDurationMs || 900000) * multiplier;
    record.jailedUntil = now + Math.min(duration, 86400000); // Máximo 24h
  }
}

/**
 * Compatibilidad con la función anterior
 */
export function checkRateLimit(
  identifier: string,
  options = { maxRequests: 20, windowMs: 60000 }
) {
  return checkAdaptiveRateLimit(identifier, options);
}

/**
 * Extrae la IP de origen confiable desde headers
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // Solo confiar en X-Forwarded-For si explícitamente se corre tras un proxy de confianza configurado
  if (process.env.TRUST_PROXY === 'true') {
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      const parts = forwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
      return parts[0] || '127.0.0.1';
    }
  }

  return '127.0.0.1';
}
