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
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { collection,query,where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Agora importa o auth também
import { Ionicons } from '@expo/vector-icons';
import { width, height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';
import { podeGerenciarModulo } from '../constants/Perfis';
import { WebView } from 'react-native-webview';

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
  const [permissoesUsuario, setPermissoesUsuario] = useState([]);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const podeAdministrar = podeGerenciarModulo(
    perfilUsuario,
    permissoesUsuario,
    'cursos'
  );

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
          setPermissoesUsuario(dados.permissoes);
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
      setSelectedVideoId(videoId);
      setVideoModalVisible(true);
    } else {
      alert('Vídeo inválido.');
    }
  };

  const adicionarOuEditarCurso = async () => {
    if (!novoTitulo.trim() || !novoUrl.trim()) {
      alert('Preencha o título e o URL.');
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
    if (!podeAdministrar) return; 

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
    <ScreenWrapper title="Cursos e Palestras" scrollable={false}>
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
      {podeAdministrar && (
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
            <TouchableOpacity
              style={styles.botaoFecharModal}
              onPress={() => {
                setModalVisible(false);
                setEditandoId(null);
                setNovoTitulo('');
                setNovoUrl('');
                setNovaDescricao('');
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

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
            </View>

          </View>
        </View>
      </Modal>

      {/* Modal para Visualizar Vídeo Embarcado */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={videoModalVisible}
        onRequestClose={() => {
          setVideoModalVisible(false);
          setSelectedVideoId(null);
        }}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalContent}>
            <TouchableOpacity
              style={styles.botaoFecharVideoModal}
              onPress={() => {
                setVideoModalVisible(false);
                setSelectedVideoId(null);
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            {selectedVideoId && (
              <View style={styles.videoPlayerContainer}>
                {Platform.OS === 'web' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideoId}`}
                    style={styles.videoIframe}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="YouTube Video"
                  />
                ) : (
                  <WebView
                    source={{ uri: `https://www.youtube.com/embed/${selectedVideoId}` }}
                    style={styles.videoWebview}
                    allowsFullscreenVideo
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    originWhitelist={['*']}
                  />
                )}
              </View>
            )}
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
  card: { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 3 },
  thumbnail: { width: '100%', height: width * 0.4 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', padding: 8, textAlign: 'center', color: '#333' },
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
  videoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoModalContent: {
    width: '100%',
    maxWidth: 900,
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  botaoFecharVideoModal: {
    position: 'absolute',
    top: -45,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 5,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  videoWebview: {
    flex: 1,
  },
  videoIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
