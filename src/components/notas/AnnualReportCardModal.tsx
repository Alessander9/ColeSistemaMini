'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { AnnualReportCardView } from './AnnualReportCardView';
import { StudentAnnualReportCard } from '@/lib/grades/calculations';

interface AnnualReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportCard: StudentAnnualReportCard | null;
}

export function AnnualReportCardModal({ isOpen, onClose, reportCard }: AnnualReportCardModalProps) {
  if (!reportCard) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Libreta Oficial de Fin de Año — SIAGIE / MINEDU"
      maxWidth="5xl"
    >
      <div className="max-h-[80vh] overflow-y-auto pr-1">
        <AnnualReportCardView reportCard={reportCard} showPrintButton={true} />
      </div>
    </Modal>

  );
}
