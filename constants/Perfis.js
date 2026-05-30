/** Permissão curinga — acesso total (perfil Administrador). */
export const PERMISSAO_TODAS = '*';

export const PERMISSOES = [
  { id: 'atendimento', label: 'Novo atendimento' },
  { id: 'fila', label: 'Fila de espera' },
  { id: 'eventos', label: 'Agenda e eventos' },
  { id: 'voluntarios', label: 'Escala de voluntários' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'oracoes', label: 'Orações' },
  { id: 'cursos', label: 'Cursos e palestras' },
  { id: 'usuarios', label: 'Gerenciar usuários' },
  { id: 'pessoas', label: 'Gerenciar pessoas' },
  { id: 'orientador', label: 'Orientador espiritual' },
  { id: 'cadastro', label: 'Cadastros gerais' },
];

export const PERFIS_PADRAO = [
  {
    id: 'ADMINISTRADOR',
    label: 'Administrador',
    descricao: 'Acesso total — gerencia tudo no app',
    permissoes: [PERMISSAO_TODAS],
  },
  {
    id: 'COORDENADOR',
    label: 'Coordenador',
    descricao: 'Operação do dia a dia, sem gestão de usuários',
    permissoes: [
      'atendimento',
      'fila',
      'eventos',
      'voluntarios',
      'biblioteca',
      'oracoes',
      'cursos',
      'pessoas',
      'orientador',
      'cadastro',
    ],
  },
  {
    id: 'VOLUNTARIO',
    label: 'Voluntário',
    descricao: 'Atendimento, fila e consultas',
    permissoes: ['atendimento', 'fila', 'eventos', 'biblioteca', 'oracoes', 'cursos'],
  },
  {
    id: 'ORIENTADOR',
    label: 'Orientador',
    descricao: 'Atendimento espiritual e fila',
    permissoes: ['atendimento', 'fila', 'orientador', 'oracoes'],
  },
  {
    id: 'USUARIO',
    label: 'Usuário comum',
    descricao: 'Consulta conteúdos públicos',
    permissoes: ['biblioteca', 'oracoes', 'cursos', 'eventos'],
  },
];

export const PERFIL_ADMINISTRADOR = PERFIS_PADRAO[0];

export function obterPerfilPadrao(perfilId) {
  if (!perfilId) return null;
  const id = String(perfilId).trim().toUpperCase();
  return PERFIS_PADRAO.find((p) => p.id === id) || null;
}

export function ehAdministrador(perfil) {
  if (!perfil) return false;
  const valor = String(perfil).trim().toLowerCase();
  return ['admin', 'administrador', 'administrator'].includes(valor);
}

export function normalizarPermissoes(permissoes) {
  if (!permissoes) return [];
  if (Array.isArray(permissoes)) {
    return permissoes.map((p) => String(p).trim()).filter(Boolean);
  }
  const texto = String(permissoes).trim();
  if (!texto) return [];
  if (texto.toLowerCase() === 'todas' || texto === PERMISSAO_TODAS) {
    return [PERMISSAO_TODAS];
  }
  return texto.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
}

export function temTodasPermissoes(permissoes) {
  const lista = normalizarPermissoes(permissoes).map((p) => p.toLowerCase());
  return lista.includes(PERMISSAO_TODAS) || lista.includes('todas') || lista.includes('*');
}

export function usuarioTemPermissao(permissoesOuUsuario, permissaoId) {
  const permissoes =
    permissoesOuUsuario && typeof permissoesOuUsuario === 'object' && !Array.isArray(permissoesOuUsuario)
      ? permissoesOuUsuario.permissoes
      : permissoesOuUsuario;

  if (temTodasPermissoes(permissoes)) return true;

  const alvo = String(permissaoId).trim().toLowerCase();
  const lista = normalizarPermissoes(permissoes).map((p) => p.toLowerCase());

  return lista.includes(alvo);
}

export function podeGerenciarModulo(perfil, permissoes, moduloId) {
  return ehAdministrador(perfil) || usuarioTemPermissao(permissoes, moduloId);
}

export function permissoesDoPerfil(perfilId) {
  const perfil = obterPerfilPadrao(perfilId);
  return perfil ? [...perfil.permissoes] : [];
}

export function rotuloPerfil(perfilId) {
  const perfil = obterPerfilPadrao(perfilId);
  if (perfil) return perfil.label;
  return perfilId || '—';
}

/** Compatível com dados antigos (ex.: "Orientador" na fila). */
export function temPermissaoOrientador(permissoes) {
  return (
    usuarioTemPermissao(permissoes, 'orientador') ||
    normalizarPermissoes(permissoes).some((p) => p.toLowerCase() === 'orientador')
  );
}
