# 🛡️ Informe de Auditoría de Seguridad & Bug Hunting: ColeSistemaMini-dev

> **Framework de Evaluación:** Claude-BugHunter (`hunt-auth-bypass`, `hunt-api-misconfig`, `hunt-spa-api`, `hunt-session`, `hunt-brute-force`, `hunt-nextjs`, `triage-validation`)  
> **Fecha:** 12 de Octubre de 2026  
> **Objetivo:** ColeSistemaMini-dev (`http://localhost:3001`)  
> **Arquitectura:** Next.js 16.1.1 (Turbopack) · React 19 · Node.js · Supabase / Mock Layer  

---

## 📊 Resumen Ejecutivo del Estado de Seguridad

Se realizó un análisis de penetración y auditoría de seguridad integral sobre la aplicación web utilizando la metodología **Claude-BugHunter**. Se auditaron la capa de **Middleware**, las rutas **API**, el modelo de **Sesión y Cookies**, y los mecanismos de **Rate Limiting**.

Se identificaron **5 vulnerabilidades verificadas con Proof of Concept (PoC) reproducible**, que van desde riesgo Crítico hasta Medio:

| ID | Vulnerabilidad | Severidad | CVSS v3.1 | Skill BugHunter |
| :--- | :--- | :---: | :---: | :--- |
| **VULN-001** | Bypass de Autenticación de Director mediante Cookie No Firmada | **CRÍTICO** | **9.8** | `hunt-auth-bypass` |
| **VULN-002** | Modificación No Autenticada de Identidad y Branding Institucional | **ALTO** | **7.5** | `hunt-api-misconfig` |
| **VULN-003** | Endpoints de Notificaciones Expuestos sin Autenticación (Open Mail Relay) | **ALTO** | **7.3** | `hunt-spa-api` |
| **VULN-004** | Cookies de Sesión y Rol sin Flags `HttpOnly` ni `Secure` | **MEDIO** | **5.4** | `hunt-session` |
| **VULN-005** | Evasión del Rate Limiting mediante Spoofing de `X-Forwarded-For` | **MEDIO** | **5.3** | `hunt-brute-force` |

---

## 🔍 Detalle Técnico de los Hallazgos

