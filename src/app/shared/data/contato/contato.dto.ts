/** Espelha PessoaContatoResponse/VoluntarioContatoResponse (abrigo-backend)
 * — mesmo shape nos dois, só a FK do "dono" difere (id_pessoa/id_voluntario),
 * que o frontend nem precisa ler (o contato já chega no contexto de uma
 * pessoa/voluntário específico). */
export interface ContatoDto {
  id: number;
  numero: string;
  nome_contato: string | null;
  observacao: string | null;
  principal: boolean;
}

export interface ContatoEntradaDto {
  numero: string;
  nome_contato: string | null;
  observacao: string | null;
  principal: boolean;
}
