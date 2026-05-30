import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { collection, getDocs, getDoc, doc, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { width, height } from '../constants/Layout';

import ScreenWrapper from '../components/ScreenWrapper';
import { podeGerenciarModulo } from '../constants/Perfis';

export default function LivrosScreen() {
  const [busca, setBusca] = useState('');
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [livroExpandido, setLivroExpandido] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState('');
  const [permissoesUsuario, setPermissoesUsuario] = useState([]);
  const [tabSelecionada, setTabSelecionada] = useState(0);
  const user = auth.currentUser;

  // Estados para novo livro
  const [modalVisible, setModalVisible] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoAutor, setNovoAutor] = useState('');
  const [novoLinkPDF, setNovoLinkPDF] = useState('');
  const [novoPrecoVenda, setNovoPrecoVenda] = useState('');
  const [novoEstoque, setNovoEstoque] = useState('');
  const [novoTemPDF, setNovoTemPDF] = useState(false);
  const [novoVendaDisponivel, setNovoVendaDisponivel] = useState(false);
  const [novoEmprestimoDisponivel, setNovoEmprestimoDisponivel] = useState(false);

  const router = useRouter();

  const podeAdministrar = podeGerenciarModulo(
    perfilUsuario,
    permissoesUsuario,
    'biblioteca'
  );

  const verificarPermissao = async () => {
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

    carregarLivros();
    verificarPermissao();  // 🔥 Só chama, não recria
  }, []);


  const compartilharPDF = async (livro) => {
    if (Platform.OS === 'web') {
      window.open(livro.linkPDF, '_blank');
      return;
    }

    try {
      const nomeArquivo = livro.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      const fileUri = FileSystem.documentDirectory + nomeArquivo;

      const downloadResumable = FileSystem.createDownloadResumable(
        livro.linkPDF,
        fileUri,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          }
        }
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
      try {
        await Linking.openURL(livro.linkPDF);
      } catch (linkErr) {
        Alert.alert('Erro', 'Não foi possível compartilhar o PDF nem abrir o link.');
      }
    }
  };

  const baixarPDF = async (livro) => {
    if (Platform.OS === 'web') {
      window.open(livro.linkPDF, '_blank');
      return;
    }

    try {
      const nomeArquivo = `${livro.titulo.replace(/\s+/g, '_')}.pdf`;
      const fileUri = FileSystem.documentDirectory + nomeArquivo;

      const download = FileSystem.createDownloadResumable(
        livro.linkPDF,
        fileUri,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          }
        }
      );
      const { uri } = await download.downloadAsync();

      if (!uri) throw new Error('Falha ao baixar o PDF.');

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Escolha onde salvar seu PDF',
        });
      } else {
        await Linking.openURL(livro.linkPDF);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
      try {
        await Linking.openURL(livro.linkPDF);
      } catch (linkErr) {
        Alert.alert('Erro', 'Não foi possível baixar o PDF pelo app nem abrir o link.');
      }
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
            Alert.alert('Erro', 'Não foi possível remover the book.');
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
              <TouchableOpacity style={styles.botaoLer} onPress={() => abrirLivroPDF(item)}>
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
            {podeAdministrar && (
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

  const adicionarLivro = async () => {
    if (!novoTitulo.trim() || !novoAutor.trim()) {
      Alert.alert('Erro', 'Preencha o título e o autor.');
      return;
    }

    try {
      await addDoc(collection(db, 'bzmLivro'), {
        titulo: novoTitulo,
        autor: novoAutor,
        linkPDF: novoLinkPDF || '',
        precoVenda: novoPrecoVenda ? parseFloat(novoPrecoVenda) : 0,
        estoque: novoEstoque ? parseInt(novoEstoque) : 0,
        temPDF: novoTemPDF,
        vendaDisponivel: novoVendaDisponivel,
        emprestimoDisponivel: novoEmprestimoDisponivel,
        emprestado: false,
        emprestadoPara: '',
        dataEmprestimo: '',
        dataDevolucaoPrevista: '',
      });

      Alert.alert('Sucesso', 'Livro adicionado!');
      setModalVisible(false);

      // Limpar campos
      setNovoTitulo('');
      setNovoAutor('');
      setNovoLinkPDF('');
      setNovoPrecoVenda('');
      setNovoEstoque('');
      setNovoTemPDF(false);
      setNovoVendaDisponivel(false);
      setNovoEmprestimoDisponivel(false);

      // Atualizar lista
      const snapshot = await getDocs(collection(db, 'bzmLivro'));
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLivros(lista);
    } catch (error) {
      console.error('Erro ao adicionar livro:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o livro.');
    }
  };


  const abrirLivroPDF = (livro) => {
    if (!livro.linkPDF) {
      Alert.alert('Erro', 'Este livro não possui link de PDF.');
      return;
    }
  
    router.push({
      pathname: '/Rota_LeitorPDFScreen', // 🔥 aqui chama a tela certa
      params: { pdfUrl: livro.linkPDF, titulo: livro.titulo }, // 🔥 envia com os nomes corretos
    });
  };
  


  return (
    <ScreenWrapper title="Biblioteca" scrollable={false}>
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
      {podeAdministrar && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
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
          <ScrollView contentContainerStyle={styles.modalContent}>
            <TouchableOpacity
              style={styles.botaoFecharModal}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Adicionar Novo Livro</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Título"
              value={novoTitulo}
              onChangeText={setNovoTitulo}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Autor"
              value={novoAutor}
              onChangeText={setNovoAutor}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Link do PDF"
              value={novoLinkPDF}
              onChangeText={setNovoLinkPDF}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Preço de Venda"
              keyboardType="numeric"
              value={novoPrecoVenda}
              onChangeText={setNovoPrecoVenda}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Estoque"
              keyboardType="numeric"
              value={novoEstoque}
              onChangeText={setNovoEstoque}
            />

            <View style={styles.switchRow}>
              <Text>Tem PDF:</Text>
              <TouchableOpacity onPress={() => setNovoTemPDF(!novoTemPDF)}>
                <Ionicons name={novoTemPDF ? "checkmark-circle" : "ellipse-outline"} size={28} color={novoTemPDF ? "#22c55e" : "#ccc"} />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text>Disponível para Venda:</Text>
              <TouchableOpacity onPress={() => setNovoVendaDisponivel(!novoVendaDisponivel)}>
                <Ionicons name={novoVendaDisponivel ? "checkmark-circle" : "ellipse-outline"} size={28} color={novoVendaDisponivel ? "#22c55e" : "#ccc"} />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text>Disponível para Empréstimo:</Text>
              <TouchableOpacity onPress={() => setNovoEmprestimoDisponivel(!novoEmprestimoDisponivel)}>
                <Ionicons name={novoEmprestimoDisponivel ? "checkmark-circle" : "ellipse-outline"} size={28} color={novoEmprestimoDisponivel ? "#22c55e" : "#ccc"} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={adicionarLivro}>
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenWrapper>
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6A5ACD',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
  modalContainer: {
    paddingTop: height * 0.06,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    ...(Platform.OS === 'web' && {
      maxWidth: 450,
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#6A5ACD',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  botaoFecharModal: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
    padding: 4,
  },
});
