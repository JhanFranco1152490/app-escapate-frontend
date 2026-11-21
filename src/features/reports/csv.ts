import type { Report } from './api';

// Excel en español separa columnas con punto y coma y necesita la marca BOM para leer las
// tildes del UTF-8. Los valores con separador, comillas o saltos van entre comillas.
const SEPARATOR = ';';

function cell(value: string | number | null) {
  if (value === null) return '';
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function reportToCsv(report: Report) {
  const lines = [report.columns, ...report.rows].map((row) =>
    row.map(cell).join(SEPARATOR),
  );
  return `﻿${lines.join('\r\n')}`;
}

export function downloadCsv(report: Report, fileName: string) {
  const blob = new Blob([reportToCsv(report)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
