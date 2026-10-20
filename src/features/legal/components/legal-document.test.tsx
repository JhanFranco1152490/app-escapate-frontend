import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LegalDocument } from './legal-document';

const source = `# Título del documento

## 1. Primera sección

Texto con un [enlace interno](/privacidad) y uno [externo](https://example.com/ruta).

- Primer punto
- Segundo punto

| Dato | Plazo |
| --- | --- |
| Ingresos | 90 días |

<script>alert('x')</script>
`;

describe('LegalDocument', () => {
  it('muestra títulos, listas y tablas', () => {
    render(<LegalDocument source={source} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Título del documento' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '1. Primera sección' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('columnheader', { name: 'Plazo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '90 días' })).toBeInTheDocument();
  });

  it('abre los enlaces externos en otra pestaña sin pasar el referente', () => {
    render(<LegalDocument source={source} />);

    const external = screen.getByRole('link', { name: 'externo' });
    expect(external).toHaveAttribute('href', 'https://example.com/ruta');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('deja los enlaces internos en la misma pestaña', () => {
    render(<LegalDocument source={source} />);

    const internal = screen.getByRole('link', { name: 'enlace interno' });
    expect(internal).toHaveAttribute('href', '/privacidad');
    expect(internal).not.toHaveAttribute('target');
  });

  it('no ejecuta el HTML crudo que venga en el texto', () => {
    const { container } = render(<LegalDocument source={source} />);

    expect(container.querySelector('script')).toBeNull();
  });
});
