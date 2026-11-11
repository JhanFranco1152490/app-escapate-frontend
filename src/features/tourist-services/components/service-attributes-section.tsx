import type { ComponentType } from 'react';

import { FormSection } from '@/components/form-section';

import type { ServiceType } from '../api';
import type { ServiceFormApi } from '../schemas';
import { AirAttributesFields } from './air-attributes-fields';
import { CruiseAttributesFields } from './cruise-attributes-fields';
import { FoodAttributesFields } from './food-attributes-fields';
import { GroundAttributesFields } from './ground-attributes-fields';
import { LodgingAttributesFields } from './lodging-attributes-fields';
import { ToursAttributesFields } from './tours-attributes-fields';
import { WholesalerAttributesFields } from './wholesaler-attributes-fields';

type Block = {
  title: string;
  Fields: ComponentType<{ form: ServiceFormApi }>;
};

// "Otro" no tiene campos propios: se describe en la descripción del servicio.
const BLOCKS: Partial<Record<ServiceType, Block>> = {
  lodging: {
    title: 'Características del alojamiento',
    Fields: LodgingAttributesFields,
  },
  air: { title: 'Características del vuelo', Fields: AirAttributesFields },
  ground: {
    title: 'Características del traslado',
    Fields: GroundAttributesFields,
  },
  tours: { title: 'Características del tour', Fields: ToursAttributesFields },
  cruise: {
    title: 'Características del crucero',
    Fields: CruiseAttributesFields,
  },
  food: {
    title: 'Características de la alimentación',
    Fields: FoodAttributesFields,
  },
  wholesaler: {
    title: 'Características del paquete mayorista',
    Fields: WholesalerAttributesFields,
  },
};

export function ServiceAttributesSection({
  form,
  type,
}: {
  form: ServiceFormApi;
  type: ServiceType | undefined;
}) {
  const block = type && BLOCKS[type];
  if (!block) return null;
  const { title, Fields } = block;
  return (
    <FormSection title={title}>
      <Fields form={form} />
    </FormSection>
  );
}
