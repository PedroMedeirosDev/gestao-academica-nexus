import type { ApiErrorDetail, ApiErrorEnvelope } from '../types/api-error.types';

/**
 * Mensagens pt-BR mínimas (`api.spec.md` §3).
 * Na UI: chave i18n recomendada = `errors.<code>` (ver `i18nKeyFor`).
 */
export const API_ERROR_MESSAGES_PT_BR = {
  VALIDATION_ERROR: 'Dados de entrada inválidos.',
  INVALID_CREDENTIALS: 'Credenciais inválidas.',
  UNAUTHORIZED: 'Autenticação necessária ou token inválido.',
  FORBIDDEN: 'Você não tem permissão para esta operação.',
  NOT_FOUND: 'Recurso não encontrado.',
  INTERNAL_ERROR: 'Erro interno.',
  CONFLICT: 'Conflito com o estado atual dos dados.',
  HTTP_ERROR: 'Erro na requisição.',
  IDEMPOTENCY_KEY_CONFLICT:
    'A mesma chave de idempotência foi usada com um corpo diferente da requisição original.',
  CATALOG_MISCONFIGURED_LEVEL:
    'Nível com séries fixas sem roteiro (`fixedSeriesTemplate`). Corrija o cadastro do nível.',
  CATALOG_FIXED_SERIES:
    'Combinação de rótulo e ordem não faz parte do roteiro fixo deste nível (ex.: matriz SEE principal).',
  CATALOG_DEPENDENCY:
    'Operação bloqueada: existem dados dependentes (matrícula, turma, currículo, etc.).',
  GRADE_NOT_FOUND: 'Série não encontrada.',
  ACADEMIC_YEAR_NOT_FOUND: 'Ano letivo não encontrado.',
  EDUCATION_LEVEL_NOT_FOUND: 'Nível de ensino não encontrado.',
  DISCIPLINE_NOT_FOUND: 'Disciplina não encontrada.',
  GRADE_CURRICULUM_LINE_NOT_FOUND: 'Linha de currículo não encontrada nesta série.',
  SCHOOL_CLASS_NOT_FOUND: 'Turma não encontrada nesta série.',
  VALIDATION_GRADE_SORT_REQUIRED_FIXED:
    'Para níveis com séries fixas, envie `sortOrder` igual ao definido no roteiro do nível.',
  VALIDATION_EDUCATION_LEVEL_FIXED_TEMPLATE_REQUIRED:
    'Nível com séries fixas exige `fixedSeriesTemplate` com ao menos um item.',
  VALIDATION_EDUCATION_LEVEL_TEMPLATE_INVALID_FOR_FREE:
    'Não envie `fixedSeriesTemplate` enquanto o nível estiver (ou for ficar) em modo livre (`FREE`).',
  VALIDATION_EDUCATION_LEVEL_FIXED_REQUIRES_TEMPLATE:
    'Nível FIXED_SERIES exige roteiro: envie `fixedSeriesTemplate` ou mantenha o já cadastrado.',
  VALIDATION_MATERIALIZE_EDUCATION_LEVEL_IDS:
    'Algum id em `educationLevelIds` não existe ou não está em `FIXED_SERIES`.',
  VALIDATION_FIXED_SERIES_DUPLICATE_LABEL: 'Rótulos duplicados no roteiro de séries fixas.',
  VALIDATION_FIXED_SERIES_DUPLICATE_ORDER: 'Ordem duplicada no roteiro de séries fixas.',
  CATALOG_DUPLICATE_ACADEMIC_YEAR: 'Já existe um ano letivo com este valor.',
  CATALOG_DUPLICATE_GRADE:
    'Já existe uma série com este ano letivo, nível e rótulo (após normalização).',
  CATALOG_DUPLICATE_CURRICULUM_LINE:
    'Disciplina já está no currículo desta série ou a ordem já está em uso.',
  CATALOG_DUPLICATE_CURRICULUM_SORT: 'Esta ordem já está em uso no currículo da série.',
  CATALOG_DEPENDENCY_GRADE_DELETE:
    'Não é possível excluir a série: existem matrículas, turmas ou linhas de currículo vinculadas.',
  CATALOG_DEPENDENCY_CURRICULUM_REMOVE:
    'Não é possível remover: existe matrícula ativa nesta série (currículo materializado).',
  CATALOG_DUPLICATE_SCHOOL_CLASS: 'Já existe uma turma com este nome nesta série.',
  CATALOG_DEPENDENCY_SCHOOL_CLASS_DELETE:
    'Não é possível excluir a turma: existe matrícula vinculada (inclui canceladas — política MVP).',
  CATALOG_DUPLICATE_EDUCATION_LEVEL_CODE: 'Já existe um nível de ensino com este código.',
  CATALOG_DEPENDENCY_EDUCATION_LEVEL_TEMPLATE:
    'Existem séries já cadastradas que não entram no novo roteiro. Ajuste ou remova essas séries antes de mudar o roteiro.',
  CATALOG_DEPENDENCY_ACADEMIC_YEAR_EDIT:
    'Não é possível alterar o ano: já existem séries, matrículas ou planos de pagamento vinculados a este ano letivo.',
  CATALOG_DEPENDENCY_ACADEMIC_YEAR_DELETE:
    'Não é possível excluir o ano letivo: ainda existem séries, matrículas ou planos de pagamento vinculados.',
  EDUCATION_LEVEL_DELETE_HAS_GRADES:
    'Não é possível excluir o nível: existem séries (em qualquer ano) que o utilizam.',
  DISCIPLINE_DELETE_IN_USE:
    'Não é possível excluir a disciplina: ela consta de currículo de série ou de matrícula.',
  GRADE_MOVE_BLOCKED_BY_ENROLLMENT:
    'Não é possível mudar o ano letivo ou o nível desta série: existem matrículas em Reserva ou Ativa.',
  VALIDATION_PATCH_EMPTY: 'Envie ao menos um campo para atualizar.',
  INVALID_CPF: 'CPF inválido (dígitos verificadores).',
  STUDENT_DUPLICATE_IDENTITY:
    'Já existe um aluno com esta identidade (cadastro concluído).',
  STUDENT_DRAFT_CONFLICT:
    'Já existe um rascunho de aluno com esta identidade; retome o rascunho ou descarte-o antes de criar outro.',
  STUDENT_IDENTITY_IMMUTABLE:
    'A identidade legal (CPF ou documento) não pode ser alterada após a criação do registo.',
  STUDENT_COMPLETION_INCOMPLETE:
    'Dados insuficientes para marcar o aluno como cadastro completo.',
  STUDENT_GUARDIAN_REQUIRED:
    'É necessário pelo menos um responsável vinculado a este aluno.',
  STUDENT_FINANCIAL_GUARDIAN_REQUIRED:
    'Para menor de idade, é obrigatório um responsável financeiro com dados completos.',
  STUDENT_FINANCIAL_GUARDIAN_PROFESSION_REQUIRED:
    'O responsável financeiro deve ter profissão preenchida.',
  STUDENT_ADDRESS_INCOMPLETE:
    'Preencha o endereço do aluno ou defina morada a partir de um responsável com endereço completo.',
  STUDENT_HAS_ENROLLMENTS:
    'Não é possível excluir: existem matrículas vinculadas a este aluno.',
  STUDENT_DELETE_CONFIRMATION_REQUIRED:
    'Envie o cabeçalho `X-Deletion-Confirm: 1` para confirmar a exclusão do aluno.',
  GUARDIAN_NOT_FOUND: 'Responsável não encontrado.',
  GUARDIAN_DUPLICATE_IDENTITY:
    'Já existe um responsável com esta identidade; utilize a pesquisa e vincule o existente.',
  GUARDIAN_HAS_STUDENT_LINKS:
    'Não é possível excluir: o responsável ainda está vinculado a aluno(s).',
  GUARDIAN_LINK_NOT_FOUND: 'Vínculo aluno–responsável não encontrado.',
  GUARDIAN_LINK_DUPLICATE: 'Este responsável já está vinculado a este aluno.',
  STUDENT_ADDRESS_SOURCE_INVALID:
    'O vínculo indicado como fonte de morada não pertence a este aluno ou não existe.',
  STUDENT_ADDRESS_SOURCE_GUARDIAN_ADDRESS_INCOMPLETE:
    'O responsável escolhido como fonte de morada não tem endereço completo.',
  STUDENT_MULTIPLE_ADDRESS_SOURCES:
    'Apenas um vínculo pode ser marcado como fonte de morada do aluno.',
  STORAGE_NOT_CONFIGURED:
    'Armazenamento de arquivos não configurado (Supabase). Defina `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` na API.',
  STUDENT_PORTRAIT_FILE_REQUIRED: 'Envie o arquivo no campo `file` (multipart).',
  STUDENT_PORTRAIT_MIME_NOT_ALLOWED:
    'Formato de imagem não permitido. Use JPEG, PNG ou WebP.',
  STUDENT_PORTRAIT_TOO_LARGE: 'Imagem muito grande (máximo 5 MB).',
  STUDENT_PORTRAIT_NOT_SET: 'Este aluno não tem retrato carregado.',
  STUDENT_PORTRAIT_UPLOAD_FAILED:
    'Não foi possível gravar o retrato no armazenamento. Tente novamente mais tarde.',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_MESSAGES_PT_BR;

export function i18nKeyFor(code: ApiErrorCode): string {
  return `errors.${code}`;
}

export function businessError(
  code: ApiErrorCode,
  options?: { message?: string; details?: ApiErrorDetail[] },
): ApiErrorEnvelope {
  const message = options?.message ?? API_ERROR_MESSAGES_PT_BR[code];
  return {
    error: {
      code,
      message,
      ...(options?.details?.length ? { details: options.details } : {}),
    },
  };
}
