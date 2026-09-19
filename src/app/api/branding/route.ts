import { NextResponse, NextRequest } from 'next/server';
import { DEFAULT_BRANDING_CONFIG } from '@/lib/services/brandingService';
import { SystemBrandingConfig } from '@/types';

// In-memory fallback on server
let serverBrandingConfig: SystemBrandingConfig = { ...DEFAULT_BRANDING_CONFIG };

export async function GET() {
  return NextResponse.json({
    success: true,
    data: serverBrandingConfig,
  });
}

export async function POST(request: NextRequest) {
  try {
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
