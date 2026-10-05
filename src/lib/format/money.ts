const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

// El API manda pesos enteros. Un monto con decimales es un error que no se oculta redondeando.
export function formatMoney(amount: number) {
  if (!Number.isInteger(amount)) {
    throw new Error('Los montos llegan en pesos enteros');
  }
  return pesos.format(amount);
}

// Los porcentajes llegan del API como string decimal ("12.50").
export const formatPercentage = (value: string) =>
  `${percent.format(Number(value))} %`;
