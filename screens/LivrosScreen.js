import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

export default function LivrosScreen() {
  const [busca, setBusca] = useState('');
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [livroExpandido, setLivroExpandido] = useState(null);
  const [usuarioPermissao, setUsuarioPermissao] = useState([]);
  const [tabSelecionada, setTabSelecionada] = useState(0);

  useEffect(() => {
    const carregarLivros = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'bzmLivro'));
        const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setLivros(lista);
      } catch (error) {
        console.error('❌ Erro ao buscar livros:', error);
      } finally {
        setCarregando(false);
      }
    };

    const verificarPermissao = async () => {
      const auth = getAuth();
      const email = auth.currentUser?.email;
      if (!email) return;

      const usuariosSnap = await getDocs(collection(db, 'bzmpessoa'));
      const usuario = usuariosSnap.docs.find(doc => doc.data().email === email);
      if (usuario) {
        setUsuarioPermissao(usuario.data().permissoes || []);
      }
    };

    carregarLivros();
    verificarPermissao();
  }, []);

  const compartilharPDF = async (livro) => {
    try {
      const nomeArquivo = livro.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      const fileUri = FileSystem.documentDirectory + nomeArquivo;

      const downloadResumable = FileSystem.createDownloadResumable(
        livro.linkPDF,
        fileUri
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log('✅ Arquivo salvo em:', uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Download concluído!', `O arquivo foi salvo em:\n${uri}`);
      }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      Alert.alert('Erro', 'Não foi possível baixar o PDF.');
    }
  };

  const baixarPDF = async (livro) => {
    try {
      const nomeArquivo = `${livro.titulo.replace(/\s+/g, '_')}.pdf`;
      const fileUri = FileSystem.documentDirectory + nomeArquivo;

      const download = FileSystem.createDownloadResumable(livro.linkPDF, fileUri);
      const { uri } = await download.downloadAsync();

      if (!uri) throw new Error('Falha ao baixar o PDF.');

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Escolha onde salvar seu PDF',
        });
      } else {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
      Alert.alert('Erro', 'Não foi possível salvar o PDF.');
    }
  };


  const filtroLivros = () => {
    const filtrados = livros.filter(
      (livro) =>
        livro.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        livro.autor.toLowerCase().includes(busca.toLowerCase())
    );

    if (tabSelecionada === 0) return filtrados.filter((livro) => livro.temPDF);
    if (tabSelecionada === 1) return filtrados.filter((livro) => livro.emprestimoDisponivel);
    if (tabSelecionada === 2) return filtrados.filter((livro) => livro.vendaDisponivel);
    return filtrados;
  };

  const toggleEmprestimo = async (livro) => {
    const livroRef = doc(db, 'bzmLivro', livro.id);
    const novoEstado = !livro.emprestado;
    try {
      await updateDoc(livroRef, {
        emprestado: novoEstado,
        emprestadoPara: novoEstado ? '1744840882517' : '',
        dataEmprestimo: novoEstado ? new Date().toISOString() : '',
        dataDevolucaoPrevista: novoEstado ? new Date(Date.now() + 7 * 86400000).toISOString() : '',
      });
      setLivros((prev) =>
        prev.map((l) => (l.id === livro.id ? { ...l, emprestado: novoEstado } : l))
      );
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o estado de empréstimo.');
    }
  };

  const removerLivro = async (livro) => {
    Alert.alert('Remover Livro', `Deseja remover "${livro.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'bzmLivro', livro.id));
            setLivros((prev) => prev.filter((l) => l.id !== livro.id));
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível remover o livro.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const expandido = livroExpandido === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setLivroExpandido(expandido ? null : item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.autor}>Autor: {item.autor}</Text>

        {item.vendaDisponivel && tabSelecionada === 2 && (
          <Text style={styles.precoLivro}>💰 R$ {item.precoVenda.toFixed(2)}</Text>
        )}


        {expandido && (
          <View style={styles.botoes}>
            {item.temPDF && (
              <TouchableOpacity style={styles.botaoLer}>
                <Icon name="eye" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {item.temPDF && (
              <TouchableOpacity style={styles.botaoBaixar} onPress={() => baixarPDF(item)}>
                <Icon name="download" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {item.temPDF && (
              <TouchableOpacity
                onPress={() => compartilharPDF(item)}
                style={styles.botaoCompartilhar}
              >
                <Icon name="share" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {item.emprestimoDisponivel && (
              <TouchableOpacity
                onPress={() => toggleEmprestimo(item)}
                style={[
                  styles.botaoEmprestimoTexto,
                  { backgroundColor: item.emprestado ? '#dc2626' : '#22c55e' },
                ]}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {item.emprestado ? 'Devolver' : 'Emprestar'}
                </Text>
              </TouchableOpacity>
            )}
            {(usuarioPermissao.includes('admin') || usuarioPermissao.includes('administrador')) && (
              <TouchableOpacity
                onPress={() => removerLivro(item)}
                style={styles.botaoRemover}
              >
                <Icon name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };



  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <Text style={styles.headerTitle}>📚 Biblioteca</Text>
      </View>

      <SegmentedControl
        values={["PDF", "Empréstimo", "Venda"]}
        selectedIndex={tabSelecionada}
        onChange={(event) => setTabSelecionada(event.nativeEvent.selectedSegmentIndex)}
        style={styles.segmented}
      />

      <TextInput
        placeholder="Buscar por título ou autor"
        value={busca}
        onChangeText={setBusca}
        style={styles.input}
      />
      <FlatList
        data={filtroLivros()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum livro encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: height * 0.05,
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.05,
    backgroundColor: '#f7f7f7',
  },
  headerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
  },
  headerTitle: { paddingTop: height * 0.05, fontSize: width * 0.06, fontWeight: 'bold', textAlign: 'center', marginBottom: height * 0.02 },
  input: {
    height: height * 0.06,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    paddingHorizontal: width * 0.04,
    marginVertical: height * 0.015,
    fontSize: width * 0.04,
    backgroundColor: '#fff',
  },
  segmented: {
    marginBottom: height * 0.02,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.015,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  titulo: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  autor: {
    fontSize: width * 0.038,
    color: '#555',
  },
  botoes: {
    flexDirection: 'row',
    marginTop: height * 0.015,
  },
  botaoLer: {
    backgroundColor: '#6A5ACD',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  botaoBaixar: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  botaoEmprestimo: {
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  botaoEmprestimoTexto: {
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  botaoCompartilhar: {
    backgroundColor: '#3B82F6', // azul
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  botaoRemover: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 10,
  },
  precoLivro: {
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: height * 0.1,
    fontSize: width * 0.04,
    color: '#777',
  },
});
