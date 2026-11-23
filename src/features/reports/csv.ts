import type { Report } from './api';

// Excel en español separa columnas con punto y coma y necesita la marca BOM para leer las
// tildes del UTF-8. Los valores con separador, comillas o saltos van entre comillas.
const SEPARATOR = ';';

// Excel ejecuta como fórmula una celda de texto que empieza por alguno de estos caracteres, y
// los reportes traen texto que escribe cualquier persona (nombres, destinos, descripciones).
// Se antepone una comilla simple, que la hoja no muestra. Solo al texto: un saldo negativo es
// un número y debe seguir siéndolo.
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: string | number | null) {
  if (value === null) return '';
  const text =
    typeof value === 'string' && FORMULA_START.test(value)
      ? `'${value}`
      : String(value);
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
