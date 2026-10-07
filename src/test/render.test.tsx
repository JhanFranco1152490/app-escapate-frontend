import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from './render';

function Greeting() {
  const { data } = useQuery({
    queryKey: ['greeting'],
    queryFn: async () => 'Hola',
  });
  return <p>{data ?? 'Cargando'}</p>;
}

describe('renderWithProviders', () => {
  it('monta TanStack Query para los componentes que lo usan', async () => {
    renderWithProviders(<Greeting />);

    expect(await screen.findByText('Hola')).toBeInTheDocument();
  });
});
