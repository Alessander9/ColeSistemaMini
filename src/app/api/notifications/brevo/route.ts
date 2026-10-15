import { NextRequest, NextResponse } from 'next/server';
import { buildAttendanceEmailHtml, SendAttendanceEmailParams } from '@/lib/services/brevoService';
import { verifySessionToken } from '@/lib/security/sessionToken';

export async function POST(request: NextRequest) {
  try {
    // Validar autorización: Solo directivos o docentes pueden despachar notificaciones de asistencia
    const sessionToken = request.cookies.get('cole_session_token')?.value;
    const verification = await verifySessionToken(sessionToken);

    if (!verification.valid || (verification.payload?.role !== 'admin' && verification.payload?.role !== 'docente' && verification.payload?.role !== 'asistencia')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión activa autorizada para emitir notificaciones de asistencia.' },
        { status: 401 }
      );
    }

    const params: SendAttendanceEmailParams = await request.json();

    if (!params.parentEmail || !params.studentName) {
      return NextResponse.json(
        { success: false, error: 'Correo del apoderado y nombre del estudiante son requeridos' },
        { status: 400 }
      );
    }

    const branding = params.branding || {};
    const apiKey = branding.brevoApiKey || process.env.BREVO_API_KEY;
    const senderEmail = branding.brevoSenderEmail || process.env.BREVO_SENDER_EMAIL || 'asistencia@colegio.edu.pe';
    const senderName = branding.brevoSenderName || branding.nombreInstitucion || 'ColeSistema - Control de Asistencia';
    
    // Status text for subject
    const statusText = params.estado === 'presente' 
      ? '✅ Ingreso Registrado' 
      : params.estado === 'tardanza' 
      ? '⚠️ Tardanza Registrada' 
      : params.estado === 'falta' 
      ? '❌ Inasistencia' 
      : 'ℹ️ Justificación';

    const subject = branding.brevoPlantillaAsunto
      ? branding.brevoPlantillaAsunto
          .replace('[ALUMNO]', params.studentName)
          .replace('[COLEGIO]', branding.nombreInstitucion || 'Colegio')
          .replace('[ESTADO]', statusText)
          .replace('[HORA]', params.horaRegistro)
      : `${statusText}: ${params.studentName} (${params.horaRegistro}) - ${branding.nombreInstitucion || 'ColeSistema'}`;

    const htmlContent = buildAttendanceEmailHtml(params);

    // Si no hay API Key configurada, simular envío exitoso en modo demo
    if (!apiKey) {
      console.log(`[Brevo Simulado] Enviando correo a: ${params.parentEmail} | Alumno: ${params.studentName} | Hora: ${params.horaRegistro}`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `Correo simulado correctamente hacia ${params.parentEmail} (Configura tu Brevo API Key en Branding para envíos reales).`,
        messageId: `simulated-${Date.now()}`,
        recipient: params.parentEmail,
        subject,
      });
    }

    // Envío real a la API de Brevo (Sendinblue v3)
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: params.parentEmail,
            name: params.parentName || 'Padre de Familia / Apoderado',
          },
        ],
        subject,
        htmlContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json().catch(() => ({}));
      console.error('[Brevo Error API]:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || `Error Brevo HTTP ${brevoResponse.status}`,
          details: errorData,
        },
        { status: brevoResponse.status }
      );
    }

    const data = await brevoResponse.json();
    return NextResponse.json({
      success: true,
      simulated: false,
      messageId: data.messageId,
      recipient: params.parentEmail,
      subject,
    });
  } catch (error: any) {
    console.error('[Brevo Server Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno al enviar correo con Brevo' },
      { status: 500 }
    );
  }
}
