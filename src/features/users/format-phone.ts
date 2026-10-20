// El celular se guarda como 10 dígitos; se muestra con el indicativo y en grupos.
export const formatPhone = (phone: string) =>
  `+57 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
