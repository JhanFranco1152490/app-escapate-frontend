import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LegalLinks } from './legal-links';

describe('LegalLinks', () => {
  it('apunta a la política de privacidad y a los términos', () => {
    render(<LegalLinks />);

    expect(
      screen.getByRole('link', { name: 'Política de privacidad' }),
    ).toHaveAttribute('href', '/privacidad');
    expect(
      screen.getByRole('link', { name: 'Términos y condiciones' }),
    ).toHaveAttribute('href', '/terminos');
  });
});
