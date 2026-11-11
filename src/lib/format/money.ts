import type { Currency } from '@/lib/validation/amount';

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dollars = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

// El API manda pesos enteros. Un monto con decimales es un error que no se oculta redondeando.
export function formatMoney(amount: number) {
  if (!Number.isInteger(amount)) {
    throw new Error('Los montos llegan en pesos enteros');
  }
  return pesos.format(amount);
}

// El valor de una tarifa llega como cadena decimal en la moneda del proveedor ("710000",
// "1250.50"). El número solo se usa para mostrarlo: con hasta 12 cifras enteras y 2 decimales
// no pierde precisión.
export const formatRateAmount = (amount: string, currency: Currency) =>
  currency === 'COP'
    ? formatMoney(Number(amount))
    : dollars.format(Number(amount));

// La cadena decimal escrita como se lee en el campo del formulario: "710000" → "710.000",
// "1250.5" → "1.250,50". Trabaja sobre el texto para no redondear nada.
export function formatAmountInput(amount: string, currency: Currency) {
  const [whole, cents = ''] = amount.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, '.');
  return currency === 'COP' ? grouped : `${grouped},${cents.padEnd(2, '0')}`;
}

// Los porcentajes llegan del API como string decimal ("12.50").
export const formatPercentage = (value: string) =>
  `${percent.format(Number(value))} %`;
