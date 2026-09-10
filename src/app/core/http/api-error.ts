export interface ApiErrorDetail {
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

export function descreverErroHttp(error: ApiErrorDetail | unknown): string {
  if (error && typeof error === 'object') {
    const problema = error as ApiErrorDetail;
    if (problema.detail) return problema.detail;
    if (problema.title) return problema.title;
    if (problema.errors) {
      return Object.values(problema.errors).flat().join(' ');
    }
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
