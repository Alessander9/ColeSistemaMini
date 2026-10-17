import { SystemBrandingConfig } from '@/types';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';

export type ResendEmailType = 'libreta_notas' | 'bienvenida_matricula' | 'recordatorio_pension' | 'comunicado';

export interface SendReportCardEmailParams {
  type: 'libreta_notas';
  recipientEmail: string;
  recipientName?: string;
  studentName: string;
  studentCode: string;
  gradeSection: string;
  bimestre: string; // ej: 'I Bimestre'
  promedioLetra: 'AD' | 'A' | 'B' | 'C';
  puestoMerito?: string;
  pdfDownloadUrl?: string;
  branding?: Partial<SystemBrandingConfig>;
}

export interface SendWelcomeEnrollmentEmailParams {
  type: 'bienvenida_matricula';
  recipientEmail: string;
  recipientName?: string;
  studentName: string;
  studentCode: string;
  gradeSection: string;
  anioLectivo: string;
  loginUsername: string;
  loginUrl?: string;
  branding?: Partial<SystemBrandingConfig>;
}

export interface SendTuitionReminderEmailParams {
  type: 'recordatorio_pension';
  recipientEmail: string;
  recipientName?: string;
  studentName: string;
  studentCode: string;
  gradeSection: string;
  mes: string; // ej: 'Septiembre 2026'
  montoSoles: number;
  fechaVencimiento: string;
  cuentasBancarias?: string;
  paymentUrl?: string;
  branding?: Partial<SystemBrandingConfig>;
}

export interface SendAnnouncementEmailParams {
  type: 'comunicado';
  recipientEmail: string;
  recipientName?: string;
  titulo: string;
  contenido: string;
  categoria?: string;
  esUrgente?: boolean;
  remitente: string;
  loginUrl?: string;
  branding?: Partial<SystemBrandingConfig>;
}

export type ResendEmailParams = 
  | SendReportCardEmailParams 
  | SendWelcomeEnrollmentEmailParams 
  | SendTuitionReminderEmailParams
  | SendAnnouncementEmailParams;

// El texto del comunicado lo escribe una persona: se escapa antes de insertarlo en el HTML del correo
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/**
 * Plantilla de Comunicado / Circular enviado desde el módulo de Comunicados
 */
