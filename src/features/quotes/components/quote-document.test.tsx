import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildQuoteDetail, buildQuoteItem } from '@/test/quotes';

import { QuoteDocument } from './quote-document';

const quote = buildQuoteDetail({
  deposit_percent: '30.00',
  items: [
    buildQuoteItem(),
    buildQuoteItem({
      id: 41,
      name: 'Tour en lancha',
      is_optional: true,
      sale_price: 360_000,
    }),
  ],
  totals: {
    cost: 2_700_000,
    sale: 3_105_000,
    profit: 405_000,
    margin_percent: '13.04',
    optional_sale: 360_000,
    per_person: 1_035_000,
    deposit: 931_500,
    missing_exchange_rate: false,
  },
});

describe('QuoteDocument', () => {
  it('muestra el total, el valor por persona y los opcionales con su precio', () => {
    render(<QuoteDocument quote={quote} />);

    expect(screen.getByText('Hotel Las Américas')).toBeVisible();
    expect(screen.getByText(/3\.105\.000/)).toBeVisible();
    expect(screen.getByText(/1\.035\.000 por persona/)).toBeVisible();
    expect(screen.getByText(/\+ \$\s?360\.000/)).toBeVisible();
    expect(screen.getByText(/Abono para reservar: 30 %/)).toBeVisible();
  });

  it('nunca muestra costos ni ganancia', () => {
    render(<QuoteDocument quote={quote} />);

    expect(screen.queryByText(/2\.700\.000/)).toBeNull();
    expect(screen.queryByText(/405\.000/)).toBeNull();
    expect(screen.queryByText(/450\.000/)).toBeNull();
  });

  it('muestra el nivel de una alternativa para comparar', () => {
    render(
      <QuoteDocument
        quote={{
          ...quote,
          items: [
            buildQuoteItem({ quality_level: 'standard' }),
            buildQuoteItem({
              id: 42,
              name: 'Suite frente al mar',
              alternative_of_id: 40,
              quality_level: 'superior',
            }),
          ],
        }}
      />,
    );

    expect(screen.getByText('Suite frente al mar')).toBeVisible();
    expect(screen.getByText(/Superior/)).toBeVisible();
  });
});
