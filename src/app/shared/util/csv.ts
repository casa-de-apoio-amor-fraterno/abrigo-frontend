/** Exportação simples de listas para CSV — usado nos botões "Exportar CSV"
 * das telas de Consulta, em vez de replicar os relatórios impressos
 * (PDF/`TfrmRelatorio*`) do legado (ver gap 4 de `docs/atividades.md`). */
export function exportarCsv(nomeArquivo: string, cabecalhos: string[], linhas: (string | number | null)[][]): void {
  const escapar = (valor: string | number | null): string => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    if (texto.includes(';') || texto.includes('"') || texto.includes('\n')) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const conteudo = [cabecalhos, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\r\n');

  // BOM UTF-8 pra abrir corretamente no Excel em pt-BR.
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
