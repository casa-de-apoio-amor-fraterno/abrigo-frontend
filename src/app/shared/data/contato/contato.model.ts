export interface Contato {
  id: number;
  numero: string;
  nomeContato: string | null;
  observacao: string | null;
  principal: boolean;
}

export interface ContatoFormulario {
  numero: string;
  nomeContato: string | null;
  observacao: string | null;
  principal: boolean;
}
