import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonProfile } from '@/components/ui/Skeleton';
import RootLoading from '@/app/loading';
import AdminLoading from '@/app/admin/loading';
import DocenteLoading from '@/app/docente/loading';
import EstudianteLoading from '@/app/estudiante/loading';

describe('Skeleton UI & Loading Pages System', () => {
  it('renders generic Skeleton with variant classes', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Skeleton, { variant: 'circular', className: 'w-10 h-10' })
    );
    expect(html).toContain('rounded-full');
    expect(html).toContain('w-10 h-10');
  });

  it('renders SkeletonCard, SkeletonTable, SkeletonChart and SkeletonProfile correctly', () => {
    const cardHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(SkeletonCard));
    expect(cardHtml).toContain('rounded-3xl');

    const tableHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(SkeletonTable, { rows: 3, cols: 3 }));
    expect(tableHtml).toContain('grid');

    const chartHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(SkeletonChart));
    expect(chartHtml).toContain('rounded-t-xl');

    const profileHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(SkeletonProfile));
    expect(profileHtml).toContain('rounded-full');
  });

  it('renders RootLoading page with pulse and spinner', () => {
    const html = ReactDOMServer.renderToStaticMarkup(React.createElement(RootLoading));
    expect(html).toContain('Cargando ColeSistema');
    expect(html).toContain('animate-spin');
  });

  it('renders AdminLoading, DocenteLoading and EstudianteLoading route skeletons without crash', () => {
    const adminHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(AdminLoading));
    expect(adminHtml).toContain('rounded-3xl');

    const docenteHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(DocenteLoading));
    expect(docenteHtml).toContain('rounded-3xl');

    const estudianteHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(EstudianteLoading));
    expect(estudianteHtml).toContain('rounded-3xl');
  });
});
