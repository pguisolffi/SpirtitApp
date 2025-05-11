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
  Dimensions,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Menu, Provider } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function GerenciarUsuariosScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [menuVisible, setMenuVisible] = useState({});
  const [perfilModalVisible, setPerfilModalVisible] = useState(false);
  const [usuarioEditandoPerfil, setUsuarioEditandoPerfil] = useState(null);
  const [voluntarios, setVoluntarios] = useState([]);

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const q = query(collection(db, 'bzmusuario'));
        const snapshot = await getDocs(q);

        const listaUsuarios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsuarios(listaUsuarios);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
  }, []);

  const handleSalvar = async (usuario) => {
    try {
      setSalvando(true);
      const docRef = doc(db, 'bzmusuario', usuario.id);
      await updateDoc(docRef, usuario);
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

  const perfisDisponiveis = [
    'ADMINISTRADOR',
    'COORDENADOR',
    'VOLUNTARIO',
    'ATENDENTE',
    'ORIENTADOR',
    'VISITANTE',
  ];

  const atualizarCampo = (id, campo, valor) => {
    setUsuarios(prev =>
      prev.map(u => (u.id === id ? { ...u, [campo]: valor } : u))
    );
  };

  const renderUsuario = ({ item }) => {
    const selecionado = usuarioSelecionado === item.id;
    const isMenuVisible = menuVisible[item.id] || false;

    return (
      <View>
        <TouchableOpacity onPress={() => toggleSelecionar(item.id)}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {selecionado && (
            <>
              <TextInput
                style={styles.input}
                value={item.email || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'email', text)}
                placeholder="Email"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                value={item.telefone || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'telefone', text)}
                placeholder="Telefone"
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                value={item.endereco || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'endereco', text)}
                placeholder="Endereço"
              />
              <TextInput
                style={styles.input}
                value={item.dtnascimento || ''}
                onChangeText={(text) => atualizarCampo(item.id, 'dtnascimento', text)}
                placeholder="Data de Nascimento (DD/MM/AAAA)"
                keyboardType="numeric"
              />
            </>
          )}
        </TouchableOpacity>

        {selecionado && (
          <Provider>
            <Menu
              visible={isMenuVisible}
              onDismiss={() => setMenuVisible(prev => ({ ...prev, [item.id]: false }))}
              anchor={
                <TouchableOpacity
                  style={styles.dropdownAnchor}
                  onPress={() => {
                    setUsuarioEditandoPerfil(item.id);
                    setPerfilModalVisible(true);
                  }}
                >
                  <Text style={styles.dropdownText}>{item.perfil || 'Selecionar Perfil'}</Text>
                </TouchableOpacity>
              }
            >
              {perfisDisponiveis.map(perfil => (
                <Menu.Item
                  key={perfil}
                  onPress={() => {
                    atualizarCampo(item.id, 'perfil', perfil);
                    setMenuVisible(prev => ({ ...prev, [item.id]: false }));
                  }}
                  title={perfil}
                />
              ))}
            </Menu>
          </Provider>
        )}

        {selecionado && (
          <TouchableOpacity style={styles.saveButton} onPress={() => handleSalvar(item)}>
            <Text style={styles.saveButtonText}>{salvando ? 'Salvando...' : 'Salvar Alterações'}</Text>
          </TouchableOpacity>
        )}
      </View>

    );
  };


  const usuariosFiltrados = usuarios.filter(u =>
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
    <View style={styles.container}>
      <Text style={styles.title}>👥 Gerenciar Usuários</Text>
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
        {perfilModalVisible && (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Selecionar Perfil</Text>
        {perfisDisponiveis.map(perfil => (
          <TouchableOpacity
            key={perfil}
            style={styles.modalOption}
            onPress={() => {
              atualizarCampo(usuarioEditandoPerfil, 'perfil', perfil);
              setPerfilModalVisible(false);
              setUsuarioEditandoPerfil(null);
            }}
          >
            <Text style={styles.modalOptionText}>{perfil}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setPerfilModalVisible(false)}>
          <Text style={styles.modalCancelar}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: width * 0.04, backgroundColor: '#f9f9f9', flexGrow: 1, paddingTop: height * 0.04 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: width * 0.07, fontWeight: 'bold', color: '#333', textAlign: 'center', marginVertical: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 3 },
  nome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginBottom: 10 },
  input: { backgroundColor: '#f2f2f2', borderRadius: 8, padding: 10, marginVertical: 5 },
  dropdownAnchor: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 8, marginTop: 10 },
  dropdownText: { color: '#333' },
  saveButton: { backgroundColor: '#6A5ACD', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalOption: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCancelar: {
    marginTop: 15,
    color: '#6A5ACD',
    fontWeight: 'bold',
    fontSize: 16,
  },

});
