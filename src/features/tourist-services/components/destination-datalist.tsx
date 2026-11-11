export const DESTINATION_LIST_ID = 'destination-suggestions';

// Destinos frecuentes de la agencia. Solo son sugerencias: el campo acepta cualquier otro, pero
// escribir desde la lista evita guardar el mismo destino de varias formas ("San Andres",
// "San Andrés"). Un destino puede ser una ciudad o una región, como en cruceros y paquetes.
const DESTINATION_SUGGESTIONS = [
  'Cartagena',
  'San Andrés',
  'Santa Marta',
  'Medellín',
  'Bogotá',
  'Eje Cafetero',
  'Caribe',
  'Punta Cana',
  'Cancún',
  'Panamá',
  'Aruba',
  'Curazao',
  'Miami',
  'Orlando',
] as const;

export function DestinationDatalist() {
  return (
    <datalist id={DESTINATION_LIST_ID}>
      {DESTINATION_SUGGESTIONS.map((destination) => (
        <option key={destination} value={destination} />
      ))}
    </datalist>
  );
}