### 🔴 VULN-001: Bypass de Autenticación Administrativa mediante Forja de Cookie
- **Severidad:** **CRÍTICA** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H - Score: 9.8)
- **Componente Afectado:** [`src/middleware.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/middleware.ts) (Líneas 106-118 y 134)
- **Descripción:**  
  El middleware de Next.js verifica si el usuario tiene rol de acceso leyendo directamente la cookie de texto plano `cole_user_role`:
  ```typescript
  const userRole = request.cookies.get('cole_user_role')?.value;
  const isAuthenticated = !!user || !!userRole;
  ...
  const role = userRole || 'admin';
  ```
  La cookie no está firmada con un HMAC secreto, ni asociada a un JWT o ID de sesión validado contra base de datos. Cualquier atacante anónimo en Internet puede enviar `Cookie: cole_user_role=admin` y obtener acceso irrestricto a `/admin`.
- **Proof of Concept (PoC):**
  ```bash
  curl -i -H "Cookie: cole_user_role=admin" http://localhost:3001/admin
  ```
  *Resultado:* HTTP 200 OK con el panel de administración completo expuesto sin haber iniciado sesión.
- **Remediación:**  
  1. No basar las decisiones de autorización únicamente en una cookie de texto plano manipulable desde el cliente.
  2. Implementar tokens de sesión firmados en el servidor (JWT con `HS256`/`RS256` o sesión opaca de Supabase Auth).
  3. Validar en `middleware.ts` la firma del token o la existencia de `user` activo en Supabase.

---

### 🟠 VULN-002: Modificación No Autenticada de Identidad y Branding Institucional
- **Severidad:** **ALTA** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N - Score: 7.5)
- **Componente Afectado:** [`src/app/api/branding/route.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/app/api/branding/route.ts) y [`src/middleware.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/middleware.ts) (Línea 29)
- **Descripción:**  
  La ruta `/api/branding` está declarada en la lista blanca `PUBLIC_PATHS` del middleware. Sin embargo, en `route.ts`, el método `POST` recibe cualquier carga útil JSON y sobreescribe la configuración global de la institución:
  ```typescript
  export async function POST(request: NextRequest) {
    const body = await request.json();
    serverBrandingConfig = { ...serverBrandingConfig, ...body };
    ...
  ```
  Un usuario anónimo puede alterar el nombre del colegio, cambiar la paleta institucional o sustituir la URL del logo por contenido inapropiado o enlaces de phishing.
- **Proof of Concept (PoC):**
  ```bash
  curl -X POST http://localhost:3001/api/branding \
    -H "Content-Type: application/json" \
    -d '{"nombreInstitucion":"Colegio Modificado por Atacante","siglas":"HACK"}'
  ```
  *Resultado:* HTTP 200 OK; la configuración queda modificada para todos los visitantes del sistema.
- **Remediación:**  
  1. Remover `/api/branding` de `PUBLIC_PATHS` para peticiones `POST`.
  2. En el handler `POST`, validar que el usuario autenticado cuente con el rol `admin`.

---

### 🟠 VULN-003: Endpoints de Notificaciones Expuestos sin Autenticación (Open Mail Relay)
- **Severidad:** **ALTA** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L - Score: 7.3)
- **Componente Afectado:** [`src/app/api/notifications/resend/route.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/app/api/notifications/resend/route.ts) y [`src/app/api/notifications/brevo/route.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/app/api/notifications/brevo/route.ts)
- **Descripción:**  
  Ambos endpoints están configurados como públicos en `PUBLIC_PATHS`. No existe validación de sesión ni control de autorización para verificar si quien solicita el envío es un directivo o docente autorizado. Un atacante puede emplear la API como un "relay" abierto para enviar miles de correos de phishing o spam utilizando el dominio y saldo de la institución.
- **Proof of Concept (PoC):**
  ```bash
  curl -X POST http://localhost:3001/api/notifications/resend \
    -H "Content-Type: application/json" \
    -d '{"recipientEmail":"victima@correo.com","type":"bienvenida_matricula","studentName":"Test"}'
  ```
- **Remediación:**  
  1. Proteger las rutas `/api/notifications/*` requiriendo sesión activa de directivo o profesor.
  2. Restringir la lista de destinatarios a correos de alumnos y apoderados matriculados en la base de datos institucional.

---

### 🟡 VULN-004: Cookies de Sesión sin Flags `HttpOnly` ni `Secure`
- **Severidad:** **MEDIA** (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N - Score: 5.4)
- **Componente Afectado:** [`src/lib/services/authService.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/lib/services/authService.ts) (Líneas 43-44)
- **Descripción:**  
  Las cookies de autorización se escriben en el navegador mediante:
  ```typescript
  document.cookie = `cole_user_role=${matchedUser.rol}; path=/; max-age=604800; SameSite=Lax`;
  document.cookie = `cole_access_token=jwt-local-active; path=/; max-age=604800; SameSite=Lax`;
  ```
  Al no tener el atributo `HttpOnly`, cualquier script JavaScript (por ejemplo, mediante una inyección XSS en un comunicado escolar) puede leer las cookies de autenticación directamente vía `document.cookie`. Asimismo, falta la directiva `Secure` para forzar su transmisión únicamente bajo HTTPS.
- **Remediación:**  
  1. Configurar las cookies de autenticación desde el servidor (`Set-Cookie` en headers de respuesta) agregando `HttpOnly; Secure; SameSite=Strict`.

---

### 🟡 VULN-005: Evasión del Rate Limiting mediante Spoofing de `X-Forwarded-For`
- **Severidad:** **MEDIA** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N - Score: 5.3)
- **Componente Afectado:** [`src/lib/security/rateLimiter.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/lib/security/rateLimiter.ts) (Líneas 167-179)
- **Descripción:**  
  La función `getClientIp` prioriza el primer valor de la cabecera `x-forwarded-for`:
  ```typescript
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  ```
  Si el servidor no está detrás de un proxy inverso configurado para sobrescribir esta cabecera (como Cloudflare o Nginx con `proxy_set_header`), un atacante puede rotar el valor `X-Forwarded-For: <ip_aleatoria>` en cada intento de ataque de fuerza bruta contra `/login`, anulando por completo el mecanismo `Adaptive Rate Limiter` y la cárcel de IPs (`IP Jail`).
- **Remediación:**  
  1. En despliegues locales o sin proxy de confianza, usar la IP del socket de conexión de la petición (`request.ip` en Next.js o confiar únicamente en cabeceras de proveedores confirmados como `cf-connecting-ip`).

---

## 🚀 Plan de Acción Recomendado

1. **Prioridad Inmediata (Hotfix):**
   - Retirar `/api/branding` y `/api/notifications/*` de `PUBLIC_PATHS` en [`src/middleware.ts`](file:///c:/Users/Alessander/Desktop/TRABAJOS/ACTUALES/ColeSistemaMini-dev/ColeSistemaMini-dev/src/middleware.ts).
   - Impedir que una simple cookie `cole_user_role` sin sesión verificada autorice el acceso a `/admin`.
2. **Prioridad Media:**
   - Migrar la persistencia de sesión a tokens JWT firmados criptográficamente y cookies con atributo `HttpOnly`.
   - Robustecer `getClientIp` ante spoofing de cabeceras.
