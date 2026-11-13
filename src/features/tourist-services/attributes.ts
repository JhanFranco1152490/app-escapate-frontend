import type { components } from '@/lib/api/schema';

import type { ServiceType, TouristServiceDetail } from './api';

type Schemas = components['schemas'];

export type AttributesByType = {
  lodging: Schemas['LodgingAttributes-Output'];
  air: Schemas['AirAttributes'];
  ground: Schemas['GroundAttributes'];
  tours: Schemas['ToursAttributes'];
  cruise: Schemas['CruiseAttributes'];
  food: Schemas['FoodAttributes'];
  wholesaler: Schemas['WholesalerAttributes'];
  other: Schemas['OtherAttributes'];
};

// La ficha con los atributos que corresponden a su tipo: un `switch` sobre `service_type`
// deja leer, por ejemplo, `attributes.max_capacity` de un alojamiento.
export type TypedTouristService = {
  [K in ServiceType]: Omit<
    TouristServiceDetail,
    'service_type' | 'attributes'
  > & {
    service_type: K;
    attributes: AttributesByType[K];
  };
}[ServiceType];

// La API describe `attributes` como cualquiera de los ocho modelos, porque cuál es lo dice el
// tipo, un nivel más arriba. La API siempre los arma con el modelo de ese tipo, así que este es
// el único lugar donde se asume.
export const typedService = (service: TouristServiceDetail) =>
  service as TypedTouristService;
