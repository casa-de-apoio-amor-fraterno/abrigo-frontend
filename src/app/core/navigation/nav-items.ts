export interface NavItem {
  rota: string;
  rotulo: string;
  icone: string;
}

export const NAV_ITEMS: NavItem[] = [
  { rota: '/inicio', rotulo: 'Início', icone: 'home' },
  { rota: '/pessoas', rotulo: 'Pessoas', icone: 'groups' },
  { rota: '/quartos', rotulo: 'Quartos', icone: 'meeting_room' },
  { rota: '/estadias', rotulo: 'Estadias', icone: 'hotel' },
  { rota: '/voluntarios', rotulo: 'Voluntários', icone: 'volunteer_activism' },
  { rota: '/emprestimos', rotulo: 'Empréstimos', icone: 'inventory_2' },
  { rota: '/materiais', rotulo: 'Materiais', icone: 'category' }
];

/** Itens visíveis diretamente na barra inferior do mobile; o restante fica em "Mais". */
export const NAV_ITEMS_MOBILE_PRINCIPAIS = 3;
