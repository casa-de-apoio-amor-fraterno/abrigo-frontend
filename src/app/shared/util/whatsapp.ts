/** DDD padrão da CAAF (Porto União/SC — mesmo usado no rodapé do contrato
 * de empréstimo, "(42) 3522-7765") — usado como fallback quando o telefone
 * cadastrado é só o número local, sem DDD (comum em contato secundário
 * anotado à mão no legado, ex.: "99804-6328"). */
const DDD_PADRAO_CAAF = '42';

/** Extrai um número de telefone brasileiro (com DDI 55) de texto livre.
 * `Pessoa.telefone`/contatos são texto livre migrado do legado — às vezes
 * vem só o número, às vezes tem um segundo contato colado no mesmo campo
 * (ex.: "42 999840-7314 MÃE: 42 99944-4150"). Sem separador estruturado
 * pra garantir qual é o primeiro número "de verdade", a extração pega os
 * primeiros dígitos plausíveis — não é perfeito, mas cobre o caso comum
 * (um telefone só no campo) e ainda tenta algo no caso messy. Retorna
 * `null` quando não dá pra extrair nada com tamanho mínimo de telefone. */
export function numeroWhatsapp(telefone: string): string | null {
  // Formato antigo de DDD com zero de tronco (ex.: "042 99984-0731") —
  // nenhum DDD real começa com 0, então é seguro remover antes de contar
  // dígitos (senão o zero desloca a extração e quebra o número).
  const digitos = telefone.replace(/\D/g, '').replace(/^0+/, '');
  if (digitos.length >= 11) {
    return `55${digitos.slice(0, 11)}`;
  }
  if (digitos.length === 10) {
    return `55${digitos}`;
  }
  if (digitos.length === 8 || digitos.length === 9) {
    return `55${DDD_PADRAO_CAAF}${digitos}`;
  }
  return null;
}

/** Monta o link `wa.me` com a mensagem já preenchida (usuário só confirma
 * o envio) — abre o WhatsApp Web ou o app, dependendo do dispositivo. */
export function linkWhatsapp(telefone: string, mensagem: string): string | null {
  const numero = numeroWhatsapp(telefone);
  if (!numero) {
    return null;
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