export function buildAnnouncementEmailHtml(params: SendAnnouncementEmailParams): string {
  const branding = { ...DEFAULT_BRANDING_CONFIG, ...params.branding };
  const primaryColor = branding.primaryColor || '#4f46e5';
  const schoolName = escapeHtml(branding.nombreInstitucion || 'ColeSistema Mini');
  const schoolSiglas = escapeHtml(branding.siglas || 'CS');
  const titulo = escapeHtml(params.titulo);
  const contenido = escapeHtml(params.contenido).replace(/\r?\n/g, '<br>');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b;">
  <div style="padding:30px 10px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:${primaryColor};padding:28px 25px;text-align:center;color:#ffffff;">
        <div style="display:inline-block;width:48px;height:48px;line-height:48px;background:rgba(255,255,255,0.2);border-radius:14px;font-weight:900;font-size:20px;margin-bottom:10px;">${schoolSiglas}</div>
        <div style="font-size:13px;opacity:0.85;">${schoolName} · Comunicado oficial</div>
      </div>
      <div style="padding:28px 25px;">
        ${params.esUrgente ? '<div style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;margin-bottom:12px;">URGENTE</div>' : ''}
        <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:800;color:#0f172a;">${titulo}</h1>
        <div style="font-size:14px;line-height:1.7;color:#334155;">${contenido}</div>
        <p style="margin:24px 0 0 0;font-size:12px;color:#64748b;">Emitido por: ${escapeHtml(params.remitente)}</p>
        ${params.loginUrl ? `<a href="${escapeHtml(params.loginUrl)}" style="display:block;text-align:center;background:${primaryColor};color:#ffffff;padding:13px 20px;border-radius:12px;font-weight:800;font-size:14px;text-decoration:none;margin-top:20px;">Ver en el portal del colegio</a>` : ''}
      </div>
      <div style="background:#f1f5f9;padding:16px 25px;text-align:center;font-size:11px;color:#94a3b8;">${schoolName}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Plantilla de Entrega Oficial de Libreta de Notas Bimestral
 */
export function buildReportCardEmailHtml(params: SendReportCardEmailParams): string {
  const branding = { ...DEFAULT_BRANDING_CONFIG, ...params.branding };
  const primaryColor = branding.primaryColor || '#4f46e5';
  const schoolName = branding.nombreInstitucion || 'ColeSistema Mini';
  const schoolLogo = branding.logoUrl || '';
  const schoolSiglas = branding.siglas || 'CS';

  const badgeColorMap = {
    AD: { bg: '#ecfdf5', color: '#059669', label: 'AD - Logro Destacado' },
    A: { bg: '#eff6ff', color: '#2563eb', label: 'A - Logro Esperado' },
    B: { bg: '#fffbeb', color: '#d97706', label: 'B - En Proceso' },
    C: { bg: '#fef2f2', color: '#dc2626', label: 'C - En Inicio' },
  };

  const badge = badgeColorMap[params.promedioLetra] || badgeColorMap.A;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Libreta de Calificaciones - ${schoolName}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 30px 10px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%); padding: 30px 25px; text-align: center; color: #ffffff; }
    .logo-img { max-height: 50px; max-width: 140px; border-radius: 12px; margin-bottom: 12px; }
    .logo-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; font-weight: 900; font-size: 18px; color: #ffffff; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85); }
    .content { padding: 30px 25px; }
    .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .intro { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; margin-bottom: 24px; }
    .student-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
    .student-meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
    .grade-badge { display: inline-block; padding: 8px 18px; border-radius: 12px; background: ${badge.bg}; color: ${badge.color}; font-weight: 800; font-size: 14px; border: 1px solid ${badge.color}33; }
    .btn-action { display: block; width: 100%; box-sizing: border-box; text-align: center; background: ${primaryColor}; color: #ffffff !important; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; margin: 20px 0; shadow: 0 4px 12px ${primaryColor}40; }
    .footer { background: #f1f5f9; padding: 20px 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" class="logo-img" />` : `<div class="logo-badge">${schoolSiglas}</div>`}
        <h1>${schoolName}</h1>
        <p>Informe Oficial de Progreso de Competencias – SIAGIE 2026</p>
      </div>
      <div class="content">
        <div class="greeting">Estimado(a) ${params.recipientName || 'Padre de Familia / Apoderado'},</div>
        <div class="intro">
          Nos complace compartir con usted el informe de calificaciones oficial correspondiente al <strong>${params.bimestre}</strong> de su menor hijo(a):
        </div>

        <div class="card">
          <div class="student-title">${params.studentName}</div>
          <div class="student-meta">Código: <strong>${params.studentCode}</strong> • Grado: <strong>${params.gradeSection}</strong></div>
          
          <div style="text-align: center; margin: 16px 0;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Nivel de Logro Alcanzado</div>
            <div class="grade-badge">${badge.label}</div>
            ${params.puestoMerito ? `<div style="font-size: 12px; color: #0f172a; font-weight: 700; margin-top: 8px;">🏆 Mérito Académico: ${params.puestoMerito}</div>` : ''}
          </div>

          <a href="${params.pdfDownloadUrl || '#'}" class="btn-action">
            📄 Descargar Libreta Oficial en PDF
          </a>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; font-size: 12px; color: #166534; line-height: 1.5;">
          ℹ️ <strong>Validez Oficial:</strong> Este documento digital cuenta con firma digital de Dirección y código de verificación institucional.
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 4px 0;"><strong>${schoolName}</strong></p>
        <p style="margin: 0;">Mensaje enviado mediante Resend Platform. ${branding.contactoEmail ? `Contacto: ${branding.contactoEmail}` : ''}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 2. Plantilla de Bienvenida a Nuevos Matriculados
 */
export function buildWelcomeEnrollmentEmailHtml(params: SendWelcomeEnrollmentEmailParams): string {
  const branding = { ...DEFAULT_BRANDING_CONFIG, ...params.branding };
  const primaryColor = branding.primaryColor || '#4f46e5';
  const schoolName = branding.nombreInstitucion || 'ColeSistema Mini';
  const schoolLogo = branding.logoUrl || '';
  const schoolSiglas = branding.siglas || 'CS';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Bienvenido a ${schoolName}!</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 30px 10px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, #312e81 100%); padding: 35px 25px; text-align: center; color: #ffffff; }
    .logo-img { max-height: 55px; max-width: 140px; border-radius: 12px; margin-bottom: 12px; }
    .logo-badge { display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(255,255,255,0.2); border-radius: 14px; font-weight: 900; font-size: 20px; color: #ffffff; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .content { padding: 30px 25px; }
    .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .intro { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .creds-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .btn-login { display: block; text-align: center; background: ${primaryColor}; color: #ffffff !important; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; margin: 20px 0; }
    .footer { background: #f1f5f9; padding: 20px 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" class="logo-img" />` : `<div class="logo-badge">${schoolSiglas}</div>`}
        <h1>¡Bienvenido a ${schoolName}!</h1>
        <p>Apertura de Matrícula – Año Académico ${params.anioLectivo}</p>
      </div>
      <div class="content">
        <div class="greeting">Estimada familia ${params.recipientName || ''},</div>
        <div class="intro">
          Nos llena de alegría darles la más cálida bienvenida a nuestra comunidad educativa. La matrícula del estudiante <strong>${params.studentName}</strong> en el aula <strong>${params.gradeSection}</strong> ha sido completada con éxito.
        </div>

        <div class="creds-box">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; text-align: center;">Credenciales de Acceso a la Intranet</div>
          <table style="width: 100%; font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding: 6px 0;">👤 Usuario / DNI:</td>
              <td style="font-weight: 800; text-align: right; font-family: monospace;">${params.loginUsername}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">🏷️ Código Escolar:</td>
              <td style="font-weight: 800; text-align: right; font-family: monospace;">${params.studentCode}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">🏫 Grado / Sección:</td>
              <td style="font-weight: 800; text-align: right;">${params.gradeSection}</td>
            </tr>
          </table>

          <a href="${params.loginUrl || '#'}" class="btn-login">
            🚀 Ingresar a la Intranet Escolar
          </a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 4px 0;"><strong>${schoolName}</strong> – ${branding.slogan || 'Gestión Escolar'}</p>
        <p style="margin: 0;">Despachado por Resend Mailer.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 3. Plantilla de Recordatorio de Pensión / Tesorería Escolar
 */
export function buildTuitionReminderEmailHtml(params: SendTuitionReminderEmailParams): string {
  const branding = { ...DEFAULT_BRANDING_CONFIG, ...params.branding };
  const primaryColor = branding.primaryColor || '#4f46e5';
  const schoolName = branding.nombreInstitucion || 'ColeSistema Mini';
  const schoolLogo = branding.logoUrl || '';
  const schoolSiglas = branding.siglas || 'CS';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estado de Cuenta - ${schoolName}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 30px 10px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px 25px; text-align: center; color: #ffffff; }
    .logo-img { max-height: 50px; max-width: 140px; border-radius: 12px; margin-bottom: 12px; }
    .logo-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; font-weight: 900; font-size: 18px; color: #ffffff; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .content { padding: 30px 25px; }
    .amount-box { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 16px; padding: 22px; text-align: center; margin-bottom: 24px; }
    .btn-pay { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 14px; text-decoration: none; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 20px 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" class="logo-img" />` : `<div class="logo-badge">${schoolSiglas}</div>`}
        <h1>${schoolName}</h1>
        <p>Departamento de Administración y Tesorería</p>
      </div>
      <div class="content">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Estimado(a) Padre de Familia / Tutor,</div>
        <div style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 20px;">
          Le recordamos la información correspondiente a la pensión escolar del mes de <strong>${params.mes}</strong> de su menor hijo(a) <strong>${params.studentName}</strong> (${params.gradeSection}):
        </div>

        <div class="amount-box">
          <div style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase;">Monto de la Pensión Escolar</div>
          <div style="font-size: 32px; font-weight: 900; color: #15803d; margin: 4px 0;">S/ ${params.montoSoles.toFixed(2)}</div>
          <div style="font-size: 12px; color: #166534;">Fecha Límite de Pago: <strong>${params.fechaVencimiento}</strong></div>

          <a href="${params.paymentUrl || '#'}" class="btn-pay">
            💳 Realizar Pago Online / Subir Voucher
          </a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 12px; color: #475569;">
          🏦 <strong>Cuentas Bancarias Autorizadas:</strong><br>
          ${params.cuentasBancarias || `• BCP Recaudación Colegios: Cta Cte 191-0482910-0-21<br>• BBVA / Interbank / Yape Institucional`}
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 4px 0;"><strong>${schoolName}</strong> – Tesorería</p>
        <p style="margin: 0;">Despacho automatizado mediante Resend API.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Cliente para despachar correos mediante Resend API v1
 */
export async function sendResendEmail(
  params: ResendEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string; simulated?: boolean }> {
  try {
    const response = await fetch('/api/notifications/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.warn('[Resend] Error despachando correo:', err);
    return {
      success: false,
      error: err?.message || 'Error de conexión con el servicio Resend',
    };
  }
}
