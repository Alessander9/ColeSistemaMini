import { describe, it, expect } from 'vitest';
import { checkAdaptiveRateLimit, checkRateLimit } from '../lib/security/rateLimiter';
import { sanitizePlainText, sanitizeHtml, sanitizeEmail, sanitizeNumeric } from '../lib/security/sanitize';
import { generateSessionSignature, verifySessionSignature } from '../lib/security/sessionGuard';
import { generateCsrfToken, validateCsrfToken, timingSafeEqual } from '../lib/security/csrfGuard';
import { sanitizeDeep, validatePayloadSize } from '../lib/security/payloadGuard';
import { logSecurityEvent, getRecentSecurityEvents } from '../lib/security/securityLogger';

describe('Suite de Seguridad & Hardening Extremo (Anti-DDoS, CSRF, XSS, Jail & Integrity)', () => {
  it('Rate Limiter Adaptativo: debe detectar ráfagas rápidas (Burst Protection) y bloquear', () => {
    const burstIp = 'burst-test-ip-999';
    const options = { maxRequests: 50, windowMs: 60000, burstLimit: 3, burstWindowMs: 2000 };

    expect(checkAdaptiveRateLimit(burstIp, options).allowed).toBe(true);
    expect(checkAdaptiveRateLimit(burstIp, options).allowed).toBe(true);
    expect(checkAdaptiveRateLimit(burstIp, options).allowed).toBe(true);

    // 4ta petición en la ventana corta de 2s debe ser bloqueada por ráfaga
    const burstBlocked = checkAdaptiveRateLimit(burstIp, options);
    expect(burstBlocked.allowed).toBe(false);
    expect(burstBlocked.reason).toBe('burst_limit_exceeded');
  });

  it('Auto-Jail: debe poner en cuarentena (Jail) a atacantes reincidentes', () => {
    const attackerIp = 'attacker-ip-jail-test';
    const options = {
      maxRequests: 2,
      windowMs: 10000,
      maxViolationsBeforeJail: 2,
      jailDurationMs: 60000,
    };

    // 2 permitidas
    checkAdaptiveRateLimit(attackerIp, options);
    checkAdaptiveRateLimit(attackerIp, options);

    // Infracción 1
    checkAdaptiveRateLimit(attackerIp, options);
    // Infracción 2 -> Activa Jail
    const jailedResult = checkAdaptiveRateLimit(attackerIp, options);
    expect(jailedResult.allowed).toBe(false);
    expect(jailedResult.isJailed).toBe(true);
    expect(jailedResult.reason).toBe('ip_jailed');
  });

  it('Anti-CSRF: debe emitir tokens válidos y rechazar tokens falsificados o manipulados', () => {
    const sessionId = 'sess-usr-admin-2026';
    const token = generateCsrfToken(sessionId);

    expect(token).toBeDefined();
    expect(token.startsWith('csrf_')).toBe(true);

    // Validación exitosa
    expect(validateCsrfToken(token, sessionId)).toBe(true);

    // Falso token con diferente sesión
    expect(validateCsrfToken(token, 'sess-otro-usuario')).toBe(false);

    // Token manipulado
    expect(validateCsrfToken('csrf_fake_token_123', sessionId)).toBe(false);
  });

  it('Timing-Safe: debe comparar cadenas con tiempo constante para mitigar ataques de canal lateral', () => {
    expect(timingSafeEqual('password123', 'password123')).toBe(true);
    expect(timingSafeEqual('password123', 'password124')).toBe(false);
    expect(timingSafeEqual('short', 'muchlongerstring')).toBe(false);
  });

  it('Payload Guard: debe bloquear Prototype Pollution y claves NoSQL maliciosas', () => {
    const maliciousPayload = {
      nombre: 'Examen de Matemática',
      __proto__: { isAdmin: true },
      constructor: { hacked: true },
      $where: 'sleep(5000)',
      notas: ['18', '<script>steal()</script>20'],
    };

    const clean = sanitizeDeep(maliciousPayload);
    expect(clean.nombre).toBe('Examen de Matemática');
    expect(clean).not.toHaveProperty('__proto__');
    expect(clean).not.toHaveProperty('constructor');
    expect(clean).not.toHaveProperty('$where');
    expect(clean.notas[1]).toBe('20');
  });

  it('Payload Size: debe validar y rechazar cargas excesivamente grandes para prevenir DoS', () => {
    expect(validatePayloadSize('data normal', 1024)).toBe(true);
    const hugeString = 'a'.repeat(2000);
    expect(validatePayloadSize(hugeString, 1000)).toBe(false);
  });

  it('Security Logger: debe registrar y auditar incidentes de seguridad', () => {
    logSecurityEvent({
      type: 'rate_limit_violation',
      ip: '192.168.1.50',
      path: '/api/auth',
      details: 'Test violation log',
      severity: 'high',
    });

    const events = getRecentSecurityEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].ip).toBe('192.168.1.50');
    expect(events[0].type).toBe('rate_limit_violation');
  });

  it('Sanitización: debe neutralizar scripts maliciosos y etiquetas HTML (Anti-XSS)', () => {
    const maliciousInput = '<script>alert("hacked")</script>Juan Pérez<b></b>';
    const cleaned = sanitizePlainText(maliciousInput);
    expect(cleaned).toBe('Juan Pérez');
    expect(cleaned).not.toContain('<script>');

    const htmlSafe = sanitizeHtml('<img src=x onerror=alert(1)>');
    expect(htmlSafe).toContain('&lt;img');
    expect(htmlSafe).not.toContain('<img');
  });

  it('Session Guard: debe generar y verificar firmas de sesión para evitar manipulación de roles', () => {
    const userId = 'usr-admin-test';
    const role = 'admin';

    const sig = generateSessionSignature(userId, role);
    expect(sig).toBeDefined();
    expect(verifySessionSignature(userId, role, sig)).toBe(true);
    expect(verifySessionSignature(userId, 'docente', sig)).toBe(false);
  });
});

