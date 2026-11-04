import { CITY_SUGGESTIONS } from '@/lib/city-suggestions';

export const CITY_LIST_ID = 'city-suggestions';

// Sugerencias nativas del navegador: proponen sin obligar a elegir de la lista. El campo de la
// ciudad la enlaza con `list={CITY_LIST_ID}`.
export function CityDatalist() {
  return (
    <datalist id={CITY_LIST_ID}>
      {CITY_SUGGESTIONS.map((city) => (
        <option key={city} value={city} />
      ))}
    </datalist>
  );
}
