import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  FormField,
  fieldAriaProps,
  fieldErrorId,
  fieldHintId,
} from './form-field';

describe('FormField', () => {
  it('asocia la etiqueta al control y marca el obligatorio solo a la vista', () => {
    render(
      <FormField id="name" label="Nombre" required>
        <input id="name" />
      </FormField>,
    );

    expect(screen.getByRole('textbox', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('muestra el error con el id que espera aria-describedby', () => {
    render(
      <FormField id="name" label="Nombre" error="Ingresa tu nombre.">
        <input id="name" aria-describedby={fieldErrorId('name')} />
      </FormField>,
    );

    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription(
      'Ingresa tu nombre.',
    );
  });

  it('describe el control con la ayuda y el error', () => {
    render(
      <FormField
        id="name"
        label="Nombre"
        hint="Como aparece en tu documento."
        error="Ingresa tu nombre."
      >
        <input
          id="name"
          {...fieldAriaProps('name', {
            hint: 'Como aparece en tu documento.',
            error: 'Ingresa tu nombre.',
          })}
        />
      </FormField>,
    );

    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAccessibleDescription(
      'Como aparece en tu documento. Ingresa tu nombre.',
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('sin error ni ayuda no agrega atributos', () => {
    expect(fieldAriaProps('name', {})).toEqual({});
    expect(fieldAriaProps('name', { hint: 'Ayuda.' })).toEqual({
      'aria-describedby': fieldHintId('name'),
    });
  });
});
