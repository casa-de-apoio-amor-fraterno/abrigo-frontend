/**
 * Mascara o CPF pra exibição em telas de consulta/listagem (LGPD —
 * minimização: só mostra o CPF completo em telas de detalhe/edição, onde há
 * necessidade real de vê-lo).
 *
 * "12345678900" ou "123.456.789-00" -> "123.***.**9-00"
 */
export function mascararCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11) {
    return cpf;
  }

  const inicio = digitos.slice(0, 3);
  const fim = digitos.slice(9, 11);
  return `${inicio}.***.**${digitos[8]}-${fim}`;
}
