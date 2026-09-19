import { NextRequest, NextResponse } from 'next/server';
import { 
  ResendEmailParams, 
  buildReportCardEmailHtml, 
  buildWelcomeEnrollmentEmailHtml, 
  buildTuitionReminderEmailHtml 
} from '@/lib/services/resendService';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ResendEmailParams;

    if (!body || !body.recipientEmail || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Parámetros incompletos (recipientEmail o type faltante)' },
        { status: 400 }
      );
    }

    const branding = { ...DEFAULT_BRANDING_CONFIG, ...body.branding };
    const apiKey = branding.resendApiKey || process.env.RESEND_API_KEY;
    const defaultSender = process.env.RESEND_FROM_EMAIL || (apiKey && !apiKey.startsWith('re_demo') ? 'onboarding@resend.dev' : 'comunicados@colegio.edu.pe');
    const senderEmail = (branding.resendSenderEmail && branding.resendSenderEmail !== 'comunicados@colegio.edu.pe') 
      ? branding.resendSenderEmail 
      : defaultSender;
    const senderName = branding.resendSenderName || branding.nombreInstitucion || 'ColeSistema';

    let htmlContent = '';
    let subject = '';

    if (body.type === 'libreta_notas') {
      htmlContent = buildReportCardEmailHtml(body);
      subject = (branding.resendPlantillaLibretaAsunto || '📊 Libreta Oficial de Calificaciones [BIMESTRE]: [ALUMNO] | [COLEGIO]')
        .replace(/\[BIMESTRE\]/g, body.bimestre)
        .replace(/\[ALUMNO\]/g, body.studentName)
        .replace(/\[COLEGIO\]/g, branding.siglas || branding.nombreInstitucion || 'Colegio');
    } else if (body.type === 'bienvenida_matricula') {
      htmlContent = buildWelcomeEnrollmentEmailHtml(body);
      subject = (branding.resendPlantillaBienvenidaAsunto || '🎉 ¡Bienvenido(a) al Año Escolar 2026!: [ALUMNO] | [COLEGIO]')
        .replace(/\[ALUMNO\]/g, body.studentName)
        .replace(/\[COLEGIO\]/g, branding.siglas || branding.nombreInstitucion || 'Colegio');
    } else if (body.type === 'recordatorio_pension') {
      htmlContent = buildTuitionReminderEmailHtml(body);
      subject = (branding.resendPlantillaPensionAsunto || '💳 Aviso de Pensión Escolar - Mes de [MES]: [ALUMNO] | [COLEGIO]')
        .replace(/\[MES\]/g, body.mes)
        .replace(/\[ALUMNO\]/g, body.studentName)
        .replace(/\[COLEGIO\]/g, branding.siglas || branding.nombreInstitucion || 'Colegio');
    }

    // Si no hay API Key de Resend configurada o estamos en desarrollo local, simulamos despacho exitoso
    if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('re_demo')) {
      console.log(`[Resend Simulado] Correo tipo "${body.type}" despachado a: ${body.recipientEmail} | Asunto: ${subject}`);
      return NextResponse.json({
        success: true,
        simulated: true,
        messageId: `sim_resend_${Date.now()}`,
        recipient: body.recipientEmail,
        type: body.type,
      });
    }

    // Despacho real a través de Resend API (v1)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [body.recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[Resend Error]', resendResult);
      return NextResponse.json(
        { 
          success: false, 
          error: resendResult?.message || 'Error al despachar el correo a través de Resend' 
        },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: resendResult.id,
      recipient: body.recipientEmail,
      type: body.type,
    });
  } catch (error: any) {
    console.error('[Resend Route Exception]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno del servidor de correo Resend' },
      { status: 500 }
    );
  }
}
