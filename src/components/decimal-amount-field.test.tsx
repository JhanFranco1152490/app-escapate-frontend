import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import type { Currency } from '@/lib/validation/amount';

import { DecimalAmountField } from './decimal-amount-field';

function Harness({ currency, error }: { currency: Currency; error?: string }) {
  const form = useForm({ defaultValues: { amount: '' } });
  const { setError } = form;
  useEffect(() => {
    if (error) setError('amount', { message: error });
  }, [error, setError]);
  return (
    <DecimalAmountField
      form={form}
      name="amount"
      label={`Valor por noche (${currency})`}
      currency={currency}
    />
  );
}

describe('DecimalAmountField', () => {
  it('al salir del campo agrega los puntos de miles', async () => {
    const user = userEvent.setup();
    render(<Harness currency="COP" />);
    const field = screen.getByLabelText(/Valor por noche \(COP\)/);

    await user.type(field, '710000');
    await user.tab();

    expect(field).toHaveValue('710.000');
    expect(field).toHaveAttribute('inputmode', 'decimal');
  });

  it('en dólares completa los centavos', async () => {
    const user = userEvent.setup();
    render(<Harness currency="USD" />);
    const field = screen.getByLabelText(/Valor por noche \(USD\)/);

    await user.type(field, '1250,5');
    await user.tab();

    expect(field).toHaveValue('1.250,50');
  });

  it('lo que no sigue el formato queda tal cual para corregirlo', async () => {
    const user = userEvent.setup();
    render(<Harness currency="USD" />);
    const field = screen.getByLabelText(/Valor por noche/);

    await user.type(field, '1,250.50');
    await user.tab();

    expect(field).toHaveValue('1,250.50');
  });

  it('la ayuda cambia con la moneda', () => {
    const { rerender } = render(<Harness currency="COP" />);
    expect(screen.getByText('Sin decimales: 710.000')).toBeInTheDocument();

    rerender(<Harness currency="USD" />);
    expect(
      screen.getByText('Punto para miles y coma para centavos: 1.250,50'),
    ).toBeInTheDocument();
  });

  it('muestra el error enlazado al campo', async () => {
    render(<Harness currency="COP" error="Indica el valor de la tarifa." />);

    await screen.findByText('Indica el valor de la tarifa.');
    expect(
      screen.getByLabelText(/Valor por noche/),
    ).toHaveAccessibleDescription(
      expect.stringContaining('Indica el valor de la tarifa.'),
    );
  });
});
