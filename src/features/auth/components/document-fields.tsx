import type { UseFormRegisterReturn } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import type { DocumentType } from '../api';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../schemas';

type DocumentFieldsProps = {
  typeField: UseFormRegisterReturn<'document_type'>;
  numberField: UseFormRegisterReturn<'document_number'>;
  documentType: DocumentType;
  errors: { document_type?: string; document_number?: string };
};

export function DocumentFields({
  typeField,
  numberField,
  documentType,
  errors,
}: DocumentFieldsProps) {
  return (
    <>
      <FormField
        id="document_type"
        label="Tipo de documento"
        required
        error={errors.document_type}
      >
        <NativeSelect
          id="document_type"
          className="w-full [&_select]:h-11"
          {...typeField}
          {...fieldAriaProps('document_type', { error: errors.document_type })}
        >
          {DOCUMENT_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField
        id="document_number"
        label="Número de documento"
        required
        error={errors.document_number}
      >
        <Input
          id="document_number"
          autoComplete="username"
          // CE, PPT y pasaporte pueden llevar letras: solo la cédula usa el teclado numérico.
          inputMode={documentType === 'CC' ? 'numeric' : 'text'}
          className="h-11"
          {...numberField}
          {...fieldAriaProps('document_number', {
            error: errors.document_number,
          })}
        />
      </FormField>
    </>
  );
}
