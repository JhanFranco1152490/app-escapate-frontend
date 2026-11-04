import { DEFAULT_PHONE_COUNTRY, splitPhone } from '@/lib/format/phone';

import type { SupplierDetail } from './api';
import type { SupplierFormValues } from './schemas';

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  trade_name: '',
  legal_name: '',
  document_type: '',
  document_number: '',
  categories: [],
  city: '',
  coverage_zone: '',
  contact_name: '',
  contact_role: '',
  contact_phone_country: DEFAULT_PHONE_COUNTRY,
  contact_phone: '',
  contact_email: '',
  payment_terms: '',
  commission_rate: '',
  agreement_valid_until: '',
  notes: '',
};

// La ficha como valores del formulario de edición.
export function supplierFormValues(
  supplier: SupplierDetail,
): SupplierFormValues {
  const phone = supplier.contact_phone
    ? splitPhone(supplier.contact_phone)
    : { country: DEFAULT_PHONE_COUNTRY, number: '' };
  return {
    trade_name: supplier.trade_name,
    legal_name: supplier.legal_name ?? '',
    document_type: supplier.document_type ?? '',
    document_number: supplier.document_number ?? '',
    categories: [...supplier.categories],
    city: supplier.city ?? '',
    coverage_zone: supplier.coverage_zone ?? '',
    contact_name: supplier.contact_name,
    contact_role: supplier.contact_role ?? '',
    contact_phone_country: phone.country,
    contact_phone: phone.number,
    contact_email: supplier.contact_email ?? '',
    payment_terms: supplier.payment_terms ?? '',
    commission_rate: supplier.commission_rate ?? '',
    agreement_valid_until: supplier.agreement_valid_until ?? '',
    notes: supplier.notes ?? '',
  };
}
