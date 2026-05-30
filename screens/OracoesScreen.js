import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, where, query } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { width, height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';
import { podeGerenciarModulo } from '../constants/Perfis';

export default function OracoesScreen() {
  const [oracoes, setOracoes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoTexto, setNovoTexto] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState('');
  const [permissoesUsuario, setPermissoesUsuario] = useState([]);
  const router = useRouter();

  const podeAdministrar = podeGerenciarModulo(
    perfilUsuario,
    permissoesUsuario,
    'oracoes'
  );

  useEffect(() => {
    carregarOracoes();
    buscarPerfilUsuario();
  }, []);

  const carregarOracoes = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bzmoracoes'));
      const lista = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const tA = a.criadoEm?.seconds || a.criadoEm?.toDate?.()?.getTime?.() / 1000 || 0;
          const tB = b.criadoEm?.seconds || b.criadoEm?.toDate?.()?.getTime?.() / 1000 || 0;
          return tB - tA;
        });
      setOracoes(lista);
    } catch (error) {
      console.error('Erro ao carregar orações:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarPerfilUsuario = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'bzmusuario'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const dados = querySnapshot.docs[0].data();
          setPerfilUsuario(dados.perfil);
          setPermissoesUsuario(dados.permissoes);
        } else {
          console.log('Usuário não encontrado no Firestore');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const abrirOracao = (item) => {
    router.push({ pathname: '/Rota_OracaoViewerScreen', params: { titulo: item.titulo, texto: item.texto } });
  };

  const adicionarOuEditarOracao = async () => {
    if (!novoTitulo.trim() || !novoTexto.trim()) {
      alert('Preencha o título e o texto.');
      return;
    }

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'bzmoracoes', editandoId), {
          titulo: novoTitulo,
          texto: novoTexto,
        });
        alert('Oração atualizada com sucesso!');
      } else {
        await addDoc(collection(db, 'bzmoracoes'), {
          titulo: novoTitulo,
          texto: novoTexto,
          criadoEm: new Date(),
        });
        alert('Oração adicionada com sucesso!');
      }

      setNovoTitulo('');
      setNovoTexto('');
      setEditandoId(null);
      setModalVisible(false);
      carregarOracoes();
    } catch (error) {
      console.error('Erro ao salvar oração:', error);
    }
  };

  const abrirMenuOpcoes = (item) => {
    if (!podeAdministrar) return;

    Alert.alert(
      'Opções',
      `O que deseja fazer com "${item.titulo}"?`,
      [
        { text: 'Editar', onPress: () => editarOracao(item) },
        { text: 'Excluir', onPress: () => excluirOracao(item) },
        { text: 'Cancelar', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const editarOracao = (item) => {
    setNovoTitulo(item.titulo);
    setNovoTexto(item.texto);
    setEditandoId(item.id);
    setModalVisible(true);
  };

  const excluirOracao = async (item) => {
    try {
      await deleteDoc(doc(db, 'bzmoracoes', item.id));
      alert('Oração excluída com sucesso!');
      carregarOracoes();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir.');
    }
  };

  const oracoesFiltradas = oracoes.filter(ora =>
    ora.titulo?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
      </View>
    );
  }

  return (
    <ScreenWrapper title="Orações" scrollable={false}>
      <TextInput
        style={styles.inputFiltro}
        placeholder="Buscar orações..."
        value={filtro}
        onChangeText={setFiltro}
      />

      <FlatList
        data={oracoesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => abrirOracao(item)}
            onLongPress={() => abrirMenuOpcoes(item)}
          >
            <Text style={styles.cardTitle}>{item.titulo}</Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {podeAdministrar && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.botaoFecharModal}
              onPress={() => {
                setModalVisible(false);
                setEditandoId(null);
                setNovoTitulo('');
                setNovoTexto('');
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {editandoId ? 'Editar Oração' : 'Adicionar Nova Oração'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Título"
              value={novoTitulo}
              onChangeText={setNovoTitulo}
            />
            <TextInput
              style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Texto da oração"
              value={novoTexto}
              onChangeText={setNovoTexto}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={adicionarOuEditarOracao}>
                <Text style={styles.modalButtonText}>
                  {editandoId ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#333', paddingTop: height * 0.06 },
  inputFiltro: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, elevation: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', marginVertical: 5, padding: 15, borderRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6A5ACD', borderRadius: 30, padding: 15, elevation: 5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    ...(Platform.OS === 'web' && {
      maxWidth: 450,
    }),
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { backgroundColor: '#f1f1f1', borderRadius: 8, padding: 10, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, backgroundColor: '#6A5ACD', borderRadius: 8, padding: 10, marginHorizontal: 5, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
  botaoFecharModal: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
    padding: 4,
  },
});
