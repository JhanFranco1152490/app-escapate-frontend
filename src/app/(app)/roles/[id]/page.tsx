import { RoleScreen } from '@/features/roles/components/role-screen';

// El layout de /roles ya exige roles.view; editar depende de roles.manage dentro de la
// pantalla.
export default async function RolePage({ params }: PageProps<'/roles/[id]'>) {
  const { id } = await params;
  return <RoleScreen id={id} />;
}
