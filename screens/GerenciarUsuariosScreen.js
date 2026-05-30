// GerenciarUsuariosScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { width, height } from '../constants/Layout';
import { rotuloPerfil } from '../constants/Perfis';
import PerfilPermissoesEditor from '../components/PerfilPermissoesEditor';

import ScreenWrapper from '../components/ScreenWrapper';

export default function GerenciarUsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [currentUserPerfil, setCurrentUserPerfil] = useState('');

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const q = query(collection(db, 'bzmusuario'));
        const snapshot = await getDocs(q);

        const listaUsuarios = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setUsuarios(listaUsuarios);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    const obterPerfilAtual = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(collection(db, 'bzmusuario'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const dados = querySnapshot.docs[0].data();
            setCurrentUserPerfil(dados.perfil);
          }
        }
      } catch (error) {
        console.error('Erro ao obter perfil do usuário logado:', error);
      }
    };

    carregarUsuarios();
    obterPerfilAtual();
  }, []);

  const handleSalvar = async (usuario) => {
    if (currentUserPerfil !== 'ADMINISTRADOR') {
      Alert.alert('Erro', 'Apenas administradores podem salvar alterações.');
      return;
    }
    try {
      setSalvando(true);
      const { id, ...dados } = usuario;
      const docRef = doc(db, 'bzmusuario', id);
      await updateDoc(docRef, dados);
      Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
      setUsuarioSelecionado(null);
    }
  };

  const toggleSelecionar = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (usuarioSelecionado === id) {
      setUsuarioSelecionado(null);
    } else {
      setUsuarioSelecionado(id);
    }
  };

  const atualizarCampo = (id, campo, valor) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [campo]: valor } : u))
    );
  };

  const atualizarPerfilPermissoes = (id, { perfil, permissoes }) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, perfil, permissoes } : u
      )
    );
  };

  const renderUsuario = ({ item }) => {
    const selecionado = usuarioSelecionado === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => toggleSelecionar(item.id)}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.perfilResumo}>
            {rotuloPerfil(item.perfil)}
          </Text>
          {selecionado && (
            <>
              <TextInput
                style={styles.input}
                value={item.email || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'email', text)}
                placeholder="Email"
                keyboardType="email-address"
                editable={currentUserPerfil === 'ADMINISTRADOR'}
              />
              <TextInput
                style={styles.input}
                value={item.telefone || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'telefone', text)}
                placeholder="Telefone"
                keyboardType="phone-pad"
                editable={currentUserPerfil === 'ADMINISTRADOR'}
              />
              <TextInput
                style={styles.input}
                value={item.endereco || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'endereco', text)}
                placeholder="Endereço"
                editable={currentUserPerfil === 'ADMINISTRADOR'}
              />
              <TextInput
                style={styles.input}
                value={item.dtnascimento || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'dtnascimento', text)}
                placeholder="Data de Nascimento (DD/MM/AAAA)"
                keyboardType="numeric"
                editable={currentUserPerfil === 'ADMINISTRADOR'}
              />

              <PerfilPermissoesEditor
                perfil={item.perfil}
                permissoes={item.permissoes}
                editable={currentUserPerfil === 'ADMINISTRADOR'}
                onChange={(dados) => atualizarPerfilPermissoes(item.id, dados)}
              />

              {currentUserPerfil === 'ADMINISTRADOR' ? (
                <TouchableOpacity style={styles.saveButton} onPress={() => handleSalvar(item)}>
                  <Text style={styles.saveButtonText}>
                    {salvando ? 'Salvando...' : 'Salvar Alterações'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>
                  Apenas administradores podem alterar perfis ou informações.
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </View>
    );
  }

  return (
    <ScreenWrapper title="Gerenciar Usuários" scrollable={false}>
      <TextInput
        style={styles.input}
        placeholder="Buscar por nome ou email..."
        value={busca}
        onChangeText={setBusca}
      />
      <FlatList
        data={usuariosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderUsuario}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: width * 0.04,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
    paddingTop: height * 0.04,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  nome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginBottom: 4 },
  perfilResumo: { fontSize: 13, color: '#6A5ACD', marginBottom: 10, fontWeight: '600' },
  input: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginVertical: 5 },
  saveButton: {
    backgroundColor: '#6A5ACD',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});
