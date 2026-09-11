interface FastApiErroValidacao {
  loc?: (string | number)[];
  msg?: string;
}

export interface ApiErrorDetail {
  detail?: string | FastApiErroValidacao[];
  title?: string;
  errors?: Record<string, string[]>;
}

export function descreverErroHttp(error: ApiErrorDetail | unknown): string {
  if (error && typeof error === 'object') {
    const problema = error as ApiErrorDetail;
    if (typeof problema.detail === 'string') return problema.detail;
    if (Array.isArray(problema.detail)) {
      // Erro de validação do FastAPI/Pydantic: detail é uma lista de
      // {loc, msg}, não uma string — ex.: campo obrigatório não enviado.
      return problema.detail.map((erro) => erro.msg).filter(Boolean).join(' ') || 'Dados inválidos.';
    }
    if (problema.title) return problema.title;
    if (problema.errors) {
      return Object.values(problema.errors).flat().join(' ');
    }
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
