import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection,query,where, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Agora importa o auth também
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function CursosPalestrasScreen() {
  const [cursos, setCursos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoUrl, setNovoUrl] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState('');
  const router = useRouter();

  useEffect(() => {
    carregarCursos();
    buscarPerfilUsuario();
  }, []);

  const carregarCursos = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'bzmcursospalestras'));
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCursos(lista);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
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
        } else {
          console.log('Usuário não encontrado no Firestore');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const extrairVideoId = (url) => {
    const regex = /(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const abrirVideo = (curso) => {
    const videoId = extrairVideoId(curso.urlyoutube);
    if (videoId) {
      router.push({ pathname: '/Rota_VideoViewerScreen', params: { videoId } });
    } else {
      alert('Vídeo inválido.');
    }
  };

  const adicionarOuEditarCurso = async () => {
    if (!novoTitulo.trim() || !novoUrl.trim()) {
      alert('Preencha o título e a URL.');
      return;
    }

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'bzmcursospalestras', editandoId), {
          titulo: novoTitulo,
          urlyoutube: novoUrl,
          descricao: novaDescricao || '',
        });
        alert('Vídeo atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'bzmcursospalestras'), {
          titulo: novoTitulo,
          urlyoutube: novoUrl,
          descricao: novaDescricao || '',
        });
        alert('Vídeo adicionado com sucesso!');
      }

      setNovoTitulo('');
      setNovoUrl('');
      setNovaDescricao('');
      setEditandoId(null);
      setModalVisible(false);
      carregarCursos();

    } catch (error) {
      console.error('Erro ao salvar curso:', error);
    }
  };

  const abrirMenuOpcoes = (item) => {
    if (perfilUsuario !== 'ADMINISTRADOR') return; 

    Alert.alert(
      'Opções',
      `O que deseja fazer com "${item.titulo}"?`,
      [
        { text: 'Editar', onPress: () => editarVideo(item) },
        { text: 'Excluir', onPress: () => excluirVideo(item) },
        { text: 'Cancelar', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const editarVideo = (item) => {
    setNovoTitulo(item.titulo);
    setNovoUrl(item.urlyoutube);
    setNovaDescricao(item.descricao);
    setEditandoId(item.id);
    setModalVisible(true);
  };

  const excluirVideo = async (item) => {
    try {
      await deleteDoc(doc(db, 'bzmcursospalestras', item.id));
      alert('Vídeo excluído com sucesso!');
      carregarCursos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir.');
    }
  };

  const cursosFiltrados = cursos.filter(curso =>
    curso.titulo?.toLowerCase().includes(filtro.toLowerCase())
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
      <Text style={styles.title}>🎬 Cursos e Palestras</Text>

      <TextInput
        style={styles.inputFiltro}
        placeholder="Buscar cursos..."
        value={filtro}
        onChangeText={setFiltro}
      />

      <FlatList
        data={cursosFiltrados}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => {
          const videoId = extrairVideoId(item.urlyoutube);
          const thumbnailUrl = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : null;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => abrirVideo(item)}
              onLongPress={() => abrirMenuOpcoes(item)}
            >
              {thumbnailUrl && (
                <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
              )}
              <Text style={styles.cardTitle}>{item.titulo}</Text>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão flutuante apenas para admins */}
      {perfilUsuario === 'ADMINISTRADOR' && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal de adicionar/editar */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editandoId ? 'Editar Vídeo' : 'Adicionar Novo Vídeo'}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Título"
              value={novoTitulo}
              onChangeText={setNovoTitulo}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="URL do YouTube"
              value={novoUrl}
              onChangeText={setNovoUrl}
            />
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Descrição"
              value={novaDescricao}
              onChangeText={setNovaDescricao}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={adicionarOuEditarCurso}>
                <Text style={styles.modalButtonText}>
                  {editandoId ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditandoId(null);
                  setNovoTitulo('');
                  setNovoUrl('');
                  setNovaDescricao('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#333', paddingTop: height * 0.06 },
  inputFiltro: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, elevation: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 3 },
  thumbnail: { width: '100%', height: width * 0.4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', padding: 8, textAlign: 'center', color: '#333' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6A5ACD', borderRadius: 30, padding: 15, elevation: 5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { backgroundColor: '#f1f1f1', borderRadius: 8, padding: 10, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, backgroundColor: '#6A5ACD', borderRadius: 8, padding: 10, marginHorizontal: 5, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});
