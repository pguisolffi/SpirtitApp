import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import {
  PERFIS_PADRAO,
  PERMISSOES,
  obterPerfilPadrao,
  normalizarPermissoes,
  temTodasPermissoes,
  rotuloPerfil,
} from '../constants/Perfis';

export default function PerfilPermissoesEditor({
  perfil,
  permissoes,
  onChange,
  editable = true,
}) {
  const listaPermissoes = normalizarPermissoes(permissoes);
  const acessoTotal = temTodasPermissoes(listaPermissoes);
  const perfilAtual = obterPerfilPadrao(perfil);

  const emitir = (novoPerfil, novasPermissoes) => {
    onChange?.({ perfil: novoPerfil, permissoes: novasPermissoes });
  };

  const selecionarPerfil = (perfilPadrao) => {
    if (!editable) return;
    emitir(perfilPadrao.id, [...perfilPadrao.permissoes]);
  };

  const togglePermissao = (permissaoId) => {
    if (!editable || acessoTotal) return;

    let atualizadas = [...listaPermissoes];
    const idx = atualizadas.findIndex((p) => p.toLowerCase() === permissaoId.toLowerCase());

    if (idx >= 0) {
      atualizadas.splice(idx, 1);
    } else {
      atualizadas.push(permissaoId);
    }

    emitir(perfil, atualizadas);
  };

  const temPermissaoAtiva = (permissaoId) => {
    if (acessoTotal) return true;
    return listaPermissoes.some((p) => p.toLowerCase() === permissaoId.toLowerCase());
  };

  return (
    <View>
      <Text style={styles.subtitulo}>Perfil padrão</Text>
      <Text style={styles.dica}>
        Toque em um perfil para aplicar permissões sugeridas. Depois ajuste os itens abaixo, se precisar.
      </Text>

      <View style={styles.perfisGrid}>
        {PERFIS_PADRAO.map((item) => {
          const selecionado =
            perfilAtual?.id === item.id ||
            String(perfil).trim().toUpperCase() === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.perfilCard, selecionado && styles.perfilCardAtivo]}
              onPress={() => selecionarPerfil(item)}
              disabled={!editable}
              activeOpacity={editable ? 0.7 : 1}
            >
              <Text style={[styles.perfilLabel, selecionado && styles.perfilLabelAtivo]}>
                {item.label}
              </Text>
              <Text style={styles.perfilDescricao} numberOfLines={2}>
                {item.descricao}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!perfilAtual && perfil ? (
        <Text style={styles.avisoLegado}>
          Perfil personalizado: {rotuloPerfil(perfil)}
        </Text>
      ) : null}

      <Text style={[styles.subtitulo, { marginTop: 16 }]}>Permissões</Text>

      {acessoTotal ? (
        <View style={styles.badgeTotal}>
          <Text style={styles.badgeTotalTexto}>Acesso total — todas as funções habilitadas</Text>
        </View>
      ) : null}

      {PERMISSOES.map((item) => (
        <View key={item.id} style={styles.linhaPermissao}>
          <Text style={styles.permissaoLabel}>{item.label}</Text>
          <Switch
            value={temPermissaoAtiva(item.id)}
            onValueChange={() => togglePermissao(item.id)}
            disabled={!editable || acessoTotal}
            trackColor={{ false: '#d1d5db', true: '#a78bfa' }}
            thumbColor={temPermissaoAtiva(item.id) ? '#6A5ACD' : '#f4f4f5'}
          />
        </View>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  subtitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  },
  dica: {
    fontSize: 13,
    color: '#777',
    marginBottom: 12,
    lineHeight: 18,
  },
  perfisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perfilCard: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  perfilCardAtivo: {
    borderColor: '#6A5ACD',
    backgroundColor: '#ede9fe',
  },
  perfilLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  perfilLabelAtivo: {
    color: '#6A5ACD',
  },
  perfilDescricao: {
    fontSize: 11,
    color: '#666',
    lineHeight: 15,
  },
  avisoLegado: {
    fontSize: 13,
    color: '#b45309',
    marginTop: 8,
    fontStyle: 'italic',
  },
  linhaPermissao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  permissaoLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingRight: 12,
  },
  badgeTotal: {
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeTotalTexto: {
    color: '#5b21b6',
    fontWeight: '600',
    textAlign: 'center',
  },
  botaoAcessoTotal: {
    marginTop: 12,
    padding: 10,
    alignItems: 'center',
  },
  botaoAcessoTotalTexto: {
    color: '#6A5ACD',
    fontWeight: '600',
  },
});
