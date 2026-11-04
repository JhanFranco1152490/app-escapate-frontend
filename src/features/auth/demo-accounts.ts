import type { DocumentType } from './api';

export type DemoAccountKey =
  'administrator' | 'advisor' | 'suppliers' | 'operations';

export type DemoAccount = {
  key: DemoAccountKey;
  role: string;
  summary: string;
  name: string;
  document_type: DocumentType;
  document_number: string;
  password: string;
};

// Cuentas ficticias del entorno de pruebas compartido: sus datos son inventados y no dan
// acceso a nada real, por eso las contraseñas están en el código. El menú que las usa solo
// se compila cuando NEXT_PUBLIC_DEMO_ACCOUNTS está en `true`; en producción este archivo no
// llega al navegador.
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    key: 'administrator',
    role: 'Administrador',
    summary: 'Usuarios, roles y todo el sistema',
    name: 'Admin Prueba',
    document_type: 'CC',
    document_number: '1000000001',
    password: '9mbq-vyPX-DbE4-LKek',
  },
  {
    key: 'advisor',
    role: 'Asesor comercial',
    summary: 'Clientes, viajeros y solicitudes',
    name: 'Asesor Prueba',
    document_type: 'CC',
    document_number: '1000000002',
    password: 'bcKB-D6Lh-eFj7-zxzq',
  },
  {
    key: 'suppliers',
    role: 'Encargado de proveedores',
    summary: 'Proveedores, servicios y tarifas',
    name: 'Encargado Prueba',
    document_type: 'CC',
    document_number: '1000000003',
    password: 'qLhD-7dMF-PmNh-g9DC',
  },
  {
    key: 'operations',
    role: 'Operativo',
    summary: 'Reservas, documentos y pagos posteriores',
    name: 'Operativo Prueba',
    document_type: 'CC',
    document_number: '1000000004',
    password: 'fn7K-xMKa-Lieq-ZnCJ',
  },
];
