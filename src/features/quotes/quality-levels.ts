import type { QualityLevel } from './api';

// En el orden de la API, del más sencillo al más alto: así se listan en el formulario.
export const QUALITY_LEVELS: QualityLevel[] = [
  'economy',
  'standard',
  'superior',
  'luxury',
];

export const QUALITY_LEVEL_LABELS: Record<QualityLevel, string> = {
  economy: 'Económico',
  standard: 'Estándar',
  superior: 'Superior',
  luxury: 'Lujo',
};
