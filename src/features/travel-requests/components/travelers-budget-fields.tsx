import { DecimalAmountField } from '@/components/decimal-amount-field';

import type { RequestFormApi } from '../schemas';
import { CountInput } from './count-input';

// Cuántos viajan y cuánto quiere gastar el cliente. Las personas se asocian después; aquí solo
// van las cantidades. El presupuesto es una referencia en pesos: se puede dar solo uno de los
// dos extremos.
export function TravelersBudgetFields({ form }: { form: RequestFormApi }) {
  return (
    <>
      <CountInput form={form} name="adults" label="Adultos" />
      <CountInput form={form} name="minors" label="Menores" />
      <DecimalAmountField
        form={form}
        name="budget_min"
        label="Presupuesto mínimo (COP)"
        currency="COP"
      />
      <DecimalAmountField
        form={form}
        name="budget_max"
        label="Presupuesto máximo (COP)"
        currency="COP"
      />
    </>
  );
}
