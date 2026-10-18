import { NextResponse, NextRequest } from 'next/server';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';
import { SystemBrandingConfig } from '@/types';
import { verifySessionToken } from '@/lib/security/sessionToken';

// In-memory fallback on server
let serverBrandingConfig: SystemBrandingConfig = { ...DEFAULT_BRANDING_CONFIG };

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: serverBrandingConfig,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización: solo administradores pueden modificar el branding
    const sessionToken = request.cookies.get('cole_session_token')?.value;
    const verification = await verifySessionToken(sessionToken);

    if (!verification.valid || verification.payload?.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Se requieren permisos de Director/Admin para modificar la configuración de branding.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    serverBrandingConfig = {
      ...serverBrandingConfig,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({
      success: true,
      message: 'Branding actualizado con éxito',
      data: serverBrandingConfig,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error al procesar la solicitud',
      },
      { status: 400 }
    );
  }
}
