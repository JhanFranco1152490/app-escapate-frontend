import type { SupplierCategory, SupplierDocumentType } from './api';

// En el orden de las pantallas: el mismo con el que la API devuelve las categorías de cada
// proveedor.
export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  lodging: 'Alojamiento',
  air: 'Transporte aéreo',
  ground: 'Transporte terrestre',
  tours: 'Tours y actividades',
  cruise: 'Cruceros',
  food: 'Alimentación',
  wholesaler: 'Mayorista',
  other: 'Otro',
};

export const SUPPLIER_CATEGORIES = Object.keys(
  SUPPLIER_CATEGORY_LABELS,
) as SupplierCategory[];

export const SUPPLIER_DOCUMENT_TYPES = [
  'NIT',
  'CC',
  'CE',
  'FOREIGN',
] as const satisfies SupplierDocumentType[];
