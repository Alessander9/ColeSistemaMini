import { SystemBrandingConfig, AttendanceStatus } from '@/types';
import { getStoredBranding, DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';

export interface SendAttendanceEmailParams {
  parentEmail: string;
  parentName?: string;
  studentName: string;
  studentCode?: string;
  gradeSection?: string;
  avatarUrl?: string;
  fecha: string;
  horaRegistro: string;
  estado: AttendanceStatus;
  metodo: 'qr' | 'manual';
  observacion?: string;
  branding?: Partial<SystemBrandingConfig>;
}

/**
 * Genera una plantilla HTML moderna, responsive y estilizada para el correo de confirmación de asistencia.
 */
export function buildAttendanceEmailHtml(params: SendAttendanceEmailParams): string {
  const branding = { ...DEFAULT_BRANDING_CONFIG, ...params.branding };
  const primaryColor = branding.primaryColor || '#4f46e5';
  const schoolName = branding.nombreInstitucion || 'ColeSistema Mini';
  const schoolLogo = branding.logoUrl || '';
  const schoolSiglas = branding.siglas || 'CS';

  const statusConfig: Record<AttendanceStatus, { label: string; bg: string; color: string; icon: string; desc: string }> = {
    presente: {
      label: 'PRESENTE - PUNTUAL',
      bg: '#ecfdf5',
      color: '#059669',
      icon: '✅',
      desc: 'El estudiante ingresó a la institución dentro del horario regular establecido.',
    },
    tardanza: {
      label: 'TARDANZA REGISTRADA',
      bg: '#fffbeb',
      color: '#d97706',
      icon: '⚠️',
      desc: 'El estudiante ingresó a la institución posterior a la hora límite de tolerancia.',
    },
    falta: {
      label: 'INASISTENCIA / FALTA',
      bg: '#fef2f2',
      color: '#dc2626',
      icon: '❌',
      desc: 'No se registró ingreso del estudiante en la jornada escolar correspondiente.',
    },
    justificado: {
      label: 'INASISTENCIA JUSTIFICADA',
      bg: '#eff6ff',
      color: '#2563eb',
      icon: 'ℹ️',
      desc: 'La inasistencia o tardanza cuenta con sustento justificado por la familia.',
    },
  };

  const statusInfo = statusConfig[params.estado] || statusConfig.presente;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Asistencia - ${schoolName}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 30px 10px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, #1e1b4b 100%); padding: 30px 25px; text-align: center; color: #ffffff; }
    .logo-container { margin-bottom: 12px; }
    .logo-img { max-height: 50px; max-width: 140px; border-radius: 12px; }
    .logo-badge { display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; font-weight: 900; font-size: 18px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.8); }
    .content { padding: 30px 25px; }
    .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .intro { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
    .student-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
    .student-meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 12px; background: ${statusInfo.bg}; color: ${statusInfo.color}; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 12px; border: 1px solid ${statusInfo.color}33; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .details-table td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .details-table td:last-child { text-align: right; font-weight: 700; color: #0f172a; }
    .details-table tr:last-child td { border-bottom: none; }
    .details-label { color: #64748b; }
    .notice-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; font-size: 12px; color: #166534; line-height: 1.5; margin-bottom: 20px; }
    .footer { background: #f1f5f9; padding: 20px 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .footer a { color: ${primaryColor}; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div class="logo-container">
          ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" class="logo-img" />` : `<div class="logo-badge">${schoolSiglas}</div>`}
        </div>
        <h1>${schoolName}</h1>
        <p>Sistema Automatizado de Control de Asistencia Escolar</p>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <div class="greeting">Estimado(a) ${params.parentName || 'Padre de Familia / Apoderado'},</div>
        <div class="intro">
          Le informamos que se ha registrado el control de asistencia de su menor hijo(a) en el sistema escolar:
        </div>

        <!-- STUDENT CARD -->
        <div class="card">
          <div class="student-title">${params.studentName}</div>
          <div class="student-meta">
            ${params.studentCode ? `Código: <strong>${params.studentCode}</strong>` : ''} 
            ${params.gradeSection ? `• Salón: <strong>${params.gradeSection}</strong>` : ''}
          </div>

          <div style="text-align: center; margin: 10px 0;">
            <div class="status-badge">
              ${statusInfo.icon} ${statusInfo.label}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${statusInfo.desc}
            </div>
          </div>

          <table class="details-table">
            <tr>
              <td class="details-label">📅 Fecha de Marcación:</td>
              <td>${params.fecha}</td>
            </tr>
            <tr>
              <td class="details-label">⏰ Hora de Registro:</td>
              <td style="color: ${statusInfo.color}; font-size: 14px;">${params.horaRegistro}</td>
            </tr>
            <tr>
              <td class="details-label">🚪 Punto de Ingreso:</td>
              <td>${params.metodo === 'qr' ? 'Terminal Kiosco QR - Puerta Principal' : 'Registro Manual en Aula'}</td>
            </tr>
            ${params.observacion ? `
            <tr>
              <td class="details-label">📝 Observación:</td>
              <td>${params.observacion}</td>
            </tr>` : ''}
          </table>
        </div>

        <div class="notice-box">
          🛡️ <strong>Seguridad Estudiantil:</strong> Este mensaje se envía de forma automática e instantánea al momento exacto de la lectura del carnet QR para su tranquilidad y monitoreo en tiempo real.
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;"><strong>${schoolName}</strong></p>
        ${branding.contactoEmail ? `<p style="margin: 0 0 4px 0;">Contacto: <a href="mailto:${branding.contactoEmail}">${branding.contactoEmail}</a> ${branding.telefono ? `• Tel: ${branding.telefono}` : ''}</p>` : ''}
        ${branding.direccion ? `<p style="margin: 0 0 8px 0;">${branding.direccion}</p>` : ''}
        <p style="margin: 0; opacity: 0.7;">Mensaje generado automáticamente. Por favor no responda directamente a este correo.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envía un correo transaccional utilizando la API de Brevo (Sendinblue v3)
 */
export async function sendBrevoAttendanceEmail(
  params: SendAttendanceEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string; simulated?: boolean }> {
  try {
    const response = await fetch('/api/notifications/brevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.warn('[Brevo] Error despachando correo:', err);
    return {
      success: false,
      error: err?.message || 'Error de conexión con el servicio de correos',
    };
  }
}
