import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    // Se fija siempre, aunque falte: sin un valor al compilar, Next no reemplaza la variable
    // y no descarta el menú de cuentas de demostración, así que su código, con las
    // contraseñas, se publicaría en producción aunque nunca se mostrara.
    NEXT_PUBLIC_DEMO_ACCOUNTS: process.env.NEXT_PUBLIC_DEMO_ACCOUNTS ?? 'false',
  },
};

export default nextConfig;
