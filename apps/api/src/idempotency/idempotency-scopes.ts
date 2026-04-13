/** Escopos lógicos por operação (evita colisão entre rotas). */
export const IdempotencyScope = {
  /** `POST /academic-years` — demonstração; reutilize o padrão em matrícula/financeiro. */
  ACADEMIC_YEAR_CREATE: 'academic-years:create',
} as const;
