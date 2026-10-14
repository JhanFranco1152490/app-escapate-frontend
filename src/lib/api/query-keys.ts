// Cada dominio agrega su bloque con la misma forma: all, lists, list(query), detail(id).
export const queryKeys = {
  session: () => ['session'] as const,
  profile: () => ['profile'] as const,
  resetToken: (token: string) => ['reset-token', token] as const,
};
