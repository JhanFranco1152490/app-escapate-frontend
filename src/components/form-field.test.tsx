import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField, fieldErrorId } from './form-field';

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
});
