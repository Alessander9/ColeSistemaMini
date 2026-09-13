import { NextRequest, NextResponse } from 'next/server';
import { calculateAverage, calculateAnnualStatus } from '@/lib/grades/calculations';
import { GradeLetter } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grades = [] }: { grades: GradeLetter[] } = body;

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Se requiere una lista de calificaciones (AD, A, B, C)' },
        { status: 400 }
      );
    }

    const averageResult = calculateAverage(grades);
    const annualResult = calculateAnnualStatus(grades);

    return NextResponse.json({
      success: true,
      data: {
        promedioLetra: averageResult.averageLetter,
        promedioScore: averageResult.averageScore,
        estadoPromocion: annualResult.status,
        totalNotas: averageResult.count,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al calcular promedios', error: String(error) },
      { status: 500 }
    );
  }
}
