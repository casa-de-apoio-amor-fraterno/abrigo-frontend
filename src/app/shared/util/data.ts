/** Formata `Date` pro valor esperado por `<input type="datetime-local">`
 * ("YYYY-MM-DDTHH:mm") usando os componentes LOCAIS (getFullYear/getHours/
 * etc.) — nunca `toISOString()`, que converte pra UTC e desloca a hora em
 * qualquer fuso diferente de UTC+0. O backend grava `data_entrada`/
 * `data_saida` como datetime "naive" (sem timezone, ver
 * estadia.legacy.md), então o valor local do navegador é o que deve ser
 * enviado tal como está — sem conversão. */
export function paraDatetimeLocal(data: Date): string {
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  const ano = data.getFullYear();
  const mes = doisDigitos(data.getMonth() + 1);
  const dia = doisDigitos(data.getDate());
  const hora = doisDigitos(data.getHours());
  const minuto = doisDigitos(data.getMinutes());
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

/** Hora atual do computador, já no formato de `paraDatetimeLocal` — usado
 * pra pré-preencher `data_entrada`/`data_saida` ao iniciar/encerrar uma
 * estadia agora mesmo. */
export function agoraDatetimeLocal(): string {
  return paraDatetimeLocal(new Date());
}

/** Tempo de estadia (valor + unidade), calculado a partir de entrada/saída
 * — substitui o campo que antes era digitado manualmente ao encerrar (ver
 * estadia.legacy.md). Menos de 1 dia (24h) vira horas; 1 dia ou mais vira
 * dias. `dataEntrada`/`dataSaida` no formato de `paraDatetimeLocal`
 * ("YYYY-MM-DDTHH:mm"), interpretado como hora local pelo próprio `Date`. */
export function calcularTempoEstadia(
  dataEntrada: string,
  dataSaida: string
): { valor: number; unidade: 'dias' | 'horas' } {
  const diffMs = new Date(dataSaida).getTime() - new Date(dataEntrada).getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);

  if (diffHoras < 24) {
    return { valor: Math.max(1, Math.round(diffHoras)), unidade: 'horas' };
  }
  return { valor: Math.max(1, Math.round(diffHoras / 24)), unidade: 'dias' };
}
